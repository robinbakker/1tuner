import { useMemo, useState } from 'preact/hooks';
import { radioStations } from '~/store/signals/radio';

export const useRadioStations = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const activeFilterCount = useMemo(
    () => selectedCountries.length + selectedGenres.length,
    [selectedCountries, selectedGenres],
  );

  const filteredStations = useMemo(
    () =>
      radioStations.value.filter((station) => {
        const matchesSearch = station.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCountry = !selectedCountries.length || selectedCountries.includes(station.language);
        const matchesGenre = !selectedGenres.length || selectedGenres.some((g) => station.genres.includes(g));
        return matchesSearch && matchesCountry && matchesGenre;
      }),
    [selectedGenres, selectedCountries, searchTerm, radioStations.value],
  );

  const handleCountryChange = (country: string) => {
    setSelectedCountries((prev) => (prev.includes(country) ? prev.filter((c) => c !== country) : [...prev, country]));
  };

  const handleGenreChange = (genre: string) => {
    setSelectedGenres((prev) => (prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]));
  };

  return {
    searchTerm,
    setSearchTerm,
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