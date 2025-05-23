import { useLocation } from 'preact-iso';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { useHead } from '~/hooks/useHead';
import { validationUtil } from '~/lib/validationUtil';
import { isDBLoaded } from '~/store/db/db';
import {
  clearLastPodcastSearchResult,
  lastPodcastSearchResult,
  setLastPodcastSearchResult,
} from '~/store/signals/podcast';
import { settingsState } from '~/store/signals/settings';
import { uiIsScrolled } from '~/store/signals/ui';
import { Podcast, PodcastSearchProvider } from '~/store/types';

export const usePodcasts = () => {
  const { query, route } = useLocation();
  const [searchTerm, setSearchTerm] = useState(lastPodcastSearchResult.value?.query || '');
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isInitialized = useRef(false);

  useHead({
    title: 'Podcasts',
  });

  useEffect(() => {
    if (!isDBLoaded.value || isInitialized.current) return;

    const initialSearchQuery = query['q'] ? decodeURIComponent(query['q']) || '' : '';

    if (initialSearchQuery) {
      const validatedQuery = validationUtil.getSanitizedSearchQuery(initialSearchQuery);
      setSearchTerm(validatedQuery);
    } else {
      setSearchTerm('');
    }
    isInitialized.current = true;
  }, [query, isDBLoaded.value]);

  const updateURLParams = useCallback(
    (search?: string) => {
      const url = new URL(window.location.href);

      if (search) {
        const validatedSearch = validationUtil.getSanitizedSearchQuery(search);
        url.searchParams.set('q', encodeURIComponent(validatedSearch));
      } else {
        url.searchParams.delete('q');
      }

      route(url.pathname + url.search, true);
    },
    [route],
  );

  useEffect(() => {
    const searchQuery = validationUtil.getSanitizedSearchQuery(searchTerm);

    if (searchQuery && searchQuery !== lastPodcastSearchResult.value?.query) {
      setIsLoading(true);
      updateURLParams(searchQuery);

      // Clear existing timeout
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }

      // Set new timeout
      searchTimeout.current = setTimeout(async () => {
        try {
          const isAppleSearch = settingsState.value?.podcastSearchProvider === PodcastSearchProvider.Apple;
          const response = isAppleSearch
            ? await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&media=podcast`)
            : await fetch('https://podcastindex.tuner.workers.dev', {
                method: 'POST',
                body: searchQuery,
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
              `Sorry, nothing found for "${searchQuery}"... 😥 Maybe you can try to change your search query?`,
            );
          }
          let searchResults: Podcast[];
          if (isAppleSearch) {
            searchResults =
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data.results.map((r: any) => ({
                ...r,
                id: r.trackId,
                title: r.collectionName,
                description: r.artistName,
                imageUrl: r.artworkUrl600 || r.artworkUrl100,
                url: r.feedUrl,
              }));
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            searchResults = data.feeds.map((f: any) => ({ ...f, imageUrl: f.image }));
          }
          setLastPodcastSearchResult(searchQuery, searchResults);
        } catch (error) {
          console.error('Error fetching podcasts:', error);
        } finally {
          setIsLoading(false);
        }
      }, 500); // 500ms delay
    } else {
      if (!searchQuery) {
        clearLastPodcastSearchResult();
      }
      setIsLoading(false);
    }

    // Cleanup timeout on component unmount
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchTerm]);

  useEffect(() => {
    if (query['focus-search']) {
      const url = new URL(window.location.href);
      url.searchParams.delete('focus-search');
      route(url.pathname + url.search, true);
      searchInputRef.current?.focus();
    }
  }, [query, route]);

  return {
    searchTerm,
    setSearchTerm,
    searchInputRef,
    searchResults: lastPodcastSearchResult.value?.result || [],
    isLoading,
    isScrolled: !!uiIsScrolled.value,
  };
};
