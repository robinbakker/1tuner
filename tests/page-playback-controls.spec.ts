import { expect, Page, test } from '@playwright/test';

const playlistUrl = '/playlist/Controls/?h00=rb-controls-a&h12=rb-controls-b&tz=UTC';

test.use({ timezoneId: 'UTC' });

test.beforeEach(async ({ page }) => {
  // Stay clear of schedule boundaries while exercising the page controls.
  await page.clock.setFixedTime(new Date('2026-09-16T10:30:00Z'));
  await page.addInitScript(() => {
    Object.defineProperties(HTMLMediaElement.prototype, {
      play: { value: () => Promise.resolve() },
      pause: { value() {} },
      load: { value() {} },
    });
  });
  await page.route('https://media.example/**', (route) => route.abort());
  await page.goto('/');
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const path = '/tests/fixtures/playlist-state.ts';
        return (await import(path)).isDBLoaded.value;
      }),
    )
    .toBe(true);
  await page.evaluate(async (url) => {
    const path = '/tests/fixtures/playlist-state.ts';
    const { playlists, radioBrowserStations } = await import(path);
    radioBrowserStations.value = ['a', 'b'].map((id) => ({
      id: `rb-controls-${id}`,
      name: `Controls station ${id}`,
      displayorder: 0,
      logosource: '',
      language: 'en',
      genres: [],
      streams: [{ url: `https://media.example/${id}.mp3`, mimetype: 'audio/mpeg' }],
    }));
    playlists.value = [
      {
        name: 'Controls',
        url,
        items: [
          { time: '00:00', stationID: 'rb-controls-a' },
          { time: '12:00', stationID: 'rb-controls-b' },
        ],
      },
    ];
  }, playlistUrl);
});

async function expectPlayback(page: Page, isPlaying: boolean, contentID: string) {
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const path = '/tests/fixtures/playlist-state.ts';
        const { playerState } = await import(path);
        return { isPlaying: playerState.value?.isPlaying, contentID: playerState.value?.contentID };
      }),
    )
    .toEqual({ isPlaying, contentID });
}

for (const kind of ['station', 'playlist'] as const) {
  test(`${kind} page toggles playback and reflects global player changes`, async ({ page }) => {
    const url = kind === 'station' ? '/radio-station/rb-controls-a' : playlistUrl;
    const contentID = kind === 'station' ? 'rb-controls-a' : playlistUrl;
    // Navigate within the app, retaining the seeded in-memory station and playlist data.
    await page.evaluate((url) => {
      const link = document.createElement('a');
      link.href = url;
      document.body.append(link);
      link.click();
      link.remove();
    }, url);
    const main = page.getByRole('main');
    const globalPlayer = page.locator('div').filter({ has: page.locator(':scope > audio') });

    await main.getByRole('button', { name: 'Play', exact: true }).click();
    await expectPlayback(page, true, contentID);
    await expect(main.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();

    await main.getByRole('button', { name: 'Pause', exact: true }).click();
    await expectPlayback(page, false, contentID);
    await expect(main.getByRole('button', { name: 'Play', exact: true })).toBeVisible();

    await globalPlayer.getByRole('button', { name: 'Play', exact: true }).click();
    await expectPlayback(page, true, contentID);
    await expect(main.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();

    await globalPlayer.getByRole('button', { name: 'Pause', exact: true }).click();
    await expectPlayback(page, false, contentID);
    await expect(main.getByRole('button', { name: 'Play', exact: true })).toBeVisible();

    await main.getByRole('button', { name: 'Play', exact: true }).click();
    await expectPlayback(page, true, contentID);
    await expect(main.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();

    await page.evaluate(async () => {
      const path = '/tests/fixtures/playlist-state.ts';
      (await import(path)).playRadioStationByID('rb-controls-b');
    });
    await expectPlayback(page, true, 'rb-controls-b');
    await expect(main.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
    await main.getByRole('button', { name: 'Play', exact: true }).click();
    await expectPlayback(page, true, contentID);
    await expect(main.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();

    await globalPlayer.getByRole('button', { name: 'Close player', exact: true }).click();
    await expect(page.locator('audio')).toHaveCount(0);
    await expect(main.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
  });
}
