import { defineConfig, devices } from '@playwright/test';

// Run after `node node_modules/vite/bin/vite.js build` to exercise prerendered HTML and hydration.
export default defineConfig({
  testDir: './tests/production',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium-production', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
});
