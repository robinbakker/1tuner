import { ArrowLeft, Share2 } from 'lucide-preact';
import { ComponentChildren } from 'preact';
import { cn } from '~/lib/utils';
import { isPlayerMaximized } from '~/store/signals/player';
import { headerTitle } from '~/store/signals/ui';
import { Player } from '../player/player';
import { useAppShell } from './useAppShell';

interface AppShellProps {
  children: ComponentChildren;
}

export const AppShell = ({ children }: AppShellProps) => {
  const { headerSentinelRef, isScrolled, isActive, handleBackClick, handleShare } = useAppShell();

  return (
    <div class="flex h-screen">
      <nav class="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-stone-800 shadow-lg md:relative md:h-full md:w-20 md:flex-shrink-0">
        <ul class="flex h-16 items-center justify-around md:h-full md:flex-col md:justify-start md:py-4">
          <li class="w-full">
            <a
              href={`/`}
              class={cn(
                'flex flex-col items-center justify-center p-2 transition-colors',
                'duration-200 hover:text-primary [&.active]:text-primary',
                isActive('/') && 'text-primary',
              )}
            >
              <svg
                class="h-6 w-6 text-current group-hover:text-primary transition-colors duration-200"
                xmlns="http://www.w3.org/2000/svg"
                style="isolation:isolate"
                stroke="currentColor"
                viewBox="0 0 42 42"
              >
                <defs>
                  <clipPath id="cpHome">
                    <path d="M0 0h42v42H0z" />
                  </clipPath>
                </defs>
                <g clip-path="url(#a)">
                  <path
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5.707 18.546l.039 19.452c0 .562.456 1.018 1.018 1.018h8.92a1.017 1.017 0 001.018-1.018v-9.865c0-1.685 2.633-3.686 4.317-3.686 1.685 0 4.317 2.001 4.317 3.686v9.865a1.017 1.017 0 001.018 1.018h8.92c.563 0 1.019-.456 1.019-1.018V18.546L21.019 2.984 5.707 18.546z"
                    vector-effect="non-scaling-stroke"
                  />
                </g>
              </svg>
              <span class="text-xs mt-1 text-center">Home</span>
            </a>
          </li>
          <li class="w-full">
            <a
              href={`/radio-stations`}
              class={cn(
                'flex flex-col items-center justify-center p-2 transition-colors',
                'duration-200 hover:text-primary [&.active]:text-primary',
                isActive('/radio-stations') && 'text-primary',
              )}
            >
              <svg
                class="h-6 w-6 text-current group-hover:text-primary transition-colors duration-200"
                xmlns="http://www.w3.org/2000/svg"
                style="isolation:isolate"
                stroke="currentColor"
                viewBox="0 0 42 42"
              >
                <defs>
                  <clipPath id="cpRadio">
                    <path d="M0 0h42v42H0z" />
                  </clipPath>
                </defs>
                <g clip-path="url(#a)">
                  <path
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17.611 39.318h21.063c.456 0 .826-.37.826-.826V15.369a.825.825 0 00-.826-.825H17.611M31.547 2.682L3.326 14.544a.825.825 0 00-.826.825v23.123c0 .456.37.826.826.826h14.285"
                    vector-effect="non-scaling-stroke"
                  />
                  <circle
                    cx="27.593"
                    cy="26.931"
                    r="6.745"
                    fill="none"
                    stroke-linecap="square"
                    stroke-miterlimit="3"
                    stroke-width="2"
                    vector-effect="non-scaling-stroke"
                  />
                </g>
              </svg>
              <span class="text-xs mt-1 text-center">Radio</span>
            </a>
          </li>
          <li class="w-full">
            <a
              href={`/podcasts`}
              class={cn(
                'flex flex-col items-center justify-center p-2 transition-colors',
                'duration-200 hover:text-primary [&.active]:text-primary',
                isActive('/podcasts') && 'text-primary',
              )}
            >
              <svg
                class="h-6 w-6 text-current group-hover:text-primary transition-colors duration-200"
                xmlns="http://www.w3.org/2000/svg"
                style="isolation:isolate"
                stroke="currentColor"
                viewBox="0 0 42 42"
              >
                <defs>
                  <clipPath id="aPodcast">
                    <path d="M0 0h42v42H0z" />
                  </clipPath>
                </defs>
                <g stroke-linecap="round" stroke-linejoin="round" stroke-width="2" clip-path="url(#a)">
                  <path
                    fill="none"
                    d="M14.246 10.272v10.28a6.254 6.254 0 1012.508 0v-10.28c0-3.454-2.8-6.254-6.254-6.254a6.238 6.238 0 00-5.624 3.527c-.168.349-.63 2.162-.63 2.727z"
                    vector-effect="non-scaling-stroke"
                  />
                  <path
                    fill="none"
                    d="M31 17.209v3.081c0 5.957-4.701 10.786-10.5 10.786S10 26.247 10 20.29v-3.081"
                    vector-effect="non-scaling-stroke"
                  />
                  <path
                    stroke-miterlimit="3"
                    d="M20.5 31.99v7.328M14.246 39.318h12.508"
                    vector-effect="non-scaling-stroke"
                  />
                </g>
              </svg>
              <span class="text-xs mt-1 text-center">Podcasts</span>
            </a>
          </li>
          <li class="w-full">
            <a
              href={'/settings'}
              class={cn(
                'flex flex-col items-center justify-center p-2 transition-colors',
                'duration-200 hover:text-primary [&.active]:text-primary',
                isActive('/settings') && 'text-primary',
              )}
            >
              <svg
                class="h-6 w-6 text-current group-hover:text-primary transition-colors duration-200"
                xmlns="http://www.w3.org/2000/svg"
                style="isolation:isolate"
                stroke="currentColor"
                viewBox="0 0 42 42"
              >
                <defs>
                  <clipPath id="aSettings">
                    <path d="M0 0h42v42H0z" />
                  </clipPath>
                </defs>
                <g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" clip-path="url(#a)">
                  <circle cx="21" cy="21" r="7.449" vector-effect="non-scaling-stroke" />
                  <path
                    d="M32.436 25.636a2.55 2.55 0 00.51 2.813l.093.093a3.093 3.093 0 11-4.374 4.373l-.092-.092a2.55 2.55 0 00-2.813-.51 2.549 2.549 0 00-1.545 2.333v.263a3.091 3.091 0 01-6.182 0v-.139a2.553 2.553 0 00-1.669-2.334 2.55 2.55 0 00-2.813.51l-.093.093a3.093 3.093 0 11-4.373-4.374l.092-.092a2.55 2.55 0 00.51-2.813 2.549 2.549 0 00-2.333-1.545h-.263a3.091 3.091 0 010-6.182h.139a2.553 2.553 0 002.334-1.669 2.55 2.55 0 00-.51-2.813l-.093-.093a3.093 3.093 0 114.374-4.373l.092.092a2.55 2.55 0 002.813.51h.124a2.549 2.549 0 001.545-2.333v-.263a3.091 3.091 0 016.182 0v.139a2.551 2.551 0 001.545 2.334 2.55 2.55 0 002.813-.51l.093-.093a3.093 3.093 0 114.373 4.374l-.092.092a2.55 2.55 0 00-.51 2.813v.124a2.549 2.549 0 002.333 1.545h.263a3.091 3.091 0 010 6.182h-.139a2.551 2.551 0 00-2.334 1.545z"
                    vector-effect="non-scaling-stroke"
                  />
                </g>
              </svg>
              <span class="text-xs mt-1 text-center">Settings</span>
            </a>
          </li>
        </ul>
      </nav>
      <main class={cn('flex-1 overflow-auto pb-40', isPlayerMaximized.value ? 'md:mr-96' : 'md:mb-20')}>
        {!!headerTitle.value && (
          <header
            class={`sticky top-0 z-20 transition-all duration-300 ${isScrolled ? 'bg-white/33 backdrop-blur-md shadow-md border-b app-shell-header' : 'bg-transparent'}`}
          >
            <div class="flex items-center justify-between p-4">
              <button
                onClick={handleBackClick}
                class="p-2 rounded-full hover:bg-gray-200 transition-colors duration-200"
              >
                <ArrowLeft class="h-6 w-6 text-gray-600" />
              </button>
              <h1
                class={`text-lg font-semibold transition-opacity truncate duration-300 ${isScrolled ? 'opacity-100' : 'opacity-0'}`}
              >
                {headerTitle.value}
              </h1>
              <button onClick={handleShare} class="p-2 rounded-full hover:bg-gray-200 transition-colors duration-200">
                <Share2 class="h-6 w-6 text-gray-600" />
              </button>
            </div>
          </header>
        )}
        <div ref={headerSentinelRef} class="h-1 w-full"></div>
        {children}
      </main>
      <Player />
    </div>
  );
};