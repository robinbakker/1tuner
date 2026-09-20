import { devices, expect, test } from '@playwright/test';

// A reproducible lab measurement, not a substitute for profiling a physical phone.
// Run alone with --workers=1 so other browser tests do not compete for CPU.
test('records cold homepage transfer and execution on an emulated mobile browser', async ({ browser }, testInfo) => {
  const samples = [];
  for (let run = 0; run < 3; run++) {
    const context = await browser.newContext({ ...devices['Pixel 5'], serviceWorkers: 'block' });
    const page = await context.newPage();
    // Keep external artwork, analytics, and fonts from adding network variability.
    await page.route('**/*', (route) =>
      new URL(route.request().url()).origin === testInfo.project.use.baseURL ? route.continue() : route.abort(),
    );
    const session = await context.newCDPSession(page);
    await session.send('Network.enable');
    await session.send('Network.setCacheDisabled', { cacheDisabled: true });
    await session.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150,
      downloadThroughput: 1_600_000 / 8,
      uploadThroughput: 750_000 / 8,
      connectionType: 'cellular4g',
    });
    await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await session.send('Performance.enable');
    await page.goto('/');
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByRole('status')).toHaveCount(0);
    await page.waitForLoadState('networkidle');
    const resources = await page.evaluate(() =>
      performance
        .getEntriesByType('resource')
        .filter((entry) => entry.name.startsWith(location.origin) && new URL(entry.name).pathname.endsWith('.js'))
        .map((entry) => {
          const resource = entry as PerformanceResourceTiming;
          return {
            url: resource.name,
            transfer: resource.transferSize,
            encoded: resource.encodedBodySize,
            decoded: resource.decodedBodySize,
          };
        }),
    );
    const { metrics } = await session.send('Performance.getMetrics');
    samples.push({
      run: run + 1,
      jsTransferBytes: resources.reduce((sum, item) => sum + item.transfer, 0),
      jsEncodedBytes: resources.reduce((sum, item) => sum + item.encoded, 0),
      jsDecodedBytes: resources.reduce((sum, item) => sum + item.decoded, 0),
      scriptDurationMs: (metrics.find((metric) => metric.name === 'ScriptDuration')?.value ?? 0) * 1000,
      taskDurationMs: (metrics.find((metric) => metric.name === 'TaskDuration')?.value ?? 0) * 1000,
      resources,
    });
    await context.close();
  }
  await testInfo.attach('mobile-startup.json', {
    body: JSON.stringify(samples, null, 2),
    contentType: 'application/json',
  });
  console.log(
    JSON.stringify(
      samples.map((sample) => ({ ...sample, resources: undefined })),
      null,
      2,
    ),
  );
  // Byte budgets are deterministic; timings are recorded, not gated on host CPU speed.
  for (const sample of samples) expect(sample.jsDecodedBytes).toBeLessThan(280 * 1024);
});
