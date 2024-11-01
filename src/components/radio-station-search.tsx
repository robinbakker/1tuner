import { Filter } from 'lucide-preact';
import { useEffect, useState } from 'preact/hooks';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { ScrollArea } from '~/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '~/components/ui/sheet';
import { RadioStation } from './types';
import { Card, CardContent } from './ui/card';

export function RadioStationSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [radioStations, setRadioStations] = useState<RadioStation[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [genres, setGenres] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('https://raw.githubusercontent.com/robinbakker/1tuner/refs/heads/main/assets/data/stations.json'),
      fetch('https://raw.githubusercontent.com/robinbakker/1tuner/refs/heads/main/assets/data/genres.json'),
      fetch('https://raw.githubusercontent.com/robinbakker/1tuner/refs/heads/main/assets/data/languages.json'),
    ])
      .then(([stationsResponse, genresResponse, languagesResponse]) =>
        Promise.all([stationsResponse.json(), genresResponse.json(), languagesResponse.json()]),
      )
      .then(([stationsData, genresData, languagesData]) => {
        const genreMap = Object.fromEntries(Object.entries(genresData).map(([key, value]: [string, any]) => [key, value.name]));
        const languageMap = Object.fromEntries(Object.entries(languagesData).map(([key, value]: [string, any]) => [key, value.country]));

        const stations: RadioStation[] = Object.entries(stationsData).map(([id, stationData]: [string, any]) => ({
          id,
          name: stationData.name,
          logo: stationData.logosource || '/placeholder.svg?height=100&width=100',
          language: languageMap[stationData.language] || stationData.language || 'Unknown',
          genres: (stationData.genres || []).map((genre: string) => genreMap[genre] || genre),
          streams: (stationData.streams || []).map((stream: any) => ({
            mimetype: stream.mimetype,
            url: stream.url,
          })),
        }));
        setRadioStations(stations);

        // Extract unique languages and genres
        const uniqueLanguages = Array.from(new Set(stations.map((s) => s.language))).sort();
        const uniqueGenres = Array.from(new Set(stations.flatMap((s) => s.genres))).sort();
        setCountries(uniqueLanguages); // We keep the state name as 'countries' for consistency
        setGenres(uniqueGenres);
      })
      .catch((error) => console.error('Error fetching data:', error));
  }, []);

  const activeFilterCount = () => selectedCountries.length + selectedGenres.length;

  const filteredStations = radioStations.filter((station) => {
    const matchesSearch = station.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCountry = !selectedCountries.length || selectedCountries.includes(station.language);
    const matchesGenre = !selectedGenres.length || selectedGenres.some((g) => station.genres.includes(g));
    return matchesSearch && matchesCountry && matchesGenre;
  });

  const handleCountryChange = (country: string) => {
    setSelectedCountries((prev) => (prev.includes(country) ? prev.filter((c) => c !== country) : [...prev, country]));
  };

  const handleGenreChange = (genre: string) => {
    setSelectedGenres((prev) => (prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]));
  };

  const FilterContent = () => (
    <div class="bg-card rounded-lg p-4 shadow">
      <h2 class="text-lg font-semibold mb-2">Filters</h2>
      <div class="mb-4">
        <h3 class="font-medium mb-2">Countries</h3>
        <ScrollArea className="h-40">
          {countries.map((country) => (
            <div key={country} class="flex items-center space-x-2 mb-2">
              <Checkbox
                id={`country-${country}`}
                checked={selectedCountries.includes(country)}
                onCheckedChange={() => handleCountryChange(country)}
              />
              <Label for={`country-${country}`}>{country}</Label>
            </div>
          ))}
        </ScrollArea>
      </div>
      <div>
        <h3 class="font-medium mb-2">Genres</h3>
        <ScrollArea className="h-40">
          {genres.map((genre) => (
            <div key={genre} class="flex items-center space-x-2 mb-2">
              <Checkbox id={`genre-${genre}`} checked={selectedGenres.includes(genre)} onCheckedChange={() => handleGenreChange(genre)} />
              <Label for={`genre-${genre}`}>{genre}</Label>
            </div>
          ))}
        </ScrollArea>
      </div>
    </div>
  );

  return (
    <div class="container mx-auto p-4">
      <h1 class="text-3xl font-bold mb-6">Radio stations</h1>
      {/* <p class="text-lg font-bold mb-4">Listen to the radio 📻</p> */}
      <div class="flex flex-col lg:flex-row gap-4">
        <section class="flex-1 order-1 lg:order-1">
          <div class="flex gap-2 mb-8">
            <Input
              type="search"
              placeholder="Search radio stations..."
              value={searchTerm}
              onChange={(e: Event) => setSearchTerm((e.target as HTMLInputElement)?.value || '')}
              className="bg-white border-gray-300 focus:ring-primary w-full"
            />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant={activeFilterCount() > 0 ? 'default' : 'outline'} className="lg:hidden relative">
                  <Filter class="mr-2 h-4 w-4" />
                  Filters
                  {activeFilterCount() > 0 && (
                    <span class="absolute top-0 right-0 -mt-1 -mr-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
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
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredStations.map((station) => (
              <a key={station.id} class="flex flex-col items-center p-2 h-auto" href={`/radio-station/${station.id}`}>
                <Card class="w-[100px]">
                  <CardContent class="p-2">
                    <img src={station.logo} alt={`${station.name} logo`} class="w-20 h-20 object-contain mb-2" />
                    <span class="text-center text-sm truncate w-full" title={station.name}>
                      {station.name}
                    </span>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        </section>
        <aside class="w-full lg:w-1/4 order-2 lg:order-2 hidden lg:block overflow-y-auto">
          <div class="h-full">
            <FilterContent />
          </div>
        </aside>
      </div>
    </div>
  );
}
