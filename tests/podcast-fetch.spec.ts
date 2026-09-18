import { expect, Page, test } from '@playwright/test';

const feedUrl = 'https://feeds.example/limits';
const podcastID = Buffer.from('feeds.example/limits').toString('base64');
const podcastPath = `/podcast/limits/${podcastID}`;
const rss = '<rss><channel><title>Stream podcast</title><description>Test</description></channel></rss>';
type Mode = 'stall' | 'headers' | 'oversize' | 'exact' | 'unicode' | 'fail' | 'success';

async function navigate(page: Page, url: string) {
  await page.evaluate((url) => {
    const link = document.createElement('a');
    link.href = url;
    document.body.append(link);
    link.click();
    link.remove();
  }, url);
}

async function mockFeed(page: Page, mode: Mode, proxy = false, contentLength?: string) {
  await page.evaluate(
    ({ mode, proxy, contentLength, feedUrl, rss }) => {
      const state = {
        mode,
        calls: [] as { url: string; aborted: boolean; cancelled: boolean }[],
      };
      Object.assign(window, { feedTest: state });
      const originalFetch = window.fetch;
      window.fetch = async (input, options) => {
        const url = String(input);
        if (url !== feedUrl && url !== 'https://request.tuner.workers.dev') return originalFetch(input, options);
        const call = { url, aborted: false, cancelled: false };
        state.calls.push(call);
        options?.signal?.addEventListener(
          'abort',
          () => {
            call.aborted = true;
          },
          { once: true },
        );
        if ((proxy && url === feedUrl) || state.mode === 'fail') throw new TypeError('Network failure');
        if (state.mode === 'headers') {
          return new Promise<Response>((_, reject) => {
            options?.signal?.addEventListener('abort', () => reject(options.signal?.reason), { once: true });
          });
        }
        const encoder = new TextEncoder();
        const cap = 5 * 1024 * 1024;
        let offset = 0;
        let bytes: Uint8Array;
        if (state.mode === 'oversize' || state.mode === 'exact') {
          const size = cap + (state.mode === 'oversize' ? 1 : 0);
          bytes = encoder.encode(rss.replace('Test', 'x'.repeat(size - encoder.encode(rss).length + 4)));
        } else {
          bytes = encoder.encode(state.mode === 'unicode' ? rss.replace('Stream podcast', 'Café 🎵') : rss);
        }
        const stream = new ReadableStream<Uint8Array>({
          pull(controller) {
            if (offset < bytes.length) {
              const length = state.mode === 'unicode' ? 1 : 64 * 1024;
              controller.enqueue(bytes.slice(offset, offset + length));
              offset += length;
            } else if (state.mode !== 'stall' && state.mode !== 'oversize') {
              controller.close();
            }
          },
          cancel() {
            call.cancelled = true;
          },
        });
        return new Response(stream, {
          headers: {
            'Content-Type': 'application/rss+xml',
            ...(contentLength ? { 'Content-Length': contentLength } : {}),
          },
        });
      };
    },
    { mode, proxy, contentLength, feedUrl, rss },
  );
}

async function calls(page: Page) {
  return page.evaluate(
    () =>
      (
        window as unknown as {
          feedTest: { calls: { url: string; aborted: boolean; cancelled: boolean }[] };
        }
      ).feedTest.calls,
  );
}

async function setMode(page: Page, mode: Mode) {
  await page.evaluate((mode) => {
    (window as unknown as { feedTest: { mode: Mode } }).feedTest.mode = mode;
  }, mode);
}

async function saved(page: Page) {
  return page.evaluate(async (id) => {
    const path = '/tests/fixtures/playback-state.ts';
    return (await import(path)).getPodcast(id) ?? null;
  }, podcastID);
}

test.beforeEach(async ({ page }) => {
  await page.clock.install();
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

for (const proxy of [false, true]) {
  test(`stalled ${proxy ? 'proxy' : 'direct'} body times out and can be retried`, async ({ page }) => {
    await mockFeed(page, 'stall', proxy);
    await navigate(page, podcastPath);
    await expect.poll(async () => (await calls(page)).length).toBe(proxy ? 2 : 1);
    await page.clock.runFor(10_100);
    await expect(page.getByRole('alert')).toHaveText('Podcast feed timed out after 10 seconds.');
    expect((await calls(page)).at(-1)).toMatchObject({ aborted: true, cancelled: true });
    expect(await saved(page)).toBeNull();
    await setMode(page, 'success');
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(
      page
        .locator('header')
        .filter({ has: page.getByTitle('Refresh episodes', { exact: true }) })
        .getByRole('heading', { name: 'Stream podcast', exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
}

for (const proxy of [false, true]) {
  for (const contentLength of [undefined, '1']) {
    test(`rejects oversized ${proxy ? 'proxy' : 'direct'} chunks with ${contentLength ? 'false' : 'no'} Content-Length`, async ({
      page,
    }) => {
      await mockFeed(page, 'oversize', proxy, contentLength);
      await navigate(page, podcastPath);
      await expect(page.getByRole('alert')).toHaveText('Podcast feed is too large (maximum 8 MiB).');
      const requests = await calls(page);
      expect(requests).toHaveLength(proxy ? 2 : 1);
      expect(requests.at(-1)?.cancelled).toBe(true);
      expect(await saved(page)).toBeNull();
    });
  }
}

for (const mode of ['exact', 'unicode'] as const) {
  test(`accepts ${mode === 'exact' ? 'a feed exactly at the byte cap' : 'UTF-8 split across chunks'}`, async ({
    page,
  }) => {
    await mockFeed(page, mode);
    await navigate(page, podcastPath);
    await expect(
      page
        .locator('header')
        .filter({ has: page.getByTitle('Refresh episodes', { exact: true }) })
        .getByRole('heading', { name: mode === 'exact' ? 'Stream podcast' : 'Café 🎵', exact: true }),
    ).toBeVisible();
    await page.clock.runFor(11_000);
    await expect(page.getByRole('alert')).toHaveCount(0);
    expect(await calls(page)).toEqual([{ url: feedUrl, aborted: false, cancelled: false }]);
  });
}

for (const mode of ['headers', 'stall', 'fail'] as const) {
  test(`navigation cancels work during ${mode} without retries or cache writes`, async ({ page }) => {
    await mockFeed(page, mode);
    await navigate(page, podcastPath);
    await expect.poll(async () => (await calls(page)).length).toBe(mode === 'fail' ? 2 : 1);
    await navigate(page, '/settings');
    await expect(page).toHaveURL(/\/settings$/);
    await page.clock.runFor(20_000);
    const requests = await calls(page);
    expect(requests).toHaveLength(mode === 'fail' ? 2 : 1);
    expect(requests.every((request) => request.aborted)).toBe(true);
    if (mode === 'stall') expect(requests[0].cancelled).toBe(true);
    expect(await saved(page)).toBeNull();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
}

test('switching podcast routes cancels the old body and displays only the new feed', async ({ page }) => {
  await mockFeed(page, 'stall');
  await navigate(page, podcastPath);
  await expect.poll(async () => (await calls(page)).length).toBe(1);
  const otherUrl = 'https://feeds.example/other';
  await page.route(otherUrl, (route) =>
    route.fulfill({ contentType: 'application/rss+xml', body: rss.replace('Stream podcast', 'Other podcast') }),
  );
  await navigate(page, `/podcast/other/${Buffer.from('feeds.example/other').toString('base64')}`);
  await expect(
    page
      .locator('header')
      .filter({ has: page.getByTitle('Refresh episodes', { exact: true }) })
      .getByRole('heading', { name: 'Other podcast', exact: true }),
  ).toBeVisible();
  await page.clock.runFor(20_000);
  expect(await calls(page)).toEqual([{ url: feedUrl, aborted: true, cancelled: true }]);
  expect(await saved(page)).toBeNull();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('refresh errors retain cached episodes and clear after successful refresh', async ({ page }) => {
  await mockFeed(page, 'success');
  await navigate(page, podcastPath);
  await expect(
    page
      .locator('header')
      .filter({ has: page.getByTitle('Refresh episodes', { exact: true }) })
      .getByRole('heading', { name: 'Stream podcast', exact: true }),
  ).toBeVisible();
  await setMode(page, 'oversize');
  await page.getByTitle('Refresh episodes', { exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Podcast feed is too large (maximum 8 MiB).');
  await expect(
    page
      .locator('header')
      .filter({ has: page.getByTitle('Refresh episodes', { exact: true }) })
      .getByRole('heading', { name: 'Stream podcast', exact: true }),
  ).toBeVisible();
  await setMode(page, 'success');
  await page.getByTitle('Refresh episodes', { exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('navigation stops an OPML import before it fetches the next feed', async ({ page }) => {
  await mockFeed(page, 'stall');
  await navigate(page, '/settings');
  await page.getByLabel('Import from OPML', { exact: true }).setInputFiles({
    name: 'subscriptions.opml',
    mimeType: 'text/x-opml',
    buffer: Buffer.from(
      `<opml version="2.0"><body><outline xmlUrl="${feedUrl}"/><outline xmlUrl="https://feeds.example/next"/></body></opml>`,
    ),
  });
  await expect.poll(async () => (await calls(page)).length).toBe(1);
  const dialogs: string[] = [];
  page.on('dialog', (dialog) => {
    dialogs.push(dialog.message());
    void dialog.dismiss();
  });
  await navigate(page, '/');
  await page.clock.runFor(20_000);
  expect(await calls(page)).toEqual([{ url: feedUrl, aborted: true, cancelled: true }]);
  expect(dialogs).toEqual([]);
});
