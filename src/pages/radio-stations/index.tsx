import { ChevronDown, ChevronUp, Filter, Globe, Search, SquareLibrary } from 'lucide-preact';
import { useEffect, useRef, useState } from 'preact/hooks';
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
    onSearchInput,
    handleLanguageChange,
    handleGenreChange,
  } = useRadioStations();
  const [userOverrideFilter, setUserOverrideFilter] = useState<boolean | null>(null);
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const headerSentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only auto-expand/collapse if user hasn't made a choice yet
    if (userOverrideFilter === null) {
      setIsFilterExpanded(!isScrolled);
    }
  }, [isScrolled, userOverrideFilter]);

  const handleFilterClick = () => {
    const newState = !isFilterExpanded;
    setIsFilterExpanded(newState);
    setUserOverrideFilter(newState);
  };

  useEffect(() => {
    if (!headerSentinelRef.current) {
      setIsScrolled(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        requestAnimationFrame(() => {
          setIsScrolled(!entry.isIntersecting);
        });
      },
      {
        threshold: [0],
        rootMargin: '0px 0px 0px 0px',
      },
    );

    observer.observe(headerSentinelRef.current);
    return () => observer.disconnect();
  }, [headerSentinelRef.current]);

  return (
    <>
      <div ref={headerSentinelRef} class="h-1 w-full opacity-0 pointer-events-none" aria-hidden="true" />
      <div
        class={cn(
          'sticky top-0 z-20',
          isScrolled ? 'bg-white/80 backdrop-blur-md shadow-md dark:bg-black/80' : 'bg-transparent',
        )}
      >
        <div class="container mx-auto px-8">
          <div class="py-3 transform-gpu">
            <div class="md:flex md:justify-between md:items-center relative">
              <div class="md:flex md:justify-between md:items-center relative">
                <h1
                  class={cn(
                    'text-3xl font-bold transform-gpu transition-transform origin-left duration-200 pr-12 md:pr-0',
                    isScrolled ? 'scale-[0.833]' : 'scale-100',
                  )}
                >
                  Radio stations
                </h1>
                <button
                  title="Filter"
                  onClick={handleFilterClick}
                  class={cn(
                    'md:hidden absolute right-0 top-0',
                    'p-2 rounded-md border border-input bg-white/80 dark:bg-black/80',
                    'hover:bg-accent hover:text-accent-foreground transition-colors',
                    'inline-flex items-center gap-1',
                    isFilterExpanded && 'bg-accent',
                  )}
                >
                  {activeFilterCount > 0 && (
                    <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {activeFilterCount}
                    </div>
                  )}
                  <Filter size={20} />
                  {isFilterExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
              <div class="hidden md:flex gap-4 mt-2 md:mt-0">
                <TagSelect
                  align="right"
                  options={languageOptions}
                  placeholder={'Language/region'}
                  icon={<Globe class="w-4 opacity-50" />}
                  onChange={handleLanguageChange}
                  selectedValues={activeLanguages.map((l) => l.id)}
                />
                <TagSelect
                  align="right"
                  options={genreOptions}
                  placeholder={'Genre'}
                  icon={<SquareLibrary class="w-4 opacity-50" />}
                  onChange={handleGenreChange}
                  selectedValues={activeGenres.map((l) => l.id)}
                />
              </div>
            </div>

            <div class="mt-4">
              <div class="relative w-full">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400">
                  <Search size={18} />
                </div>
                <Input
                  type="search"
                  placeholder="Search radio stations..."
                  value={searchTerm}
                  onInput={onSearchInput}
                  className="w-full bg-white/80 dark:bg-black/80 focus:ring-primary pl-10"
                />
              </div>
              <div
                class={cn(
                  'flex flex-col gap-2 md:hidden transform-gpu transition-all duration-100',
                  !isFilterExpanded ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-[200px] opacity-100 mt-2',
                )}
              >
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
          </div>
        </div>
      </div>

      <div class="container mx-auto px-8">
        <div class="pt-4 grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 sm:gap-12 justify-items-center">
          {filteredStations.map((station) => (
            <RadioStationCard key={station.id} station={station} size="large" />
          ))}
        </div>
      </div>
    </>
  );
};
