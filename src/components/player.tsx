import { ChevronDown, ChevronUp, FastForward, Pause, Play, Rewind, Timer, X } from 'lucide-preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { cn } from '~/lib/utils';
import { updatePodcastEpisodeCurrentTime } from '~/store/signals/podcast';
import { playerState, togglePlayerMaximized } from '../store/signals/player';

export function Player() {
  if (!playerState.value) return null;

  const audioRef = useRef<HTMLAudioElement>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  const isPodcast = playerState.value.pageLocation.startsWith('/podcast/');

  useEffect(() => {
    if (!audioRef.current || !playerState.value || !playerState.value.streams?.length) return;

    // Only reload when streams actually change
    const currentSrc = audioRef.current.currentSrc;
    const newSrc = playerState.value.streams[0].url;

    if (!currentSrc || !currentSrc.includes(newSrc)) {
      audioRef.current.load();
    }

    if (playerState.value.currentTime) audioRef.current.currentTime = playerState.value.currentTime;

    if (playerState.value.isPlaying) {
      audioRef.current.play();
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
  }, [playerState.value.isPlaying, playerState.value.streams]);

  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('durationchange', updateDuration);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('durationchange', updateDuration);
    };
  }, []);

  const handleSeek = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = audioRef.current.currentTime + seconds;
  };

  const handlePlaybackRateChange = (rate: number) => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const handlePlayPause = () => {
    if (!playerState.value) return;
    playerState.value = {
      ...playerState.value,
      isPlaying: !playerState.value.isPlaying,
    };
  };

  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    playerState.value = null;
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSliderChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (!audioRef.current) return;
    const newTime = parseFloat(target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  return (
    <div
      class={cn(
        'fixed transition-all duration-300 ease-in-out',
        'h-20 bottom-16 right-0 z-40',
        'md:right-0 w-full md:w-auto',
        playerState.value.isMaximized
          ? ['h-[calc(100%-4rem)] top-0 bottom-16', 'md:h-full md:top-0 md:bottom-0 md:w-96']
          : ['h-20', 'md:bottom-0 md:right-0 md:left-20'],
      )}
    >
      <audio ref={audioRef} preload="metadata">
        {playerState.value.streams.map((stream) => (
          <source key={stream.url} src={stream.url} type={stream.mimetype} />
        ))}
      </audio>

      <div
        class={cn(
          'h-full w-full bg-white/66 backdrop-blur-md',
          playerState.value.isMaximized ? 'shadow-lg' : 'shadow-md',
        )}
      >
        {playerState.value.isMaximized ? (
          // Maximized View Content
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
              <div class="flex flex-col items-center space-y-6">
                <div class="relative w-64 h-64 shadow-lg rounded-lg overflow-hidden">
                  <img src={playerState.value.imageUrl} alt="" class="w-full h-full object-cover" />
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
                        class="p-2 rounded-full transition-colors flex flex-col items-center"
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
                        class="p-2 rounded-full transition-colors flex flex-col items-center"
                        title="Forward 30 seconds"
                      >
                        <FastForward class="h-6 w-6 text-gray-600" />
                        <span class="text-xs text-gray-400 mt-1">30s</span>
                      </button>
                    </div>
                    <div class="w-full px-6 mb-6">
                      <div class="flex items-center space-x-2 text-sm text-gray-500">
                        <span>{formatTime(currentTime)}</span>
                        <input
                          type="range"
                          min="0"
                          max={duration || 0}
                          value={currentTime}
                          onChange={handleSliderChange}
                          class="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
                          style={{
                            backgroundImage: `linear-gradient(to right, #ff6000 ${(currentTime / duration) * 100}%, #ccc ${(currentTime / duration) * 100}%)`,
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
          // Minimized View
          <div class="flex items-center h-full px-4">
            <button
              onClick={() => togglePlayerMaximized()}
              class="mr-2 p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ChevronUp class="h-6 w-6 text-gray-600" />
            </button>

            <div class="flex items-center flex-1 min-w-0">
              <div class="relative h-12 w-12 flex-shrink-0">
                <img src={playerState.value.imageUrl} alt="" class="h-full w-full object-cover rounded-md" />
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
                <div class="flex-1">
                  <h3 class="text-sm font-medium text-gray-900 truncate">
                    <a href={playerState.value.pageLocation}>{playerState.value.title}</a>
                  </h3>
                  <p class="text-xs text-gray-500 truncate">{playerState.value.description}</p>
                </div>
                {isPodcast && (
                  <>
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
                  </>
                )}
                <button onClick={handleClose} class="ml-2 mr-4 p-2 hover:bg-gray-200 rounded-full transition-colors">
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
