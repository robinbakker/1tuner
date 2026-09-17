import { expect, Page, test } from '@playwright/test';

const feedUrl = 'https://feeds.example/shapes';
const podcastID = Buffer.from('feeds.example/shapes').toString('base64');
const podcastPath = `/podcast/shapes/${podcastID}`;
const feed = (items: string, metadata = '<description>Feed description</description>') =>
  `<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"><channel>
    <title>Shape podcast</title>${metadata}${items}
  </channel></rss>`;
const item = (metadata = '', title = 'Episode') => `<item><title>${title}</title>${metadata}
  <enclosure url="https://media.example/episode.mp3?x=1&amp;y=2" type="audio/mpeg" />
</item>`;

async function fetchPodcast(page: Page, xml: string) {
  await page.route(feedUrl, (route) => route.fulfill({ contentType: 'application/rss+xml', body: xml }));
  return page.evaluate(
    async ({ podcastID, feedUrl }) => {
      const path = '/tests/fixtures/podcast-data.tsx';
      const harness = await import(path);
      harness.startFetch(podcastID, feedUrl, true);
      return harness.result;
    },
    { podcastID, feedUrl },
  );
}

test.beforeEach(async ({ page }) => {
  // An unexpectedly rejected feed must never reach the real proxy.
  await page.route('https://request.tuner.workers.dev', (route) => route.fulfill({ status: 503, body: '' }));
  await page.goto('/');
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const path = '/tests/fixtures/playback-state.ts';
        return (await import(path)).isDBLoaded.value;
      }),
    )
    .toBe(true);
});

for (const count of [0, 1, 3, 51]) {
  test(`loads ${count} RSS items and retains the 50-episode limit`, async ({ page }) => {
    const podcast = await fetchPodcast(
      page,
      feed(Array.from({ length: count }, (_, i) => item('', `Episode ${i}`)).join('')),
    );
    expect(podcast).toMatchObject({ title: 'Shape podcast', description: 'Feed description' });
    expect(podcast.episodes.map((episode: { title: string }) => episode.title)).toEqual(
      Array.from({ length: Math.min(count, 50) }, (_, i) => `Episode ${i}`),
    );
  });
}

for (const attributes of ['', ' isPermaLink="false"']) {
  test(`preserves text GUIDs ${attributes ? 'with' : 'without'} attributes`, async ({ page }) => {
    const guids = [
      'episode-one',
      '0012345678901234567890',
      '0',
      'https://example.test/episode?x=1&y=2',
      'literal&amp;',
    ];
    const podcast = await fetchPodcast(
      page,
      feed(guids.map((guid) => item(`<guid${attributes}>${guid.replaceAll('&', '&amp;')}</guid>`)).join('')),
    );
    expect(podcast.episodes.map((episode: { guid: string }) => episode.guid)).toEqual(guids);
  });
}

test('missing and invalid optional metadata has safe defaults', async ({ page }) => {
  const podcast = await fetchPodcast(
    page,
    feed(
      item() +
        item('<description/><guid/><pubDate>invalid</pubDate><duration>invalid</duration>') +
        item(
          '<description><nested>invalid</nested></description><guid><nested>invalid</nested></guid><itunes:duration/>',
        ) +
        '<item><description>Description only</description></item>',
      '<image/><itunes:image/><categories>not an array</categories>',
    ),
  );
  expect(podcast).toMatchObject({ description: '', imageUrl: '' });
  expect(podcast.categories).toBeUndefined();
  for (const episode of podcast.episodes) {
    expect(episode.guid).toBeUndefined();
    expect(episode.pubDate).toBeUndefined();
    expect(episode.duration).toBe('');
  }
  expect(podcast.episodes[0]).toMatchObject({
    description: '',
    audio: 'https://media.example/episode.mp3?x=1&y=2',
    mimeType: 'audio/mpeg',
  });
  expect(podcast.episodes[2].description).toBe('');
  expect(podcast.episodes[3]).toMatchObject({ title: '', description: 'Description only', audio: '', mimeType: '' });
});

test('preserves valid dates, duration formats, text metadata and artwork', async ({ page }) => {
  const podcast = await fetchPodcast(
    page,
    feed(
      item(
        '<description>One &amp; two</description><pubDate>Wed, 16 Sep 2026 08:00:00 GMT</pubDate><itunes:duration>600</itunes:duration>',
        '001',
      ) + item('<duration>01:02:03</duration>'),
      '<image><url>https://images.example/cover?x=1&amp;y=2</url></image>',
    ),
  );
  expect(podcast.imageUrl).toBe('https://images.example/cover?x=1&y=2');
  expect(podcast.episodes[0]).toMatchObject({ title: '001', description: 'One & two', duration: '00:10' });
  expect(podcast.episodes[0].pubDate).toEqual(new Date('2026-09-16T08:00:00Z'));
  expect(podcast.episodes[1].duration).toBe('01:02');
});

test('a single episode without optional metadata renders and produces an episode share URL', async ({ page }) => {
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = () => Promise.resolve();
    HTMLMediaElement.prototype.pause = () => {};
    HTMLMediaElement.prototype.load = () => {};
  });
  await page.route('https://media.example/**', (route) => route.abort());
  await page.route(feedUrl, (route) =>
    route.fulfill({ contentType: 'application/rss+xml', body: feed(item('<guid>00123</guid>'), '') }),
  );
  await page.goto(`${podcastPath}/00123`);
  const podcastHeader = page.locator('header').filter({ has: page.getByTitle('Refresh episodes', { exact: true }) });
  await expect(podcastHeader.getByRole('heading', { name: 'Shape podcast', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Episode', exact: true })).toBeVisible();
  await expect(page.locator('section time')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Show all episodes/ })).toBeVisible();
  await page.getByRole('heading', { name: 'Episode', exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const path = '/tests/fixtures/playback-state.ts';
        return (await import(path)).playerState.value.shareUrl;
      }),
    )
    .toBe(`${podcastPath}/00123`);
});
