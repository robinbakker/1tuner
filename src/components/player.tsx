import { ChevronDown, ChevronUp, FastForward, Pause, Play, Rewind, Timer, X } from 'lucide-preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { cn } from '~/lib/utils';
import { updatePodcastEpisodeCurrentTime } from '~/store/signals/podcast';
import { isPlayerMaximized, playerState, togglePlayerMaximized } from '../store/signals/player';

export function Player() {
  if (!playerState.value) return null;

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
  const isPodcast = playerState.value.pageLocation.startsWith('/podcast/');

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

  const updateTimeUI = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !playerState.value) return;
    currentTimeRef.current = audio.currentTime;

    // Only update refs if they exist and the parent elements are mounted
    // This prevents errors during view transitions
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
  }, [duration]);

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

  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const handleSliderChange = useCallback((e: Event) => {
    const target = e.target as HTMLInputElement;
    if (!audioRef.current) return;
    const newTime = parseFloat(target.value);
    audioRef.current.currentTime = newTime;
    updateTimeUI();
  }, []);

  return (
    <div
      class={cn(
        'fixed transition-all duration-300 ease-in-out',
        'h-20 bottom-16 right-0 z-50',
        'md:right-0 w-full md:w-auto',
        isPlayerMaximized.value
          ? ['h-full top-0 bottom-0 overscroll-none', 'md:top-0 md:w-96']
          : ['h-20', 'md:bottom-0 md:right-0 md:left-20'],
      )}
      style={{
        touchAction: isPlayerMaximized.value ? 'none' : undefined,
      }}
    >
      <audio ref={audioRef} preload="metadata">
        {playerState.value.streams.map((stream) => (
          <source key={stream.url} src={stream.url} type={stream.mimetype} />
        ))}
      </audio>

      <div
        class={cn(
          'h-full w-full bg-white/66 backdrop-blur-md relative',
          isPlayerMaximized.value ? 'shadow-lg bg-white/55 overscroll-none' : 'md:shadow-md',
        )}
      >
        {!isPlayerMaximized.value && isPodcast && (
          <div
            ref={progressBarRef}
            class="absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-200"
            style={{ width: `${(currentTimeRef.current / duration) * 100}%` }}
          />
        )}
        {isPlayerMaximized.value ? (
          <div class="h-full flex flex-col">
            <div class="p-4 flex justify-between">
              <button
                onClick={() => togglePlayerMaximized()}
                class="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <ChevronDown class="h-6 w-6 text-gray-600" />
              </button>
              <button onClick={handleClose} class="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X class="h-6 w-6 text-gray-600" />
              </button>
            </div>
            <div class="flex-1 overflow-y-auto p-6">
              <div class="flex flex-col items-center justify-center space-y-6">
                <div class={`relative flex flex-col items-center justify-center overflow-hidden w-64 h-64`}>
                  <img
                    src={playerState.value.imageUrl}
                    alt={playerState.value.title}
                    class={`w-48 h-48${isPodcast ? '' : ' rounded-full'}`}
                  />
                </div>
                <div class="text-center w-full">
                  <h2 class="text-xl font-semibold text-gray-900">
                    <a href={playerState.value.pageLocation}>{playerState.value.title}</a>
                  </h2>
                  <p class="text-sm text-gray-500 mt-2">{playerState.value.description}</p>
                </div>
                {isPodcast && (
                  <>
                    <div class="flex items-center space-x-4">
                      <button
                        onClick={() => handleSeek(-10)}
                        class="p-2 pt-6 rounded-full transition-colors flex flex-col items-center"
                        title="Rewind 10 seconds"
                      >
                        <Rewind class="h-6 w-6 text-gray-600" />
                        <span class="text-xs text-gray-400 mt-1">10s</span>
                      </button>

                      <button
                        onClick={handlePlayPause}
                        class="p-4 bg-primary rounded-full hover:bg-primary/90 transition-colors"
                      >
                        {playerState.value.isPlaying ? (
                          <Pause class="h-8 w-8 text-white" />
                        ) : (
                          <Play class="h-8 w-8 text-white" />
                        )}
                      </button>

                      <button
                        onClick={() => handleSeek(30)}
                        class="p-2 pt-6 rounded-full transition-colors flex flex-col items-center"
                        title="Forward 30 seconds"
                      >
                        <FastForward class="h-6 w-6 text-gray-600" />
                        <span class="text-xs text-gray-400 mt-1">30s</span>
                      </button>
                    </div>
                    <div class="w-full px-6 mb-6">
                      <div class="flex items-center space-x-2 text-sm text-gray-500">
                        <span ref={currentTimeDisplayRef}>{formatTime(currentTimeRef.current)}</span>
                        <input
                          ref={sliderRef}
                          type="range"
                          min="0"
                          max={duration || 0}
                          value={currentTimeRef.current}
                          onChange={handleSliderChange}
                          class="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gray-700 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-gray-700 [&::-moz-range-thumb]:border-0"
                          style={{
                            backgroundImage: `linear-gradient(to right, #ff6000 ${(currentTimeRef.current / duration) * 100}%, #ccc ${(currentTimeRef.current / duration) * 100}%)`,
                          }}
                        />
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>
                  </>
                )}

                {!isPodcast && (
                  <button
                    onClick={handlePlayPause}
                    class="p-4 bg-primary rounded-full hover:bg-primary/90 transition-colors"
                  >
                    {playerState.value.isPlaying ? (
                      <Pause class="h-8 w-8 text-white" />
                    ) : (
                      <Play class="h-8 w-8 text-white" />
                    )}
                  </button>
                )}

                {isPodcast && (
                  <div class="flex items-center space-x-2">
                    <Timer class="h-4 w-4 text-gray-500" />
                    <select
                      value={playbackRate}
                      onChange={(e) => handlePlaybackRateChange(Number(e.currentTarget.value))}
                      class="bg-transparent text-sm text-gray-700 border border-gray-300 rounded-md px-2 py-1"
                    >
                      {playbackRates.map((rate) => (
                        <option key={rate} value={rate}>
                          {rate}x
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div class="flex items-center border-t border-b md:border-b-0 border-slate-300/50 h-full px-4">
            <button
              onClick={() => togglePlayerMaximized()}
              class="mr-2 p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ChevronUp class="h-6 w-6 text-gray-600" />
            </button>

            <div class="flex items-center flex-1 min-w-0">
              <div class="relative h-12 w-12 flex-shrink-0">
                <img
                  src={playerState.value.imageUrl}
                  alt={playerState.value.title}
                  loading="lazy"
                  class="h-full w-full object-cover rounded-md"
                />
                <button
                  onClick={handlePlayPause}
                  class="absolute inset-0 flex items-center justify-center bg-black/40 rounded-md hover:bg-black/50 transition-colors"
                >
                  {playerState.value.isPlaying ? (
                    <Pause class="h-6 w-6 text-white" />
                  ) : (
                    <Play class="h-6 w-6 text-white" />
                  )}
                </button>
              </div>
              <div class="ml-3 min-w-0 flex-1 flex items-center">
                {' '}
                <div class="min-w-0 flex-1">
                  <h3 class="text-sm font-medium text-gray-900 truncate max-w-full">
                    <a href={playerState.value.pageLocation} class="truncate block">
                      {playerState.value.title}
                    </a>
                  </h3>
                  <p class="text-xs text-gray-500 truncate max-w-full">{playerState.value.description}</p>
                </div>
                {isPodcast && (
                  <div class="flex-shrink-0 flex items-center">
                    <button
                      onClick={() => handleSeek(-10)}
                      class="ml-2 p-2 rounded-full transition-colors relative group"
                      title="Rewind 10 seconds"
                    >
                      <Rewind class="h-5 w-5 text-gray-600" />
                      <span class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-400">
                        10s
                      </span>
                    </button>
                    <button
                      onClick={() => handleSeek(30)}
                      class="ml-1 p-2 rounded-full transition-colors relative group"
                      title="Forward 30 seconds"
                    >
                      <FastForward class="h-5 w-5 text-gray-600" />
                      <span class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-400">
                        30s
                      </span>
                    </button>
                  </div>
                )}
                <button
                  onClick={handleClose}
                  class="ml-2 mr-4 p-2 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0"
                >
                  <X class="h-6 w-6 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
