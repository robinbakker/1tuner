import { hydrate, prerender as ssr } from 'preact-iso';
import { App } from './app.tsx';
import { genres } from './assets/data/genres.json';
import { languages } from './assets/data/languages.json';
import { stations } from './assets/data/stations.json';
import { RadioStation } from './components/types.ts';

if (typeof window !== 'undefined') {
  hydrate(
    <App stations={stations as RadioStation[]} genres={genres} languages={languages} />,
    document.getElementById('app')!,
  );
}

export async function prerender() {
  const { html, links: discoveredLinks } = await ssr(
    <App stations={stations as RadioStation[]} genres={genres} languages={languages} />,
  );

  const extraLinks = stations.map((s) => {
    return `/radio-station/${s.id}`;
  });

  return {
    html: `${html}<script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "30f87338881f4e7f8b7258541e15092f"}'></script>`,
    links: new Set([...(discoveredLinks || []), ...extraLinks]),
  };
}
