import { expect, Page, test } from '@playwright/test';
import { installCastMock } from './fixtures/cast-sdk';

async function state(page: Page) {
  return page.evaluate(() => {
    const m = window.castMock;
    return {
      init: m.initializeCalls,
      requests: m.requestCalls,
      loads: m.session.loads.map((r) => r.media.contentId),
      sessionListeners: m.session.listeners.size,
      mediaListeners: m.session.loadedMedia.map((media) => media.listeners.size),
    };
  });
}
async function enable(page: Page, enabled = true) {
  await page.evaluate(async (enabled) => {
    const path = '/tests/fixtures/cast-state.ts';
    const { settingsState } = await import(path);
    settingsState.value = { ...settingsState.value, enableChromecast: enabled };
  }, enabled);
  await expect(page.locator('script[src*="cast_sender.js"]')).toHaveCount(enabled ? 1 : 0);
}
async function select(page: Page, id: string, playType = 'podcast') {
  await page.evaluate(
    async ({ id, playType }) => {
      const path = '/tests/fixtures/cast-state.ts';
      const { playerState } = await import(path);
      playerState.value = {
        playType,
        contentID: id,
        title: id,
        imageUrl: '',
        pageLocation: '/',
        isPlaying: true,
        streams: [{ url: `https://media.example/${id}.mp3`, mimetype: 'audio/mpeg' }],
        currentTime: 42,
      };
    },
    { id, playType },
  );
}
async function start(page: Page) {
  await enable(page);
  await page.getByTitle('Start casting', { exact: true }).click();
  await expect(page.getByTitle('Stop casting', { exact: true })).toBeVisible();
  await expect.poll(async () => (await state(page)).loads.length).toBe(1);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(installCastMock);
  await page.route('https://www.gstatic.com/**/cast_sender.js*', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: 'window.castMock.ready();',
    }),
  );
  await page.route('https://media.example/**', (route) => route.abort());
  await page.goto('/?log');
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const path = '/tests/fixtures/cast-state.ts';
        return (await import(path)).isDBLoaded.value;
      }),
    )
    .toBe(true);
  await page.evaluate(async () => {
    const path = '/tests/fixtures/cast-state.ts';
    const { followedPodcasts, recentlyVisitedPodcasts } = await import(path);
    const podcast = {
      id: 'a',
      title: 'Cast progress',
      description: '',
      imageUrl: '',
      url: 'https://media.example/feed',
      feedUrl: 'https://media.example/feed',
      addedDate: 0,
      lastFetched: Date.now(),
      episodes: ['a', 'b'].map((title) => ({
        title,
        description: '',
        pubDate: new Date(),
        duration: '10:00',
        audio: `https://media.example/${title}.mp3`,
        mimeType: 'audio/mpeg',
        currentTime: 42,
      })),
    };
    followedPodcasts.value = [podcast];
    recentlyVisitedPodcasts.value = [podcast];
  });
  await select(page, 'a');
});

async function savedProgress(page: Page) {
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

test('initial connection allows a waking TV up to 60 seconds', async ({ page }) => {
  await page.clock.install();
  await page.evaluate(() => {
    window.castMock.deferRequest = true;
  });
  await enable(page);
  expect(await page.evaluate(() => window.castMock.requestTimeout)).toBe(60000);
  await page.getByTitle('Start casting', { exact: true }).click();
  await page.clock.runFor(55000);
  await expect(page.getByRole('status')).toHaveText('Connecting to Cast…');
  await page.evaluate(() => window.castMock.requestDone());
  await expect.poll(async () => (await state(page)).loads.length).toBe(1);
  await page.clock.runFor(10000);
  await expect(page.getByTitle('Stop casting', { exact: true })).toBeVisible();
  await expect(page.getByRole('status')).toHaveCount(0);
});

test('a 60-second connection timeout unlocks retry and ignores an obsolete request', async ({ page }) => {
  await page.clock.install();
  await page.evaluate(() => {
    window.castMock.deferRequest = true;
  });
  await enable(page);
  await page.getByTitle('Start casting', { exact: true }).click();
  await page.clock.runFor(61000);
  await expect(page.getByRole('status')).toHaveText('Cast connection timed out. Tap the Cast icon to try again.');
  await page.evaluate(() => window.castMock.requestCompletions[0]());
  expect((await state(page)).sessionListeners).toBe(0);
  await page.getByTitle('Start casting', { exact: true }).click();
  expect((await state(page)).requests).toBe(2);
  await page.evaluate(() => window.castMock.requestCompletions[0]());
  expect((await state(page)).loads).toEqual([]);
  await page.evaluate(() => window.castMock.requestCompletions[1]());
  await expect.poll(async () => (await state(page)).loads.length).toBe(1);
  await expect(page.getByTitle('Stop casting', { exact: true })).toBeVisible();
});

test('receiver readiness uses the remaining connection deadline and can be retried', async ({ page }) => {
  await page.clock.install();
  await page.evaluate(() => {
    window.castMock.deferRequest = true;
    window.castMock.session.namespaces = [];
  });
  await enable(page);
  await page.getByTitle('Start casting', { exact: true }).click();
  await page.clock.runFor(45000);
  await page.evaluate(() => window.castMock.requestDone());
  await expect(page.getByRole('status')).toHaveText('Waiting for Cast to be ready…');
  await page.clock.runFor(10000);
  await expect(page.getByTitle('Stop casting', { exact: true })).toBeVisible();
  await page.clock.runFor(6000);
  await expect(page.getByRole('status')).toHaveText('Cast connection timed out. Tap the Cast icon to try again.');
  expect((await state(page)).sessionListeners).toBe(0);
  await page.evaluate(() => {
    window.castMock.deferRequest = false;
    window.castMock.session.namespaces = [{ name: 'urn:x-cast:com.google.cast.media' }];
    window.castMock.session.emit();
  });
  await page.getByTitle('Start casting', { exact: true }).click();
  await expect.poll(async () => (await state(page)).loads.length).toBe(1);
});

test('disabling Cast cancels the initial connection timeout', async ({ page }) => {
  await page.clock.install();
  await page.evaluate(() => {
    window.castMock.deferRequest = true;
  });
  await enable(page);
  await page.getByTitle('Start casting', { exact: true }).click();
  await enable(page, false);
  await page.clock.runFor(61000);
  await page.evaluate(() => window.castMock.requestDone());
  await expect(page.getByRole('status')).toHaveCount(0);
  expect((await state(page)).sessionListeners).toBe(0);
});

test('cold connection waits for the receiver media channel before loading the selected source', async ({ page }) => {
  await page.evaluate(() => {
    window.castMock.session.namespaces = [];
  });
  await enable(page);
  await page.getByTitle('Start casting', { exact: true }).click();
  await expect(page.getByTitle('Stop casting', { exact: true })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Waiting for Cast to be ready…');
  expect((await state(page)).loads).toEqual([]);
  await page.evaluate(() => {
    window.castMock.session.namespaces = [{ name: 'urn:x-cast:com.google.cast.media' }];
    window.castMock.session.emit();
  });
  await expect.poll(async () => (await state(page)).loads).toEqual(['https://media.example/a.mp3']);
  expect(await page.evaluate(() => window.castMock.session.media[0].playerState)).toBe('PLAYING');
});

test('a local play rejection during Cast handoff cannot pause the receiver', async ({ page }) => {
  await page.evaluate(() => {
    window.castMock.deferLocalPlay = true;
  });
  await select(page, 'radio', 'radio');
  await expect.poll(() => page.evaluate(() => window.castMock.localPlayRejections.length)).toBeGreaterThan(0);
  await start(page);
  await page.evaluate(() => {
    window.castMock.localPlayRejections.forEach((reject) =>
      reject(new DOMException('Interrupted by pause()', 'AbortError')),
    );
  });
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => window.castMock.session.media[0].pauses)).toBe(0);
  expect(await page.evaluate(() => window.castMock.session.media[0].playerState)).toBe('PLAYING');
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
});

for (const receiverState of ['IDLE', 'BUFFERING']) {
  test(`a successful LOAD callback still retries when initial media stays ${receiverState}`, async ({ page }) => {
    await page.clock.install();
    await page.evaluate(() => {
      window.castMock.session.defer = true;
    });
    await start(page);
    await page.evaluate((state) => {
      const session = window.castMock.session;
      session.loadedMedia[0].playerState = state;
      session.pending[0]();
      session.defer = false;
    }, receiverState);
    await expect(page.getByRole('status')).toBeVisible();
    await page.clock.runFor(10500);
    await expect.poll(async () => (await state(page)).loads.length).toBe(2);
    expect(await page.evaluate(() => window.castMock.session.media[0].playerState)).toBe('PLAYING');
    await expect(page.getByRole('status')).toHaveCount(0);
  });
}

test('stopping Cast cancels a scheduled startup retry', async ({ page }) => {
  await page.clock.install();
  await page.evaluate(() => {
    window.castMock.session.defer = true;
  });
  await start(page);
  await page.evaluate(() => window.castMock.session.failures[0]());
  await page.getByTitle('Stop casting', { exact: true }).click();
  await expect(page.getByTitle('Start casting', { exact: true })).toBeVisible();
  await page.clock.runFor(15000);
  expect((await state(page)).loads).toHaveLength(1);
});

for (const playType of ['radio', 'podcast']) {
  test(`stalled initial ${playType} load retries the same source and ignores the obsolete load callback`, async ({
    page,
  }) => {
    await select(page, 'a', playType);
    await page.clock.install();
    await page.evaluate(() => {
      window.castMock.session.defer = true;
    });
    await start(page);
    await page.evaluate(() => {
      window.castMock.session.defer = false;
    });
    await page.clock.runFor(10500);
    await expect
      .poll(async () => (await state(page)).loads)
      .toEqual(['https://media.example/a.mp3', 'https://media.example/a.mp3']);
    expect(await page.evaluate(() => window.castMock.session.media[0].playerState)).toBe('PLAYING');
    expect(await page.evaluate(() => window.castMock.session.loads[1].autoplay)).toBe(true);
    if (playType === 'podcast')
      expect(await page.evaluate(() => window.castMock.session.loads[1].currentTime)).toBe(42);
    await page.evaluate(() => window.castMock.session.pending[0]());
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    expect(await page.evaluate(() => window.castMock.session.loadedMedia.map((m) => m.pauses))).toEqual([0, 1]);
    await page.clock.runFor(15000);
    expect((await state(page)).loads).toHaveLength(2);
  });
}

test('a first load timeout retries without changing stations', async ({ page }) => {
  await page.clock.install();
  await page.evaluate(() => {
    window.castMock.session.defer = true;
  });
  await start(page);
  await page.evaluate(() => {
    window.castMock.session.defer = false;
    window.castMock.session.failures[0]();
  });
  await page.clock.runFor(1500);
  await expect.poll(async () => (await state(page)).loads.length).toBe(2);
  expect(await page.evaluate(() => window.castMock.session.media[0].playerState)).toBe('PLAYING');
});

test('startup retries are bounded and Play retries the same source after failure', async ({ page }) => {
  await page.clock.install();
  await page.evaluate(() => {
    window.castMock.session.defer = true;
  });
  await start(page);
  await page.clock.runFor(25000);
  expect((await state(page)).loads).toHaveLength(2);
  await expect(page.getByRole('status')).toHaveText('Could not start Cast audio. Press Play to retry.');
  await page.evaluate(() => {
    window.castMock.session.defer = false;
  });
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect.poll(async () => (await state(page)).loads.length).toBe(3);
  expect(await page.evaluate(() => window.castMock.session.media[0].playerState)).toBe('PLAYING');
});

test('initial radio load retains pause taps until the receiver is ready', async ({ page }) => {
  await select(page, 'radio', 'radio');
  await page.evaluate(() => {
    window.castMock.session.defer = true;
  });
  await start(page);
  await expect(page.getByRole('status')).toHaveText('Loading on Cast…');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
  await page.evaluate(() => {
    window.castMock.session.pending[0]();
  });
  await expect.poll(() => page.evaluate(() => window.castMock.session.media[0].pauses)).toBe(1);
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.castMock.session.media[0].plays)).toBe(1);
  expect((await state(page)).loads).toHaveLength(1);
});

test('reconnecting to the same radio reloads stopped media and controls work on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await select(page, 'radio', 'radio');
  await start(page);
  await page.getByTitle('Stop casting', { exact: true }).click();
  await expect(page.getByTitle('Start casting', { exact: true })).toBeVisible();
  await page.getByTitle('Start casting', { exact: true }).click();
  await expect.poll(async () => (await state(page)).loads.length).toBe(2);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
  await page.evaluate(async () => {
    const path = '/tests/fixtures/cast-state.ts';
    (await import(path)).isPlayerMaximized.value = true;
  });
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.castMock.session.loadedMedia.map((m) => [m.plays, m.pauses])))
    .toEqual([
      [0, 0],
      [1, 2],
    ]);
  expect((await state(page)).mediaListeners).toEqual([0, 1]);
});

test('pause requested while initial radio is buffering is applied when playback starts', async ({ page }) => {
  await select(page, 'radio', 'radio');
  await page.evaluate(() => {
    window.castMock.session.defer = true;
  });
  await start(page);
  await page.evaluate(() => {
    window.castMock.session.loadedMedia[0].playerState = 'BUFFERING';
    window.castMock.session.pending[0]();
  });
  await expect(page.getByRole('status')).toHaveText('Buffering on Cast…');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
  await page.evaluate(() => {
    const media = window.castMock.session.media[0];
    media.playerState = 'PLAYING';
    media.emit();
  });
  await expect.poll(() => page.evaluate(() => window.castMock.session.media[0].pauses)).toBe(1);
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
});

test('late media discovery after a source change or disconnect cannot restore old controls', async ({ page }) => {
  await select(page, 'radio', 'radio');
  await page.evaluate(() => {
    window.castMock.session.defer = true;
  });
  await start(page);
  await select(page, 'other-radio', 'radio');
  await expect.poll(async () => (await state(page)).loads.length).toBe(2);
  await page.evaluate(() => {
    const session = window.castMock.session;
    session.media = [session.loadedMedia[0]];
    session.failures[0]();
  });
  await page.waitForTimeout(650);
  expect((await state(page)).mediaListeners).toEqual([0, 0]);
  await page.getByTitle('Stop casting', { exact: true }).click();
  await page.evaluate(() => window.castMock.session.pending[1]());
  await page.waitForTimeout(650);
  expect((await state(page)).mediaListeners).toEqual([0, 0]);
  await expect(page.getByRole('status')).toHaveCount(0);
});

test('initial radio load recovers controls when receiver media arrives after a load timeout', async ({ page }) => {
  await select(page, 'radio', 'radio');
  await page.evaluate(() => {
    window.castMock.session.defer = true;
  });
  await start(page);
  await page.evaluate(() => {
    const session = window.castMock.session;
    session.failures[0]();
    // Own loads do not trigger the SDK's listener for media from other senders.
    session.media = [session.loadedMedia[0]];
  });
  await expect.poll(async () => (await state(page)).mediaListeners).toEqual([1]);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.castMock.session.media[0].pauses)).toBe(1);
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.castMock.session.media[0].plays)).toBe(1);
  expect((await state(page)).loads).toHaveLength(1);
});

function episodeProgress(position: number, title = 'a') {
  const podcasts = expect.arrayContaining([
    expect.objectContaining({
      id: 'a',
      episodes: expect.arrayContaining([expect.objectContaining({ title, currentTime: position })]),
    }),
  ]);
  return { followed: podcasts, recent: podcasts };
}

test('Cast checkpoints persist receiver progress and reload resumes locally', async ({ page }) => {
  await start(page);
  await page.evaluate(() => {
    window.castMock.session.media[0].position = 300;
  });
  await expect
    .poll(() => savedProgress(page), { timeout: 8000 })
    .toMatchObject({
      ...episodeProgress(300),
      player: { currentTime: 300 },
    });
  await page.evaluate(() => {
    window.castMock.session.media[0].position = 301;
  });
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const path = '/tests/fixtures/cast-state.ts';
        return (await import(path)).currentTime.value;
      }),
    )
    .toBe(301);
  expect(await savedProgress(page)).toMatchObject({ player: { currentTime: 300 } });
  expect((await state(page)).loads).toHaveLength(1);
  await page.reload();
  await expect.poll(() => page.locator('audio').evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBe(301);
  await expect.poll(() => savedProgress(page)).toMatchObject(episodeProgress(301));
});

for (const action of ['stop', 'disconnect', 'disable', 'close', 'unmount', 'detach']) {
  test(`${action} snapshots Cast progress before releasing the media`, async ({ page }) => {
    await start(page);
    await page.evaluate(() => {
      window.castMock.session.media[0].position = 300;
    });
    if (action === 'stop') await page.getByTitle('Stop casting', { exact: true }).click();
    if (action === 'disconnect') await page.evaluate(() => window.castMock.session.emit(false));
    if (action === 'disable') await enable(page, false);
    if (action === 'close') await page.getByRole('button', { name: 'Close player', exact: true }).click();
    if (action === 'unmount')
      await page.evaluate(async () => {
        const path = '/tests/fixtures/cast-state.ts';
        (await import(path)).unmountApp();
      });
    if (action === 'detach') await page.evaluate(() => window.castMock.session.media[0].emit(false));
    await expect
      .poll(() => savedProgress(page))
      .toMatchObject({
        ...episodeProgress(300),
        player: action === 'close' ? null : { currentTime: 300 },
      });
    if (['stop', 'disconnect', 'disable'].includes(action)) {
      await expect.poll(() => page.locator('audio').evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBe(300);
      await page.reload();
      await expect.poll(() => page.locator('audio').evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBe(300);
    }
  });
}

for (const event of ['visibilitychange', 'pagehide', 'beforeunload']) {
  test(`${event} saves Cast progress between checkpoints`, async ({ page }) => {
    await start(page);
    await page.evaluate((event) => {
      window.castMock.session.media[0].position = 300;
      if (event === 'visibilitychange') {
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
        document.dispatchEvent(new Event(event));
      } else window.dispatchEvent(new Event(event));
    }, event);
    await expect
      .poll(() => savedProgress(page))
      .toMatchObject({
        ...episodeProgress(300),
        player: { currentTime: 300 },
      });
  });
}

test('switching episodes checkpoints only the outgoing source and ignores its late updates', async ({ page }) => {
  await start(page);
  await page.evaluate(async () => {
    window.castMock.session.media[0].position = 300;
    const path = '/tests/fixtures/cast-state.ts';
    const { playerState } = await import(path);
    playerState.value = {
      ...playerState.value,
      title: 'b',
      currentTime: 42,
      streams: [{ url: 'https://media.example/b.mp3', mimetype: 'audio/mpeg' }],
    };
  });
  await expect.poll(async () => (await state(page)).loads.length).toBe(2);
  await expect
    .poll(() => savedProgress(page))
    .toMatchObject({
      ...episodeProgress(300),
      player: { title: 'b', currentTime: 42 },
    });
  await page.evaluate(async () => {
    const old = window.castMock.session.loadedMedia[0];
    old.position = 599;
    old.removed.forEach((listener) => listener(true));
    window.castMock.session.media[0].position = 75;
    const path = '/tests/fixtures/cast-state.ts';
    await (await import(path)).saveStateToDB();
  });
  expect(await savedProgress(page)).toMatchObject({ ...episodeProgress(300), player: { currentTime: 75 } });
  expect(await savedProgress(page)).toMatchObject(episodeProgress(75, 'b'));
  await select(page, 'radio', 'radio');
  await expect.poll(async () => (await state(page)).loads.length).toBe(3);
  await page.evaluate(async () => {
    window.castMock.session.media[0].position = 999;
    const path = '/tests/fixtures/cast-state.ts';
    await (await import(path)).saveStateToDB();
  });
  expect(await savedProgress(page)).toMatchObject({ ...episodeProgress(75, 'b'), player: { currentTime: 42 } });
});

test('receiver pause and seeks save immediately, including zero on return to local playback', async ({ page }) => {
  await start(page);
  await page.evaluate(() => {
    const media = window.castMock.session.media[0];
    media.position = 300;
    media.playerState = 'PAUSED';
    media.emit();
  });
  await expect
    .poll(() => savedProgress(page))
    .toMatchObject({
      ...episodeProgress(300),
      player: { currentTime: 300, isPlaying: false },
    });
  await page.evaluate(() => window.castMock.mediaActions.get('seekto')?.({ action: 'seekto', seekTime: 0 }));
  await expect.poll(() => savedProgress(page)).toMatchObject({ ...episodeProgress(0), player: { currentTime: 0 } });
  await page.getByTitle('Stop casting', { exact: true }).click();
  await expect.poll(() => page.locator('audio').evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBe(0);
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
});

test('invalid receiver positions do not overwrite a checkpoint', async ({ page }) => {
  await start(page);
  await page.evaluate(async () => {
    const path = '/tests/fixtures/cast-state.ts';
    const { saveStateToDB } = await import(path);
    const media = window.castMock.session.media[0];
    media.position = 300;
    await saveStateToDB();
    for (const position of [NaN, Infinity, -1]) {
      media.position = position;
      await saveStateToDB();
    }
    media.position = 0;
    media.playerState = 'IDLE';
  });
  await page.getByTitle('Stop casting', { exact: true }).click();
  await expect.poll(() => savedProgress(page)).toMatchObject({ ...episodeProgress(300), player: { currentTime: 300 } });
});

test('play/pause, progress and metadata retain the SDK and session; each new source loads once', async ({ page }) => {
  await start(page);
  await page.evaluate(() => {
    Object.assign(window, { originalCastScript: document.querySelector('script[src*="cast_sender.js"]') });
  });
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.evaluate(async () => {
    const path = '/tests/fixtures/cast-state.ts';
    const { playerState } = await import(path);
    playerState.value = { ...playerState.value, currentTime: 89, title: 'Updated metadata' };
  });
  await page.waitForTimeout(150);
  expect(await state(page)).toEqual({
    init: 1,
    requests: 1,
    loads: ['https://media.example/a.mp3'],
    sessionListeners: 1,
    mediaListeners: [1],
  });
  expect(
    await page.evaluate(
      () => document.querySelector('script[src*="cast_sender.js"]') === Reflect.get(window, 'originalCastScript'),
    ),
  ).toBe(true);
  await select(page, 'b');
  await expect.poll(async () => (await state(page)).loads.length).toBe(2);
  await select(page, 'radio', 'radio');
  await expect.poll(async () => (await state(page)).loads.length).toBe(3);
  await page.waitForTimeout(150);
  expect(await state(page)).toMatchObject({ init: 1, requests: 1, sessionListeners: 1, mediaListeners: [0, 0, 1] });
  expect(
    await page.evaluate(() =>
      window.castMock.session.loads.map((r) => ({ time: r.currentTime, autoplay: r.autoplay })),
    ),
  ).toEqual([
    { time: 42, autoplay: true },
    { time: 42, autoplay: true },
    { time: undefined, autoplay: true },
  ]);
});

test('late load callbacks cannot replace the current media or revive a disabled session', async ({ page }) => {
  await page.evaluate(() => {
    window.castMock.session.defer = true;
  });
  await start(page);
  await select(page, 'b');
  await expect.poll(async () => (await state(page)).loads.length).toBe(2);
  await page.evaluate(() => {
    const pending = window.castMock.session.pending;
    pending[1]();
    pending[0]();
  });
  await expect.poll(async () => (await state(page)).mediaListeners).toEqual([0, 1]);
  await page.getByTitle('Forward 30 seconds').click();
  expect(await page.evaluate(() => window.castMock.session.loadedMedia.map((m) => m.seeks))).toEqual([[], [72]]);
  await select(page, 'c');
  await expect.poll(async () => (await state(page)).loads.length).toBe(3);
  await enable(page, false);
  await page.evaluate(() => {
    window.castMock.session.pending[2]();
    window.castMock.onSession(window.castMock.session);
  });
  expect(await state(page)).toMatchObject({ sessionListeners: 0, mediaListeners: [0, 0, 0] });
});

test('remote progress and relative, slider and media-session seeks use receiver time', async ({ page }) => {
  await start(page);
  await page.evaluate(() => {
    window.castMock.session.media[0].position = 123;
  });
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const path = '/tests/fixtures/cast-state.ts';
        return (await import(path)).currentTime.value;
      }),
    )
    .toBe(123);
  await page.getByTitle('Forward 30 seconds').click();
  await page.getByTitle('Rewind 10 seconds').click();
  expect(await page.evaluate(() => window.castMock.session.media[0].seeks)).toEqual([153, 143]);
  await page.evaluate(async () => {
    const path = '/tests/fixtures/cast-state.ts';
    (await import(path)).isPlayerMaximized.value = true;
  });
  await expect(page.locator('input[type="range"]')).toHaveValue('143');
  await page.locator('input[type="range"]').fill('250');
  await page.locator('input[type="range"]').dispatchEvent('change');
  await expect.poll(() => page.evaluate(() => window.castMock.session.media[0].seeks)).toEqual([153, 143, 250]);
  await page.evaluate(() => window.castMock.mediaActions.get('seekto')?.({ action: 'seekto', seekTime: 75 }));
  await expect.poll(() => page.evaluate(() => window.castMock.session.media[0].seeks)).toEqual([153, 143, 250, 75]);
  expect(await page.locator('audio').evaluate((a: HTMLAudioElement) => a.currentTime)).toBe(42);
  expect((await state(page)).loads).toHaveLength(1);
});

test('buffering preserves playback intent and receiver pause updates the player', async ({ page }) => {
  await start(page);
  await page.evaluate(() => {
    const m = window.castMock.session.media[0];
    m.playerState = 'BUFFERING';
    m.emit();
  });
  await page.waitForTimeout(150);
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await page.evaluate(() => {
    const m = window.castMock.session.media[0];
    m.playerState = 'PAUSED';
    m.emit();
  });
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
  expect(await state(page)).toMatchObject({ init: 1, requests: 1, sessionListeners: 1, mediaListeners: [1] });
});

for (const action of ['stop', 'disconnect', 'disable', 'close', 'unmount']) {
  test(`${action} removes exactly the registered listeners`, async ({ page }) => {
    await start(page);
    if (action === 'stop') await page.getByTitle('Stop casting', { exact: true }).click();
    if (action === 'disconnect')
      await page.evaluate(() => {
        window.castMock.session.status = 'disconnected';
        window.castMock.session.emit(true);
      });
    if (action === 'disable') await enable(page, false);
    if (action === 'close') await page.getByRole('button', { name: 'Close player', exact: true }).click();
    if (action === 'unmount')
      await page.evaluate(async () => {
        const path = '/tests/fixtures/cast-state.ts';
        (await import(path)).unmountApp();
      });
    await expect.poll(async () => (await state(page)).sessionListeners).toBe(0);
    expect((await state(page)).mediaListeners).toEqual([0]);
    expect(await page.evaluate(() => window.castMock.session.mediaListeners.size)).toBe(0);
  });
}

test('failed stop keeps the session usable until a successful stop', async ({ page }) => {
  await start(page);
  await page.evaluate(() => {
    window.castMock.session.failStop = true;
  });
  await page.getByTitle('Stop casting', { exact: true }).click();
  await expect(page.getByTitle('Stop casting', { exact: true })).toBeVisible();
  expect((await state(page)).sessionListeners).toBe(1);
  await page.evaluate(() => {
    window.castMock.session.failStop = false;
  });
  await page.getByTitle('Stop casting', { exact: true }).click();
  await expect.poll(async () => (await state(page)).sessionListeners).toBe(0);
});

test('already available SDK initializes once and late initialization/request callbacks are ignored', async ({
  page,
}) => {
  await page.evaluate(() => {
    window.castMock.ready();
    window.castMock.deferInitialize = true;
  });
  await enable(page);
  await expect.poll(async () => (await state(page)).init).toBe(1);
  await enable(page, false);
  await page.evaluate(() => window.castMock.initializeDone());
  await expect(page.getByTitle('Start casting', { exact: true })).toHaveCount(0);
  await page.evaluate(() => {
    window.castMock.deferInitialize = false;
    window.castMock.deferRequest = true;
  });
  await enable(page);
  await page.getByTitle('Start casting', { exact: true }).click();
  await page.getByTitle('Start casting', { exact: true }).click();
  expect((await state(page)).requests).toBe(1);
  await enable(page, false);
  await page.evaluate(() => window.castMock.requestDone());
  expect(await state(page)).toMatchObject({ sessionListeners: 0, loads: [] });
});

test('rejoining matching media retains its position without another load', async ({ page }) => {
  await start(page);
  await page.evaluate(() => {
    window.castMock.session.media[0].position = 175;
  });
  await enable(page, false);
  await enable(page);
  await page.evaluate(() => window.castMock.onSession(window.castMock.session));
  await expect(page.getByTitle('Stop casting', { exact: true })).toBeVisible();
  await expect.poll(async () => (await state(page)).mediaListeners).toEqual([1]);
  await page.getByTitle('Forward 30 seconds').click();
  expect(await page.evaluate(() => window.castMock.session.media[0].seeks)).toEqual([205]);
  expect(await state(page)).toMatchObject({ init: 2, requests: 1, loads: ['https://media.example/a.mp3'] });
});

test('a source changed while paused loads once with autoplay disabled', async ({ page }) => {
  await start(page);
  await page.evaluate(async () => {
    const path = '/tests/fixtures/cast-state.ts';
    const { playerState } = await import(path);
    playerState.value = {
      ...playerState.value,
      isPlaying: false,
      streams: [{ url: 'https://media.example/paused.mp3', mimetype: 'audio/mpeg' }],
    };
  });
  await expect.poll(async () => (await state(page)).loads.length).toBe(2);
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.castMock.session.loads[1].autoplay)).toBe(false);
  expect(await page.evaluate(() => window.castMock.session.media[0].plays)).toBe(0);
});
