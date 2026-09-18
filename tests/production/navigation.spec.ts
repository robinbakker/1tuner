import { expect, test } from '@playwright/test';

for (const entry of ['/', '/settings', '/radio-station/bbcradio2']) {
  test(`prerendered ${entry} hydrates once and supports navigation and history`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    // Exercise the loading screen even on a fast local database.
    await page.addInitScript(() => {
      const databases = indexedDB.databases.bind(indexedDB);
      const ready = new Promise<void>((resolve) => {
        addEventListener('test-release-database', () => resolve(), { once: true });
      });
      indexedDB.databases = async () => {
        await ready;
        return databases();
      };
    });
    await page.goto(entry);
    await expect(page.getByRole('status')).toHaveText('Loading your saved data…');
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(page.getByRole('navigation')).toHaveCount(0);
    await page.evaluate(() => dispatchEvent(new Event('test-release-database')));
    await expect(page.getByRole('status')).toHaveCount(0);
    await expect(page.getByRole('navigation')).toHaveCount(1);
    await expect(page.getByRole('main')).toHaveCount(1);
    // A DOM attribute survives SPA navigation, but not a full-page reload.
    await page.evaluate(() => document.documentElement.setAttribute('data-navigation-test', 'same-document'));
    const destination = entry === '/settings' ? '/playlists' : '/settings';
    await page
      .getByRole('navigation')
      .getByRole('link', {
        name: destination === '/settings' ? 'Settings' : 'Playlists',
        exact: true,
      })
      .click();
    await expect(page).toHaveURL(new RegExp(`${destination}$`));
    await expect(page.getByRole('main')).toHaveCount(1);
    if (destination === '/settings') {
      await expect(page.locator('label[for="theme-dark"]')).toBeVisible();
    } else {
      await expect(page.getByRole('link', { name: 'Add playlist' })).toBeVisible();
    }
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`${entry}$`));
    await expect(page.getByRole('navigation')).toHaveCount(1);
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(page.locator('html')).toHaveAttribute('data-navigation-test', 'same-document');
    expect(errors).toEqual([]);
  });
}

test('failed initialization replaces prerendered content and retries without duplicating the app', async ({ page }) => {
  await page.addInitScript(() => {
    const open = indexedDB.open.bind(indexedDB);
    let failed = false;
    indexedDB.open = (name, version) => {
      if (!failed && name === '1tuner') {
        failed = true;
        throw new DOMException('Test database failure', 'UnknownError');
      }
      return open(name, version);
    };
  });
  await page.goto('/settings');
  await expect(page.getByRole('alert')).toContainText('Could not load your saved data');
  await expect(page.getByRole('main')).toHaveCount(1);
  await expect(page.getByRole('navigation')).toHaveCount(0);
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByRole('navigation')).toHaveCount(1);
  await expect(page.getByRole('main')).toHaveCount(1);
  await expect(page.locator('label[for="theme-dark"]')).toBeVisible();
});
