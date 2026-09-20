import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill';
import { hydrate } from 'preact-iso';
import { App } from './app.tsx';
import podcasts from './assets/data/featured/podcasts.json';
import { genres } from './assets/data/genres.json';
import { languages } from './assets/data/languages.json';
import { stations } from './assets/data/stations.json';
import { getPodcastUrlID } from './lib/utils.ts';
import { featuredPodcasts } from './store/signals/podcast.ts';
import { radioGenres, radioLanguages, radioStations, setStationPodcasts } from './store/signals/radio.ts';
import { RadioStation } from './store/types.ts';

polyfillCountryFlagEmojis();

// Make sure the radio signals are in the air before (pre)rendering :)
radioStations.value = stations as RadioStation[];
radioLanguages.value = languages;
radioGenres.value = genres;
featuredPodcasts.value = podcasts;

// Load station podcasts data
if (typeof window !== 'undefined') {
  // Load station podcasts data in browser
  import('./assets/data/stations/podcasts.json')
    .then((module) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const podcasts = Object.keys(module.default).reduce((acc: { [key: string]: any[] }, key: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        acc[key] = (module.default as { [key: string]: any[] })[key].map((podcast) => ({
          ...podcast,
          id: getPodcastUrlID(podcast.url),
          feedUrl: podcast.url,
        }));
        return acc;
      }, {});
      setStationPodcasts(podcasts);
    })
    .catch(console.error);
}

if (typeof window !== 'undefined') {
  hydrate(<App />, document.getElementById('app')!);
}

// The plugin calls this export only at build time. Keep its dependencies in excluded chunks.
export async function prerender() {
  return (await import('./prerender')).prerender();
}
