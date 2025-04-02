import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill';
import { hydrate, prerender as ssr } from 'preact-iso';
import { App } from './app.tsx';
import podcasts from './assets/data/featured/podcasts.json';
import { genres } from './assets/data/genres.json';
import { languages } from './assets/data/languages.json';
import { stations } from './assets/data/stations.json';
import { defaultHeadData, HeadData } from './hooks/useHead.ts';
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

export async function prerender() {
  // Load both podcast data and station podcasts during prerender
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(globalThis as any).__PRERENDER_PODCASTS__) {
    const [podcastData, stationPodcastsData] = await Promise.all([
      import('./assets/data/podcasts.json'),
      import('./assets/data/stations/podcasts.json'),
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__PRERENDER_PODCASTS__ = podcastData.default
      .map((pc) => ({
        ...pc,
        id: getPodcastUrlID(pc.url),
      }))
      .concat(featuredPodcasts.value.map((fp) => ({ ...fp, categories: [], episodes: [] })));

    const formattedStationPodcasts = Object.keys(stationPodcastsData.default).reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (acc: { [key: string]: any[] }, key: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        acc[key] = (stationPodcastsData.default as { [key: string]: any[] })[key].map((podcast) => ({
          ...podcast,
          id: getPodcastUrlID(podcast.url),
          feedUrl: podcast.url,
        }));
        return acc;
      },
      {},
    );
    setStationPodcasts(formattedStationPodcasts);
  }
  //return await ssr(<App />);
  const { html, links } = await ssr(<App />);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const headData = { ...defaultHeadData, ...((globalThis as any).__HEAD_DATA__ || {}) } as HeadData;

  return {
    html,
    // Optionally add additional links that should be
    // prerendered (if they haven't already been -- these will be deduped)
    links,
    // Optionally configure and add elements to the `<head>` of
    // the prerendered HTML document
    head: {
      // Sets the "lang" attribute: `<html lang="en">`
      //lang: 'en',
      // Sets the title for the current page: `<title>My cool page</title>`
      title: headData.title,
      // Sets any additional elements you want injected into the `<head>`:
      //   <link rel="stylesheet" href="foo.css">
      //   <meta property="og:title" content="Social media title">
      elements: new Set([
        { type: 'meta', props: { property: 'og:title', content: headData.title } },
        { type: 'meta', props: { property: 'og:description', content: headData.description } },
        { type: 'meta', props: { property: 'og:image', content: headData.image } },
        { type: 'meta', props: { property: 'og:url', content: headData.url } },
        { type: 'meta', props: { property: 'og:type', content: headData.type } },
      ]),
    },
  };
}
