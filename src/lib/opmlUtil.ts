import { Podcast } from '~/store/types';

const parsePodcastFeedUrls = (text: string): string[] => {
  // OPML needs only standard XML entities; custom DTD entities are not supported.
  if (/<!DOCTYPE/i.test(text)) throw new Error('OPML document types are not supported');

  const document = new DOMParser().parseFromString(text, 'application/xml');
  const root = document.documentElement;
  const body = Array.from(root.children).find((element) => element.tagName === 'body');
  if (document.querySelector('parsererror') || root.tagName !== 'opml' || !root.getAttribute('version') || !body) {
    throw new Error('Invalid OPML structure');
  }

  // DOM traversal covers flat, singleton, and arbitrarily nested outlines alike.
  // XML parsing decodes attribute entities exactly once without HTML execution.
  return Array.from(body.querySelectorAll('outline'))
    .filter((outline) => outline.hasAttribute('xmlUrl') || outline.getAttribute('type')?.toLowerCase() === 'rss')
    .map((outline) => outline.getAttribute('xmlUrl')?.trim() ?? '');
};

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
  parsePodcastFeedUrls,
};
