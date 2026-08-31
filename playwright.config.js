// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for NVIDIA Contact Page build validation.
 *
 * HOW TO RUN:
 *   npm test               — headless (CI-friendly)
 *   npm run test:headed    — with visible browser window
 *   npm run test:report    — open last HTML report
 *   npx playwright test --grep "mega menu"   — run one test by name
 *
 * The server (port 3001) is started automatically before tests
 * and stopped when all tests finish.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Auto-start the dev server before tests */
  webServer: {
    command: 'npm start',
    url: 'http://localhost:3001',
    reuseExistingServer: true,
    timeout: 15_000,
  },
});
