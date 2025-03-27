import { Podcast } from '~/store/types';

const escapeXml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const generatePodcastsOpml = (podcasts: Podcast[]) => {
  const date = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>1tuner.com export</title>
    <dateCreated>${date}</dateCreated>
  </head>
  <body>
    <outline text="Podcasts">
${podcasts
  .map(
    (podcast) =>
      `      <outline type="rss" text="${escapeXml(podcast.title)}" xmlUrl="${escapeXml(podcast.feedUrl)}"/>`,
  )
  .join('\n')}
    </outline>
  </body>
</opml>`;
};

export const opmlUtil = {
  generatePodcastsOpml,
};
