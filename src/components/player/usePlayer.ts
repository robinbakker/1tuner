import { computed, signal, useComputed } from '@preact/signals';
import { useCallback, useEffect, useLayoutEffect, useRef } from 'preact/hooks';
import { useNoise } from '~/hooks/useNoise';
import { playlistUtil } from '~/lib/playlistUtil';
import { reconnectUtil } from '~/lib/reconnectUtil';
import { saveStateToDB } from '~/store/db/db';
import { trackPlaybackProgress } from '~/store/playbackProgress';
import { addLogEntry } from '~/store/signals/log';
import { playlistRules } from '~/store/signals/playlist';
import { playNextRadioStation, playRadioStationByID } from '~/store/signals/radio';
import { DEFAULT_MAX_RECONNECT_ATTEMPTS, settingsState } from '~/store/signals/settings';
import { addToast } from '~/store/signals/ui';
import { PlaylistRuleType } from '~/store/types';
import { useCastApi } from '../../hooks/useCastApi';
import { isPlayerMaximized, playerState } from '../../store/signals/player';

export const playbackRateSignal = signal(1);
export const durationSignal = signal(0);
export const audioSourcesSignal = computed(() => playerState.value?.streams || []);
export const currentTime = signal(0);
export const audioKey = signal(0);

export const usePlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentTimeDisplayRef = useRef<HTMLSpanElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const { startNoise, stopNoise } = useNoise();

  const {
    isCastingAvailable,
    startCasting,
    stopCasting,
    handleCastPlayPause,
    handleCastSeek,
    castSession,
    castMediaRef,
    castStatus,
  } = useCastApi();
  const maxReconnectAttempts = settingsState.value.radioStreamMaxReconnects ?? DEFAULT_MAX_RECONNECT_ATTEMPTS;
  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  const isPodcast = playerState.value?.playType === 'podcast';
  const isPlaylist = playerState.value?.playType === 'playlist';
  const isRadio = playerState.value?.playType === 'radio';
  const playlistUrl = isPlaylist ? playerState.value?.pageLocation : undefined;
  const progressPercentage = useComputed(() => (currentTime.value / durationSignal.value) * 100);
  const contentID = playerState.value?.contentID;
  const playType = playerState.value?.playType;
  const isPlaying = playerState.value?.isPlaying;
  const streamUrl = playerState.value?.streams[0]?.url;
  const elementKey = audioKey.value;
  const wasCastingRef = useRef(false);
  const localPlaybackGenerationRef = useRef(0);

  useLayoutEffect(() => {
    localPlaybackGenerationRef.current++;
    const owner = playerState.peek();
    const returningFromCast = wasCastingRef.current && !castSession;
    wasCastingRef.current = !!castSession;
    if (!audioRef.current || !owner || castSession) return;
    // Restore before registering local snapshots, including a seek back to zero.
    if (returningFromCast && owner.playType === 'podcast') {
      audioRef.current.currentTime = owner.currentTime ?? 0;
      currentTime.value = owner.currentTime ?? 0;
    }
    return trackPlaybackProgress(audioRef.current, owner, () => void saveStateToDB());
  }, [contentID, playType, streamUrl, elementKey, castSession]);

  useEffect(() => {
    if (!playlistUrl) return;

    // Follow playlist identity, not the player-state writes made by each check.
    const checkPlaylistCurrentPlaying = () => {
      playlistUtil.playPlaylistByUrl(playlistUrl);
    };

    checkPlaylistCurrentPlaying();
    const playlistInterval = setInterval(checkPlaylistCurrentPlaying, 30000); // Check every 30 secs

    return () => clearInterval(playlistInterval);
  }, [playlistUrl]);

  const formatTime = useCallback((time: number) => {
    if (isNaN(time) || !isFinite(time) || time == null) return '';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const updateTimeUI = useCallback(() => {
    if (!audioRef.current || !playerState.value?.streams || !isPodcast) return;
    const position = castSession ? castMediaRef.current?.getEstimatedTime() : audioRef.current.currentTime;
    if (position === undefined || !Number.isFinite(position)) return;
    currentTime.value = position;
    if (castSession) durationSignal.value = castMediaRef.current?.media?.duration ?? 0;

    requestAnimationFrame(() => {
      if (currentTimeDisplayRef.current) {
        currentTimeDisplayRef.current.textContent = formatTime(position);
      }
      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${progressPercentage.value}%`;
      }
      if (sliderRef.current) {
        sliderRef.current.value = position.toString();
        sliderRef.current.style.backgroundImage = `linear-gradient(to right, #ff6000 ${progressPercentage.value}%, #ccc ${progressPercentage.value}%)`;
      }
    });
  }, [playerState.value?.streams, isPodcast, progressPercentage, formatTime, castSession, castMediaRef]);

  const handleSeek = useCallback(
    (seconds: number) => {
      if (castSession) {
        handleCastSeek(seconds);
        return;
      }

      if (audioRef.current) {
        audioRef.current.currentTime = audioRef.current.currentTime + seconds;
      }
    },
    [castMediaRef, castSession, handleCastSeek],
  );

  const handlePlaybackRateChange = useCallback(
    (rate: number) => {
      if (castSession && castMediaRef.current) {
        playbackRateSignal.value = rate;
        return;
      }

      if (audioRef.current) {
        audioRef.current.playbackRate = rate;
        playbackRateSignal.value = rate;
      }
    },
    [castMediaRef, castSession],
  );

  const setToPaused = useCallback(() => {
    stopNoise();
    if (!audioRef.current || !playerState.value) return;
    audioRef.current.pause();
    if (isPodcast) {
      currentTime.value = audioRef.current.currentTime;
      saveStateToDB();
    } else {
      audioRef.current.currentTime = 0;
      audioRef.current.load();
    }
  }, [playerState.value, stopNoise, isPodcast]);

  const handlePlayPause = useCallback(() => {
    if (!playerState.value) return;
    const newIsPlaying = !playerState.value.isPlaying;

    // Handle cast media if casting
    if (castSession) {
      handleCastPlayPause(newIsPlaying);
      return;
    }

    // Otherwise handle local audio
    if (!castSession && audioRef.current) {
      playerState.value = {
        ...playerState.value,
        isPlaying: newIsPlaying,
      };

      if (newIsPlaying) {
        stopNoise();
        const generation = localPlaybackGenerationRef.current;
        audioRef.current.play().catch((error) => {
          if (generation !== localPlaybackGenerationRef.current) return;
          console.error('Error playing audio:', error);
          addLogEntry({
            level: 'error',
            message: `Error playing audio (${playerState.value?.streams?.[0]?.url}): ${error.message}`,
          });
          playerState.value = {
            ...playerState.value!,
            isPlaying: false,
          };
        });
      } else {
        setToPaused();
      }
    }
  }, [playerState.value, castSession, castMediaRef, handleCastPlayPause, stopNoise, setToPaused]);

  const handleClose = useCallback(() => {
    if (castSession) stopCasting();
    setToPaused();
    if (reconnectTimeout.current) {
      console.log('handleClose: Cleaning up reconnect timeout');
      clearTimeout(reconnectTimeout.current);
    }
    reconnectAttempts.current = 0;
    playerState.value = null;
    isPlayerMaximized.value = false;
    void saveStateToDB();
  }, [setToPaused, castSession, stopCasting]);

  const handleSliderChange = useCallback(
    (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (!audioRef.current) return;
      const newTime = parseFloat(target.value);
      if (castSession) {
        handleCastSeek(newTime, true);
        return;
      }
      audioRef.current.currentTime = newTime;
      updateTimeUI();
    },
    [updateTimeUI, castSession, handleCastSeek],
  );

  useEffect(() => {
    if (!audioRef.current || !playerState.value || !playerState.value.streams?.length) return;

    const audio = audioRef.current;
    if (castSession) {
      audio.pause();
      return;
    }
    audio.playbackRate = playbackRateSignal.peek();
    // A reconnect remount is initialized by its scheduled cache-busted retry.
    if (reconnectAttempts.current > 0) return;
    const newSrc = playerState.value.streams[0].url;

    // If src was set programmatically for reconnect, we must remove it
    // to allow the audio element to use its <source> children again.
    if (audio.hasAttribute('src')) {
      audio.removeAttribute('src');
      // After removing src, we must call load() to apply the <source> elements.
      audio.load();
    } else {
      // If src was not set, check if the source is different and load if needed.
      if (!audio.currentSrc || !audio.currentSrc.includes(newSrc)) {
        audio.load();
      }
    }

    if (!audio.currentTime && playerState.value.currentTime) {
      audio.currentTime = playerState.value.currentTime;
    }

    if (playerState.value.isPlaying && !castSession) {
      const generation = localPlaybackGenerationRef.current;
      const promise = audio.play();
      if (promise) {
        promise.catch((error) => {
          // Pausing local audio for Cast may reject its outstanding play request.
          if (generation !== localPlaybackGenerationRef.current) return;
          if (playerState.value) playerState.value = { ...playerState.value, isPlaying: false };
          console.error('Error playing audio:', error);
          addLogEntry({
            level: 'error',
            message: `Error playing audio (${newSrc}): ${error.message}`,
          });
        });
      }
    } else {
      setToPaused();
    }
  }, [playerState.value, castSession, setToPaused, elementKey]);

  const reconnectFnRef = useRef<() => void>();

  const retryConnection = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !playerState.value?.isPlaying || !playerState.value.streams?.[0]?.url) {
      if (reconnectAttempts.current > 0) {
        console.log('Aborting reconnect sequence.');
        reconnectAttempts.current = 0;
        stopNoise();
        addLogEntry({
          level: 'info',
          message: `Reconnect aborted due to ${audio ? '' : 'missing audio element and'} ${playerState.value?.isPlaying ? 'playing' : 'paused'} player state, stream URL: ${playerState.value?.streams?.[0]?.url}`,
        });
      }
      return;
    }

    console.log('Attempting to play stream...');
    const streamUrl = playerState.value.streams[0].url;
    const cacheBustingUrl = `${streamUrl}${streamUrl.includes('?') ? '&' : '?'}_=${new Date().getTime()}`;
    audio.src = cacheBustingUrl;
    audio.currentTime = 0;
    audio.load();
    addLogEntry({
      level: 'info',
      message: `Attempting to reconnect to stream: ${cacheBustingUrl}`,
    });

    const playPromise = audio.play();
    if (playPromise) {
      playPromise
        .then(() => {
          console.log('Reconnect successful');
          stopNoise();
          addLogEntry({
            level: 'info',
            message: `Reconnect (${reconnectAttempts.current}) successful to stream: ${cacheBustingUrl}`,
          });
          reconnectAttempts.current = 0;
        })
        .catch((error) => {
          console.log('Reconnect attempt failed:', error);
          addLogEntry({
            level: 'error',
            message: `Reconnect attempt failed for stream ${cacheBustingUrl}: ${error.message}`,
          });
          if (reconnectFnRef.current) {
            reconnectFnRef.current();
          }
        });
    }
  }, [playerState.value, stopNoise]);

  const attemptReconnect = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (reconnectAttempts.current >= maxReconnectAttempts) {
      stopNoise();
      console.log('Max reconnect attempts reached');
      addLogEntry({
        level: 'error',
        message: `Max reconnect attempts (${maxReconnectAttempts}) reached for stream: ${playerState.value?.streams?.[0]?.url}`,
      });
      addToast({
        title: '😢 Reconnect failed...',
        description: 'Failed to reconnect to the stream',
        variant: 'error',
      });
      reconnectAttempts.current = 0;
      playerState.value = playerState.value
        ? {
            ...playerState.value,
            isPlaying: false,
          }
        : null;
      return;
    } else if (reconnectAttempts.current % 10 === 0) {
      console.log('Incrementing audioKey to force re-render');
      audioKey.value += 1;
      addLogEntry({
        level: 'info',
        message: `Incrementing audioKey to force re-render after ${reconnectAttempts.current} attempts`,
      });
    }

    reconnectAttempts.current += 1;
    console.log(`Reconnect attempt ${reconnectAttempts.current}/${maxReconnectAttempts}`);
    addLogEntry({
      level: 'info',
      message: `Reconnect attempt ${reconnectAttempts.current}/${maxReconnectAttempts} for stream: ${playerState.value?.streams?.[0]?.url}`,
    });
    addToast({
      title: '🛜 Reconnecting...',
      description: `There was an issue with the stream. Attempting to reconnect...`,
      variant: 'default',
    });

    if (reconnectTimeout.current) {
      console.log('attemptReconnect: Clearing previous reconnect timeout');
      clearTimeout(reconnectTimeout.current);
    }

    const timeout = reconnectUtil.getReconnectTimeoutMs(reconnectAttempts.current, maxReconnectAttempts);
    reconnectTimeout.current = setTimeout(() => retryConnection(), timeout);
  }, [audioRef, playerState.value, maxReconnectAttempts, retryConnection, stopNoise]);

  reconnectFnRef.current = attemptReconnect;

  // A retry belongs to the current playback session, not an individual element.
  // Rebinding listeners after a remount must leave its scheduled retry intact.
  useLayoutEffect(() => {
    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = undefined;
      reconnectAttempts.current = 0;
      stopNoise();
    };
  }, [contentID, playType, streamUrl, isPlaying, castSession, stopNoise]);

  useLayoutEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;

    const handleError = (e: Event) => {
      if (!castSession && !isPodcast && playerState.value?.isPlaying && reconnectAttempts.current === 0) {
        console.log(`Stream ${e.type} event, attempting reconnect...`, e);
        startNoise();
        attemptReconnect();
        addLogEntry({
          level: 'warn',
          message: `Stream ${e.type} event, attempting reconnect for stream: ${playerState.value?.streams?.[0]?.url}`,
        });
      }
    };

    const handlePlaying = () => {
      if (reconnectAttempts.current > 0) {
        console.log(`Stream is playing, resetting reconnect attempts (was ${reconnectAttempts.current}).`);
        if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = undefined;
        reconnectAttempts.current = 0;
        stopNoise();
        addLogEntry({
          level: 'info',
          message: `Stream is playing, resetting reconnect attempts for ${playerState.value?.title}`,
        });
      }
    };

    audio.addEventListener('error', handleError);
    audio.addEventListener('stalled', handleError);
    audio.addEventListener('playing', handlePlaying);

    return () => {
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('stalled', handleError);
      audio.removeEventListener('playing', handlePlaying);
    };
  }, [isPodcast, isPlaying, attemptReconnect, startNoise, stopNoise, castSession, elementKey]);

  useEffect(() => {
    const forceRetry = (reason: string) => {
      if (reconnectAttempts.current > 0) {
        console.log(`${reason} during reconnect. Forcing immediate retry.`);
        addLogEntry({
          level: 'info',
          message: `${reason} during reconnect. Forcing immediate retry.`,
        });
        if (reconnectTimeout.current) {
          console.log('useEffect forceRetry: Cleaning up reconnect timeout');
          clearTimeout(reconnectTimeout.current);
        }
        // A short delay to allow the browser to stabilize
        reconnectTimeout.current = setTimeout(retryConnection, 250);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        forceRetry('App became visible');
      }
    };

    const handleOnline = () => {
      forceRetry('Network came online');
    };

    const handleOffline = () => {
      if (reconnectTimeout.current) {
        console.log('Network went offline. Clearing reconnect timeout.');
        addLogEntry({
          level: 'info',
          message: 'Network went offline. Clearing reconnect timeout.',
        });
        clearTimeout(reconnectTimeout.current);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [retryConnection]);

  const handleEnded = useCallback(() => {
    if (isPodcast) {
      // Store the final position before a rule replaces the current source.
      if (playerState.value) playerState.value = { ...playerState.value, isPlaying: false };
      void saveStateToDB();
      if (playlistRules.value[0]?.ruleType === PlaylistRuleType.podcastToStation) {
        playRadioStationByID(playlistRules.value[0].stationID);
      } else if (playlistRules.value[0]?.ruleType === PlaylistRuleType.podcastToPlaylist) {
        playlistUtil.playPlaylistByUrl(playlistRules.value[0].playlistUrl, true);
      }
    }
  }, [isPodcast, playlistRules.value]);

  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    if (castSession) {
      updateTimeUI();
      // The paused local audio element emits no remote timeupdate events.
      const timer = window.setInterval(updateTimeUI, 500);
      return () => window.clearInterval(timer);
    }
    let lastTime = 0;

    const updateTime = () => {
      if (Math.abs(audio.currentTime - lastTime) >= 1) {
        lastTime = audio.currentTime;
        updateTimeUI();
      }
    };
    const updateDuration = () => (durationSignal.value = audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('durationchange', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('durationchange', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [castMediaRef, castSession, updateTimeUI, handleEnded, elementKey]);

  useEffect(() => {
    if (castSession && audioRef.current) {
      audioRef.current.pause();
    }
  }, [castSession, elementKey]);

  useEffect(() => {
    if (
      !audioRef.current ||
      !playerState.value ||
      typeof navigator.mediaSession === 'undefined' ||
      (isPodcast && durationSignal.value === 0)
    ) {
      return;
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: playerState.value.title,
      artist: playerState.value.description,
      artwork: [{ src: playerState.value.imageUrl, sizes: '512x512', type: 'image/jpeg' }],
    });

    navigator.mediaSession.playbackState = playerState.value.isPlaying ? 'playing' : 'paused';

    navigator.mediaSession.setActionHandler('play', () => {
      handlePlayPause();
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      console.log('mediasession: Pause');
      handlePlayPause();
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      if (isPodcast) handleSeek(-10);
      else playNextRadioStation(true);
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      if (isPodcast) handleSeek(30);
      else playNextRadioStation();
    });

    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (!isPodcast || !audioRef.current || details.seekTime === undefined) return;
      if (castSession) {
        handleCastSeek(details.seekTime, true);
        return;
      }
      audioRef.current.currentTime = details.seekTime;
      updateTimeUI();
    });

    if (isPodcast && Number.isFinite(durationSignal.value) && durationSignal.value > 0) {
      navigator.mediaSession.setPositionState({
        duration: durationSignal.value,
        position: Math.min(
          durationSignal.value,
          Math.max(0, castSession ? (castMediaRef.current?.getEstimatedTime() ?? 0) : audioRef.current.currentTime),
        ),
        playbackRate: playbackRateSignal.value,
      });
    }

    return () => {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
      navigator.mediaSession.setActionHandler('seekto', null);
    };
  }, [
    playerState.value,
    durationSignal.value,
    isPodcast,
    handlePlayPause,
    handleSeek,
    updateTimeUI,
    castSession,
    castMediaRef,
    handleCastSeek,
  ]);

  // Expose a function to force remount
  const forceAudioRemount = () => {
    audioKey.value += 1;
  };

  return {
    audioRef,
    currentTime,
    currentTimeDisplayRef,
    progressBarRef,
    sliderRef,
    playbackRate: playbackRateSignal,
    duration: durationSignal,
    progressPercentage,
    playbackRates,
    isPodcast,
    isRadio,
    audioSources: audioSourcesSignal,
    handleSeek,
    handlePlaybackRateChange,
    handlePlayPause,
    handleClose,
    handleSliderChange,
    formatTime,
    isCastingAvailable,
    castStatus,
    castSession,
    startCasting,
    stopCasting,
    audioKey,
    forceAudioRemount,
  };
};
