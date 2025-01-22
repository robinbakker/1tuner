import { Search } from 'lucide-preact';
import { useCallback } from 'preact/hooks';
import { Loader } from '~/components/loader';
import { PodcastCard } from '~/components/podcast-card';
import { Input } from '~/components/ui/input';
import { cn, slugify } from '~/lib/utils';
import { Podcast } from '~/store/types';
import { followedPodcasts, recentlyVisitedPodcasts } from '../../store/signals/podcast';
import { usePodcasts } from './usePodcasts';

export const PodcastsPage = () => {
  const { isLoading, isScrolled, searchTerm, setSearchTerm, searchResults } = usePodcasts();

  const renderPodcastList = useCallback((podcasts: Podcast[] | undefined, title: string) => {
    if (isLoading) return <div>Loading...</div>;
    if (!podcasts?.length) return null;
    const slugTitle = slugify(title);
    return (
      <>
        <h2 className="text-xl opacity-60 font-semibold mb-4">{title}</h2>
        <div className="grid grid-cols-1 @xl:grid-cols-2 @4xl:grid-cols-3 gap-6 mb-8">
          {podcasts.map((podcast) => (
            <PodcastCard key={`${slugTitle}-${podcast.id}`} size="large" podcast={podcast} />
          ))}
        </div>
      </>
    );
  }, []);

  return (
    <>
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
                  'text-3xl font-bold transform-gpu transition-transform origin-bottom-left duration-200 pr-12 md:pr-0',
                  isScrolled ? 'scale-[0.833]' : 'scale-100',
                )}
              >
                Podcasts
              </h1>
              <div class="my-4">
                <div class="relative w-full">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400">
                    <Search size={18} />
                  </div>
                  <Input
                    type="search"
                    placeholder="Search podcasts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
                    className="w-full focus:ring-primary pl-10"
                    autofocus={!!searchTerm}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="container mx-auto px-8">
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
                {renderPodcastList(followedPodcasts.value, 'Following')}
                {renderPodcastList(recentlyVisitedPodcasts.value, 'Last visited')}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};
