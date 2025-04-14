/* eslint-disable @typescript-eslint/no-explicit-any */
import { Search, X } from 'lucide-preact';
import { Loader } from '~/components/loader';
import { RadioStationCard } from '~/components/radio-station-card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { cn } from '~/lib/utils';
import { MAX_SEARCH_LENGTH } from '~/lib/validationUtil';
import { useRBTest } from './useRBTest';

export const RBTestPage = () => {
  const { isLoading, isScrolled, searchTerm, searchResult, searchInputRef, setSearchTerm } = useRBTest();

  return (
    <div class="mt-4">
      <div
        class={cn(
          'sticky top-0 z-20',
          isScrolled ? 'bg-white/80 backdrop-blur-md shadow-md dark:bg-black/80' : 'bg-background',
        )}
      >
        <div class="container mx-auto px-8">
          <div class="py-3 transform-gpu">
            <div class="relative">
              <h1
                class={cn(
                  'text-3xl font-bold transform-gpu transition-transform',
                  'origin-bottom-left duration-200 pr-12 md:pr-0',
                  isScrolled ? 'scale-[0.833]' : 'scale-100',
                )}
              >
                Radio Browser search test
              </h1>
              <div class="my-4">
                <div class="relative w-full">
                  <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400">
                    <Search size={18} />
                  </div>
                  {searchTerm && (
                    <Button
                      onClick={() => setSearchTerm('')}
                      class="absolute right-0 top-0 rounded-none rounded-r-lg"
                      title="Clear search"
                    >
                      <X size={18} />
                    </Button>
                  )}
                  <Input
                    ref={searchInputRef}
                    type="search"
                    placeholder="Search stations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
                    class={cn(
                      'w-full bg-white/80 dark:bg-black/80 focus:ring-primary pl-10',
                      searchTerm && 'pr-15',
                      '[&::-webkit-search-cancel-button]:hidden',
                    )}
                    autofocus={!!searchTerm}
                    maxLength={MAX_SEARCH_LENGTH}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="container @container mx-auto px-8">
        {isLoading ? (
          <Loader />
        ) : (
          <div class="pt-4 grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 sm:gap-12 justify-items-center">
            {searchResult.map((station) => (
              <RadioStationCard key={station.id} station={station} size="large" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
