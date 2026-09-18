import { expect, Page, test } from '@playwright/test';

test.use({ timezoneId: 'UTC' });

async function waitForDB(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const path = '/tests/fixtures/station-cache-state.ts';
        return (await import(path)).isDBLoaded.value;
      }),
    )
    .toBe(true);
}

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-09-18T11:59:00Z') });
  await page.addInitScript(() => {
    Object.defineProperties(HTMLMediaElement.prototype, {
      play: { value: () => Promise.resolve() },
      pause: { value() {} },
      load: { value() {} },
    });
  });
  await page.route('https://media.example/**', (route) => route.abort());
  await page.goto('/');
  await waitForDB(page);
});

test('followed and scheduled stations survive eviction, reload, and automatic transitions', async ({ page }) => {
  await page.evaluate(async () => {
    const path = '/tests/fixtures/station-cache-state.ts';
    const s = await import(path);
    for (const id of ['followed', 'morning', 'afternoon']) s.addRadioBrowserStation(s.station(id));
    s.followRadioStation('rb-followed');
    s.playlists.value = [
      {
        name: 'Cache schedule',
        url: '/playlist/Cache%20schedule?h0=rb-morning&h12=rb-afternoon&tz=UTC',
        items: [
          { time: '00:00', stationID: 'rb-morning' },
          { time: '12:00', stationID: 'rb-afternoon' },
        ],
      },
    ];
    s.churn();
    await s.saveStateToDB();
  });

  for (const reload of [false, true]) {
    if (reload) {
      await page.reload();
      await waitForDB(page);
      await page.evaluate(async () => {
        const path = '/tests/fixtures/station-cache-state.ts';
        (await import(path)).churn('after-reload');
      });
    }
    expect(
      await page.evaluate(async () => {
        const path = '/tests/fixtures/station-cache-state.ts';
        const s = await import(path);
        return ['rb-followed', 'rb-morning', 'rb-afternoon'].map((id) => s.getRadioStation(id)?.name);
      }),
    ).toEqual(['Station followed', 'Station morning', 'Station afternoon']);
  }

  await page.goto('/radio-stations');
  await waitForDB(page);
  const followedCard = page.locator('a[href="/radio-station/rb-followed"]').first();
  await expect(followedCard).toBeVisible();
  await followedCard.getByRole('button', { name: 'Play Station followed', exact: true }).click();
  await expect(page.locator('audio source')).toHaveAttribute('src', 'https://media.example/followed.mp3');
  await page.clock.setSystemTime(new Date('2026-09-18T11:59:00Z'));
  await page.evaluate(async () => {
    const path = '/tests/fixtures/station-cache-state.ts';
    const s = await import(path);
    s.playlistUtil.playPlaylistByUrl(s.playlists.value[0].url, true);
  });
  await expect(page.locator('audio source')).toHaveAttribute('src', 'https://media.example/morning.mp3');
  await page.clock.runFor(90000);
  await expect(page.locator('audio source')).toHaveAttribute('src', 'https://media.example/afternoon.mp3');
});

test('more than 100 references stay pinned alongside the latest 100 unreferenced stations', async ({ page }) => {
  expect(
    await page.evaluate(async () => {
      const path = '/tests/fixtures/station-cache-state.ts';
      const s = await import(path);
      for (let i = 0; i < 105; i++) {
        const station = s.station(`followed-${i}`);
        s.addRadioBrowserStation(station);
        s.followRadioStation(station.id);
      }
      s.churn();
      return {
        followed: s.followedRadioStationIDs.value.every((id: string) => !!s.getRadioStation(id)),
        count: s.radioBrowserStations.value.length,
        recent: s.radioBrowserStations.value.slice(0, 100).map((station: { id: string }) => station.id),
        evicted: s.getRadioStation('rb-recent-0') === undefined,
      };
    }),
  ).toEqual({
    followed: true,
    count: 205,
    recent: Array.from({ length: 100 }, (_, i) => `rb-recent-${100 - i}`),
    evicted: true,
  });
});

test('rules and paused radio playback pin metadata until their references are removed', async ({ page }) => {
  expect(
    await page.evaluate(async () => {
      const path = '/tests/fixtures/station-cache-state.ts';
      const s = await import(path);
      for (const id of ['rule', 'playing', 'followed', 'scheduled']) s.addRadioBrowserStation(s.station(id));
      s.playlistRules.value = [{ ruleType: s.PlaylistRuleType.podcastToStation, stationID: 'rb-rule' }];
      s.playRadioStationByID('rb-playing');
      s.playerState.value = { ...s.playerState.value, isPlaying: false };
      s.followRadioStation('rb-followed');
      s.playlists.value = [
        { name: 'Saved', url: '/playlist/Saved', items: [{ time: '00:00', stationID: 'rb-scheduled' }] },
      ];
      s.churn();
      const ids = ['rb-rule', 'rb-playing', 'rb-followed', 'rb-scheduled'];
      const retained = ids.every((id) => !!s.getRadioStation(id));
      s.playlistRules.value = [];
      s.playerState.value = null;
      s.unfollowRadioStation('rb-followed');
      s.playlists.value = [];
      s.addRadioBrowserStation(s.station('new'));
      return {
        retained,
        released: ids.every((id) => !s.getRadioStation(id)),
        count: s.radioBrowserStations.value.length,
      };
    }),
  ).toEqual({ retained: true, released: true, count: 100 });
});

test('refreshing pinned metadata replaces it once and preserves cache order', async ({ page }) => {
  expect(
    await page.evaluate(async () => {
      const path = '/tests/fixtures/station-cache-state.ts';
      const s = await import(path);
      s.addRadioBrowserStation(s.station('followed'));
      s.followRadioStation('rb-followed');
      s.churn();
      s.addRadioBrowserStation({
        ...s.station('followed'),
        name: 'Updated',
        streams: [{ url: 'https://media.example/new.mp3', mimetype: 'audio/mpeg' }],
      });
      s.addRadioBrowserStation({ ...s.station('ignored'), id: 'local-station' });
      return {
        count: s.radioBrowserStations.value.length,
        copies: s.radioBrowserStations.value.filter((station: { id: string }) => station.id === 'rb-followed').length,
        first: s.radioBrowserStations.value[0].name,
        stream: s.getRadioStation('rb-followed').streams[0].url,
        ignored: !s.getRadioStation('local-station'),
      };
    }),
  ).toEqual({ count: 101, copies: 1, first: 'Updated', stream: 'https://media.example/new.mp3', ignored: true });
});

test('the current playlist URL pins its stations even after the saved playlist is removed', async ({ page }) => {
  expect(
    await page.evaluate(async () => {
      const path = '/tests/fixtures/station-cache-state.ts';
      const s = await import(path);
      s.addRadioBrowserStation(s.station('active'));
      s.playlistUtil.playPlaylist(
        {
          name: 'Active',
          url: '/playlist/Active?h0=rb-active&tz=UTC',
          items: [{ time: '00:00', stationID: 'rb-active' }],
        },
        true,
      );
      s.playlists.value = [];
      s.churn();
      return s.getRadioStation('rb-active')?.name;
    }),
  ).toBe('Station active');
});
