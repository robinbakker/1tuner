import { expect, test } from '@playwright/test';

test('Search for a radio station, play and stop it', async ({ page }) => {
  await page.goto('/');

  // Search for "kink"
  await page.getByRole('link', { name: 'Radio' }).first().click();
  await page.getByTitle('🇺🇸 English (United States)').getByRole('button').click();
  await page.getByPlaceholder('Search radio stations...').fill('kink');

  // Click the station
  await page.getByRole('heading', { name: 'KINK' }).first().click();
  await page.getByLabel('Play').first().click();

  // Wait for the player to be visible
  await expect(page.getByLabel('Close player')).toBeVisible();
  await page.getByLabel('Close player').click();

  // Go back to the homepage
  //await page.goto('/');

  //await expect(page.getByTitle('Play KINK')).toBeVisible();
});

test('Follow a radio station and check it on the radio stations page', async ({ page }) => {
  await page.goto('/');

  // Search for "kink"
  await page.getByRole('link', { name: 'Radio' }).first().click();
  await page.getByTitle('🇺🇸 English (United States)').getByRole('button').click();
  await page.getByPlaceholder('Search radio stations...').fill('kink');

  // Click the station
  await page.getByRole('heading', { name: 'KINK' }).first().click();

  // Click the follow button
  await page.getByRole('button', { name: 'Follow' }).click();

  // Navigate to the radio stations page
  await page.getByRole('link', { name: 'Radio' }).first().click();

  // Check that the station is in the "Following" list on the radio stations page
  await expect(page.getByTitle('Play KINK').first()).toBeVisible();
});
