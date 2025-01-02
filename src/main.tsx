import { hydrate, prerender as ssr } from 'preact-iso';
import { App } from './app.tsx';
import { genres } from './assets/data/genres.json';
import { languages } from './assets/data/languages.json';
import { stations } from './assets/data/stations.json';
import { getPodcastUrlID } from './lib/utils.ts';
import { radioGenres, radioLanguages, radioStations } from './store/signals/radio.ts';
import { RadioStation } from './store/types.ts';

// Make sure the radio signals are in the air before (pre)rendering :)
radioStations.value = stations as RadioStation[];
radioLanguages.value = languages;
radioGenres.value = genres;

if (typeof window !== 'undefined') {
  hydrate(<App />, document.getElementById('app')!);
}

export async function prerender() {
  // Fetch podcast data during prerender phase
  if (!(global as any).__PRERENDER_PODCASTS__) {
    const podcastData = await import('./assets/data/podcasts.json');
    (global as any).__PRERENDER_PODCASTS__ = podcastData.default.map((pc) => ({
      ...pc,
      id: getPodcastUrlID(pc.url),
    }));
  }
  return await ssr(<App />);
}
