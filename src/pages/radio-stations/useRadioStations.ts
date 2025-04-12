import { computed } from '@preact/signals';
import { useLocation } from 'preact-iso';
import { useCallback, useEffect, useMemo, useRef } from 'preact/hooks';
import { useHead } from '~/hooks/useHead';
import { validationUtil } from '~/lib/validationUtil';
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
  userLanguage,
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
      const validatedQuery = validationUtil.validateSearchQuery(initialSearchQuery);
      setLastRadioSearchResultQuery(validatedQuery);
    } else {
      clearLastRadioSearchResult();
    }
    const userLanguages =
      !userLanguage.value || userLanguage.value === 'en' ? ['en', 'en-US', 'en-UK'] : [userLanguage.value];
    const savedLanguages = radioSearchFilters.value?.regions || userLanguages;
    radioSearchFilters.value = {
      regions: initialLanguages.length ? initialLanguages : savedLanguages,
      genres: initialGenres,
    };

    isInitialized.current = true;
  }, [query, userLanguage.value]);

  // Update URL helper function
  const updateURLParams = useCallback(
    (search?: string, searchFilters?: RadioSearchFilters | null) => {
      const url = new URL(window.location.href);

      if (search) {
        const validatedSearch = validationUtil.validateSearchQuery(search);
        url.searchParams.set('q', encodeURIComponent(validatedSearch));
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

  const filteredStations = computed(() => {
    const langs = radioSearchFilters.value?.regions || [];
    const genres = radioSearchFilters.value?.genres || [];
    return [...radioStations.value]
      .sort((a, b) => a.displayorder - b.displayorder)
      .filter((station) => {
        const matchesSearch = station.name
          ?.toLowerCase()
          .includes((lastRadioSearchResult.value?.query || '').toLowerCase());
        const matchesCountry = !langs.length || langs.includes(station.language);
        const matchesGenre = !genres.length || genres.some((g) => station.genres.includes(g));
        return matchesSearch && matchesCountry && matchesGenre;
      });
  });

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
      if (validationUtil.validateSearchQuery(searchInput)) {
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
