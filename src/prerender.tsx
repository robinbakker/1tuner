import { prerender as ssr } from 'preact-iso';
import { App } from './app';
import { defaultHeadData, HeadData } from './hooks/useHead';
import { getPodcastUrlID } from './lib/utils';
import { featuredPodcasts } from './store/signals/podcast';
import { setStationPodcasts } from './store/signals/radio';

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
  const { html, links } = await ssr(<App />);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const headData = { ...defaultHeadData, ...((globalThis as any).__HEAD_DATA__ || {}) } as HeadData;

  return {
    html,
    links,
    head: {
      title: headData.title,
      elements: new Set([
        { type: 'meta', props: { name: 'description', content: headData.description } },
        { type: 'meta', props: { property: 'og:title', content: headData.title } },
        { type: 'meta', props: { property: 'og:description', content: headData.description } },
        { type: 'meta', props: { property: 'og:image', content: headData.image } },
        { type: 'meta', props: { property: 'og:url', content: headData.url } },
        { type: 'meta', props: { property: 'og:type', content: headData.type } },
      ]),
    },
  };
}
