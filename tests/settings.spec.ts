import { expect, Page, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://www.gstatic.com/**/cast_sender.js*', (route) =>
    route.fulfill({ contentType: 'application/javascript', body: '' }),
  );
  await page.goto('/settings?log');
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const path = '/tests/fixtures/settings-state.ts';
        return (await import(path)).isDBLoaded.value;
      }),
    )
    .toBe(true);
});

function toggle(page: Page, label: string) {
  return page
    .locator('div.flex.items-center.gap-2')
    .filter({ has: page.getByText(label, { exact: true }) })
    .locator('label');
}

async function savedSettings(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('1tuner');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise((resolve, reject) => {
        const request = db.transaction('appState').objectStore('appState').get('settingsState');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } finally {
      db.close();
    }
  });
}

test('reconnect controls react immediately and retain the noise preference', async ({ page }) => {
  await toggle(page, 'Mute noise').click();
  await toggle(page, 'Reconnect automatically').click();
  await expect(page.getByText('Mute noise', { exact: true })).toHaveCount(0);
  await expect
    .poll(() => savedSettings(page))
    .toMatchObject({ radioStreamMaxReconnects: 0, disableReconnectNoise: true });

  await toggle(page, 'Reconnect automatically').click();
  await expect(toggle(page, 'Mute noise').locator('input')).toBeChecked();
  await expect
    .poll(() => savedSettings(page))
    .toMatchObject({ radioStreamMaxReconnects: 200, disableReconnectNoise: true });
});

test('all settings notify subscribers with new objects and persist while the page is active', async ({ page }) => {
  await page.locator('label[for="theme-dark"]').click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.locator('label[for="searchProvider-Apple"]').click();
  await toggle(page, 'Mute noise').click();
  await toggle(page, 'Reconnect automatically').click();
  await toggle(page, 'Enable logging').click();
  await toggle(page, 'Enable Google Cast support').click();
  await expect(page.locator('script[src*="cast_sender.js"]')).toHaveCount(1);

  const expected = {
    theme: 'dark',
    podcastSearchProvider: 'Apple',
    disableReconnectNoise: true,
    radioStreamMaxReconnects: 0,
    enableLogging: true,
    enableChromecast: true,
  };
  await expect.poll(() => savedSettings(page)).toEqual(expected);
  const updates = await page.evaluate(async () => {
    const path = '/tests/fixtures/settings-state.ts';
    return (await import(path)).settingsUpdates;
  });
  expect(updates.slice(-7)).toEqual([
    {},
    { theme: 'dark' },
    { theme: 'dark', podcastSearchProvider: 'Apple' },
    { theme: 'dark', podcastSearchProvider: 'Apple', disableReconnectNoise: true },
    { theme: 'dark', podcastSearchProvider: 'Apple', disableReconnectNoise: true, radioStreamMaxReconnects: 0 },
    { ...expected, enableChromecast: undefined },
    expected,
  ]);

  await toggle(page, 'Enable Google Cast support').click();
  await expect(page.locator('script[src*="cast_sender.js"]')).toHaveCount(0);
  await expect.poll(() => savedSettings(page)).toEqual({ ...expected, enableChromecast: false });
  await page.reload();
  await expect(page.locator('input[name="theme"][value="dark"]')).toBeChecked();
  await expect(page.locator('input[name="searchProvider"][value="Apple"]')).toBeChecked();
  await expect(toggle(page, 'Reconnect automatically').locator('input')).not.toBeChecked();
});

test('a mounted radio player uses the changed reconnect limit on its next error', async ({ page }) => {
  await page.evaluate(async () => {
    Object.defineProperties(HTMLMediaElement.prototype, {
      play: { configurable: true, value: () => Promise.resolve() },
      pause: { configurable: true, value() {} },
      load: { configurable: true, value() {} },
    });
    const path = '/tests/fixtures/settings-state.ts';
    const { playerState } = await import(path);
    playerState.value = {
      playType: 'radio',
      isPlaying: true,
      contentID: 'settings-test',
      title: 'Settings test',
      imageUrl: '',
      pageLocation: '/',
      streams: [{ url: 'https://media.example/radio', mimetype: 'audio/mpeg' }],
    };
  });
  await expect(page.locator('audio')).toHaveCount(1);
  await toggle(page, 'Mute noise').click();
  await toggle(page, 'Reconnect automatically').click();
  await expect(page.getByText('Mute noise', { exact: true })).toHaveCount(0);
  // Allow the player's passive effect to replace the audio error listener.
  await page.waitForTimeout(100);
  await page.locator('audio').dispatchEvent('stalled');
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const path = '/tests/fixtures/settings-state.ts';
        return (await import(path)).playerState.value.isPlaying;
      }),
    )
    .toBe(false);
  await expect(page.getByText('Failed to reconnect to the stream', { exact: true })).toBeVisible();
});
