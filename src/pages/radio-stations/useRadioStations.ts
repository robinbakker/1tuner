import { useLocation } from 'preact-iso';
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { useHead } from '~/hooks/useHead';
import {
  clearLastRadioSearchResult,
  followedRadioStationIDs,
  lastRadioSearchResult,
  radioGenres,
  radioLanguages,
  radioStations,
  setLastRadioSearchResult,
} from '~/store/signals/radio';
import { uiIsScrolled } from '~/store/signals/ui';

export const useRadioStations = () => {
  const { query, route } = useLocation();
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useHead({
    title: 'Radio stations',
  });

  const activeFilterCount = useMemo(
    () => selectedCountries.length + selectedGenres.length,
    [selectedCountries, selectedGenres],
  );

  const activeLanguages = useMemo(
    () => radioLanguages.value.filter((l) => selectedCountries.includes(l.id)),
    [selectedCountries],
  );

  const activeGenres = useMemo(() => radioGenres.value.filter((g) => selectedGenres.includes(g.id)), [selectedGenres]);

  const filteredStations = useMemo(
    () =>
      [...radioStations.value]
        .sort((a, b) => +followedRadioStationIDs.value.includes(b.id) - +followedRadioStationIDs.value.includes(a.id))
        .filter((station) => {
          const matchesSearch = station.name
            ?.toLowerCase()
            .includes((lastRadioSearchResult.value?.query || '').toLowerCase());
          const matchesCountry = !selectedCountries.length || selectedCountries.includes(station.language);
          const matchesGenre = !selectedGenres.length || selectedGenres.some((g) => station.genres.includes(g));
          return matchesSearch && matchesCountry && matchesGenre;
        }),
    [lastRadioSearchResult.value?.query, followedRadioStationIDs.value, selectedGenres, selectedCountries],
  );

  const languageOptions = useMemo(
    () =>
      radioLanguages.value
        .filter((language) => !selectedCountries.includes(language.country))
        .map((l) => ({ label: `${l.flag ?? ''} ${l.name}`, minimalLabel: l.flag ?? undefined, value: l.id })),
    [selectedCountries],
  );

  const genreOptions = useMemo(() => {
    return radioGenres.value.map((genre) => ({ label: genre.name, value: genre.id }));
  }, []);

  const handleLanguageChange = (countries: string[]) => {
    setSelectedCountries(countries);
  };

  const handleGenreChange = (genres: string[]) => {
    setSelectedGenres(genres);
  };

  const handleFilterClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSearchInput = useCallback((event?: InputEvent) => {
    if (!event) {
      clearLastRadioSearchResult();
      return;
    }
    const searchInput = (event.target as HTMLInputElement).value;
    if (searchInput.trim()) {
      setLastRadioSearchResult(searchInput, []);
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
    activeFilterCount,
    filteredStations,
    languageOptions,
    activeLanguages,
    activeGenres,
    genreOptions,
    isScrolled: !!uiIsScrolled.value,
    handleLanguageChange,
    handleGenreChange,
    handleFilterClick,
  };
};
