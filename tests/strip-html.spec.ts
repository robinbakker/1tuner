import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Load the real Vite-served helper without the app's unrelated network requests.
  await page.route('**/__strip-html-test', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body></body></html>' }),
  );
  await page.goto('/__strip-html-test');
});

test('stripHtml returns plain text and decodes entities once', async ({ page }) => {
  const results = await page.evaluate(async () => {
    const moduleUrl = '/src/lib/utils.ts';
    const { stripHtml } = await import(moduleUrl);
    return [
      '',
      'Plain description',
      '<p>Hello <strong>world</strong> &amp; friends &#33;</p>',
      '<script>unwanted code</script><style>unwanted CSS</style><p>Description</p>',
      '&lt;img src=x onerror=alert(1)&gt;',
      '<p>Malformed <b>description',
    ].map(stripHtml);
  });

  expect(results).toEqual([
    '',
    'Plain description',
    'Hello world & friends !',
    'Description',
    '<img src=x onerror=alert(1)>',
    'Malformed description',
  ]);
});

test('stripHtml neither executes feed code nor requests embedded resources', async ({ page }) => {
  const requests: string[] = [];
  await page.route('https://feed-payload.invalid/**', (route) => {
    requests.push(route.request().url());
    return route.abort();
  });

  const results = await page.evaluate(async () => {
    const moduleUrl = '/src/lib/utils.ts';
    const { stripHtml } = await import(moduleUrl);
    const markExecuted = "document.documentElement.setAttribute('data-feed-executed', 'yes')";
    return [
      `<img src="https://feed-payload.invalid/image" onerror="${markExecuted}">Description`,
      `<svg onload="${markExecuted}"><image href="https://feed-payload.invalid/svg" /></svg>Description`,
      `<script>${markExecuted}</script>Description`,
      '<iframe src="https://feed-payload.invalid/frame"></iframe>Description',
      '<link rel="stylesheet" href="https://feed-payload.invalid/style">Description',
      '<style>@import url("https://feed-payload.invalid/import");</style>Description',
      `&lt;img src="https://feed-payload.invalid/encoded" onerror="${markExecuted}"&gt;`,
    ].map(stripHtml);
  });

  // Resource loading and event handlers may run after the helper has returned.
  await page.waitForTimeout(500);
  expect(requests).toEqual([]);
  await expect(page.locator('html')).not.toHaveAttribute('data-feed-executed');
  expect(results.slice(0, 6)).toEqual(Array(6).fill('Description'));
  expect(results[6]).toContain('<img src=');
});
