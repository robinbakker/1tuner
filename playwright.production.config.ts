import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PREVIEW_PORT || 4173);

// Run after `node node_modules/vite/bin/vite.js build` to exercise prerendered HTML and hydration.
export default defineConfig({
  testDir: './tests/production',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium-production', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
  },
});
