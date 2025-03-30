import { computed, signal, useComputed, useSignalEffect } from '@preact/signals';
import { useCallback, useEffect, useRef } from 'preact/hooks';
import { playlistUtil } from '~/lib/playlistUtil';
import { reconnectUtil } from '~/lib/reconnectUtil';
import { saveStateToDB } from '~/store/db/db';
import { updatePodcastEpisodeCurrentTime } from '~/store/signals/podcast';
import { playNextRadioStation } from '~/store/signals/radio';
import { settingsState } from '~/store/signals/settings';
import { addToast } from '~/store/signals/ui';
import { isPlayerMaximized, playerState } from '../../store/signals/player';
import { useCastApi } from './useCastApi';

export const playbackRateSignal = signal(1);
export const durationSignal = signal(0);
export const audioSourcesSignal = computed(() => playerState.value?.streams || []);
export const currentTime = signal(0);

export const usePlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentTimeDisplayRef = useRef<HTMLSpanElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout>();
  const reconnectAttempts = signal(0);
  const audioContextRef = useRef<AudioContext | null>(null); // Reference for Web Audio API context
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null); // Reference for noise source
  const gainNodeRef = useRef<GainNode | null>(null); // Reference for the gain node

  const {
    isCastingAvailable,
    startCasting,
    stopCasting,
    handleCastPlayPause,
    handleCastSeek,
    castSession,
    castMediaRef,
  } = useCastApi();
  const maxReconnectAttempts = settingsState.value.radioStreamMaxReconnects || 50;
  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  const isPodcast = playerState.value?.playType === 'podcast';
  const isPlaylist = playerState.value?.playType === 'playlist';
  const isRadio = playerState.value?.playType === 'radio';
  const playlistUrl = isPlaylist ? playerState.value?.pageLocation : undefined;
  const progressPercentage = useComputed(() => (currentTime.value / durationSignal.value) * 100);

  useSignalEffect(() => {
    let playlistInterval: NodeJS.Timeout;

    const checkPlaylistCurrentPlaying = () => {
      playlistUtil.playPlaylistByUrl(playerState.value?.pageLocation);
    };

    if (playlistUrl) {
      checkPlaylistCurrentPlaying();
      playlistInterval = setInterval(checkPlaylistCurrentPlaying, 30000); // Check every 30 secs
    }

    return () => {
      if (playlistInterval) {
        clearInterval(playlistInterval);
      }
    };
  });

  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const updateTimeUI = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !playerState.value?.streams) return;
    currentTime.value = audio.currentTime;

    requestAnimationFrame(() => {
      if (currentTimeDisplayRef.current) {
        currentTimeDisplayRef.current.textContent = formatTime(audio.currentTime);
      }
      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${progressPercentage.value}%`;
      }
      if (sliderRef.current) {
        sliderRef.current.value = audio.currentTime.toString();
        sliderRef.current.style.backgroundImage = `linear-gradient(to right, #ff6000 ${progressPercentage.value}%, #ccc ${progressPercentage.value}%)`;
      }
    });
  }, [playerState.value?.streams, progressPercentage, formatTime]);

  const handleSeek = useCallback(
    (seconds: number) => {
      if (castSession && castMediaRef.current) {
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
    if (!audioRef.current || !audioRef.current.currentTime || !playerState.value) return;
    audioRef.current.pause();
    if (isPodcast) {
      updatePodcastEpisodeCurrentTime(
        playerState.value.contentID,
        playerState.value.streams?.[0]?.url || '',
        audioRef.current.currentTime,
      );
      currentTime.value = audioRef.current.currentTime;
      playerState.value.currentTime = audioRef.current.currentTime;
      saveStateToDB();
    } else {
      audioRef.current.currentTime = 0;
    }
  }, [playerState.value, isPodcast]);

  const handlePlayPause = useCallback(() => {
    if (!playerState.value) return;
    const newIsPlaying = !playerState.value.isPlaying;

    // Handle cast media if casting
    if (castSession && castMediaRef.current) {
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
        audioRef.current.play().catch((error) => {
          console.error('Error playing audio:', error);
          playerState.value = {
            ...playerState.value!,
            isPlaying: false,
          };
        });
      } else {
        setToPaused();
      }
    }
  }, [playerState.value, castSession, castMediaRef, handleCastPlayPause, setToPaused]);

  const handleClose = useCallback(() => {
    setToPaused();
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
    reconnectAttempts.value = 0;
    playerState.value = null;
    isPlayerMaximized.value = false;
  }, [reconnectAttempts, setToPaused]);

  const handleSliderChange = useCallback(
    (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (!audioRef.current) return;
      const newTime = parseFloat(target.value);
      audioRef.current.currentTime = newTime;
      updateTimeUI();
    },
    [updateTimeUI],
  );

  const startNoise = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    const audioContext = audioContextRef.current;

    // Create a buffer with random noise
    const bufferSize = audioContext.sampleRate * 1; // 1 second of audio
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1; // Generate random noise
    }

    // Create a buffer source
    const noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    // Create a gain node to control the volume
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.1; // Set the volume (0.1 = 10% of full volume)

    // Connect the noise source to the gain node, then to the destination
    noiseSource.connect(gainNode);
    gainNode.connect(audioContext.destination);

    noiseSource.start();

    noiseSourceRef.current = noiseSource;
    gainNodeRef.current = gainNode;
  }, []);

  const stopNoise = useCallback(() => {
    if (noiseSourceRef.current) {
      noiseSourceRef.current.stop();
      noiseSourceRef.current.disconnect();
      noiseSourceRef.current = null;
    }

    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!audioRef.current || !playerState.value || !playerState.value.streams?.length) return;

    const currentSrc = audioRef.current.currentSrc;
    const newSrc = playerState.value.streams[0].url;

    if (!currentSrc || !currentSrc.includes(newSrc)) {
      audioRef.current.load();
    }

    if (!audioRef.current.currentTime && playerState.value.currentTime) {
      audioRef.current.currentTime = playerState.value.currentTime;
    }

    if (playerState.value.isPlaying && !castSession) {
      if (!navigator.onLine) {
        console.log('Network is offline, should pausing playback?');
        //setToPaused();
        return;
      }

      const promise = audioRef.current.play();
      if (promise) {
        promise.catch((error) => {
          if (playerState.value) playerState.value = { ...playerState.value, isPlaying: false };
          console.error('Error playing audio:', error);
        });
      }
    } else {
      setToPaused();
    }
  }, [playerState.value, castSession, setToPaused]);

  const BUFFER_THRESHOLD = 5; // Minimum buffered time (in seconds) before reconnecting

  const hasSufficientBuffer = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return false;

    const currentTime = audio.currentTime;
    for (let i = 0; i < audio.buffered.length; i++) {
      const start = audio.buffered.start(i);
      const end = audio.buffered.end(i);
      if (currentTime >= start && currentTime <= end) {
        const bufferedTime = end - currentTime;
        console.log(`Buffered time: ${bufferedTime}s`);
        return bufferedTime > BUFFER_THRESHOLD;
      }
    }
    return false;
  }, []);

  const attemptReconnect = useCallback(() => {
    const audio = audioRef.current;
    console.log('Attempting to reconnect...', audio?.readyState, audio?.networkState, audio?.error);

    if (hasSufficientBuffer()) {
      console.log('Sufficient buffer available, skipping reconnect.');
      return;
    }

    if (reconnectAttempts.value >= maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      stopNoise(); // Stop noise
      addToast({
        title: '😢 Reconnect failed...',
        description: 'Failed to reconnect to the stream',
        variant: 'error',
      });
      reconnectAttempts.value = 0;
      playerState.value = playerState.value
        ? {
            ...playerState.value,
            isPlaying: false,
          }
        : null;
      return;
    }

    reconnectAttempts.value += 1;
    console.log(`Reconnect attempt ${reconnectAttempts.value}/${maxReconnectAttempts}`);
    addToast({
      title: '🛜 Reconnecting...',
      description: `There was an issue with the stream. Attempting to reconnect...`,
      variant: 'default',
    });

    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }

    // Start noise
    startNoise();

    const timeout = reconnectUtil.getReconnectTimeoutMs(reconnectAttempts.value, maxReconnectAttempts);

    reconnectTimeout.current = setTimeout(() => {
      if (!audio || !playerState.value?.isPlaying) {
        if (!navigator.onLine) stopNoise(); // Stop noise
        return;
      }

      audio.load();
      const playPromise = audio.play();

      if (playPromise) {
        playPromise
          .then(() => {
            console.log('Reconnect successful');
            reconnectAttempts.value = 0;
            stopNoise(); // Stop noise
          })
          .catch((error) => {
            console.log('Reconnect failed:', error);
            attemptReconnect();
          });
      }
    }, timeout);
  }, [maxReconnectAttempts, reconnectAttempts.value, playerState.value, startNoise, stopNoise, hasSufficientBuffer]);

  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    const handleError = (e: ErrorEvent) => {
      console.log('Stream error detected:', e);
      attemptReconnect();
    };

    const handlePlaying = () => {
      reconnectAttempts.value = 0;
      stopNoise(); // Stop noise
    };

    const checkStream = () => {
      if (!audio.paused && audio.readyState < 3 && playerState.value?.isPlaying && !hasSufficientBuffer()) {
        console.log('Stream appears to be stalled, attempting reconnect...');
        attemptReconnect();
      }
    };

    const interval = setInterval(checkStream, 5000); // Check every 5 seconds

    console.log('Adding audio event listeners');
    audio.addEventListener('error', handleError);
    audio.addEventListener('playing', handlePlaying);

    return () => {
      console.log('Cleaning up audio event listeners');
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('playing', handlePlaying);
      clearInterval(interval);
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      stopNoise(); // Stop noise
    };
  }, [attemptReconnect, stopNoise, hasSufficientBuffer]);

  useEffect(() => {
    const handleNetworkChange = () => {
      console.log('Network status changed:', navigator.onLine ? 'Online' : 'Offline');
      if (!navigator.onLine) {
        console.log('Network disconnected, pausing player and attempting reconnect...');
        if (playerState.value?.isPlaying) {
          //setToPaused();
          attemptReconnect();
        }
      } else {
        console.log('Network restored, attempting reconnect...');
        if (playerState.value?.isPlaying) {
          attemptReconnect();
        }
      }
    };

    window.addEventListener('offline', handleNetworkChange);
    window.addEventListener('online', handleNetworkChange);

    return () => {
      window.removeEventListener('offline', handleNetworkChange);
      window.removeEventListener('online', handleNetworkChange);
    };
  }, [attemptReconnect, setToPaused, playerState.value?.isPlaying]);

  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    const isRadioStream = playerState.value?.playType !== 'podcast';

    const handleError = (e: ErrorEvent) => {
      if (isRadioStream && playerState.value?.isPlaying) {
        console.log('Stream error, attempting reconnect...', e);
        attemptReconnect();
      }
    };

    const handlePlaying = () => {
      reconnectAttempts.value = 0;
      stopNoise();
    };

    audio.addEventListener('error', handleError);
    audio.addEventListener('playing', handlePlaying);

    return () => {
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('playing', handlePlaying);
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      stopNoise();
    };
  }, [playerState.value, reconnectAttempts.value, maxReconnectAttempts, startNoise, stopNoise, attemptReconnect]);

  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    let lastTime = 0;

    const updateTime = () => {
      // Use cast media time if casting
      if (castSession && castMediaRef.current) {
        lastTime = castMediaRef.current.getEstimatedTime() ?? 0;
        updateTimeUI();
        return;
      }

      if (Math.abs(audio.currentTime - lastTime) >= 1) {
        lastTime = audio.currentTime;
        updateTimeUI();
      }
    };
    const updateDuration = () => (durationSignal.value = audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('durationchange', updateDuration);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('durationchange', updateDuration);
    };
  }, [castMediaRef, castSession, updateTimeUI]);

  useEffect(() => {
    if (castSession && audioRef.current) {
      audioRef.current.pause();
    }
  }, [castSession]);

  useEffect(() => {
    if (
      !audioRef.current ||
      !playerState.value ||
      typeof navigator.mediaSession === 'undefined' ||
      (isPodcast && durationSignal.value === 0)
    )
      return;

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
      audioRef.current.currentTime = details.seekTime;
      updateTimeUI();
    });

    if (isPodcast) {
      navigator.mediaSession.setPositionState({
        duration: durationSignal.value,
        position: audioRef.current.currentTime,
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
  }, [playerState.value, durationSignal.value, isPodcast, handlePlayPause, handleSeek, updateTimeUI]);

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
    castSession,
    startCasting,
    stopCasting,
  };
};
