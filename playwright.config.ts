import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.E2E_PORT ?? 5057);

/**
 * End-to-end tests. The app and its MongoDB are started once in globalSetup
 * (see e2e/global-setup.ts), so there is no webServer block here.
 *
 * One worker on purpose: every test resets and reseeds the same database.
 */
export default defineConfig({
  testDir: './e2e/tests',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
