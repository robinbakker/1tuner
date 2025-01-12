import { useMemo, useState } from 'preact/hooks';
import { useHead } from '~/hooks/useHead';
import {
  clearLastRadioSearchResult,
  lastRadioSearchResult,
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

  const handleCountryChange = (country: string) => {
    setSelectedCountries((prev) => (prev.includes(country) ? prev.filter((c) => c !== country) : [...prev, country]));
  };

  const handleGenreChange = (genre: string) => {
    setSelectedGenres((prev) => (prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]));
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
    selectedCountries,
    setSelectedCountries,
    selectedGenres,
    setSelectedGenres,
    activeFilterCount,
    filteredStations,
    handleCountryChange,
    handleGenreChange,
  };
};
