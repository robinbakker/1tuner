import { Search } from 'lucide-preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Loader } from '~/components/loader';
import { PodcastCard } from '~/components/podcast-card';
import { Input } from '~/components/ui/input';
import { slugify } from '~/lib/utils';
import { settingsState } from '~/store/signals/settings';
import { Podcast, PodcastSearchProvider } from '~/store/types';
import { followedPodcasts, recentlyVisitedPodcasts } from '../store/signals/podcast';

export const PodcastsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Podcast[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>();

  useEffect(() => {
    if (searchTerm.trim()) {
      setIsLoading(true);

      // Clear existing timeout
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }

      // export interface Podcast {
      //   id: string;
      //   title: string;
      //   description: string;
      //   imageUrl: string;
      //   url: string;
      //   feedUrl: string;
      //   categories?: string[];
      //   addedDate: number;
      //   lastFetched: number;
      //   episodes?: Episode[];
      // }

      // Set new timeout
      searchTimeout.current = setTimeout(async () => {
        try {
          //const url = `https://robinbakker-umbilical-71.deno.dev/API/worker/pi/search/byterm?q=${encodeURIComponent(searchTerm)}`;
          //const signature = await getSignature(url);
          // const response = await fetch(url, {
          //   headers: {
          //     'X-Umbilical-Signature': signature,
          //   },
          // });
          const isAppleSearch = settingsState.value?.podcastSearchProvider === PodcastSearchProvider.Apple;
          const response = isAppleSearch
            ? await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&media=podcast`)
            : await fetch('https://podcastindex.robinbakker.workers.dev', {
                method: 'POST',
                body: searchTerm,
              });

          if (!response.ok) {
            throw new Error('Search request failed 💥');
          }

          const data = await response.json();
          if (
            !data ||
            (isAppleSearch && (!data.results || !data.results.length)) ||
            (!isAppleSearch && (!data.feeds || !data.feeds.length))
          ) {
            throw new Error(
              `Sorry, nothing found for "${searchTerm}"... 😥 Maybe you can try to change your search query?`,
            );
          }
          if (isAppleSearch) {
            setSearchResults(
              data.results.map((r: any) => ({
                ...r,
                id: r.trackId,
                title: r.collectionName,
                description: r.artistName,
                imageUrl: r.artworkUrl600 || r.artworkUrl100,
                url: r.feedUrl,
              })),
            );
          } else {
            setSearchResults(data.feeds.map((f: any) => ({ ...f, imageUrl: f.image })));
          }
        } catch (error) {
          console.error('Error fetching podcasts:', error);
        } finally {
          setIsLoading(false);
        }
      }, 500); // 500ms delay
    } else {
      setSearchResults([]);
      setIsLoading(false);
    }

    // Cleanup timeout on component unmount
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchTerm]);

  const renderPodcastList = (podcasts: Podcast[] | undefined, title: string) => {
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
  };

  return (
    <div class="container mx-auto px-8 py-6">
      <h1 class="text-3xl font-bold mb-6">Podcasts</h1>
      <div class="mb-8 relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
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
