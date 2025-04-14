import { useLocation } from 'preact-iso';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { useHead } from '~/hooks/useHead';
import { validationUtil } from '~/lib/validationUtil';
import { isDBLoaded } from '~/store/db/db';
import { clearLastPodcastSearchResult, lastPodcastSearchResult } from '~/store/signals/podcast';
import { uiIsScrolled } from '~/store/signals/ui';
import { RadioStation } from '~/store/types';

type RadioBrowserStation = {
  changeuuid: string;
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  homepage: string;
  favicon: string;
  tags: string;
  country: string;
  countrycode: string;
  iso_3166_2: string;
  state?: string;
  language: string;
  languagecodes: string;
  votes: number;
  lastchangetime: string;
  lastchangetime_iso8601: string;
  codec: string;
  bitrate: number;
  hls: number;
  lastcheckok: number;
  lastchecktime: string;
  lastchecktime_iso8601: string;
  lastcheckoktime: string;
  lastcheckoktime_iso8601: string;
  lastlocalchecktime: string;
  lastlocalchecktime_iso8601: string;
  clicktimestamp?: string;
  clicktimestamp_iso8601?: string | null;
  clickcount: number;
  clicktrend: number;
  ssl_error: number;
  geo_lat: number;
  geo_long: number;
  geo_distance: number;
  has_extended_info: boolean;
};

export const useRBTest = () => {
  const { query, route } = useLocation();
  const [searchTerm, setSearchTerm] = useState(lastPodcastSearchResult.value?.query || '');
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isInitialized = useRef(false);
  const [searchResult, setSearchResult] = useState<RadioStation[]>([]);

  useHead({
    title: 'Radio Browser search test',
  });

  useEffect(() => {
    if (!isDBLoaded.value || isInitialized.current) return;

    const initialSearchQuery = query['q'] ? decodeURIComponent(query['q']) || '' : '';

    if (initialSearchQuery) {
      const validatedQuery = validationUtil.validateSearchQuery(initialSearchQuery);
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
        const validatedSearch = validationUtil.validateSearchQuery(search);
        url.searchParams.set('q', encodeURIComponent(validatedSearch));
      } else {
        url.searchParams.delete('q');
      }

      route(url.pathname + url.search, true);
    },
    [route],
  );

  useEffect(() => {
    const searchQuery = validationUtil.validateSearchQuery(searchTerm);

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
          const response = await fetch('https://radio-browser.tuner.workers.dev/stations', {
            //const response = await fetch('http://127.0.0.1:8787/stations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              name: searchQuery,
            }),
          });

          if (!response.ok) {
            throw new Error('Search request failed 💥');
          }

          const data = (await response.json()) as RadioBrowserStation[];
          if (!data?.length) {
            throw new Error(
              `Sorry, nothing found for "${searchQuery}"... 😥 Maybe you can try to change your search query?`,
            );
          }
          setSearchResult(
            data.map((station, index) => {
              return {
                id: station.stationuuid,
                name: station.name,
                logosource: station.favicon,
                streams: [{ url: station.url_resolved, mimetype: station.codec }],
                isFavorite: false,
                displayorder: index + 1,
                language: station.countrycode,
                genres: station.tags.split(',').map((tag) => tag.trim()),
              } as RadioStation;
            }),
          );
          console.log('Search results:', data);
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
  }, [searchTerm, updateURLParams]);

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
    searchResult,
    searchInputRef,
    isLoading,
    isScrolled: !!uiIsScrolled.value,
  };
};
