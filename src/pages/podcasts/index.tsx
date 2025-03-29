/* eslint-disable @typescript-eslint/no-explicit-any */
import { Search, X } from 'lucide-preact';
import { useCallback } from 'preact/hooks';
import { ContentSection } from '~/components/content-section';
import { Loader } from '~/components/loader';
import { PodcastCard } from '~/components/podcast-card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { cn, slugify } from '~/lib/utils';
import { MAX_SEARCH_LENGTH } from '~/lib/validationUtil';
import { Podcast } from '~/store/types';
import { followedPodcasts, recentlyVisitedPodcasts } from '../../store/signals/podcast';
import { usePodcasts } from './usePodcasts';

export const PodcastsPage = () => {
  const { isLoading, isScrolled, searchTerm, searchInputRef, setSearchTerm, searchResults } = usePodcasts();

  const renderPodcastList = useCallback(
    (podcasts: Podcast[] | undefined, title: string, nrToSmall?: number) => {
      if (isLoading) return <div>Loading...</div>;
      if (!podcasts?.length) return null;
      const slugTitle = slugify(title);
      if (podcasts.length <= (nrToSmall || 999)) {
        return (
          <ContentSection title={title} hasNoPadding>
            <div class="grid grid-cols-1 @xl:grid-cols-2 @4xl:grid-cols-3 gap-6 mb-8">
              {podcasts.map((podcast) => (
                <PodcastCard key={`${slugTitle}-${podcast.id}`} size="large" podcast={podcast} />
              ))}
            </div>
          </ContentSection>
        );
      }
      return (
        <ContentSection
          className="max-sm:-mx-8 max-sm:w-screen"
          insetClassName="max-sm:px-8"
          title={title}
          isScrollable
        >
          <ul class="flex gap-6 md:gap-10 max-sm:px-8">
            {podcasts.map((podcast) => (
              <li class="shrink-0">
                <PodcastCard key={`${slugTitle}-${podcast.id}`} podcast={podcast} />
              </li>
            ))}
            <li class="shrink-0 w-0.5"></li>
          </ul>
        </ContentSection>
      );
    },
    [isLoading],
  );

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
                Podcasts
              </h1>
              <div class="my-4">
                <div class="relative w-full">
                  <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400">
                    <Search size={18} />
                  </div>
                  {searchTerm && (
                    <Button onClick={() => setSearchTerm('')} class="absolute right-0 top-0 rounded-none rounded-r-lg">
                      <X size={18} />
                    </Button>
                  )}
                  <Input
                    ref={searchInputRef}
                    type="search"
                    placeholder="Search podcasts..."
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
        {typeof window === 'undefined' && (globalThis as any).__PRERENDER_PODCASTS__ && (
          <>{renderPodcastList((globalThis as any).__PRERENDER_PODCASTS__, 'Podcasts')}</>
        )}
        {isLoading ? (
          <Loader />
        ) : (
          <>
            {searchResults.length > 0 ? (
              renderPodcastList(searchResults, 'Search Results')
            ) : (
              <>
                {renderPodcastList(
                  [...followedPodcasts.value].sort((a, b) => {
                    const aIndex = recentlyVisitedPodcasts.value.findIndex((p) => p.id === a.id);
                    const bIndex = recentlyVisitedPodcasts.value.findIndex((p) => p.id === b.id);

                    // If both podcasts are in recently visited
                    if (aIndex !== -1 && bIndex !== -1) {
                      return aIndex - bIndex;
                    }
                    // If only a is in recently visited
                    if (aIndex !== -1) {
                      return -1;
                    }
                    // If only b is in recently visited
                    if (bIndex !== -1) {
                      return 1;
                    }
                    // If neither is in recently visited, maintain original order
                    return 0;
                  }),
                  'Following',
                  2,
                )}
                {renderPodcastList(
                  recentlyVisitedPodcasts.value.filter((p) => !followedPodcasts.value.some((fp) => fp.id === p.id)),
                  'Last visited',
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
