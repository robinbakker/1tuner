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
  await select(page, 'a');
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
