import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { playerState } from '~/store/signals/player';
import { settingsState } from '~/store/signals/settings';
import { PlayerState } from '~/store/types';

const sourceKey = (player: PlayerState | null) => {
  const stream = player?.streams[0];
  return stream?.url ? JSON.stringify([player?.playType, player?.contentID, stream.url, stream.mimetype]) : null;
};

export const useCastApi = () => {
  const enabled = !!settingsState.value.enableChromecast;
  const source = sourceKey(playerState.value);
  const isPlaying = playerState.value?.isPlaying;
  const [castSession, setCastSession] = useState<chrome.cast.Session | null>(null);
  const [castMedia, setCastMedia] = useState<chrome.cast.media.Media | null>(null);
  const [initialized, setInitialized] = useState(false);
  const sessionRef = useRef<chrome.cast.Session | null>(null);
  const castMediaRef = useRef<chrome.cast.media.Media | null>(null);
  const removeMediaListenerRef = useRef<() => void>();
  const removeSessionListenersRef = useRef<() => void>();
  const lifecycleRef = useRef(0);
  const requestingSessionRef = useRef(false);

  const detachMedia = useCallback(() => {
    removeMediaListenerRef.current?.();
    removeMediaListenerRef.current = undefined;
    castMediaRef.current = null;
    setCastMedia(null);
  }, []);

  const attachMedia = useCallback(
    (media: chrome.cast.media.Media) => {
      if (castMediaRef.current === media) return;
      detachMedia();
      const owner = sourceKey(playerState.peek());
      castMediaRef.current = media;
      setCastMedia(media);
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
        if (state !== chrome.cast.media.PlayerState.PLAYING && state !== chrome.cast.media.PlayerState.PAUSED) return;
        const playing = state === chrome.cast.media.PlayerState.PLAYING;
        if (player.isPlaying !== playing) playerState.value = { ...player, isPlaying: playing };
      };
      media.addUpdateListener(onUpdate);
      removeMediaListenerRef.current = () => media.removeUpdateListener(onUpdate);
    },
    [detachMedia],
  );

  const releaseSession = useCallback(() => {
    removeSessionListenersRef.current?.();
    removeSessionListenersRef.current = undefined;
    detachMedia();
    sessionRef.current = null;
    setCastSession(null);
  }, [detachMedia]);

  const acceptSession = useCallback(
    (session: chrome.cast.Session) => {
      if (sessionRef.current === session) return;
      releaseSession();
      sessionRef.current = session;
      const onUpdate = (isAlive: boolean) => {
        if (sessionRef.current !== session) return;
        if (
          !isAlive ||
          session.status === chrome.cast.SessionStatus.STOPPED ||
          session.status === chrome.cast.SessionStatus.DISCONNECTED
        )
          releaseSession();
      };
      const onMedia = (media: chrome.cast.media.Media) => {
        const stream = playerState.peek()?.streams[0];
        if (
          sessionRef.current === session &&
          media.media?.contentId === stream?.url &&
          media.media?.contentType === stream?.mimetype
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
    const generation = ++lifecycleRef.current;
    let disposed = false;
    let initializing = false;
    let ready = false;
    const initialize = () => {
      if (disposed || initializing || ready || !window.chrome?.cast?.isAvailable) return;
      initializing = true;
      try {
        const config = new chrome.cast.ApiConfig(
          new chrome.cast.SessionRequest('2CFD5B94'),
          (session) => {
            if (!disposed) acceptSession(session);
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

  // A source change owns one load; playback, metadata and progress writes do not.
  useEffect(() => {
    if (!enabled || !castSession || sessionRef.current !== castSession || !source) return;
    const player = playerState.peek()!;
    const stream = player.streams[0];
    let cancelled = false;
    const isCurrent = () =>
      !cancelled && sessionRef.current === castSession && sourceKey(playerState.peek()) === source;
    detachMedia();
    const existing = castSession.media?.[0];
    if (existing?.media?.contentId === stream.url && existing.media.contentType === stream.mimetype) {
      attachMedia(existing);
    } else {
      const info = new chrome.cast.media.MediaInfo(stream.url, stream.mimetype);
      info.metadata = new chrome.cast.media.GenericMediaMetadata();
      info.metadata.title = player.title;
      info.metadata.subtitle = player.description;
      info.metadata.images = player.imageUrl ? [{ url: player.imageUrl }] : [];
      info.streamType =
        player.playType === 'podcast' ? chrome.cast.media.StreamType.BUFFERED : chrome.cast.media.StreamType.LIVE;
      const request = new chrome.cast.media.LoadRequest(info);
      request.autoplay = player.isPlaying;
      if (player.playType === 'podcast') request.currentTime = player.currentTime ?? 0;
      castSession.loadMedia(
        request,
        (media) => {
          if (isCurrent()) attachMedia(media);
        },
        (error) => {
          if (isCurrent()) console.error('Error loading Cast media:', error);
        },
      );
    }
    return () => {
      cancelled = true;
      detachMedia();
    };
  }, [enabled, castSession, source, attachMedia, detachMedia]);

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
    requestingSessionRef.current = true;
    chrome.cast.requestSession(
      (session) => {
        if (lifecycleRef.current !== generation) return;
        requestingSessionRef.current = false;
        acceptSession(session);
      },
      (error) => {
        if (lifecycleRef.current !== generation) return;
        requestingSessionRef.current = false;
        console.error('Error starting cast:', error);
      },
    );
  }, [initialized, acceptSession]);

  const stopCasting = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    session.stop(
      () => {
        if (sessionRef.current === session) releaseSession();
      },
      (error) => console.error('Error stopping cast:', error),
    );
  }, [releaseSession]);

  const handleCastPlayPause = useCallback((playing: boolean) => {
    const media = castMediaRef.current;
    if (!media) return;
    if (playing)
      media.play(
        new chrome.cast.media.PlayRequest(),
        () => {},
        (error) => console.error('Error playing cast:', error),
      );
    else
      media.pause(
        new chrome.cast.media.PauseRequest(),
        () => {},
        (error) => console.error('Error pausing cast:', error),
      );
  }, []);

  useEffect(() => {
    if (!castMedia || isPlaying === undefined) return;
    if (
      (isPlaying && castMedia.playerState === chrome.cast.media.PlayerState.PAUSED) ||
      (!isPlaying && castMedia.playerState === chrome.cast.media.PlayerState.PLAYING)
    )
      handleCastPlayPause(isPlaying);
  }, [castMedia, isPlaying, handleCastPlayPause]);

  const handleCastSeek = useCallback((seconds: number, absolute = false) => {
    const media = castMediaRef.current;
    if (!media || !Number.isFinite(seconds)) return;
    const duration = media.media?.duration;
    const position = absolute ? seconds : media.getEstimatedTime() + seconds;
    const request = new chrome.cast.media.SeekRequest();
    request.currentTime = Math.max(0, Math.min(position, duration && Number.isFinite(duration) ? duration : Infinity));
    media.seek(
      request,
      () => {},
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
  };
};
