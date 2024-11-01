import { ChevronDown, ChevronUp, Pause, Play } from 'lucide-preact';
import { cn } from '~/lib/utils';
import { audioPlayer, toggleMaximized } from '../lib/audio-store';

export function AudioPlayer() {
  if (!audioPlayer.value) return null;

  return (
    <div
      class={cn(
        'fixed transition-all duration-300 ease-in-out',
        'h-20 bottom-16 right-0 z-40',
        'md:right-0 w-full md:w-auto',
        audioPlayer.value.isMaximized
          ? ['h-[calc(100%-4rem)] top-0 bottom-16', 'md:h-full md:top-0 md:bottom-0 md:w-96']
          : ['h-20', 'md:bottom-0 md:right-0 md:left-20'],
      )}
    >
      <div
        class={cn(
          'h-full w-full bg-white/66 backdrop-blur-md',
          audioPlayer.value.isMaximized ? 'shadow-lg' : 'shadow-md',
        )}
      >
        {audioPlayer.value.isMaximized ? (
          // Maximized View Content
          <div class="h-full flex flex-col">
            <div class="p-4">
              <button
                onClick={() => toggleMaximized()}
                class="p-2 hover:bg-gray-200 rounded-full transition-colors float-right"
              >
                <ChevronDown class="h-6 w-6 text-gray-600" />
              </button>
            </div>
            <div class="flex-1 overflow-y-auto p-6">
              <div class="flex flex-col items-center space-y-6">
                <div class="relative w-64 h-64 shadow-lg rounded-lg overflow-hidden">
                  <img src={audioPlayer.value.imageUrl} alt="" class="w-full h-full object-cover" />
                </div>
                <div class="text-center w-full">
                  <h2 class="text-xl font-semibold text-gray-900">{audioPlayer.value.title}</h2>
                  <p class="text-sm text-gray-500 mt-2">{audioPlayer.value.description}</p>
                </div>
                <button
                  onClick={() => {
                    if (!audioPlayer.value) return;
                    audioPlayer.value = {
                      ...audioPlayer.value,
                      isPlaying: !audioPlayer.value.isPlaying,
                    };
                  }}
                  class="p-4 bg-primary rounded-full hover:bg-primary/90 transition-colors"
                >
                  {audioPlayer.value.isPlaying ? (
                    <Pause class="h-8 w-8 text-white" />
                  ) : (
                    <Play class="h-8 w-8 text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Minimized View
          <div class="flex items-center h-full px-4">
            <div class="flex items-center flex-1 min-w-0">
              <div class="relative h-12 w-12 flex-shrink-0">
                <img src={audioPlayer.value.imageUrl} alt="" class="h-full w-full object-cover rounded-md" />
                <button
                  onClick={() => {
                    if (!audioPlayer.value) return;
                    audioPlayer.value = {
                      ...audioPlayer.value,
                      isPlaying: !audioPlayer.value.isPlaying,
                    };
                  }}
                  class="absolute inset-0 flex items-center justify-center bg-black/40 rounded-md hover:bg-black/50 transition-colors"
                >
                  {audioPlayer.value.isPlaying ? (
                    <Pause class="h-6 w-6 text-white" />
                  ) : (
                    <Play class="h-6 w-6 text-white" />
                  )}
                </button>
              </div>
              <div class="ml-3 min-w-0 flex-1">
                <h3 class="text-sm font-medium text-gray-900 truncate">{audioPlayer.value.title}</h3>
                <p class="text-xs text-gray-500 truncate">{audioPlayer.value.description}</p>
              </div>
              <button
                onClick={() => toggleMaximized()}
                class="ml-4 p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <ChevronUp class="h-6 w-6 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
