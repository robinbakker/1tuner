import { hydrate, prerender as ssr } from 'preact-iso';
import { App } from './app.tsx';
import { genres } from './assets/data/genres.json';
import { languages } from './assets/data/languages.json';
import { stations } from './assets/data/stations.json';
import { radioGenres, radioLanguages, radioStations } from './store/signals/podcast.ts';
import { RadioStation } from './store/types.ts';

// Make sure the radio signals are in the air before (pre)rendering :)
radioStations.value = stations as RadioStation[];
radioLanguages.value = languages;
radioGenres.value = genres;

if (typeof window !== 'undefined') {
  hydrate(<App />, document.getElementById('app')!);
}

export async function prerender() {
  return await ssr(<App />);
}
