import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { updatePodcastEpisodeCurrentTime } from '~/store/signals/podcast';
import { isPlayerMaximized, playerState } from '../../store/signals/player';

export const usePlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentTimeRef = useRef(0);
  const currentTimeDisplayRef = useRef<HTMLSpanElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 40;
  const reconnectTimeout = useRef<NodeJS.Timeout>();
  const [playbackRate, setPlaybackRate] = useState(1);
  const [duration, setDuration] = useState(0);
  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  const isPodcast = playerState.value?.pageLocation.startsWith('/podcast/');

  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const updateTimeUI = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !playerState.value) return;
    currentTimeRef.current = audio.currentTime;

    requestAnimationFrame(() => {
      if (currentTimeDisplayRef.current) {
        currentTimeDisplayRef.current.textContent = formatTime(audio.currentTime);
      }
      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${(audio.currentTime / duration) * 100}%`;
      }
      if (sliderRef.current) {
        sliderRef.current.value = audio.currentTime.toString();
        sliderRef.current.style.backgroundImage = `linear-gradient(to right, #ff6000 ${(audio.currentTime / duration) * 100}%, #ccc ${(audio.currentTime / duration) * 100}%)`;
      }
    });
  }, [duration, formatTime]);

  const handleSeek = useCallback((seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = audioRef.current.currentTime + seconds;
  }, []);

  const handlePlaybackRateChange = useCallback((rate: number) => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  }, []);

  const handlePlayPause = useCallback(() => {
    if (!playerState.value) return;
    playerState.value = {
      ...playerState.value,
      isPlaying: !playerState.value.isPlaying,
    };
  }, []);

  const handleClose = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
    reconnectAttempts.current = 0;
    playerState.value = null;
    isPlayerMaximized.value = false;
  }, []);

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

  useEffect(() => {
    if (!audioRef.current || !playerState.value || !playerState.value.streams?.length) return;

    const currentSrc = audioRef.current.currentSrc;
    const newSrc = playerState.value.streams[0].url;

    if (!currentSrc || !currentSrc.includes(newSrc)) {
      audioRef.current.load();
    }

    if (playerState.value.currentTime) audioRef.current.currentTime = playerState.value.currentTime;

    if (playerState.value.isPlaying) {
      const promise = audioRef.current.play();
      if (promise) {
        promise.catch((error) => {
          if (playerState.value) playerState.value = { ...playerState.value, isPlaying: false };
          console.error('Error playing audio:', error);
        });
      }
    } else {
      audioRef.current.pause();
      if (playerState.value.pageLocation.startsWith('/podcast/')) {
        updatePodcastEpisodeCurrentTime(
          playerState.value.contentID,
          playerState.value.streams?.[0]?.url || '',
          audioRef.current.currentTime,
        );
      }
    }
  }, [playerState.value]);

  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    const isRadioStream = !playerState.value?.pageLocation.startsWith('/podcast/');

    const handleStalled = () => {
      if (isRadioStream && playerState.value?.isPlaying) {
        console.log('Stream stalled, attempting reconnect...');
        attemptReconnect();
      }
    };

    const handleError = (e: ErrorEvent) => {
      if (isRadioStream && playerState.value?.isPlaying) {
        console.log('Stream error, attempting reconnect...', e);
        attemptReconnect();
      }
    };

    const attemptReconnect = () => {
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.log('Max reconnect attempts reached');
        reconnectAttempts.current = 0;
        playerState.value = playerState.value
          ? {
              ...playerState.value,
              isPlaying: false,
            }
          : null;
        return;
      }

      reconnectAttempts.current += 1;
      console.log(`Reconnect attempt ${reconnectAttempts.current}/${maxReconnectAttempts}`);

      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }

      const timeout =
        reconnectAttempts.current <= 20 ? 500 : 1000 * Math.min(2 ** (reconnectAttempts.current - 10), 16);

      reconnectTimeout.current = setTimeout(() => {
        if (!audio || !playerState.value?.isPlaying) return;

        audio.load();
        const playPromise = audio.play();

        if (playPromise) {
          playPromise
            .then(() => {
              console.log('Reconnect successful');
              reconnectAttempts.current = 0;
            })
            .catch((error) => {
              console.log('Reconnect failed:', error);
              attemptReconnect();
            });
        }
      }, timeout);
    };

    const handlePlaying = () => (reconnectAttempts.current = 0);

    audio.addEventListener('stalled', handleStalled);
    audio.addEventListener('error', handleError);
    audio.addEventListener('playing', handlePlaying);

    return () => {
      audio.removeEventListener('stalled', handleStalled);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('playing', handlePlaying);
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [playerState.value?.isPlaying]);

  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    let lastTime = 0;

    const updateTime = () => {
      if (Math.abs(audio.currentTime - lastTime) >= 1) {
        lastTime = audio.currentTime;
        updateTimeUI();
      }
    };
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('durationchange', updateDuration);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('durationchange', updateDuration);
    };
  }, [duration]);

  useEffect(() => {
    if (!audioRef.current || !playerState.value || typeof navigator.mediaSession === 'undefined') return;

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
      handlePlayPause();
    });

    if (isPodcast) {
      navigator.mediaSession.setActionHandler('seekbackward', () => {
        handleSeek(-10);
      });

      navigator.mediaSession.setActionHandler('seekforward', () => {
        handleSeek(30);
      });

      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (!audioRef.current || details.seekTime === undefined) return;
        audioRef.current.currentTime = details.seekTime;
        updateTimeUI();
      });
    }

    navigator.mediaSession.setPositionState({
      duration: duration,
      position: currentTimeRef.current,
      playbackRate: playbackRate,
    });

    return () => {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('seekforward', null);
      navigator.mediaSession.setActionHandler('seekto', null);
    };
  }, [playerState.value, isPodcast, duration, playbackRate]);

  return {
    audioRef,
    currentTimeRef,
    currentTimeDisplayRef,
    progressBarRef,
    sliderRef,
    playbackRate,
    duration,
    playbackRates,
    isPodcast,
    handleSeek,
    handlePlaybackRateChange,
    handlePlayPause,
    handleClose,
    handleSliderChange,
    formatTime,
  };
};