import { useMemo, useState } from 'preact/hooks';
import { useHead } from '~/hooks/useHead';
import {
  clearLastRadioSearchResult,
  lastRadioSearchResult,
  radioGenres,
  radioLanguages,
  radioStations,
  setLastRadioSearchResult,
} from '~/store/signals/radio';

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
    [selectedCountries, radioLanguages.value],
  );

  const activeGenres = useMemo(
    () => radioGenres.value.filter((g) => selectedGenres.includes(g.id)),
    [selectedGenres, radioGenres.value],
  );

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
    [selectedGenres, selectedCountries, lastRadioSearchResult.value?.query, radioStations.value],
  );

  const languageOptions = useMemo(
    () =>
      radioLanguages.value
        .filter((language) => !selectedCountries.includes(language.country))
        .map((l) => ({ label: `${l.flag ?? ''} ${l.name}`, minimalLabel: l.flag ?? undefined, value: l.id })),
    [selectedCountries, radioLanguages.value],
  );

  const genreOptions = useMemo(() => {
    return radioGenres.value.map((genre) => ({ label: genre.name, value: genre.id }));
  }, [radioGenres.value]);

  const handleLanguageChange = (countries: string[]) => {
    setSelectedCountries(countries);
  };

  const handleGenreChange = (genres: string[]) => {
    setSelectedGenres(genres);
  };

  const onSearchInput = (event: InputEvent) => {
    const searchInput = (event.target as HTMLInputElement).value;
    if (searchInput.trim()) {
      setLastRadioSearchResult(searchInput, []);
    } else {
      clearLastRadioSearchResult();
    }
  };

  return {
    searchTerm: lastRadioSearchResult.value?.query || '',
    onSearchInput,
    setSelectedGenres,
    activeFilterCount,
    filteredStations,
    languageOptions,
    activeLanguages,
    activeGenres,
    genreOptions,
    handleLanguageChange,
    handleGenreChange,
  };
};
