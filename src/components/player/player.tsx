import { Cast, ChevronDown, ChevronUp, FastForward, Pause, Play, Rewind, Timer, X } from 'lucide-preact';
import { styleClass } from '~/lib/styleClass';
import { cn } from '~/lib/utils';
import { isPlayerMaximized, playerState, togglePlayerMaximized } from '../../store/signals/player';
import { Button } from '../ui/button';
import { usePlayer } from './usePlayer';

export const Player = () => {
  const {
    audioRef,
    currentTime,
    currentTimeDisplayRef,
    progressBarRef,
    sliderRef,
    playbackRate,
    duration,
    progressPercentage,
    playbackRates,
    isPodcast,
    isCastingAvailable,
    castSession,
    audioSources,
    startCasting,
    stopCasting,
    handleSeek,
    handlePlaybackRateChange,
    handlePlayPause,
    handleClose,
    handleSliderChange,
    formatTime,
  } = usePlayer();

  if (!audioSources.value?.length) return null;

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
        {playerState.value?.streams.map((stream) => (
          <source key={stream.url} src={stream.url} type={stream.mimetype} />
        ))}
      </audio>

      <div
        class={cn(
          'h-full w-full bg-white/66 dark:bg-stone-700/66 backdrop-blur-md relative',
          isPlayerMaximized.value
            ? 'shadow-lg backdrop-blur-2xl overscroll-none'
            : 'md:shadow-md player-minimized-backdrop',
        )}
      >
        {!isPlayerMaximized.value && isPodcast && (
          <div
            ref={progressBarRef}
            class="absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-200"
            style={{ width: `${progressPercentage.value}%` }}
          />
        )}
        {isPlayerMaximized.value ? (
          <div class="h-full flex flex-col">
            <div class="p-4 flex justify-between">
              <Button variant="outline" styleSize="icon" onClick={togglePlayerMaximized}>
                <ChevronDown class="h-6 w-6" />
              </Button>
              <div class="flex gap-2">
                {isCastingAvailable && (
                  <Button variant="outline" styleSize="icon" onClick={castSession ? stopCasting : startCasting}>
                    {castSession ? <Cast class="h-6 w-6 text-color-primary" /> : <Cast class="h-6 w-6" />}
                  </Button>
                )}
                <Button variant="outline" styleSize="icon" onClick={handleClose}>
                  <X class="h-6 w-6" />
                </Button>
              </div>
            </div>
            <div class="flex-1 overflow-y-auto p-6">
              <div class="flex flex-col items-center justify-center space-y-6">
                <div class={`relative flex flex-col items-center justify-center overflow-hidden w-64 h-64`}>
                  <img
                    src={playerState.value?.imageUrl}
                    alt={playerState.value?.title}
                    class={`w-48 h-48 ${isPodcast ? 'rounded-lg' : 'rounded-full'}`}
                  />
                </div>
                <div class="text-center w-full">
                  <h2 class="text-xl font-semibold text-stone-800 dark:text-stone-400">
                    <a href={playerState.value?.pageLocation}>{playerState.value?.title}</a>
                  </h2>
                  <p class="text-sm text-stone-500 mt-2">{playerState.value?.description}</p>
                </div>
                {isPodcast && (
                  <>
                    <div class="flex items-center space-x-4">
                      <button
                        onClick={() => handleSeek(-10)}
                        class="p-2 pt-6 rounded-full transition-colors flex flex-col items-center"
                        title="Rewind 10 seconds"
                      >
                        <Rewind class="h-6 w-6 text-stone-600" />
                        <span class="text-xs text-stone-400 mt-1">10s</span>
                      </button>

                      <button
                        onClick={handlePlayPause}
                        class="p-4 bg-primary rounded-full hover:bg-primary/90 transition-colors"
                      >
                        {playerState.value?.isPlaying ? (
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
                        <FastForward class="h-6 w-6 text-stone-600" />
                        <span class="text-xs text-stone-400 mt-1">30s</span>
                      </button>
                    </div>
                    <div class="w-full px-6 mb-6">
                      <div class="flex items-center space-x-2 text-sm text-stone-500">
                        <span ref={currentTimeDisplayRef}>{formatTime(currentTime.value)}</span>
                        <input
                          ref={sliderRef}
                          type="range"
                          min="0"
                          max={duration || 0}
                          value={currentTime.value}
                          onChange={handleSliderChange}
                          class={cn(
                            'flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-stone-300 dark:bg-stone-600',
                            '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4',
                            '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary',
                            '[&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4',
                            '[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0',
                          )}
                          style={{
                            backgroundImage: `linear-gradient(to right, #ff6000 ${progressPercentage.value}%, #ccc ${progressPercentage.value}%)`,
                          }}
                        />
                        <span>{formatTime(duration.value)}</span>
                      </div>
                    </div>
                  </>
                )}

                {!isPodcast && (
                  <button
                    onClick={handlePlayPause}
                    class="p-4 bg-primary rounded-full hover:bg-primary/90 transition-colors"
                  >
                    {playerState.value?.isPlaying ? (
                      <Pause class="h-8 w-8 text-white" />
                    ) : (
                      <Play class="h-8 w-8 text-white" />
                    )}
                  </button>
                )}

                {isPodcast && (
                  <div class="flex items-center space-x-2">
                    <Timer class="h-4 w-4 text-stone-500" />
                    <select
                      value={playbackRate}
                      onChange={(e) => handlePlaybackRateChange(Number(e.currentTarget.value))}
                      class={styleClass.selectSmall}
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
          <div class="flex items-center border-t border-b md:border-b-0 h-full px-4">
            <button
              onClick={() => togglePlayerMaximized()}
              class="mr-2 p-2 hover:bg-stone-200 dark:hover:bg-stone-600 cursor-pointer rounded-full transition-colors"
            >
              <ChevronUp class="h-6 w-6 text-stone-600 dark:text-stone-300" />
            </button>

            <div class="flex items-center flex-1 min-w-0">
              <div class="relative h-12 w-12 shrink-0">
                <img
                  src={playerState.value?.imageUrl}
                  alt={playerState.value?.title}
                  loading="lazy"
                  class="h-full w-full object-cover rounded-md"
                />
                <button
                  onClick={handlePlayPause}
                  class="absolute inset-0 flex items-center cursor-pointer justify-center bg-black/40 rounded-md hover:bg-black/50 transition-colors"
                >
                  {playerState.value?.isPlaying ? (
                    <Pause class="h-6 w-6 text-white" />
                  ) : (
                    <Play class="h-6 w-6 text-white" />
                  )}
                </button>
              </div>
              <div class="ml-3 min-w-0 flex-1 flex items-center">
                {' '}
                <div class="min-w-0 flex-1">
                  <h3 class="text-sm font-medium text-stone-800 dark:text-stone-200 truncate max-w-full">
                    <a href={playerState.value?.pageLocation} class="truncate block">
                      {playerState.value?.title}
                    </a>
                  </h3>
                  <p class="text-xs text-stone-500 truncate max-w-full">{playerState.value?.description}</p>
                </div>
                {isPodcast && (
                  <div class="shrink-0 flex items-center">
                    <button
                      onClick={() => handleSeek(-10)}
                      class="ml-2 p-2 rounded-full cursor-pointer transition-colors relative group"
                      title="Rewind 10 seconds"
                    >
                      <Rewind class="h-5 w-5 text-stone-600 dark:text-stone-300" />
                      <span class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-[10px] text-stone-400">
                        10s
                      </span>
                    </button>
                    <button
                      onClick={() => handleSeek(30)}
                      class="ml-1 p-2 rounded-full cursor-pointer transition-colors relative group"
                      title="Forward 30 seconds"
                    >
                      <FastForward class="h-5 w-5 text-stone-600 dark:text-stone-300" />
                      <span class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-[10px] text-stone-400">
                        30s
                      </span>
                    </button>
                  </div>
                )}
                {isCastingAvailable && (
                  <button
                    onClick={castSession ? stopCasting : startCasting}
                    class="ml-2 p-2 hover:bg-stone-200 rounded-full cursor-pointer transition-colors shrink-0"
                    title={castSession ? 'Stop casting' : 'Start casting'}
                  >
                    {castSession ? (
                      <Cast class="h-6 w-6 text-primary" />
                    ) : (
                      <Cast class="h-6 w-6 text-stone-600 dark:text-stone-300" />
                    )}
                  </button>
                )}
                <button
                  onClick={handleClose}
                  class="ml-2 mr-4 p-2 hover:bg-stone-200 dark:hover:bg-stone-600 cursor-pointer rounded-full transition-colors shrink-0"
                >
                  <X class="h-6 w-6 text-stone-600 dark:text-stone-300" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
