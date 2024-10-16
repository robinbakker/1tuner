'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Podcast } from '@/lib/db';
import { getSignature } from '@/lib/signature';
import { normalizedUrlWithoutScheme, slugify, stripHtml } from '@/lib/utils';
import { SearchIcon } from 'lucide-preact';
import { useState } from 'preact/hooks';
import { followedPodcasts, recentlyVisitedPodcasts } from '../lib/store';

export function PodcastSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Podcast[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: Event) => {
    e.preventDefault();
    setIsLoading(true);

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
  };

  const renderPodcastList = (podcasts: Podcast[] | undefined, title: string) => {
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
                  <img src={podcast.imageUrl} alt={podcast.title} className="w-24 h-24 object-cover flex-shrink-0 rounded-md" />
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Podcasts</h1>
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Search podcasts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
            className="flex-grow bg-white border-gray-300 focus:border-primary focus:ring-primary"
          />
          <Button type="submit" disabled={isLoading}>
            <SearchIcon className="h-4 w-4 mr-2" />
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </form>

      {searchResults.length > 0 ? (
        renderPodcastList(searchResults, 'Search Results')
      ) : (
        <>
          {renderPodcastList(followedPodcasts.value, 'Following')}
          {renderPodcastList(recentlyVisitedPodcasts.value, 'Recently visited')}
        </>
      )}
    </div>
  );
}
