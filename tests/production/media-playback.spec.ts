import { expect, Page, test } from '@playwright/test';
import { MediaServer, startMediaServer } from './support/media-server';

// Plays real audio through the production build, including its service worker, so stalls in the
// browser's media pipeline surface here. The mocked media tests cannot detect those.
const FEED_URL = 'https://feed.test/feed.xml';
const STATION_UUID = '00000000-0000-4000-8000-000000000001';
const PODCAST_PATH = `/podcast/media-test/${Buffer.from('feed.test/feed.xml').toString('base64')}`;
const STATION_PATH = `/radio-station/rb-${STATION_UUID}`;

let media: MediaServer;

test.beforeEach(async ({ context }) => {
  media = await startMediaServer();
  // The context also routes requests made by the service worker.
  await context.route(FEED_URL, (route) =>
    route.fulfill({
      contentType: 'application/rss+xml',
      body: `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>Media test</title>
    <description>Real media playback</description>
    <item>
      <title>Long episode</title>
      <guid>media-test-1</guid>
      <pubDate>Mon, 12 Oct 2026 08:00:00 GMT</pubDate>
      <itunes:duration>30:00</itunes:duration>
      <enclosure url="${media.episodeUrl}" length="14400044" type="audio/wav"/>
    </item>
  </channel>
</rss>`,
    }),
  );
  await context.route(
    (url) => url.pathname === '/station' || url.pathname === '/station-click',
    (route) =>
      route.fulfill({
        json: [
          {
            stationuuid: STATION_UUID,
            name: 'Media test FM',
            favicon: '',
            url_resolved: media.radioUrl,
            codec: 'MP3',
            homepage: '',
            tags: '',
            countrycode: 'NL',
            lastchangetime_iso8601: '2026-10-01T00:00:00Z',
          },
        ],
      }),
  );
});

test.afterEach(async () => {
  await media.close();
});

test.setTimeout(90_000);

test('a podcast keeps playing after seeking, switching to radio and expired media URLs', async ({ page }) => {
  await page.goto(PODCAST_PATH);
  await expect(page.getByRole('heading', { name: /Long episode/ })).toBeVisible();
  await episodePlayButton(page).click();
  await expectProgress(page, 0);

  // Seek while playing.
  await seek(page, 600);
  await expectProgress(page, 600);

  // Pause, scrub through unbuffered parts, then resume.
  await playerButton(page).click();
  await expect(audio(page)).toHaveJSProperty('paused', true);
  for (const position of [900, 1100, 692]) await seek(page, position);
  await playerButton(page).click();
  await expectProgress(page, 692);

  // Switch to radio in the app and back to the episode, which resumes where it was.
  await navigate(page, STATION_PATH);
  await page.getByRole('main').getByRole('button', { name: 'Play' }).first().click();
  await expect.poll(() => audio(page).evaluate((a: HTMLAudioElement) => a.currentSrc)).toBe(media.radioUrl);
  await expectProgress(page, 0);
  await page.goBack();
  await episodePlayButton(page).click();
  await expect.poll(() => audio(page).evaluate((a: HTMLAudioElement) => a.currentSrc)).toBe(media.episodeUrl);
  await expectProgress(page, 692);

  // Signed media URLs expire while paused; resuming has to request a fresh one.
  await playerButton(page).click();
  await expect(audio(page)).toHaveJSProperty('paused', true);
  media.expireSignatures();
  const logStart = media.log.length;
  await seek(page, 1500);
  await playerButton(page).click();
  await expectProgress(page, 1500);
  const requests = media.log.slice(logStart);
  expect(requests).toContain('403 expired signature');
  expect(requests.some((request) => /^GET \/episode\.wav\?_=\d+/.test(request))).toBe(true);
});

const audio = (page: Page) => page.locator('audio');
const player = (page: Page) => page.locator('div.fixed:has(> audio)');
const playerButton = (page: Page) => player(page).getByRole('button', { name: /^(Play|Pause)$/ });
// The episode list's button, not the header's "Continue" button that appears once there is progress.
const episodePlayButton = (page: Page) =>
  page.getByRole('main').locator('section').getByRole('button', { name: 'Play' });

async function seek(page: Page, position: number) {
  await player(page).locator('button:has(.lucide-chevron-up)').click();
  const slider = player(page).locator('input[type=range]');
  await expect(slider).toHaveAttribute('max', /^1800/);
  await slider.fill(String(position));
  await player(page).locator('button:has(.lucide-chevron-down)').click();
}

// In-app navigation keeps the player mounted, as tapping a link would.
async function navigate(page: Page, path: string) {
  await page.evaluate((path) => {
    history.pushState(null, '', path);
    dispatchEvent(new PopStateEvent('popstate'));
  }, path);
}

/** Playback only works when the position advances from where it started, near where it should. */
async function expectProgress(page: Page, from: number) {
  const position = () => audio(page).evaluate((a: HTMLAudioElement) => a.currentTime);
  await expect.poll(position).toBeGreaterThanOrEqual(from);
  const start = await position();
  // Shorter than the player's stall watchdog: recovery has to come from the failure itself.
  await expect.poll(position, { timeout: 10_000 }).toBeGreaterThan(start + 2);
  expect(await position()).toBeLessThan(from + 30);
  await expect(audio(page)).toHaveJSProperty('paused', false);
  await expect(playerButton(page)).toHaveAccessibleName('Pause');
}
