import { computed } from '@preact/signals';
import { useLocation } from 'preact-iso';
import { useCallback, useEffect, useMemo, useRef } from 'preact/hooks';
import { useHead } from '~/hooks/useHead';
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

export const useRadioStations = () => {
  const { query, route } = useLocation();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useHead({
    title: 'Radio stations',
  });

  const activeLanguages = computed(() => {
    const filter = radioSearchFilters.value?.languages || [];
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
      const langs = radioSearchFilters.value?.languages || [];
      const genres = radioSearchFilters.value?.genres || [];
      const matchesCountry = !langs.length || langs.includes(station.language);
      const matchesGenre = !genres.length || genres.some((g) => station.genres.includes(g));
      return matchesSearch && matchesCountry && matchesGenre;
    }),
  );

  const languageOptions = useMemo(
    () =>
      [...radioLanguages.value]
        .filter((language) => !(radioSearchFilters.value?.languages || []).includes(language.country))
        .sort((a, b) => +!!a.flag - +!!b.flag)
        .map((l) => ({ label: `${l.flag ?? ''} ${l.name}`, minimalLabel: l.flag ?? undefined, value: l.id })),
    [radioSearchFilters.value?.languages],
  );

  const genreOptions = useMemo(() => {
    return radioGenres.value.map((genre) => ({ label: genre.name, value: genre.id }));
  }, []);

  const handleLanguageChange = (countries: string[]) => {
    radioSearchFilters.value = { languages: countries, genres: radioSearchFilters.value?.genres || [] };
  };

  const handleGenreChange = (genres: string[]) => {
    radioSearchFilters.value = { languages: radioSearchFilters.value?.languages || [], genres };
  };

  const handleFilterClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSearchInput = useCallback((event?: InputEvent) => {
    if (!event) {
      clearLastRadioSearchResult();
      return;
    }
    const searchInput = (event.target as HTMLInputElement).value?.trim();
    if (searchInput) {
      setLastRadioSearchResultQuery(searchInput);
    } else {
      clearLastRadioSearchResult();
    }
  }, []);

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
