import { Search } from 'lucide-preact';
import { useCallback } from 'preact/hooks';
import { Loader } from '~/components/loader';
import { PodcastCard } from '~/components/podcast-card';
import { Input } from '~/components/ui/input';
import { slugify } from '~/lib/utils';
import { Podcast } from '~/store/types';
import { followedPodcasts, recentlyVisitedPodcasts } from '../../store/signals/podcast';
import { usePodcasts } from './usePodcasts';

export const PodcastsPage = () => {
  const { isLoading, searchTerm, setSearchTerm, searchResults } = usePodcasts();

  const renderPodcastList = useCallback((podcasts: Podcast[] | undefined, title: string) => {
    if (isLoading) return <div>Loading...</div>;
    if (!podcasts?.length) return null;

    return (
      <>
        <h2 className="text-2xl font-semibold mb-4">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {podcasts.map((podcast) => (
            <PodcastCard key={`${slugify(title)}-${podcast.id}`} size="large" podcast={podcast} />
          ))}
        </div>
      </>
    );
  }, []);

  return (
    <div class="container mx-auto px-8 py-6">
      <h1 class="text-3xl font-bold mb-6">Podcasts</h1>
      <div class="mb-8 relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400">
          <Search size={18} />
        </div>
        <Input
          type="search"
          placeholder="Search podcasts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
          className="w-full focus:ring-primary pl-10"
        />
      </div>
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
  );
};
