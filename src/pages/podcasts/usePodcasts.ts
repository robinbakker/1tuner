import { useEffect, useRef, useState } from 'preact/hooks';
import { settingsState } from '~/store/signals/settings';
import { Podcast, PodcastSearchProvider } from '~/store/types';

export const usePodcasts = () => {
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

      // Set new timeout
      searchTimeout.current = setTimeout(async () => {
        try {
          const isAppleSearch = settingsState.value?.podcastSearchProvider === PodcastSearchProvider.Apple;
          const response = isAppleSearch
            ? await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&media=podcast`)
            : await fetch('https://podcastindex.tuner.workers.dev', {
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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    isLoading,
  };
};
