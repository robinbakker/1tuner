import { Search } from 'lucide-preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Loader } from '~/components/loader';
import { Card, CardContent } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { getSignature } from '~/lib/signature';
import { normalizedUrlWithoutScheme, slugify, stripHtml } from '~/lib/utils';
import { Podcast } from '~/store/types';
import { followedPodcasts, recentlyVisitedPodcasts } from '../store/signals/podcast';

export const PodcastsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Podcast[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeout = useRef<number>();

  useEffect(() => {
    if (searchTerm.trim()) {
      setIsLoading(true);

      // Clear existing timeout
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }

      // Set new timeout
      searchTimeout.current = window.setTimeout(async () => {
        try {
          const url = `https://robinbakker-umbilical-71.deno.dev/API/worker/pi/search/byterm?q=${encodeURIComponent(searchTerm)}`;
          const signature = await getSignature(url);
          const response = await fetch(url, {
            headers: {
              'X-Umbilical-Signature': signature,
            },
          });

          if (!response.ok) {
            throw new Error('Search request failed');
          }

          const data = await response.json();
          setSearchResults(data.feeds.map((f: any) => ({ ...f, imageUrl: f.image })));
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
            <a
              key={podcast.id}
              href={`/podcast/${slugify(podcast.title)}/${btoa(normalizedUrlWithoutScheme(podcast.url))}`}
              className="group"
            >
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-start space-x-4 p-4">
                  <img
                    src={podcast.imageUrl}
                    alt={podcast.title}
                    className="w-24 h-24 object-cover flex-shrink-0 rounded-md"
                  />
                  <div className="flex-1  min-w-0">
                    <h3 className="text-xl font-semibold mb-2 break-words group-hover:underline">{podcast.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{stripHtml(podcast.description)}</p>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </>
    );
  };

  return (
    <div class="container mx-auto p-4">
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
          className="w-full bg-white border-gray-300 focus:ring-primary pl-10"
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
