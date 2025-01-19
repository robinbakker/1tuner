import { Globe, Search, SquareLibrary } from 'lucide-preact';
import { RadioStationCard } from '~/components/radio-station-card';
import { Input } from '~/components/ui/input';
import { TagSelect } from '~/components/ui/tag-select';
import { useRadioStations } from './useRadioStations';

export const RadioStationsPage = () => {
  const {
    searchTerm,
    filteredStations,
    activeLanguages,
    activeGenres,
    languageOptions,
    genreOptions,
    onSearchInput,
    handleLanguageChange,
    handleGenreChange,
  } = useRadioStations();

  return (
    <div class="container mx-auto px-8 py-6">
      <div class="md:flex md:justify-between md:items-center mb-6">
        <h1 class="text-3xl font-bold">Radio stations</h1>
        <div class="hidden md:flex gap-4 mt-2 md:mt-0">
          <TagSelect
            options={languageOptions}
            placeholder={'Language/region'}
            icon={<Globe class="w-4 opacity-50" />}
            onChange={handleLanguageChange}
            selectedValues={activeLanguages.map((l) => l.id)}
          />
          <TagSelect
            options={genreOptions}
            placeholder={'Genre'}
            icon={<SquareLibrary class="w-4 opacity-50" />}
            onChange={handleGenreChange}
            selectedValues={activeGenres.map((l) => l.id)}
          />
        </div>
      </div>
      <div class="flex flex-col gap-2 mb-8">
        <div class="relative w-full">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400">
            <Search size={18} />
          </div>
          <Input
            type="search"
            placeholder="Search radio stations..."
            value={searchTerm}
            onInput={onSearchInput}
            className="w-full focus:ring-primary pl-10"
          />
        </div>
        <div class="flex flex-col gap-2 md:hidden">
          <TagSelect
            options={languageOptions}
            placeholder={'Language/region'}
            icon={<Globe class="w-4 opacity-50" />}
            onChange={handleLanguageChange}
            selectedValues={activeLanguages.map((l) => l.id)}
          />
          <TagSelect
            options={genreOptions}
            placeholder={'Genre'}
            icon={<SquareLibrary class="w-4 opacity-50" />}
            onChange={handleGenreChange}
            selectedValues={activeGenres.map((l) => l.id)}
          />
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 sm:gap-12 justify-items-center">
        {filteredStations.map((station) => (
          <RadioStationCard key={station.id} station={station} size="large" />
        ))}
      </div>
    </div>
  );
};
