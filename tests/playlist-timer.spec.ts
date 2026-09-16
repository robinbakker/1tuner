import { expect, Page, test } from '@playwright/test';

declare global {
  interface Window {
    playlistTimers: { active: Set<number>; created: number; maximum: number };
  }
}

test.use({ timezoneId: 'UTC' });

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-09-16T11:59:10Z') });
  await page.clock.pauseAt(new Date('2026-09-16T11:59:10Z'));
  await page.addInitScript(() => {
    Object.defineProperties(HTMLMediaElement.prototype, {
      play: { value: () => Promise.resolve() },
      pause: { value() {} },
      load: { value() {} },
    });
    const timers = (window.playlistTimers = { active: new Set<number>(), created: 0, maximum: 0 });
    const originalSetInterval = window.setInterval;
    const originalClearInterval = window.clearInterval;
    window.setInterval = (handler, timeout, ...args) => {
      const id = originalSetInterval(handler, timeout, ...args);
      // Exclude Vite's development-server heartbeat, which also runs every 30 seconds.
      if (timeout === 30000 && new Error().stack?.includes('/src/components/player/usePlayer.ts')) {
        timers.active.add(id);
        timers.created++;
        timers.maximum = Math.max(timers.maximum, timers.active.size);
      }
      return id;
    };
    window.clearInterval = (id) => {
      timers.active.delete(id!);
      originalClearInterval(id);
    };
  });
  await page.route('https://media.example/**', (route) => route.abort());
  await page.goto('/');
  await expect
    .poll(async () => {
      await page.clock.runFor(200);
      return page.evaluate(async () => {
        const path = '/tests/fixtures/playlist-state.ts';
        return (await import(path)).isDBLoaded.value;
      });
    })
    .toBe(true);
  // Flush the initial empty player's effects before a playlist is selected.
  await page.clock.runFor(200);
  await page.evaluate(async () => {
    const path = '/tests/fixtures/playlist-state.ts';
    const { playlists, radioBrowserStations } = await import(path);
    radioBrowserStations.value = ['a', 'b', 'c', 'd'].map((id) => ({
      id: `rb-timer-${id}`,
      name: `Station ${id}`,
      displayorder: 0,
      logosource: '',
      language: 'en',
      genres: [],
      streams: [{ url: `https://media.example/${id}.mp3`, mimetype: 'audio/mpeg' }],
    }));
    playlists.value = [
      {
        name: 'First',
        url: '/playlist/First?0000=rb-timer-a&1200=rb-timer-b',
        items: [
          { time: '00:00', stationID: 'rb-timer-a' },
          { time: '12:00', stationID: 'rb-timer-b' },
        ],
      },
      {
        name: 'Second',
        url: '/playlist/Second?0000=rb-timer-c&1200=rb-timer-d',
        items: [
          { time: '00:00', stationID: 'rb-timer-c' },
          { time: '12:00', stationID: 'rb-timer-d' },
        ],
      },
    ];
  });
});

async function startPlaylist(page: Page, index = 0) {
  await page.evaluate(async (index) => {
    const path = '/tests/fixtures/playlist-state.ts';
    const { playlistUtil, playlists } = await import(path);
    playlistUtil.playPlaylistByUrl(playlists.value[index].url, true);
  }, index);
  await page.clock.runFor(200);
}

async function expectTimers(page: Page, active: number, created: number) {
  expect(
    await page.evaluate(() => ({
      active: window.playlistTimers.active.size,
      created: window.playlistTimers.created,
      maximum: window.playlistTimers.maximum,
    })),
  ).toEqual({ active, created, maximum: 1 });
}

async function expectStation(page: Page, id: string) {
  await expect(page.locator('audio source')).toHaveAttribute('src', `https://media.example/${id}.mp3`);
}

test('starting a playlist after empty startup installs one timer and switches stations', async ({ page }) => {
  await startPlaylist(page);
  await expectStation(page, 'a');
  await expectTimers(page, 1, 1);
  await page.clock.runFor(130000);
  await expectStation(page, 'b');
  await expectTimers(page, 1, 1);
});

test('changing playlists replaces the timer and pause updates do not recreate it', async ({ page }) => {
  await startPlaylist(page);
  await startPlaylist(page, 1);
  await expectStation(page, 'c');
  await expectTimers(page, 1, 2);
  await page.evaluate(async () => {
    const path = '/tests/fixtures/playlist-state.ts';
    const { playerState } = await import(path);
    playerState.value = { ...playerState.value, isPlaying: false };
  });
  await page.clock.runFor(130000);
  await expectStation(page, 'd');
  await expectTimers(page, 1, 2);
  expect(
    await page.evaluate(async () => {
      const path = '/tests/fixtures/playlist-state.ts';
      return (await import(path)).playerState.value.isPlaying;
    }),
  ).toBe(false);
});

for (const stop of ['close', 'radio'] as const) {
  test(`${stop} removes the playlist timer and a later start installs one timer`, async ({ page }) => {
    await startPlaylist(page);
    await page.evaluate(async (stop) => {
      const path = '/tests/fixtures/playlist-state.ts';
      const { playerState, playRadioStationByID } = await import(path);
      if (stop === 'close') playerState.value = null;
      else playRadioStationByID('rb-timer-c');
    }, stop);
    await page.clock.runFor(130000);
    await expectTimers(page, 0, 1);
    if (stop === 'radio') await expectStation(page, 'c');
    else await expect(page.locator('audio')).toHaveCount(0);
    await startPlaylist(page);
    await expectStation(page, 'b');
    await expectTimers(page, 1, 2);
  });
}

test('restoring a saved playlist installs one timer and switches stations', async ({ page }) => {
  await startPlaylist(page);
  await page.evaluate(async () => {
    const path = '/tests/fixtures/playlist-state.ts';
    await (await import(path)).saveStateToDB();
  });
  await page.reload();
  await expect
    .poll(async () => {
      await page.clock.runFor(200);
      return page.evaluate(async () => {
        const path = '/tests/fixtures/playlist-state.ts';
        return (await import(path)).isDBLoaded.value;
      });
    })
    .toBe(true);
  await expectStation(page, 'a');
  await page.clock.runFor(200);
  await expectTimers(page, 1, 1);
  await page.clock.runFor(130000);
  await expectStation(page, 'b');
  await expectTimers(page, 1, 1);
});
