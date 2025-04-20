import { ChevronUp, Filter, Globe, Loader2, Search, SquareLibrary, X } from 'lucide-preact';
import { ContentSection } from '~/components/content-section';
import { Loader } from '~/components/loader';
import { RadioStationCard } from '~/components/radio-station-card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { TagSelect } from '~/components/ui/tag-select';
import { styleClass } from '~/lib/styleClass';
import { cn } from '~/lib/utils';
import { MAX_SEARCH_LENGTH } from '~/lib/validationUtil';
import { allRadioStations, followedRadioStationIDs } from '~/store/signals/radio';
import { useRadioStations } from './useRadioStations';

export const RadioStationsPage = () => {
  const {
    searchTerm,
    filteredStations,
    radioBrowserSearchResult,
    activeFilterCount,
    languageOptions,
    genreOptions,
    isScrolled,
    searchInputRef,
    activeGenres,
    activeLanguages,
    onSearchInput,
    handleLanguageChange,
    handleGenreChange,
    handleFilterClick,
    isLoadingMore,
    searchMoreStations,
    searchMoreStationsFromCountry,
    hasSearchTerm,
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
                  aria-label={`Scroll to filters (${activeFilterCount} active)`}
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
                {searchTerm && (
                  <Button
                    onClick={() => onSearchInput()}
                    class="absolute right-0 top-0 rounded-none rounded-r-lg"
                    title="Clear search"
                  >
                    <X size={18} />
                  </Button>
                )}
                <Input
                  ref={searchInputRef}
                  type="search"
                  placeholder="Search radio stations..."
                  value={searchTerm}
                  onInput={onSearchInput}
                  class={cn(
                    'w-full bg-white/80 dark:bg-black/80 focus:ring-primary pl-10',
                    searchTerm && 'pr-15',
                    '[&::-webkit-search-cancel-button]:hidden',
                  )}
                  maxLength={MAX_SEARCH_LENGTH}
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
        {!searchTerm && followedRadioStationIDs.value.length > 0 && (
          <ContentSection
            className="mt-4 max-sm:-mx-8 max-sm:w-screen"
            insetClassName="max-sm:px-8"
            title="Following"
            isScrollable
          >
            <ul class="flex gap-6 md:gap-10 max-sm:px-8">
              {allRadioStations.value
                .filter((s) => followedRadioStationIDs.value.some((id) => id === s.id))
                .map((s) => (
                  <li class="shrink-0">
                    <RadioStationCard key={`fs-${s.id}`} station={s} />
                  </li>
                ))}
              <li class="shrink-0 w-0.5"></li>
            </ul>
          </ContentSection>
        )}
        <>
          {filteredStations.length > 0 && (
            <div class="pt-4 mb-12">
              <div class="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 sm:gap-12 justify-items-center">
                {filteredStations.map((station) => (
                  <RadioStationCard key={station.id} station={station} size="large" />
                ))}
              </div>
            </div>
          )}

          {!!radioBrowserSearchResult.length && (
            <div class="mt-4 mb-12">
              <h2 class="text-xl font-semibold mb-1">More stations from radio-browser.info</h2>
              <p class="text-sm text-muted-foreground mb-6">
                All information about these radio stations is provided by{' '}
                <a href="https://radio-browser.info" target="_blank" rel="noopener">
                  radio-browser.info
                </a>{' '}
                — an open source directory of internet radio stations.
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 sm:gap-12 justify-items-center">
                {radioBrowserSearchResult.map((station) => (
                  <RadioStationCard key={station.id} station={station} size="large" />
                ))}
              </div>
            </div>
          )}

          {!radioBrowserSearchResult.length && (
            <>
              <div class="flex justify-center mt-8 mb-8 gap-3 flex-wrap">
                {hasSearchTerm && (
                  <Button
                    onClick={searchMoreStations}
                    variant="outline"
                    class={styleClass.textLink}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                        Searching more stations...
                      </>
                    ) : (
                      <>
                        <Globe class="mr-2 h-4 w-4" />
                        Find more stations...
                      </>
                    )}
                  </Button>
                )}
                {!isLoadingMore &&
                  activeLanguages.map((language) => (
                    <Button
                      onClick={() => searchMoreStationsFromCountry(language.abbr)}
                      variant="outline"
                      disabled={isLoadingMore}
                    >
                      {language.flag}
                      {'  '}More from {language.country_en}
                    </Button>
                  ))}
              </div>
            </>
          )}

          {hasSearchTerm && !radioBrowserSearchResult.length && isLoadingMore && <Loader />}
        </>
      </div>
    </div>
  );
};
