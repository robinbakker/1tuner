import { computed } from '@preact/signals';
import { useLocation } from 'preact-iso';
import { useCallback, useEffect, useMemo, useRef } from 'preact/hooks';
import { useHead } from '~/hooks/useHead';
import { isDBLoaded } from '~/store/db/db';
import {
  activeRadioFilterCount,
  clearLastRadioSearchResult,
  lastRadioSearchResult,
  radioGenres,
  radioLanguages,
  radioSearchFilters,
  radioStations,
  setLastRadioSearchResultQuery,
} from '~/store/signals/radio';
import { uiIsScrolled } from '~/store/signals/ui';
import { RadioSearchFilters } from '~/store/types';

export const useRadioStations = () => {
  const { query, route } = useLocation();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isInitialized = useRef(false);

  useHead({
    title: 'Radio stations',
  });

  // Sync URL params with state on initial load
  useEffect(() => {
    if (!isDBLoaded.value || isInitialized.current) return;

    const initialSearchQuery = query['q'] ? decodeURIComponent(query['q']) || '' : '';
    const initialLanguages = query['region']?.split(',').filter(Boolean) || [];
    const initialGenres = query['genre']?.split(',').filter(Boolean) || [];

    if (initialSearchQuery) {
      setLastRadioSearchResultQuery(initialSearchQuery);
    } else {
      clearLastRadioSearchResult();
    }
    const savedLanguages = radioSearchFilters.value?.regions || [navigator.language];
    radioSearchFilters.value = {
      regions: initialLanguages.length ? initialLanguages : savedLanguages,
      genres: initialGenres,
    };

    isInitialized.current = true;
  }, [query, isDBLoaded.value, radioSearchFilters.value]);

  // Update URL helper function
  const updateURLParams = useCallback(
    (search?: string, searchFilters?: RadioSearchFilters | null) => {
      const url = new URL(window.location.href);

      if (search) {
        url.searchParams.set('q', encodeURIComponent(search));
      } else {
        url.searchParams.delete('q');
      }

      if (searchFilters?.regions?.length) {
        url.searchParams.set('region', searchFilters.regions.join(','));
      } else {
        url.searchParams.delete('region');
      }

      if (searchFilters?.genres?.length) {
        url.searchParams.set('genre', searchFilters.genres.join(','));
      } else {
        url.searchParams.delete('genre');
      }

      route(url.pathname + url.search, true);
    },
    [route],
  );

  const activeLanguages = computed(() => {
    const filter = radioSearchFilters.value?.regions || [];
    return radioLanguages.value.filter((l) => filter.includes(l.id));
  });

  const activeGenres = computed(() => {
    const filter = radioSearchFilters.value?.genres || [];
    return radioGenres.value.filter((g) => filter.includes(g.id));
  });

  const filteredStations = computed(() =>
    [...radioStations.value].filter((station) => {
      const matchesSearch = station.name
        ?.toLowerCase()
        .includes((lastRadioSearchResult.value?.query || '').toLowerCase());
      const langs = radioSearchFilters.value?.regions || [];
      const genres = radioSearchFilters.value?.genres || [];
      const matchesCountry = !langs.length || langs.includes(station.language);
      const matchesGenre = !genres.length || genres.some((g) => station.genres.includes(g));
      return matchesSearch && matchesCountry && matchesGenre;
    }),
  );

  const languageOptions = useMemo(
    () =>
      [...radioLanguages.value]
        .filter((language) => !(radioSearchFilters.value?.regions || []).includes(language.country))
        .sort((a, b) => +!!a.flag - +!!b.flag)
        .map((l) => ({ label: `${l.flag ?? ''} ${l.name}`, minimalLabel: l.flag ?? undefined, value: l.id })),
    [radioSearchFilters.value?.regions],
  );

  const genreOptions = useMemo(() => {
    return radioGenres.value.map((genre) => ({ label: genre.name, value: genre.id }));
  }, []);

  const handleLanguageChange = (countries: string[]) => {
    const newSearchFilters = { regions: countries, genres: radioSearchFilters.value?.genres || [] };
    radioSearchFilters.value = newSearchFilters;
    updateURLParams(lastRadioSearchResult.value?.query, newSearchFilters);
  };

  const handleGenreChange = (genres: string[]) => {
    const newSearchFilters = { regions: radioSearchFilters.value?.regions || [], genres };
    radioSearchFilters.value = newSearchFilters;
    updateURLParams(lastRadioSearchResult.value?.query, newSearchFilters);
  };

  const handleFilterClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSearchInput = useCallback(
    (event?: InputEvent) => {
      if (!event) {
        clearLastRadioSearchResult();
        updateURLParams('', radioSearchFilters.value);
        return;
      }
      const searchInput = (event.target as HTMLInputElement).value;
      if (searchInput?.trim()) {
        setLastRadioSearchResultQuery(searchInput);
        updateURLParams(searchInput, radioSearchFilters.value);
      } else {
        clearLastRadioSearchResult();
        updateURLParams('', radioSearchFilters.value);
      }
    },
    [radioSearchFilters.value],
  );

  useEffect(() => {
    if (typeof window !== 'undefined' && query['focus-search']) {
      const url = new URL(window.location.href);
      url.searchParams.delete('focus-search');
      route(url.pathname + url.search, true);
      searchInputRef.current?.focus();
    }
  }, [query, route]);

  return {
    searchTerm: lastRadioSearchResult.value?.query || '',
    onSearchInput,
    searchInputRef,
    activeFilterCount: activeRadioFilterCount.value,
    filteredStations: filteredStations.value,
    languageOptions,
    activeLanguages: activeLanguages.value,
    activeGenres: activeGenres.value,
    genreOptions,
    isScrolled: !!uiIsScrolled.value,
    handleLanguageChange,
    handleGenreChange,
    handleFilterClick,
  };
};
