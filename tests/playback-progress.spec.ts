import { expect, Page, test } from '@playwright/test';

// Exercise the real app, lifecycle handlers and IndexedDB with deterministic media.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const positions = new WeakMap<HTMLMediaElement, number>();
    const sources = new WeakMap<HTMLMediaElement, string>();
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
          return sources.get(this) ?? '';
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
      play: {
        value() {
          return Promise.resolve();
        },
      },
      pause: { value() {} },
      load: {
        value() {
          positions.set(this, 0);
          sources.set(this, this.querySelector('source')?.src ?? '');
        },
      },
    });
  });
  await page.route('https://media.example/**', (route) => route.abort());
  await page.goto('/');
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const path = '/tests/fixtures/playback-state.ts';
        return (await import(path)).isDBLoaded.value;
      }),
    )
    .toBe(true);
  await page.evaluate(async () => {
    const path = '/tests/fixtures/playback-state.ts';
    const { followedPodcasts, recentlyVisitedPodcasts } = await import(path);
    const podcast = {
      id: 'progress-test',
      title: 'Progress test',
      description: '',
      imageUrl: '',
      url: 'https://media.example/feed',
      feedUrl: 'https://media.example/feed',
      addedDate: 0,
      lastFetched: Date.now(),
      episodes: ['a', 'b'].map((id) => ({
        title: id,
        description: '',
        pubDate: new Date(),
        duration: '10:00',
        audio: `https://media.example/${id}.mp3?x=1&amp;y=2`,
        mimeType: 'audio/mpeg',
        currentTime: 0,
      })),
    };
    followedPodcasts.value = [podcast];
    recentlyVisitedPodcasts.value = [podcast];
  });
  await selectEpisode(page, 'a');
});

async function selectEpisode(page: Page, episode: string, playType = 'podcast') {
  await page.evaluate(
    async ({ episode, playType }) => {
      const path = '/tests/fixtures/playback-state.ts';
      const { playerState, getPodcast } = await import(path);
      playerState.value = {
        playType,
        isPlaying: true,
        contentID: 'progress-test',
        title: episode,
        imageUrl: '',
        pageLocation: '/',
        streams: [{ url: `https://media.example/${episode}.mp3?x=1&y=2`, mimetype: 'audio/mpeg' }],
        currentTime:
          getPodcast('progress-test').episodes.find((ep: { title: string }) => ep.title === episode)?.currentTime ?? 0,
      };
    },
    { episode, playType },
  );
  await expect(page.locator('audio source')).toHaveAttribute('src', `https://media.example/${episode}.mp3?x=1&y=2`);
  // Flush the player's passive source/playback effect before advancing media.
  await page.waitForTimeout(100);
}

async function advance(page: Page, position: number, event = 'timeupdate') {
  await page.locator('audio').evaluate(
    (audio: HTMLAudioElement, { position, event }) => {
      audio.currentTime = position;
      audio.dispatchEvent(new Event(event));
    },
    { position, event },
  );
}

async function saved(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('1tuner');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const read = (key: string) =>
      new Promise<unknown>((resolve) => {
        const request = db.transaction('appState').objectStore('appState').get(key);
        request.onsuccess = () => resolve(request.result);
      });
    const [player, followed, recent] = await Promise.all([
      read('playerState'),
      read('followedPodcasts'),
      read('recentlyVisitedPodcasts'),
    ]);
    db.close();
    return { player, followed, recent };
  });
}

function expectedProgress(position: number, episode = 'a') {
  const podcasts = expect.arrayContaining([
    expect.objectContaining({
      episodes: expect.arrayContaining([expect.objectContaining({ title: episode, currentTime: position })]),
    }),
  ]);
  return { followed: podcasts, recent: podcasts };
}

test('checkpoints while playing and restores the position after reload', async ({ page }) => {
  await page.clock.setFixedTime(new Date(Date.now() + 6000));
  await advance(page, 123);
  await expect
    .poll(() => saved(page))
    .toMatchObject({
      ...expectedProgress(123),
      player: expect.objectContaining({ currentTime: 123 }),
    });
  // Within the interval, timeupdate must not write on every event.
  await advance(page, 124);
  expect(await saved(page)).toMatchObject({ player: { currentTime: 123 } });
  await page.reload();
  await expect.poll(() => page.locator('audio').evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBe(124);
});

for (const event of ['visibilitychange', 'pagehide', 'beforeunload']) {
  test(`${event} saves the latest position without a pause or timeupdate`, async ({ page }) => {
    await advance(page, 123, 'test-position-only');
    await page.evaluate((event) => {
      if (event === 'visibilitychange') {
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
        document.dispatchEvent(new Event(event));
      } else window.dispatchEvent(new Event(event));
    }, event);
    await expect
      .poll(() => saved(page))
      .toMatchObject({
        ...expectedProgress(123),
        player: expect.objectContaining({ currentTime: 123 }),
      });
  });
}

test('switching episodes preserves outgoing progress and resumes each episode', async ({ page }) => {
  await advance(page, 123);
  await selectEpisode(page, 'b');
  await expect
    .poll(() => saved(page))
    .toMatchObject({
      ...expectedProgress(123),
      player: expect.objectContaining({ title: 'b', currentTime: 0 }),
    });
  await advance(page, 45);
  await selectEpisode(page, 'a');
  await expect.poll(() => saved(page)).toMatchObject(expectedProgress(45, 'b'));
  expect(await page.locator('audio').evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBe(123);
});

test('switching to radio preserves the outgoing episode', async ({ page }) => {
  await advance(page, 123);
  await selectEpisode(page, 'radio', 'radio');
  await expect.poll(() => saved(page)).toMatchObject(expectedProgress(123));
});

test('closing the player saves progress and the closed state', async ({ page }) => {
  await advance(page, 123);
  await page.getByRole('button', { name: 'Close player', exact: true }).click();
  await expect.poll(() => saved(page)).toMatchObject({ ...expectedProgress(123), player: null });
  await selectEpisode(page, 'a');
  expect(await page.locator('audio').evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBe(123);
});

test('seeking back to zero replaces an older saved position', async ({ page }) => {
  await advance(page, 123, 'seeked');
  await expect.poll(() => saved(page)).toMatchObject(expectedProgress(123));
  await advance(page, 0, 'seeked');
  await expect.poll(() => saved(page)).toMatchObject({ ...expectedProgress(0), player: { currentTime: 0 } });
});

test('ending saves the final position and stops playback', async ({ page }) => {
  await advance(page, 600, 'ended');
  await expect
    .poll(() => saved(page))
    .toMatchObject({
      ...expectedProgress(600),
      player: expect.objectContaining({ currentTime: 600, isPlaying: false }),
    });
});

test('pausing captures the latest position immediately', async ({ page }) => {
  await advance(page, 123);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect
    .poll(() => saved(page))
    .toMatchObject({
      ...expectedProgress(123),
      player: expect.objectContaining({ currentTime: 123, isPlaying: false }),
    });
});

test('completion is saved before an automatic transition to radio', async ({ page }) => {
  await page.evaluate(async () => {
    const path = '/tests/fixtures/playback-state.ts';
    const { playlistRules, radioBrowserStations } = await import(path);
    radioBrowserStations.value = [
      {
        id: 'test-radio',
        name: 'Test radio',
        logosource: '',
        language: '',
        genres: [],
        streams: [{ url: 'https://media.example/radio.mp3', mimetype: 'audio/mpeg' }],
      },
    ];
    playlistRules.value = [{ ruleType: 'podcastToStation', stationID: 'test-radio' }];
  });
  await advance(page, 600, 'ended');
  await expect
    .poll(() => saved(page))
    .toMatchObject({
      ...expectedProgress(600),
      player: expect.objectContaining({ playType: 'radio', contentID: 'test-radio' }),
    });
});
