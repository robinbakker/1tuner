import { expect, Page, test } from '@playwright/test';

const rss = `<rss version="2.0"><channel><title>Imported podcast</title><description>Test feed</description>
  <item><title>First</title><description>First</description><enclosure url="https://media.example/1.mp3" /></item>
  <item><title>Second</title><description>Second</description><enclosure url="https://media.example/2.mp3" /></item>
</channel></rss>`;

test.beforeEach(async ({ page }) => {
  await page.route('https://feeds.example/**', (route) =>
    route.fulfill({ contentType: 'application/rss+xml', body: rss }),
  );
  await page.goto('/settings');
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const path = '/tests/fixtures/opml-state.ts';
        return (await import(path)).isDBLoaded.value;
      }),
    )
    .toBe(true);
});

async function upload(page: Page, content: string | Buffer) {
  const dialog = page.waitForEvent('dialog');
  await page.getByLabel('Import from OPML', { exact: true }).setInputFiles({
    name: 'subscriptions.opml',
    mimeType: 'text/x-opml',
    buffer: Buffer.from(content),
  });
  const result = await dialog;
  const message = result.message();
  await result.accept();
  await expect(page.getByLabel('Import from OPML', { exact: true })).toBeEnabled();
  await expect(page.getByLabel('Import from OPML', { exact: true })).toHaveValue('');
  return message;
}

async function subscriptions(page: Page) {
  return page.evaluate(async () => {
    const path = '/tests/fixtures/opml-state.ts';
    return (await import(path)).followedPodcasts.value;
  });
}

for (const count of [0, 1, 3]) {
  test(`export/import round trip with ${count} subscriptions and repeat import`, async ({ page }) => {
    const expected = await page.evaluate(async (count) => {
      const path = '/tests/fixtures/opml-state.ts';
      const { followedPodcasts, getPodcastUrlID } = await import(path);
      followedPodcasts.value = Array.from({ length: count }, (_, index) => {
        const feedUrl = `https://feeds.example/${index}?a=1&b=2`;
        return {
          id: getPodcastUrlID(feedUrl),
          feedUrl,
          url: feedUrl,
          title: 'Title & <quoted> "test"',
          description: '',
          imageUrl: '',
          addedDate: 1,
          lastFetched: Date.now(),
        };
      });
      return followedPodcasts.value.map((podcast: { feedUrl: string }) => podcast.feedUrl);
    }, count);
    const downloadEvent = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export to OPML' }).click();
    const stream = await (await downloadEvent).createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    const exported = Buffer.concat(chunks);
    await page.evaluate(async () => {
      const path = '/tests/fixtures/opml-state.ts';
      (await import(path)).followedPodcasts.value = [];
    });
    expect(await upload(page, exported)).toBe(`Import completed: ${count} imported, 0 skipped, 0 failed.`);
    expect((await subscriptions(page)).map((podcast: { feedUrl: string }) => podcast.feedUrl)).toEqual(expected);
    const before = await subscriptions(page);
    expect(await upload(page, exported)).toBe(`Import completed: 0 imported, ${count} skipped, 0 failed.`);
    expect(await subscriptions(page)).toEqual(before);
  });
}

test('flat and nested outlines decode XML entities once and preserve HTTP and query URLs', async ({ page }) => {
  const requested: string[] = [];
  await page.route('http://feeds.example/**', (route) => {
    requested.push(route.request().url());
    return route.fulfill({ contentType: 'application/rss+xml', body: rss });
  });
  const xml = `<opml version="1.0"><body>
    <outline type="rss" xmlUrl="http://feeds.example/flat?a=1&amp;b=2" />
    <outline text="Folder"><outline text="Deep"><outline text="Deeper">
      <outline xmlUrl="https://feeds.example/nested?q=&quot;x&quot;&amp;apostrophe=&apos;&amp;less=&lt;&amp;greater=&gt;&amp;decimal=&#38;&amp;hex=&#x26;&amp;literal=&amp;amp;" />
    </outline></outline></outline>
    <outline text="Folder two"><outline type="rss" xmlUrl="https://feeds.example/last" /></outline>
    <outline type="rss" xmlUrl="http://feeds.example/flat?a=1&amp;b=2" />
  </body></opml>`;
  expect(await upload(page, xml)).toBe('Import completed: 3 imported, 1 skipped, 0 failed.');
  expect(requested).toEqual(['http://feeds.example/flat?a=1&b=2']);
  expect((await subscriptions(page)).map((podcast: { feedUrl: string }) => podcast.feedUrl)).toEqual([
    'http://feeds.example/flat?a=1&b=2',
    `https://feeds.example/nested?q="x"&apostrophe='&less=<&greater=>&decimal=&&hex=&&literal=&amp;`,
    'https://feeds.example/last',
  ]);
});

test('failed feeds do not prevent later imports, and busy input is disabled', async ({ page }) => {
  await page.route('https://feeds.example/broken', (route) => route.fulfill({ status: 503, body: '' }));
  await page.route('https://request.tuner.workers.dev', (route) => route.fulfill({ status: 503, body: '' }));
  const pending = upload(
    page,
    `<opml version="2.0"><body>
    <outline type="rss" xmlUrl="https://feeds.example/broken" />
    <outline type="rss" xmlUrl="javascript:alert(1)" />
    <outline type="rss" />
    <outline type="rss" xmlUrl="https://feeds.example/good" />
  </body></opml>`,
  );
  await expect(page.getByLabel('Import from OPML', { exact: true })).toBeDisabled();
  expect(await pending).toBe('Import completed: 1 imported, 0 skipped, 3 failed.');
  expect((await subscriptions(page)).map((podcast: { feedUrl: string }) => podcast.feedUrl)).toEqual([
    'https://feeds.example/good',
  ]);
});

test('rejects malformed or non-OPML XML and custom entities without changing subscriptions', async ({ page }) => {
  for (const xml of [
    '<opml version="2.0"><body><outline></body></opml>',
    '<rss version="2.0"><body /></rss>',
    '<opml><body /></opml>',
    '<opml version="2.0" />',
    '<!DOCTYPE opml [<!ENTITY feed "https://feeds.example/entity">]><opml version="2.0"><body><outline xmlUrl="&feed;" /></body></opml>',
  ]) {
    expect(await upload(page, xml)).toContain('Failed to import OPML file');
    expect(await subscriptions(page)).toEqual([]);
  }
});
