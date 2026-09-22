import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { saveStateToDB } from '~/store/db/db';
import { trackRemotePlaybackProgress } from '~/store/playbackProgress';
import { addLogEntry } from '~/store/signals/log';
import { playerState } from '~/store/signals/player';
import { settingsState } from '~/store/signals/settings';
import { PlayerState } from '~/store/types';

const sourceKey = (player: PlayerState | null) => {
  const stream = player?.streams[0];
  return stream?.url ? JSON.stringify([player?.playType, player?.contentID, stream.url, stream.mimetype]) : null;
};

const hasMediaChannel = (session: chrome.cast.Session) =>
  session.namespaces?.some(({ name }) => name === 'urn:x-cast:com.google.cast.media') ?? false;
const CAST_STARTUP_TIMEOUT_MS = 10000;
const CAST_CONNECTION_TIMEOUT_MS = 60000;

export const useCastApi = () => {
  const enabled = !!settingsState.value.enableChromecast;
  const source = sourceKey(playerState.value);
  const isPlaying = playerState.value?.isPlaying;
  const [castSession, setCastSession] = useState<chrome.cast.Session | null>(null);
  const [castMedia, setCastMedia] = useState<chrome.cast.media.Media | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [castStatus, setCastStatus] = useState<string>();
  const [receiverReady, setReceiverReady] = useState(false);
  const sessionRef = useRef<chrome.cast.Session | null>(null);
  const castMediaRef = useRef<chrome.cast.media.Media | null>(null);
  const removeMediaListenerRef = useRef<() => void>();
  const removeSessionListenersRef = useRef<() => void>();
  const lifecycleRef = useRef(0);
  const requestingSessionRef = useRef(false);
  const requestAttemptRef = useRef(0);
  const connectionTimerRef = useRef<number>();
  const connectionDeadlineRef = useRef<number>();
  const ignoreSessionRef = useRef(false);
  const progressRef = useRef<ReturnType<typeof trackRemotePlaybackProgress>>();
  const mediaOwnerRef = useRef<string | null>(null);
  const pendingPlaybackRef = useRef<{ owner: string; playing: boolean }>();
  const retryLoadRef = useRef<() => boolean>();
  const receiverPlaybackRef = useRef<boolean>();

  const handleCastPlayPause = useCallback((playing: boolean) => {
    const player = playerState.peek();
    const owner = sourceKey(player);
    if (!sessionRef.current || !player || !owner) return;
    if (playing && retryLoadRef.current?.()) return;
    const media = castMediaRef.current;
    if (!media || mediaOwnerRef.current !== owner || media.playerState === chrome.cast.media.PlayerState.BUFFERING) {
      // Keep taps made while the receiver is loading; apply the latest intent when ready.
      pendingPlaybackRef.current = { owner, playing };
      if (player.isPlaying !== playing) playerState.value = { ...player, isPlaying: playing };
      return;
    }
    const onError = (error: chrome.cast.Error) => {
      if (castMediaRef.current !== media || sourceKey(playerState.peek()) !== owner) return;
      console.error('Error controlling Cast playback:', error);
      setCastStatus('Could not change Cast playback. Try again.');
      addLogEntry({ level: 'error', message: `Cast playback command failed: ${error.code}` });
    };
    if (playing) media.play(new chrome.cast.media.PlayRequest(), () => {}, onError);
    else media.pause(new chrome.cast.media.PauseRequest(), () => {}, onError);
  }, []);

  const detachMedia = useCallback(() => {
    progressRef.current?.dispose();
    progressRef.current = undefined;
    removeMediaListenerRef.current?.();
    removeMediaListenerRef.current = undefined;
    castMediaRef.current = null;
    mediaOwnerRef.current = null;
    setCastMedia(null);
  }, []);

  const attachMedia = useCallback(
    (media: chrome.cast.media.Media) => {
      if (castMediaRef.current === media) return;
      detachMedia();
      const playerOwner = playerState.peek();
      const owner = sourceKey(playerOwner);
      castMediaRef.current = media;
      mediaOwnerRef.current = owner;
      setCastMedia(media);
      const ready =
        media.playerState === chrome.cast.media.PlayerState.PLAYING ||
        media.playerState === chrome.cast.media.PlayerState.PAUSED;
      setCastStatus(
        ready
          ? undefined
          : media.playerState === chrome.cast.media.PlayerState.BUFFERING
            ? 'Buffering on Cast…'
            : 'Loading on Cast…',
      );
      addLogEntry({ level: 'info', message: `Cast media attached: ${media.playerState}, ${media.media?.contentId}` });
      if (playerOwner) {
        const stream = playerOwner.streams[0];
        progressRef.current = trackRemotePlaybackProgress(
          playerOwner,
          () => {
            // The SDK can reuse a media object or clear its position on stop.
            if (
              castMediaRef.current !== media ||
              media.media?.contentId !== stream?.url ||
              media.media?.contentType !== stream?.mimetype ||
              media.playerState === chrome.cast.media.PlayerState.IDLE
            )
              return;
            return media.getEstimatedTime();
          },
          () => void saveStateToDB(),
        );
      }
      let lastReportedState = media.playerState;
      const onUpdate = (isAlive: boolean) => {
        if (castMediaRef.current !== media) return;
        if (!isAlive) {
          detachMedia();
          return;
        }
        const player = playerState.peek();
        if (!player || sourceKey(player) !== owner) return;
        // Buffering is transitional; it must not turn a play request into a pause.
        const state = media.playerState;
        if (state !== lastReportedState) {
          lastReportedState = state;
          addLogEntry({
            level: 'info',
            message: `Cast media update: ${state}${media.idleReason ? ` (${media.idleReason})` : ''}`,
          });
        }
        if (state === chrome.cast.media.PlayerState.BUFFERING) setCastStatus('Buffering on Cast…');
        if (state !== chrome.cast.media.PlayerState.PLAYING && state !== chrome.cast.media.PlayerState.PAUSED) return;
        setCastStatus(undefined);
        const playing = state === chrome.cast.media.PlayerState.PLAYING;
        const pending = pendingPlaybackRef.current;
        if (pending?.owner === owner) {
          pendingPlaybackRef.current = undefined;
          if (playing !== player.isPlaying) {
            receiverPlaybackRef.current = player.isPlaying;
            handleCastPlayPause(player.isPlaying);
            return;
          }
        }
        receiverPlaybackRef.current = playing;
        if (player.isPlaying !== playing) playerState.value = { ...player, isPlaying: playing };
        if (!playing) progressRef.current?.checkpoint();
      };
      media.addUpdateListener(onUpdate);
      removeMediaListenerRef.current = () => media.removeUpdateListener(onUpdate);
    },
    [detachMedia, handleCastPlayPause],
  );

  const releaseSession = useCallback(() => {
    window.clearTimeout(connectionTimerRef.current);
    connectionDeadlineRef.current = undefined;
    requestingSessionRef.current = false;
    requestAttemptRef.current++;
    removeSessionListenersRef.current?.();
    removeSessionListenersRef.current = undefined;
    detachMedia();
    sessionRef.current = null;
    retryLoadRef.current = undefined;
    pendingPlaybackRef.current = undefined;
    setCastSession(null);
    setReceiverReady(false);
    setCastStatus(undefined);
  }, [detachMedia]);

  const expireConnection = useCallback(() => {
    releaseSession();
    // Ignore a late SDK callback until the user explicitly tries again.
    ignoreSessionRef.current = true;
    setCastStatus('Cast connection timed out. Tap the Cast icon to try again.');
    addLogEntry({ level: 'warn', message: 'Cast connection timed out after 60 seconds.' });
  }, [releaseSession]);

  const acceptSession = useCallback(
    (session: chrome.cast.Session) => {
      if (sessionRef.current === session) {
        setReceiverReady(hasMediaChannel(session));
        return;
      }
      const deadline = connectionDeadlineRef.current ?? Date.now() + CAST_CONNECTION_TIMEOUT_MS;
      releaseSession();
      connectionDeadlineRef.current = deadline;
      sessionRef.current = session;
      setReceiverReady(hasMediaChannel(session));
      addLogEntry({ level: 'info', message: `Cast connected; media channel ready: ${hasMediaChannel(session)}` });
      const onUpdate = (isAlive: boolean) => {
        if (sessionRef.current !== session) return;
        if (
          !isAlive ||
          session.status === chrome.cast.SessionStatus.STOPPED ||
          session.status === chrome.cast.SessionStatus.DISCONNECTED
        )
          releaseSession();
        else setReceiverReady(hasMediaChannel(session));
      };
      const onMedia = (media: chrome.cast.media.Media) => {
        const stream = playerState.peek()?.streams[0];
        if (
          sessionRef.current === session &&
          media.media?.contentId === stream?.url &&
          media.media?.contentType === stream?.mimetype &&
          media.playerState !== chrome.cast.media.PlayerState.IDLE
        )
          attachMedia(media);
      };
      session.addUpdateListener(onUpdate);
      session.addMediaListener(onMedia);
      removeSessionListenersRef.current = () => {
        session.removeUpdateListener(onUpdate);
        session.removeMediaListener(onMedia);
      };
      setCastSession(session);
    },
    [attachMedia, releaseSession],
  );

  // SDK lifetime follows the setting, never player state or media updates.
  useEffect(() => {
    if (!enabled) return;
    ignoreSessionRef.current = false;
    const generation = ++lifecycleRef.current;
    let disposed = false;
    let initializing = false;
    let ready = false;
    const initialize = () => {
      if (disposed || initializing || ready || !window.chrome?.cast?.isAvailable) return;
      initializing = true;
      try {
        const config = new chrome.cast.ApiConfig(
          new chrome.cast.SessionRequest('2CFD5B94', undefined, CAST_CONNECTION_TIMEOUT_MS),
          (session) => {
            // Explicit requests are accepted by their own guarded success callback.
            if (!disposed && !requestingSessionRef.current && !ignoreSessionRef.current) acceptSession(session);
          },
          () => {},
          chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
        );
        chrome.cast.initialize(
          config,
          () => {
            if (disposed) return;
            ready = true;
            setInitialized(true);
          },
          (error) => {
            initializing = false;
            if (!disposed) console.error('Cast API initialization error:', error);
          },
        );
      } catch (error) {
        initializing = false;
        console.error('Error during Cast API initialization:', error);
      }
    };
    const previousCallback = window.__onGCastApiAvailable;
    const onAvailable = (available: boolean) => {
      if (available) initialize();
    };
    // Register before appending the script: the SDK can call back before onload.
    window.__onGCastApiAvailable = onAvailable;
    let script = document.querySelector<HTMLScriptElement>('script[src*="cast_sender.js"]');
    const ownsScript = !script;
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
      script.async = true;
    }
    const onError = () => {
      if (!disposed) console.error('Failed to load Cast SDK');
    };
    script.addEventListener('load', initialize);
    script.addEventListener('error', onError);
    if (ownsScript) document.head.appendChild(script);
    initialize();

    return () => {
      disposed = true;
      lifecycleRef.current = generation + 1;
      requestingSessionRef.current = false;
      script.removeEventListener('load', initialize);
      script.removeEventListener('error', onError);
      if (ownsScript) script.remove();
      if (window.__onGCastApiAvailable === onAvailable) {
        if (previousCallback) window.__onGCastApiAvailable = previousCallback;
        else delete window.__onGCastApiAvailable;
      }
      releaseSession();
      setInitialized(false);
    };
  }, [enabled, acceptSession, releaseSession]);

  useEffect(() => {
    if (!castSession) return;
    if (receiverReady) {
      connectionDeadlineRef.current = undefined;
      return;
    }
    // Device selection and receiver startup share the same 60-second deadline.
    const remaining = Math.max(
      0,
      (connectionDeadlineRef.current ?? Date.now() + CAST_CONNECTION_TIMEOUT_MS) - Date.now(),
    );
    const timer = window.setTimeout(expireConnection, remaining);
    connectionTimerRef.current = timer;
    return () => window.clearTimeout(timer);
  }, [castSession, receiverReady, expireConnection]);

  // A source change owns one load; playback, metadata and progress writes do not.
  useEffect(() => {
    if (!enabled || !castSession || sessionRef.current !== castSession || !source) return;
    if (!receiverReady) {
      setCastStatus('Waiting for Cast to be ready…');
      return;
    }
    const player = playerState.peek()!;
    const stream = player.streams[0];
    receiverPlaybackRef.current = player.isPlaying;
    let cancelled = false;
    const isCurrent = () =>
      !cancelled && sessionRef.current === castSession && sourceKey(playerState.peek()) === source;
    detachMedia();
    setCastStatus('Loading on Cast…');
    if (pendingPlaybackRef.current?.owner !== source) pendingPlaybackRef.current = undefined;
    const obsoleteMedia = new Set<chrome.cast.media.Media>();
    const matchingMedia = () =>
      castSession.media?.find(
        (media) =>
          media.media?.contentId === stream.url &&
          media.media.contentType === stream.mimetype &&
          !obsoleteMedia.has(media) &&
          media.playerState !== chrome.cast.media.PlayerState.IDLE,
      );
    let attempts = 0;
    let attempt = 0;
    let failed = false;
    let startupTimer: number | undefined;
    let discoveryTimer: number | undefined;
    const clearTimers = () => {
      window.clearTimeout(startupTimer);
      window.clearInterval(discoveryTimer);
    };
    const hasStarted = (media: chrome.cast.media.Media) =>
      media.playerState === chrome.cast.media.PlayerState.PLAYING ||
      media.playerState === chrome.cast.media.PlayerState.PAUSED;
    const acceptMedia = (media: chrome.cast.media.Media) => {
      if (!isCurrent() || obsoleteMedia.has(media)) return;
      attachMedia(media);
      if (hasStarted(media)) {
        failed = false;
        clearTimers();
      }
    };
    const discoverMedia = () => {
      if (!isCurrent()) return;
      const media = castMediaRef.current ?? matchingMedia();
      if (media && !obsoleteMedia.has(media)) acceptMedia(media);
    };
    const failStartup = () => {
      clearTimers();
      failed = true;
      setCastStatus('Could not start Cast audio. Press Play to retry.');
      const active = playerState.peek();
      if (active && sourceKey(active) === source) playerState.value = { ...active, isPlaying: false };
      addLogEntry({ level: 'error', message: `Cast startup failed after ${attempts} loads: ${stream.url}` });
    };
    const retryStartup = () => {
      if (!isCurrent()) return;
      discoverMedia();
      if (castMediaRef.current && hasStarted(castMediaRef.current)) return;
      if (attempts >= 2) failStartup();
      else load();
    };
    const load = () => {
      if (!isCurrent()) return;
      clearTimers();
      if (castMediaRef.current) obsoleteMedia.add(castMediaRef.current);
      detachMedia();
      failed = false;
      const currentAttempt = ++attempt;
      attempts++;
      const active = playerState.peek()!;
      setCastStatus(attempts === 1 ? 'Loading on Cast…' : 'Retrying Cast audio…');
      addLogEntry({ level: 'info', message: `Cast load ${attempts}: autoplay=${active.isPlaying}, ${stream.url}` });
      // Keep observing startup after LOAD succeeds: IDLE/BUFFERING is not ready.
      discoveryTimer = window.setInterval(discoverMedia, 500);
      startupTimer = window.setTimeout(retryStartup, CAST_STARTUP_TIMEOUT_MS);
      const info = new chrome.cast.media.MediaInfo(stream.url, stream.mimetype);
      info.metadata = new chrome.cast.media.GenericMediaMetadata();
      info.metadata.title = player.title;
      info.metadata.subtitle = player.description;
      info.metadata.images = player.imageUrl ? [{ url: player.imageUrl }] : [];
      info.streamType =
        player.playType === 'podcast' ? chrome.cast.media.StreamType.BUFFERED : chrome.cast.media.StreamType.LIVE;
      const request = new chrome.cast.media.LoadRequest(info);
      request.autoplay = active.isPlaying;
      receiverPlaybackRef.current = active.isPlaying;
      if (player.playType === 'podcast') request.currentTime = active.currentTime ?? 0;
      castSession.loadMedia(
        request,
        (media) => {
          if (currentAttempt !== attempt) {
            obsoleteMedia.add(media);
            return;
          }
          acceptMedia(media);
        },
        (error) => {
          if (!isCurrent() || currentAttempt !== attempt || (castMediaRef.current && hasStarted(castMediaRef.current)))
            return;
          console.error('Error loading Cast media:', error);
          addLogEntry({ level: 'error', message: `Cast load failed (${stream.url}): ${error.code}` });
          window.clearTimeout(startupTimer);
          if (['timeout', 'channel_error', 'session_error'].includes(error.code)) {
            setCastStatus('Waiting for Cast audio…');
            startupTimer = window.setTimeout(retryStartup, 1000);
          } else failStartup();
        },
      );
    };
    const retry = () => {
      if (!isCurrent() || !failed) return false;
      const active = playerState.peek()!;
      playerState.value = { ...active, isPlaying: true };
      attempts = 0;
      load();
      return true;
    };
    retryLoadRef.current = retry;
    const existing = matchingMedia();
    if (existing && hasStarted(existing)) acceptMedia(existing);
    else load();
    return () => {
      cancelled = true;
      clearTimers();
      if (retryLoadRef.current === retry) retryLoadRef.current = undefined;
      detachMedia();
    };
  }, [enabled, castSession, source, receiverReady, attachMedia, detachMedia]);

  const startCasting = useCallback(() => {
    if (
      !settingsState.peek().enableChromecast ||
      !initialized ||
      !sourceKey(playerState.peek()) ||
      sessionRef.current ||
      requestingSessionRef.current
    )
      return;
    const generation = lifecycleRef.current;
    const attempt = ++requestAttemptRef.current;
    ignoreSessionRef.current = false;
    requestingSessionRef.current = true;
    connectionDeadlineRef.current = Date.now() + CAST_CONNECTION_TIMEOUT_MS;
    connectionTimerRef.current = window.setTimeout(expireConnection, CAST_CONNECTION_TIMEOUT_MS);
    setCastStatus('Connecting to Cast…');
    chrome.cast.requestSession(
      (session) => {
        if (lifecycleRef.current !== generation || requestAttemptRef.current !== attempt) return;
        acceptSession(session);
      },
      (error) => {
        if (lifecycleRef.current !== generation || requestAttemptRef.current !== attempt) return;
        if (error.code === 'timeout') {
          expireConnection();
          return;
        }
        window.clearTimeout(connectionTimerRef.current);
        connectionDeadlineRef.current = undefined;
        requestAttemptRef.current++;
        requestingSessionRef.current = false;
        setCastStatus(undefined);
        console.error('Error starting cast:', error);
      },
    );
  }, [initialized, acceptSession, expireConnection]);

  const stopCasting = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    progressRef.current?.checkpoint();
    session.stop(
      () => {
        if (sessionRef.current === session) releaseSession();
      },
      (error) => console.error('Error stopping cast:', error),
    );
  }, [releaseSession]);

  useEffect(() => {
    // A receiver update can arrive between render and this passive effect.
    const player = playerState.peek();
    if (!castMedia || castMediaRef.current !== castMedia || sourceKey(player) !== source || !player) return;
    const playing = player.isPlaying;
    if (castMedia.playerState === chrome.cast.media.PlayerState.BUFFERING) {
      if (playing !== receiverPlaybackRef.current) pendingPlaybackRef.current = { owner: source!, playing };
      return;
    }
    receiverPlaybackRef.current = playing;
    pendingPlaybackRef.current = undefined;
    if (
      (playing && castMedia.playerState === chrome.cast.media.PlayerState.PAUSED) ||
      (!playing && castMedia.playerState === chrome.cast.media.PlayerState.PLAYING)
    )
      handleCastPlayPause(playing);
  }, [castMedia, isPlaying, source, handleCastPlayPause]);

  const handleCastSeek = useCallback((seconds: number, absolute = false) => {
    const media = castMediaRef.current;
    if (!media || !Number.isFinite(seconds)) return;
    const duration = media.media?.duration;
    const position = absolute ? seconds : media.getEstimatedTime() + seconds;
    const request = new chrome.cast.media.SeekRequest();
    request.currentTime = Math.max(0, Math.min(position, duration && Number.isFinite(duration) ? duration : Infinity));
    media.seek(
      request,
      () => {
        if (castMediaRef.current === media) progressRef.current?.checkpoint();
      },
      (error) => console.error('Error seeking cast:', error),
    );
  }, []);

  return {
    startCasting,
    stopCasting,
    handleCastPlayPause,
    handleCastSeek,
    isCastingAvailable: enabled && initialized,
    castSession,
    castMediaRef,
    castStatus,
  };
};
