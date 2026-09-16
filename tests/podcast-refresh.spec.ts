import { expect, Page, Route, test } from '@playwright/test';

const feedUrl = 'https://feeds.example/refresh';
const podcastID = Buffer.from('feeds.example/refresh').toString('base64');
const podcastPath = `/podcast/refresh/${podcastID}`;
const rss = `<rss version="2.0"><channel>
  <title>Refreshed podcast</title><description>Updated description</description>
  ${['New episode', 'Existing episode']
    .map(
      (title, index) => `
    <item><title>${title}</title><description>${title}</description>
      <pubDate>Wed, 16 Sep 2026 08:00:00 GMT</pubDate><duration>600</duration>
      <enclosure url="https://media.example/${index === 0 ? 'new' : 'existing'}.mp3" type="audio/mpeg" />
    </item>`,
    )
    .join('')}
</channel></rss>`;

test.beforeEach(async ({ page }) => {
  await page.clock.install();
  await page.addInitScript(() => {
    const positions = new WeakMap<HTMLMediaElement, number>();
    Object.defineProperties(HTMLMediaElement.prototype, {
      currentTime: {
        get() {
          return positions.get(this) ?? 0;
        },
        set(value: number) {
          positions.set(this, value);
        },
      },
      currentSrc: {
        get() {
          return this.querySelector('source')?.src ?? '';
        },
      },
      duration: {
        get() {
          return 600;
        },
      },
      readyState: {
        get() {
          return 4;
        },
      },
      play: { value: () => Promise.resolve() },
      pause: { value() {} },
      load: {
        value() {
          positions.set(this, 0);
        },
      },
    });
  });
  await page.route('https://media.example/**', (route) => route.abort());
  await page.route(feedUrl, (route) => route.fulfill({ contentType: 'application/rss+xml', body: rss }));
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

async function seed(page: Page, followed: boolean, expired = false) {
  await page.evaluate(
    async ({ followed, expired, podcastID, feedUrl }) => {
      const path = '/tests/fixtures/playback-state.ts';
      const { followedPodcasts, recentlyVisitedPodcasts } = await import(path);
      const podcast = {
        id: podcastID,
        title: 'Cached podcast',
        description: 'Old description',
        imageUrl: '',
        url: feedUrl,
        feedUrl,
        addedDate: 1,
        lastFetched: expired ? 1 : Date.now(),
        episodes: [
          {
            title: 'Existing episode',
            description: '',
            pubDate: new Date(),
            duration: '10:00',
            audio: 'https://media.example/existing.mp3',
            mimeType: 'audio/mpeg',
            currentTime: 123,
          },
        ],
      };
      followedPodcasts.value = followed ? [structuredClone(podcast)] : [];
      recentlyVisitedPodcasts.value = [podcast];
    },
    { followed, expired, podcastID, feedUrl },
  );
}

async function navigate(page: Page, url: string) {
  await page.evaluate((url) => {
    const link = document.createElement('a');
    link.href = url;
    document.body.append(link);
    link.click();
    link.remove();
  }, url);
}

async function cache(page: Page) {
  return page.evaluate(async (id) => {
    const path = '/tests/fixtures/playback-state.ts';
    const { followedPodcasts, recentlyVisitedPodcasts, getPodcast } = await import(path);
    return {
      canonical: getPodcast(id),
      followed: followedPodcasts.value,
      recent: recentlyVisitedPodcasts.value,
    };
  }, podcastID);
}

function expectedPodcast(existingPosition = 123, newPosition = 0) {
  return expect.objectContaining({
    title: 'Refreshed podcast',
    description: 'Updated description',
    addedDate: 1,
    episodes: [
      expect.objectContaining({ title: 'New episode', currentTime: newPosition }),
      expect.objectContaining({ title: 'Existing episode', currentTime: existingPosition }),
    ],
  });
}

async function seek(page: Page, position: number) {
  await page.locator('audio').evaluate((audio: HTMLAudioElement, position) => {
    audio.currentTime = position;
    audio.dispatchEvent(new Event('seeked'));
  }, position);
}

for (const followed of [true, false]) {
  for (const refresh of ['manual', 'expired'] as const) {
    test(`${refresh} refresh of a ${followed ? 'followed' : 'recent-only'} podcast retains episodes and progress after reload`, async ({
      page,
    }) => {
      await seed(page, followed, refresh === 'expired');
      await navigate(page, podcastPath);
      const podcastHeader = page
        .locator('header')
        .filter({ has: page.getByTitle('Refresh episodes', { exact: true }) });
      if (refresh === 'manual') {
        await expect(podcastHeader.getByRole('heading', { name: 'Cached podcast', exact: true })).toBeVisible();
        await page.getByTitle('Refresh episodes', { exact: true }).click();
      }
      await expect(podcastHeader.getByRole('heading', { name: 'Refreshed podcast', exact: true })).toBeVisible();
      await expect
        .poll(() => cache(page))
        .toEqual({
          canonical: expectedPodcast(),
          followed: followed ? [expectedPodcast()] : [],
          recent: [expectedPodcast()],
        });
      await expect(page.getByRole('button', { name: followed ? 'Following' : 'Follow', exact: true })).toBeVisible();

      await page.getByRole('heading', { name: /^New episode/ }).click();
      await expect(page.locator('audio source')).toHaveAttribute('src', 'https://media.example/new.mp3');
      await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
      await seek(page, 45);
      await expect
        .poll(() => cache(page))
        .toEqual({
          canonical: expectedPodcast(123, 45),
          followed: followed ? [expectedPodcast(123, 45)] : [],
          recent: [expectedPodcast(123, 45)],
        });
      await page.getByRole('button', { name: 'Close player', exact: true }).click();
      await navigate(page, '/');
      await page.reload();
      await expect
        .poll(() => cache(page))
        .toEqual({
          canonical: expectedPodcast(123, 45),
          followed: followed ? [expectedPodcast(123, 45)] : [],
          recent: [expectedPodcast(123, 45)],
        });
      await navigate(page, podcastPath);
      await page.getByRole('heading', { name: /^New episode/ }).click();
      await expect.poll(() => page.locator('audio').evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBe(45);
    });
  }
}

test('refresh preserves a seek to zero made while the feed request is pending', async ({ page }) => {
  let proxyRequests = 0;
  await page.route('https://request.tuner.workers.dev', (route) => {
    proxyRequests++;
    return route.abort();
  });
  await seed(page, true);
  await navigate(page, podcastPath);
  await page.getByRole('heading', { name: /^Existing episode/ }).click();
  await expect.poll(() => page.locator('audio').evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBe(123);
  // Debugger pauses must not consume the app's 10-second request timeout.
  // Fix Date first so pauseAt cannot fall behind the running browser clock.
  const heldTime = new Date();
  await page.clock.setFixedTime(heldTime);
  await page.clock.pauseAt(heldTime);
  await page.unroute(feedUrl);
  let captureRoute!: (route: Route) => void;
  const pending = new Promise<Route>((resolve) => {
    captureRoute = resolve;
  });
  await page.route(feedUrl, captureRoute);
  await page.getByTitle('Refresh episodes', { exact: true }).click();
  const heldRoute = await pending;
  try {
    await seek(page, 0);
    await expect.poll(() => cache(page)).toMatchObject({ canonical: { episodes: [{ currentTime: 0 }] } });
  } finally {
    await heldRoute.fulfill({ contentType: 'application/rss+xml', body: rss });
  }
  await expect
    .poll(async () => {
      // Flush rendering effects without resuming wall-clock-driven timers.
      await page.clock.runFor(200);
      return cache(page);
    })
    .toEqual({
      canonical: expectedPodcast(0),
      followed: [expectedPodcast(0)],
      recent: [expectedPodcast(0)],
    });
  await expect(page.getByRole('heading', { name: 'Existing episode (00:10)', exact: true })).toBeVisible();
  expect(proxyRequests).toBe(0);
});
