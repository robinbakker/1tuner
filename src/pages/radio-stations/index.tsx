import { ChevronUp, Filter, Globe, Search, SquareLibrary } from 'lucide-preact';
import { RadioStationCard } from '~/components/radio-station-card';
import { Input } from '~/components/ui/input';
import { TagSelect } from '~/components/ui/tag-select';
import { cn } from '~/lib/utils';
import { useRadioStations } from './useRadioStations';

export const RadioStationsPage = () => {
  const {
    searchTerm,
    filteredStations,
    activeLanguages,
    activeGenres,
    activeFilterCount,
    languageOptions,
    genreOptions,
    isScrolled,
    onSearchInput,
    handleLanguageChange,
    handleGenreChange,
    handleFilterClick,
  } = useRadioStations();

  return (
    <div class="mt-4">
      <div
        class={cn(
          'sticky top-0 z-20',
          isScrolled ? 'bg-white/80 backdrop-blur-md shadow-md dark:bg-black/80' : 'bg-background',
        )}
      >
        <div class="container mx-auto px-8">
          <div class="py-3 transform-gpu">
            <div class="md:flex md:justify-between md:items-center relative">
              <div class="md:flex md:justify-between md:items-center relative">
                <h1
                  class={cn(
                    'text-3xl font-bold transform-gpu transition-transform origin-bottom-left',
                    'duration-200 pr-12 md:pr-0',
                    isScrolled ? 'scale-[0.833]' : 'scale-100',
                  )}
                >
                  Radio stations
                </h1>
                <button
                  title="Filter"
                  onClick={handleFilterClick}
                  class={cn(
                    'md:hidden absolute right-0 top-1',
                    'p-2 rounded-md border border-input bg-white/80 dark:bg-black/80',
                    'hover:bg-accent hover:text-accent-foreground transition-colors',
                    'inline-flex items-center gap-1 opacity-0 transition-opacity duration-200',
                    isScrolled && 'opacity-100',
                  )}
                >
                  {activeFilterCount > 0 && (
                    <div
                      class={cn(
                        'absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full',
                        'w-5 h-5 flex items-center justify-center',
                      )}
                    >
                      {activeFilterCount}
                    </div>
                  )}
                  <Filter size={20} />
                  <ChevronUp size={16} />
                </button>
              </div>
              <div class="hidden md:flex gap-4 mt-2 md:mt-0">
                <TagSelect
                  align="right"
                  options={languageOptions}
                  placeholder={'Language/region'}
                  icon={<Globe class="w-4 opacity-50" />}
                  onChangeTags={handleLanguageChange}
                  selectedValues={activeLanguages.map((l) => l.id)}
                />
                <TagSelect
                  align="right"
                  options={genreOptions}
                  placeholder={'Genre'}
                  icon={<SquareLibrary class="w-4 opacity-50" />}
                  onChangeTags={handleGenreChange}
                  selectedValues={activeGenres.map((l) => l.id)}
                />
              </div>
            </div>

            <div class="mt-4">
              <div class="relative w-full">
                <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400">
                  <Search size={18} />
                </div>
                <Input
                  type="search"
                  placeholder="Search radio stations..."
                  value={searchTerm}
                  onInput={onSearchInput}
                  class="w-full bg-white/80 dark:bg-black/80 focus:ring-primary pl-10"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class={cn('md:hidden relative mx-auto px-8 pb-4')}>
        <TagSelect
          options={languageOptions}
          placeholder={'Language/region'}
          icon={<Globe class="w-4 opacity-50" />}
          onChangeTags={handleLanguageChange}
          selectedValues={activeLanguages.map((l) => l.id)}
          class="mb-2"
        />
        <TagSelect
          options={genreOptions}
          placeholder={'Genre'}
          icon={<SquareLibrary class="w-4 opacity-50" />}
          onChangeTags={handleGenreChange}
          selectedValues={activeGenres.map((l) => l.id)}
        />
      </div>

      <div class="container mx-auto px-8">
        <div class="pt-4 grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 sm:gap-12 justify-items-center">
          {filteredStations.map((station) => (
            <RadioStationCard key={station.id} station={station} size="large" />
          ))}
        </div>
      </div>
    </div>
  );
};
