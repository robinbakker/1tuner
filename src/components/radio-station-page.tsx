import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useState } from 'preact/hooks';
import { RadioStation } from './types';

export function RadioStationPageComponent() {
  const [radioStations, setRadioStations] = useState<RadioStation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Radio Stations</h1>
      <div className="flex flex-col md:flex-row gap-4">
        <main className="flex-1">
          <Input
            type="search"
            placeholder="Search radio stations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target?.value)}
            className="mb-4"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredStations.map((station) => (
              <Button
                key={station.id}
                variant="outline"
                className="flex flex-col items-center p-4 h-auto"
                onClick={() => playStation(station)}
              >
                <img src={station.logo} alt={`${station.name} logo`} className="w-20 h-20 object-contain mb-2" />
                <span className="text-center">{station.name}</span>
              </Button>
            ))}
          </div>
        </main>
        <aside className="w-full md:w-1/4">
          <div className="bg-card rounded-lg p-4 shadow">
            <h2 className="text-lg font-semibold mb-2">Filters</h2>
            <div className="mb-4">
              <h3 className="font-medium mb-2">Countries</h3>
              <ScrollArea className="h-40">
                {countries.map((country) => (
                  <div key={country} className="flex items-center space-x-2 mb-2">
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
              <h3 className="font-medium mb-2">Genres</h3>
              <ScrollArea className="h-40">
                {genres.map((genre) => (
                  <div key={genre} className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      id={`genre-${genre}`}
                      checked={selectedGenres.includes(genre)}
                      onCheckedChange={() => handleGenreChange(genre)}
                    />
                    <Label for={`genre-${genre}`}>{genre}</Label>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
