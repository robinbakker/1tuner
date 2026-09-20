import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

type Chunk = { file: string; imports?: string[]; css?: string[] };
const manifest: Record<string, Chunk> = JSON.parse(readFileSync('dist/.vite/manifest.json', 'utf8'));
const secondaryRoutes = [
  'about',
  'playlist',
  'playlists',
  'podcast',
  'podcasts',
  'radio-station',
  'radio-stations',
  'settings',
];
const buildOnly = ['src/prerender.tsx', 'src/assets/data/podcasts.json', 'node_modules/preact-iso/src/prerender.js'];

function dependencies(key: string, seen = new Set<string>()) {
  if (seen.has(key)) return seen;
  seen.add(key);
  for (const dependency of manifest[key].imports ?? []) dependencies(dependency, seen);
  return seen;
}

test('homepage JavaScript stays split and within its size budget', () => {
  const initial = dependencies('src/main.tsx');
  for (const route of secondaryRoutes) {
    const key = `src/pages/${route}/index.tsx`;
    expect(manifest[key], `${route} has its own chunk`).toBeDefined();
    expect(initial.has(key)).toBe(false);
  }
  for (const key of buildOnly) expect(initial.has(key)).toBe(false);

  // Include the station associations fetched immediately on startup and the HTML entry/polyfill.
  dependencies('src/assets/data/stations/podcasts.json', initial);
  const html = readFileSync('dist/index.html', 'utf8');
  const files = new Set([...initial].map((key) => manifest[key].file));
  for (const [, file] of html.matchAll(/(?:src|href)="\/(assets\/[^" ]+\.js)"/g)) files.add(file);
  const buffers = [...files].map((file) => readFileSync(`dist/${file}`));
  expect(buffers.reduce((bytes, buffer) => bytes + buffer.length, 0)).toBeLessThan(280 * 1024);
  expect(buffers.reduce((bytes, buffer) => bytes + gzipSync(buffer).length, 0)).toBeLessThan(80 * 1024);
});

test('prerendered secondary pages contain content and metadata without executing JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, serviceWorkers: 'block' });
  const page = await context.newPage();
  for (const [path, heading] of [
    ['/settings', 'Settings'],
    ['/about', 'About'],
    ['/radio-station/bbcradio2', 'BBC Radio 2'],
    ['/podcast/the-daily/ZmVlZHMuc2ltcGxlY2FzdC5jb20vNTRuQUdjSWw=', 'The Daily'],
  ]) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: heading, exact: true }).first()).toBeVisible();
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', new RegExp(heading));
  }
  await context.close();
});

test('precache excludes build-only chunks and supports unvisited routes offline', async ({ page, context }) => {
  const errors: string[] = [];
  const requestedScripts = new Set<string>();
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (request.resourceType() === 'script') requestedScripts.add(new URL(request.url()).pathname.slice(1));
  });
  await page.goto('/');
  await expect(page.getByRole('navigation')).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }),
      );
    }
  });
  const cached = await page.evaluate(async () => {
    const names = (await caches.keys()).filter((name) => name.includes('precache'));
    const requests = await Promise.all(names.map(async (name) => (await caches.open(name)).keys()));
    return requests.flat().map((request) => new URL(request.url).pathname.slice(1));
  });
  for (const key of buildOnly) {
    expect(cached).not.toContain(manifest[key].file);
    expect(requestedScripts.has(manifest[key].file)).toBe(false);
  }
  for (const route of secondaryRoutes) {
    const key = `src/pages/${route}/index.tsx`;
    expect(requestedScripts.has(manifest[key].file)).toBe(false);
    for (const dependency of dependencies(key)) expect(cached).toContain(manifest[dependency].file);
  }
  expect(cached.reduce((bytes, file) => bytes + readFileSync(`dist/${file}`).length, 0)).toBeLessThan(525 * 1024);

  await context.setOffline(true);
  // Each navigation starts a fresh document, so no route can rely on modules already in memory.
  for (const [path, heading] of [
    ['/settings', 'Settings'],
    ['/about', 'About'],
    ['/radio-stations', 'Radio stations'],
    ['/radio-station/bbcradio2', 'BBC Radio 2'],
    ['/podcasts', 'Podcasts'],
    ['/podcast/offline/ZmVlZHMuZXhhbXBsZS9vZmZsaW5l', 'Unable to load podcast'],
    ['/playlists', 'Playlists'],
    ['/playlist/offline', 'Edit offline'],
  ]) {
    await page.goto(path);
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: heading, exact: true }).first()).toBeVisible();
  }
  await page.getByRole('navigation').getByRole('link', { name: 'Settings', exact: true }).click();
  await expect(page.locator('label[for="theme-dark"]')).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/playlist\/offline$/);
  expect(errors).toEqual([]);
});
