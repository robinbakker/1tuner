import { Filter, Search } from 'lucide-preact';
import { useMemo, useState } from 'preact/hooks';
import { RadioStationCard } from '~/components/radio-station-card';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { ScrollArea } from '~/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '~/components/ui/sheet';
import { getRadioGenres, radioLanguages, radioStations } from '~/store/signals/radio';

export const RadioStationsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const activeFilterCount = () => selectedCountries.length + selectedGenres.length;

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

  const FilterContent = () => (
    <div class="flex flex-col gap-4 h-full">
      <h2 class="text-lg font-semibold">Filters</h2>
      <div class="flex-1 flex flex-col gap-4">
        <div>
          <h3 class="font-medium mb-2">Language/region</h3>
          <ScrollArea className="h-[40vh]">
            <div class="flex items-center space-x-2 mb-2 border-b pb-2">
              <Checkbox
                id="lang-all"
                checked={selectedCountries.length === radioLanguages.value.length}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedCountries([...radioLanguages.value].map((l) => l.id));
                  } else {
                    setSelectedCountries([]);
                  }
                }}
              />
              <Label for="lang-all">All/None</Label>
            </div>
            {[...radioLanguages.value]
              .filter((l) => !l.flag)
              .map((l) => (
                <div key={l.id} class="flex items-center space-x-2 mb-2">
                  <Checkbox
                    id={`lang-${l.id}`}
                    checked={selectedCountries.includes(l.id)}
                    onCheckedChange={() => handleCountryChange(l.id)}
                  />
                  <Label for={`lang-${l.id}`}>{l.name}</Label>
                </div>
              ))}
            {[...radioLanguages.value]
              .filter((l) => l.flag)
              .map((l) => (
                <div key={l.id} class="flex items-center space-x-2 mb-2">
                  <Checkbox
                    id={`lang-${l.id}`}
                    checked={selectedCountries.includes(l.id)}
                    onCheckedChange={() => handleCountryChange(l.id)}
                  />
                  <Label for={`lang-${l.id}`}>
                    {l.flag} {l.name}
                  </Label>
                </div>
              ))}
          </ScrollArea>
        </div>
        <div>
          <h3 class="font-medium mb-2">Genre</h3>
          <ScrollArea className="h-[40vh]">
            {getRadioGenres().map((genre) => (
              <div key={genre.id} class="flex items-center space-x-2 mb-2">
                <Checkbox
                  id={`genre-${genre.id}`}
                  checked={selectedGenres.includes(genre.id)}
                  onCheckedChange={() => handleGenreChange(genre.id)}
                />
                <Label for={`genre-${genre.id}`}>{genre.name}</Label>
              </div>
            ))}
          </ScrollArea>
        </div>
      </div>
    </div>
  );

  return (
    <div class="container mx-auto px-8 py-6">
      <h1 class="text-3xl font-bold mb-6">Radio stations</h1>
      <div class="flex gap-2 mb-8">
        <div class="relative w-full">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Search size={18} />
          </div>
          <Input
            type="search"
            placeholder="Search radio stations..."
            value={searchTerm}
            onChange={(e: Event) => setSearchTerm((e.target as HTMLInputElement)?.value || '')}
            className="w-full focus:ring-primary pl-10"
          />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant={activeFilterCount() > 0 ? 'default' : 'outline'} className="relative">
              <Filter class="mr-2 h-4 w-4" />
              Filters
              {activeFilterCount() > 0 && (
                <span class="absolute top-0 right-0 -mt-1 -mr-1 bg-black text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFilterCount()}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <FilterContent />
          </SheetContent>
        </Sheet>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 sm:gap-12 justify-items-center">
        {filteredStations.map((station) => (
          <RadioStationCard key={station.id} station={station} size="large" />
        ))}
      </div>
    </div>
  );
};
