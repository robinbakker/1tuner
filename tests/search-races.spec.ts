import { expect, Page, Request, Route, test } from '@playwright/test';

type SearchKind = 'podcast' | 'apple' | 'radio';
const searchEndpoint = /podcastindex\.tuner\.workers\.dev|itunes\.apple\.com\/search|\/stations$/;

class SearchPage {
  readonly requests: Route[] = [];
  readonly aborted = new Set<Request>();

  constructor(
    readonly page: Page,
    readonly kind: SearchKind,
  ) {}

  get path() {
    return this.kind === 'radio' ? '/radio-stations' : '/podcasts';
  }
  get input() {
    return this.page.getByPlaceholder(this.kind === 'radio' ? 'Search radio stations...' : 'Search podcasts...');
  }
  get loader() {
    return this.page.getByLabel('Tuning needle');
  }
  result(name: string) {
    return this.page.getByRole('heading', { name, exact: true });
  }

  async setup() {
    await this.page.route(searchEndpoint, (route) => {
      this.requests.push(route);
    });
    await this.page.route('https://example.test/**', (route) => route.fulfill({ status: 204 }));
    this.page.on('requestfailed', (request) => {
      this.aborted.add(request);
    });
    if (this.kind === 'apple') {
      await this.page.goto('/settings');
      await this.page.locator('label[for="searchProvider-Apple"]').click();
      // Wait for the settings UI change to persist before loading the search URL.
      await expect
        .poll(() =>
          this.page.evaluate(async () => {
            const db = await new Promise<IDBDatabase>((resolve, reject) => {
              const request = indexedDB.open('1tuner');
              request.onsuccess = () => resolve(request.result);
              request.onerror = () => reject(request.error);
            });
            try {
              return await new Promise<string | undefined>((resolve, reject) => {
                const request = db.transaction('appState').objectStore('appState').get('settingsState');
                request.onsuccess = () => resolve(request.result?.podcastSearchProvider);
                request.onerror = () => reject(request.error);
              });
            } finally {
              db.close();
            }
          }),
        )
        .toBe('Apple');
    }
  }

  async open(query = 'alpha') {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (this.kind === 'radio') params.set('region', 'en-US,en-UK');
    await this.page.goto(`${this.path}?${params}`);
    await this.expectQuery(query);
    if (query) await this.waitForSearch(query, 1);
    else if (this.kind === 'radio')
      await expect(this.page.getByRole('button', { name: /More from United States/ })).toBeVisible();
    else await expect(this.page.getByRole('heading', { name: 'Featured', exact: true })).toBeVisible();
  }

  async enter(query: string) {
    await this.input.fill(query);
    // Podcasts listens for change, which the browser emits when the input loses focus.
    await this.input.press('Tab');
    await this.expectQuery(query);
  }

  async start(query: string, count: number) {
    await this.enter(query);
    await this.waitForSearch(query, count);
  }

  async waitForSearch(query: string, count: number) {
    if (this.kind === 'radio') await this.page.getByRole('button', { name: 'Find more stations...' }).click();
    await expect.poll(() => this.requests.length).toBe(count);
    const request = this.requests[count - 1].request();
    if (this.kind === 'apple') expect(new URL(request.url()).searchParams.get('term')).toBe(query);
    else if (this.kind === 'radio') expect(new URLSearchParams(request.postData()!).get('name')).toBe(query);
    else expect(request.postData()).toBe(query);
    await expect(this.loader).toBeVisible();
  }

  async expectQuery(query: string) {
    await expect(this.input).toHaveValue(query);
    await expect(this.page).toHaveURL(
      (url) => url.pathname === this.path && (url.searchParams.get('q') || '') === query,
    );
  }

  async expectAborted(index: number) {
    await expect.poll(() => this.aborted.has(this.requests[index].request())).toBe(true);
  }

  async settle(index: number, name: string, fail = false) {
    const json =
      this.kind === 'radio'
        ? [
            {
              stationuuid: name,
              name,
              favicon: 'https://example.test/logo.png',
              url_resolved: 'https://example.test/live',
              tags: '',
              countrycode: 'US',
              codec: 'MP3',
              homepage: '',
              lastchangetime_iso8601: '',
            },
          ]
        : this.kind === 'apple'
          ? {
              results: [
                {
                  trackId: name,
                  collectionName: name,
                  artistName: '',
                  feedUrl: 'https://example.test/feed',
                  artworkUrl600: 'https://example.test/logo.png',
                },
              ],
            }
          : {
              feeds: [
                {
                  id: name,
                  title: name,
                  description: '',
                  url: 'https://example.test/feed',
                  image: 'https://example.test/logo.png',
                },
              ],
            };
    await this.requests[index].fulfill({ status: fail ? 503 : 200, json });
  }

  async ignoreCancellation() {
    // Keep the real fetch and HTTP interception, but let obsolete responses reach the hooks' write guards.
    await this.page.addInitScript(() => {
      const fetch = window.fetch;
      window.fetch = (input, init) => {
        if (/podcastindex\.tuner\.workers\.dev|itunes\.apple\.com\/search|\/stations$/.test(String(input))) {
          return fetch(input, { ...init, signal: undefined });
        }
        return fetch(input, init);
      };
    });
  }

  async finishLateResponse(index: number, name: string, fail = false) {
    const finished = this.page.waitForEvent('requestfinished', (request) => request === this.requests[index].request());
    await this.settle(index, name, fail);
    await finished;
    // Allow the response handlers and Preact's queued render to run before checking for stale UI writes.
    await this.page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
  }

  async leave() {
    // Client-side navigation unmounts the search page without discarding the document.
    await this.page.locator('a[href="/settings"]').first().click();
    await expect(this.page).toHaveURL(/\/settings$/);
    await expect(this.page.getByRole('heading', { name: 'Podcast search provider', exact: true })).toBeVisible();
  }
}

for (const kind of ['podcast', 'apple', 'radio'] as const) {
  test.describe(`${kind} search routes`, () => {
    let search: SearchPage;
    test.beforeEach(async ({ page }) => {
      search = new SearchPage(page, kind);
      await search.setup();
    });

    test('a late response cannot overwrite newer results even when transport ignores cancellation', async () => {
      await search.ignoreCancellation();
      await search.open();
      await search.start('beta', 2);
      await search.settle(1, 'Beta');
      await expect(search.result('Beta')).toBeVisible();
      await search.finishLateResponse(0, 'Alpha');
      await search.expectQuery('beta');
      await expect(search.result('Beta')).toBeVisible();
      await expect(search.result('Alpha')).toHaveCount(0);
      await expect(search.loader).toHaveCount(0);
    });

    for (const fail of [false, true]) {
      test(`an obsolete ${fail ? 'failure' : 'success'} cannot stop the current loader`, async () => {
        await search.ignoreCancellation();
        await search.open();
        await search.start('beta', 2);
        await search.finishLateResponse(0, 'Alpha', fail);
        await expect(search.loader).toBeVisible();
        await expect(search.result('Alpha')).toHaveCount(0);
        await search.settle(1, 'Beta');
        await expect(search.result('Beta')).toBeVisible();
        await expect(search.loader).toHaveCount(0);
      });
    }

    test('clearing a pending search prevents its results from returning', async ({ page }) => {
      await search.open();
      await page.getByTitle('Clear search').click();
      await search.expectQuery('');
      await search.expectAborted(0);
      await search.settle(0, 'Alpha');
      await expect(search.result('Alpha')).toHaveCount(0);
      await expect(search.loader).toHaveCount(0);
    });

    test('navigation aborts pending work and prevents results from returning', async ({ page }) => {
      await search.open();
      await search.leave();
      await search.expectAborted(0);
      await search.settle(0, 'Alpha');
      await page.locator(`a[href="${search.path}"]`).first().click();
      await search.expectQuery('');
      await expect(search.result('Alpha')).toHaveCount(0);
      await expect(search.loader).toHaveCount(0);
    });

    if (kind !== 'radio') {
      test('leaving for a delayed lazy route cannot rewrite its URL or accept late results', async ({ page }) => {
        await search.ignoreCancellation();
        await search.open();
        let release!: () => void;
        const destinationReady = new Promise<void>((resolve) => {
          release = resolve;
        });
        let requested = false;
        await page.route('**/src/pages/playlists/index.tsx*', async (route) => {
          requested = true;
          await destinationReady;
          await route.continue();
        });
        try {
          await page.getByRole('navigation').getByRole('link', { name: 'Playlists', exact: true }).click();
          await expect.poll(() => requested).toBe(true);
          // The search page is still mounted while the destination module is held.
          await expect(search.input).toBeVisible();
          await search.finishLateResponse(0, 'Alpha');
          await expect(page).toHaveURL(/\/playlists$/);
          await expect(search.result('Alpha')).toHaveCount(0);
          expect(search.requests).toHaveLength(1);
        } finally {
          release();
        }
        await expect(page.getByRole('link', { name: 'Add playlist' })).toBeVisible();
      });

      for (const action of ['clear', 'navigate'] as const) {
        test(`${action} cancels a search still waiting for the debounce`, async ({ page }) => {
          await search.open('');
          const time = new Date('2026-09-18T12:00:00Z');
          await page.clock.install({ time });
          await page.clock.setFixedTime(time);
          await page.clock.pauseAt(time);
          await search.enter('alpha');
          await page.clock.runFor(50);
          await expect(search.loader).toBeVisible();
          expect(search.requests).toHaveLength(0);
          if (action === 'clear') await page.getByTitle('Clear search').click();
          else await search.leave();
          await page.clock.runFor(1000);
          expect(search.requests).toHaveLength(0);
          await expect(search.result('Alpha')).toHaveCount(0);
          await expect(search.loader).toHaveCount(0);
        });
      }

      test('returning to a cached query cancels pending work and restores the URL', async () => {
        await search.open();
        await search.settle(0, 'Alpha');
        await expect(search.result('Alpha')).toBeVisible();
        await search.start('beta', 2);
        await search.enter('alpha');
        await search.expectAborted(1);
        await search.settle(1, 'Beta');
        await expect(search.result('Alpha')).toBeVisible();
        await expect(search.result('Beta')).toHaveCount(0);
        await expect(search.loader).toHaveCount(0);
        expect(search.requests).toHaveLength(2);
      });
    }

    if (kind === 'radio') {
      for (const filter of ['region', 'genre'] as const) {
        test(`${filter} changes invalidate pending results`, async ({ page }) => {
          await search.open();
          if (filter === 'region') {
            await page
              .getByTitle('🇺🇸 English (United States)', { exact: true })
              .filter({ visible: true })
              .getByRole('button')
              .click();
            await expect(page).toHaveURL((url) => url.searchParams.get('region') === 'en-UK');
          } else {
            await page.getByRole('button', { name: 'Genre', exact: true }).click();
            await page.getByRole('option', { name: 'Rock', exact: true }).click();
            await expect(page).toHaveURL((url) => url.searchParams.get('genre') === 'rock');
          }
          await search.expectAborted(0);
          await search.settle(0, 'Alpha');
          await search.expectQuery('alpha');
          await expect(search.result('Alpha')).toHaveCount(0);
          await expect(search.loader).toHaveCount(0);
          await expect(page.getByRole('button', { name: 'Find more stations...' })).toBeEnabled();
        });
      }

      test('country searches share cancellation with query searches', async ({ page }) => {
        await search.open('');
        await page.getByRole('button', { name: /More from United States/ }).click();
        await expect.poll(() => search.requests.length).toBe(1);
        expect(new URLSearchParams(search.requests[0].request().postData()!).get('countrycode')).toBe('US');
        await search.start('beta', 2);
        await search.expectAborted(0);
        await search.settle(0, 'USA');
        await expect(search.loader).toBeVisible();
        await search.settle(1, 'Beta');
        await expect(search.result('Beta')).toBeVisible();
        await expect(search.result('USA')).toHaveCount(0);
        await page.getByTitle('Clear search').click();
        await page.getByRole('button', { name: /More from United Kingdom/ }).click();
        await expect.poll(() => search.requests.length).toBe(3);
        expect(new URLSearchParams(search.requests[2].request().postData()!).get('countrycode')).toBe('gb');
        await search.settle(2, 'UK');
        await expect(search.result('UK')).toBeVisible();
        await search.expectQuery('');
      });
    }
  });
}
