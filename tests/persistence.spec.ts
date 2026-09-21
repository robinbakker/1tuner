import { expect, Page, test } from '@playwright/test';

async function ready(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const path = '/tests/fixtures/persistence-state.ts';
        return (await import(path)).isDBLoaded.value;
      }),
    )
    .toBe(true);
}

async function saved(page: Page, key: string) {
  return page.evaluate(async (key) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('1tuner');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise((resolve, reject) => {
        const request = db.transaction('appState').objectStore('appState').get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } finally {
      db.close();
    }
  }, key);
}

test('stale tabs merge independent follows and settings even without notifications', async ({ page, context }) => {
  await context.addInitScript(() => {
    Object.defineProperty(window, 'BroadcastChannel', { value: undefined });
  });
  const older = await context.newPage();
  await Promise.all([page.goto('/settings'), older.goto('/settings')]);
  await Promise.all([ready(page), ready(older)]);
  await Promise.all(
    [page, older].map((tab, i) =>
      tab.evaluate(async (i) => {
        const path = '/tests/fixtures/persistence-state.ts';
        const s = await import(path);
        s.followRadioStation(`rb-${i}`);
        s.followPodcast({
          id: `podcast-${i}`,
          title: `Podcast ${i}`,
          feedUrl: `https://feeds.example/${i}`,
          url: `https://feeds.example/${i}`,
          description: '',
          imageUrl: '',
          addedDate: 1,
          lastFetched: 1,
        });
        s.settingsState.value = i === 0 ? { theme: 'dark' } : { enableChromecast: true };
        await s.saveStateToDB();
      }, i),
    ),
  );
  expect(((await saved(page, 'followedRadioStationIDs')) as string[]).sort()).toEqual(['rb-0', 'rb-1']);
  expect(((await saved(page, 'followedPodcasts')) as { id: string }[]).map((p) => p.id).sort()).toEqual([
    'podcast-0',
    'podcast-1',
  ]);
  expect(await saved(page, 'settingsState')).toEqual({ theme: 'dark', enableChromecast: true });
  // An unchanged, older snapshot cannot roll back a newer save during pagehide or close.
  await older.evaluate(async () => {
    window.dispatchEvent(new Event('pagehide'));
    const path = '/tests/fixtures/persistence-state.ts';
    await (await import(path)).saveStateToDB();
  });
  await older.close();
  await page.reload();
  await ready(page);
  expect(((await saved(page, 'followedRadioStationIDs')) as string[]).sort()).toEqual(['rb-0', 'rb-1']);
  expect(await saved(page, 'settingsState')).toEqual({ theme: 'dark', enableChromecast: true });
});

test('stale playlist edits preserve other edits and deletions', async ({ page, context }) => {
  await context.addInitScript(() => {
    Object.defineProperty(window, 'BroadcastChannel', { value: undefined });
  });
  await page.goto('/settings');
  await ready(page);
  await page.evaluate(async () => {
    const path = '/tests/fixtures/persistence-state.ts';
    const s = await import(path);
    s.playlists.value = ['a', 'b', 'c'].map((id) => ({
      name: id,
      url: `https://1tuner.com/playlist/${id}`,
      items: [],
    }));
    s.followRadioStation('rb-remove');
    await s.saveStateToDB();
  });
  const older = await context.newPage();
  await older.goto('/settings');
  await ready(older);
  await page.evaluate(async () => {
    const path = '/tests/fixtures/persistence-state.ts';
    const s = await import(path);
    s.playlists.value = s.playlists.value
      .filter((p: { name: string }) => p.name !== 'c')
      .map((p: { name: string }) => (p.name === 'a' ? { ...p, name: 'Edited A' } : p));
    s.unfollowRadioStation('rb-remove');
    await s.saveStateToDB();
  });
  await older.evaluate(async () => {
    const path = '/tests/fixtures/persistence-state.ts';
    const s = await import(path);
    s.playlists.value = s.playlists.value.map((p: { name: string }) =>
      p.name === 'b' ? { ...p, name: 'Edited B' } : p,
    );
    s.followRadioStation('rb-keep');
    await s.saveStateToDB();
    window.dispatchEvent(new Event('pagehide'));
    await s.saveStateToDB();
  });
  expect(await saved(page, 'playlists')).toMatchObject([{ name: 'Edited A' }, { name: 'Edited B' }]);
  expect(await saved(page, 'followedRadioStationIDs')).toEqual(['rb-keep']);
  await older.close();
});

test('notifications update other tabs without echo writes or changing their player', async ({ page, context }) => {
  const other = await context.newPage();
  await Promise.all([page.goto('/settings'), other.goto('/settings')]);
  await Promise.all([ready(page), ready(other)]);
  await other.evaluate(async () => {
    const path = '/tests/fixtures/persistence-state.ts';
    (await import(path)).countWrites();
  });
  await page.evaluate(async () => {
    const path = '/tests/fixtures/persistence-state.ts';
    const s = await import(path);
    s.followRadioStation('rb-shared');
    s.playerState.value = {
      playType: 'radio',
      isPlaying: false,
      contentID: 'rb-shared',
      title: 'Shared',
      imageUrl: '',
      streams: [],
      pageLocation: '/radio-station/rb-shared',
    };
    await s.saveStateToDB();
  });
  await expect
    .poll(() =>
      other.evaluate(async () => {
        const path = '/tests/fixtures/persistence-state.ts';
        const s = await import(path);
        return s.followedRadioStationIDs.value;
      }),
    )
    .toEqual(['rb-shared']);
  expect(
    await other.evaluate(async () => {
      const path = '/tests/fixtures/persistence-state.ts';
      const s = await import(path);
      await s.saveStateToDB();
      return { writes: s.writeCount, player: s.playerState.value };
    }),
  ).toEqual({ writes: 0, player: null });
  expect(await saved(page, 'playerState')).toMatchObject({ contentID: 'rb-shared' });
});

test('an unrelated save and closing an idle stale tab never rewrite its old collections', async ({ page, context }) => {
  await context.addInitScript(() => {
    Object.defineProperty(window, 'BroadcastChannel', { value: undefined });
  });
  const older = await context.newPage();
  await Promise.all([page.goto('/settings'), older.goto('/settings')]);
  await Promise.all([ready(page), ready(older)]);
  await page.evaluate(async () => {
    const path = '/tests/fixtures/persistence-state.ts';
    const s = await import(path);
    s.followRadioStation('bbcradio2');
    await s.saveStateToDB();
  });
  expect(
    await older.evaluate(async () => {
      const path = '/tests/fixtures/persistence-state.ts';
      const s = await import(path);
      const stale = s.followedRadioStationIDs.value;
      const writes: IDBValidKey[] = [];
      const original = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function (value, key) {
        if (this.name === 'appState' && key !== undefined) writes.push(key);
        return original.call(this, value, key);
      };
      s.settingsState.value = { theme: 'dark' };
      await s.saveStateToDB();
      window.dispatchEvent(new Event('pagehide'));
      await s.saveStateToDB();
      return { stale, writes };
    }),
  ).toEqual({ stale: [], writes: ['settingsState'] });
  await older.close();
  expect(await saved(page, 'followedRadioStationIDs')).toEqual(['bbcradio2']);
});

test('edits during a save and failed transactions remain pending for the next save', async ({ page }) => {
  await page.goto('/settings');
  await ready(page);
  expect(
    await page.evaluate(async () => {
      const path = '/tests/fixtures/persistence-state.ts';
      const s = await import(path);
      const original = IDBObjectStore.prototype.get;
      IDBObjectStore.prototype.get = function (key) {
        const request = original.call(this, key);
        if (this.name === 'appState' && key === 'followedRadioStationIDs' && this.transaction.mode === 'readwrite') {
          IDBObjectStore.prototype.get = original;
          s.followRadioStation('rb-during');
        }
        return request;
      };
      s.followRadioStation('rb-before');
      await s.saveStateToDB();
      const afterFirst = s.followedRadioStationIDs.value;
      await s.saveStateToDB();
      IDBObjectStore.prototype.get = function (key) {
        const request = original.call(this, key);
        if (this.name === 'appState' && key === 'followedRadioStationIDs' && this.transaction.mode === 'readwrite') {
          IDBObjectStore.prototype.get = original;
          this.transaction.abort();
        }
        return request;
      };
      s.followRadioStation('rb-retry');
      await s.saveStateToDB();
      await s.saveStateToDB();
      return afterFirst;
    }),
  ).toEqual(['rb-before', 'rb-during']);
  expect(await saved(page, 'followedRadioStationIDs')).toEqual(['rb-before', 'rb-during', 'rb-retry']);
});

test('radio and podcast follows and unfollows persist without playback or lifecycle events', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  await page.evaluate(async () => {
    const path = '/tests/fixtures/persistence-state.ts';
    const s = await import(path);
    s.addRadioBrowserStation(s.station('follow'));
  });
  await page.getByRole('link', { name: 'Radio', exact: true }).first().click();
  // Navigate within the SPA so a lifecycle save cannot mask missing autosaves.
  await page.evaluate(() => {
    const a = document.createElement('a');
    a.href = '/radio-station/rb-follow';
    document.body.append(a);
    a.click();
    a.remove();
  });
  await page.getByRole('button', { name: 'Follow', exact: true }).click();
  await expect.poll(() => saved(page, 'followedRadioStationIDs')).toEqual(['rb-follow']);
  await page.getByRole('button', { name: 'Following', exact: true }).click();
  await expect.poll(() => saved(page, 'followedRadioStationIDs')).toEqual([]);

  await page.evaluate(async () => {
    const path = '/tests/fixtures/persistence-state.ts';
    const s = await import(path);
    s.followPodcast({
      id: 'podcast',
      title: 'Podcast',
      feedUrl: 'https://feeds.example/test',
      url: 'https://feeds.example/test',
      description: '',
      imageUrl: '',
      addedDate: 1,
      lastFetched: 1,
    });
  });
  await expect.poll(() => saved(page, 'followedPodcasts')).toMatchObject([{ id: 'podcast' }]);
  await page.evaluate(async () => {
    const path = '/tests/fixtures/persistence-state.ts';
    (await import(path)).unfollowPodcast('podcast');
  });
  await expect.poll(() => saved(page, 'followedPodcasts')).toEqual([]);
  expect(await page.evaluate(() => document.visibilityState)).toBe('visible');
  await expect(page.locator('audio')).toHaveCount(0);
});

test('completed OPML imports reach IndexedDB while settings remains open', async ({ page }) => {
  await page.route('https://feeds.example/**', (route) =>
    route.fulfill({
      contentType: 'application/rss+xml',
      body: '<rss version="2.0"><channel><title>Imported</title><description>Feed</description></channel></rss>',
    }),
  );
  await page.goto('/settings');
  await ready(page);
  const dialog = page.waitForEvent('dialog');
  await page.getByLabel('Import from OPML', { exact: true }).setInputFiles({
    name: 'subscriptions.opml',
    mimeType: 'text/x-opml',
    buffer: Buffer.from(
      '<opml version="2.0"><body><outline xmlUrl="https://feeds.example/one" /><outline xmlUrl="https://feeds.example/two" /></body></opml>',
    ),
  });
  const result = await dialog;
  expect(result.message()).toBe('Import completed: 2 imported, 0 skipped, 0 failed.');
  await result.accept();
  await expect
    .poll(() => saved(page, 'followedPodcasts'))
    .toMatchObject([{ feedUrl: 'https://feeds.example/one' }, { feedUrl: 'https://feeds.example/two' }]);
  expect(await page.evaluate(() => document.visibilityState)).toBe('visible');
  await expect(page.locator('audio')).toHaveCount(0);
});

test('playlist creation, edits, deletion and playback rules persist while active', async ({ page }) => {
  await page.goto('/playlist');
  await ready(page);
  await page.evaluate(async () => {
    const path = '/tests/fixtures/persistence-state.ts';
    const s = await import(path);
    s.addRadioBrowserStation(s.station('one'));
    s.addRadioBrowserStation(s.station('two'));
  });
  await page.getByPlaceholder('Playlist name').fill('Daily');
  await page.getByTitle('Select station...', { exact: true }).click();
  await page.getByRole('option', { name: 'Station one', exact: true }).click();
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByTitle('Select station...', { exact: true }).nth(1).click();
  await page.getByRole('option', { name: 'Station two', exact: true }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect
    .poll(() => saved(page, 'playlists'))
    .toMatchObject([{ name: 'Daily', items: [{ stationID: 'rb-one' }, { stationID: 'rb-two' }] }]);
  await page.getByRole('link', { name: 'Daily', exact: true }).click();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByPlaceholder('Playlist name').fill('Renamed');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect.poll(() => saved(page, 'playlists')).toMatchObject([{ name: 'Renamed' }]);
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByTitle('Delete block', { exact: true }).click();
  await expect.poll(() => saved(page, 'playlists')).toEqual([]);
  await page.evaluate(async () => {
    const path = '/tests/fixtures/persistence-state.ts';
    (await import(path)).playlistRules.value = [{ ruleType: 'podcastToStation', stationID: 'rb-one' }];
  });
  await expect.poll(() => saved(page, 'playlistRules')).toMatchObject([{ stationID: 'rb-one' }]);
  expect(await page.evaluate(() => document.visibilityState)).toBe('visible');
  await expect(page.locator('audio')).toHaveCount(0);
});

test('a burst of mutations coalesces into one save containing the latest state', async ({ page }) => {
  await page.goto('/settings');
  await ready(page);
  await page.evaluate(async () => {
    const path = '/tests/fixtures/persistence-state.ts';
    const s = await import(path);
    s.countWrites();
    for (let i = 0; i < 100; i++) s.followRadioStation(`rb-${i}`);
    s.unfollowRadioStation('rb-0');
  });
  await expect.poll(() => saved(page, 'followedRadioStationIDs')).toHaveLength(99);
  expect(
    await page.evaluate(async () => {
      const path = '/tests/fixtures/persistence-state.ts';
      return (await import(path)).writeCount;
    }),
  ).toBe(1);
});

for (const failure of ['read', 'open']) {
  test(`failed database ${failure} preserves saved data and offers a working retry`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/settings');
    await ready(page);
    await page.evaluate(async () => {
      const path = '/tests/fixtures/persistence-state.ts';
      (await import(path)).followRadioStation('rb-existing');
    });
    await expect.poll(() => saved(page, 'followedRadioStationIDs')).toEqual(['rb-existing']);
    await page.addInitScript((failure) => {
      let failed = false;
      if (failure === 'read') {
        const original = IDBObjectStore.prototype.get;
        IDBObjectStore.prototype.get = function (key) {
          const request = original.call(this, key);
          if (!failed && this.name === 'appState' && key === 'settingsState') {
            failed = true;
            queueMicrotask(() => this.transaction.abort());
          }
          return request;
        };
      } else {
        const original = IDBFactory.prototype.open;
        IDBFactory.prototype.open = function (name, version) {
          if (!failed && name === '1tuner') {
            failed = true;
            return original.call(this, name, 1); // Real VersionError against the existing v9 database.
          }
          return original.call(this, name, version);
        };
      }
    }, failure);
    await page.reload();
    await expect(page.getByRole('alert')).toContainText('Could not load your saved data');
    expect(
      await page.evaluate(async () => {
        const path = '/tests/fixtures/persistence-state.ts';
        const s = await import(path);
        await s.saveStateToDB();
        return { loaded: s.isDBLoaded.value, followed: s.followedRadioStationIDs.value };
      }),
    ).toEqual({ loaded: false, followed: [] });
    expect(await saved(page, 'followedRadioStationIDs')).toEqual(['rb-existing']);
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await ready(page);
    await expect(page.getByRole('alert')).toHaveCount(0);
    expect(
      await page.evaluate(async () => {
        const path = '/tests/fixtures/persistence-state.ts';
        return (await import(path)).followedRadioStationIDs.value;
      }),
    ).toEqual(['rb-existing']);
    await page.locator('label[for="theme-dark"]').click();
    await expect.poll(() => saved(page, 'settingsState')).toMatchObject({ theme: 'dark' });
    await page.evaluate(async () => {
      const path = '/tests/fixtures/persistence-state.ts';
      (await import(path)).followRadioStation('rb-after-retry');
    });
    await expect.poll(() => saved(page, 'followedRadioStationIDs')).toEqual(['rb-existing', 'rb-after-retry']);
    expect(errors).toEqual([]);
  });
}
