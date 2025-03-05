import { useCallback, useMemo, useState } from 'preact/hooks';
import { useHead } from '~/hooks/useHead';
import {
  clearLastRadioSearchResult,
  lastRadioSearchResult,
  radioGenres,
  radioLanguages,
  radioStations,
  setLastRadioSearchResult,
} from '~/store/signals/radio';
import { uiIsScrolled } from '~/store/signals/ui';

export const useRadioStations = () => {
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

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
      radioStations.value.filter((station) => {
        const matchesSearch = station.name
          ?.toLowerCase()
          .includes((lastRadioSearchResult.value?.query || '').toLowerCase());
        const matchesCountry = !selectedCountries.length || selectedCountries.includes(station.language);
        const matchesGenre = !selectedGenres.length || selectedGenres.some((g) => station.genres.includes(g));
        return matchesSearch && matchesCountry && matchesGenre;
      }),
    [lastRadioSearchResult.value?.query, selectedGenres, selectedCountries],
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

  const onSearchInput = useCallback((event: InputEvent) => {
    const searchInput = (event.target as HTMLInputElement).value;
    if (searchInput.trim()) {
      setLastRadioSearchResult(searchInput, []);
    } else {
      clearLastRadioSearchResult();
    }
  }, []);

  return {
    searchTerm: lastRadioSearchResult.value?.query || '',
    onSearchInput,
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
