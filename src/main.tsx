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
  if (!(globalThis as any).__PRERENDER_PODCASTS__) {
    const podcastData = await import('./assets/data/podcasts.json');
    (globalThis as any).__PRERENDER_PODCASTS__ = podcastData.default.map((pc) => ({
      ...pc,
      id: getPodcastUrlID(pc.url),
    }));
  }
  return await ssr(<App />);
  // const { html } = await ssr(<App />);

  // return {
  // 	html,
  // 	// Optionally add additional links that should be
  // 	// prerendered (if they haven't already been -- these will be deduped)
  // 	//links: new Set([...discoveredLinks, '/foo', '/bar']),
  // 	// Optionally configure and add elements to the `<head>` of
  // 	// the prerendered HTML document
  // 	head: {
  // 		// Sets the "lang" attribute: `<html lang="en">`
  // 		//lang: 'en',
  // 		// Sets the title for the current page: `<title>My cool page</title>`
  // 		//title: 'My cool page',
  // 		// Sets any additional elements you want injected into the `<head>`:
  // 		//   <link rel="stylesheet" href="foo.css">
  // 		//   <meta property="og:title" content="Social media title">
  // 		elements: new Set([
  // 			{ type: 'link', props: { rel: 'stylesheet', href: 'foo.css' } },
  // 			{ type: 'meta', props: { property: 'og:title', content: 'Social media title' } }
  // 		])
  // 	}
  // }
}
