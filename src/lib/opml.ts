import { Podcast } from '~/store/types';

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
  .map((podcast) => `      <outline type="rss" text="${podcast.title}" xmlUrl="${podcast.feedUrl}"/>`)
  .join('\n')}
    </outline>
  </body>
</opml>`;
};

export const opml = {
  generatePodcastsOpml,
};
