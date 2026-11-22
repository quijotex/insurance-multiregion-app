import { defineConfig, devices } from '@playwright/test';

/**
 * Two ways to run e2e:
 * - Local (default): Playwright starts Strapi (seeded at bootstrap) and `ng serve` (proxying /api to Strapi).
 * - Against the Docker stack: `docker compose up --build`, then `npm run e2e:docker`
 *   (uses playwright.docker.config.ts, so Playwright starts nothing).
 */
const externalBaseUrl = process.env['E2E_BASE_URL'];

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env['CI'] ? 1 : 0,
  use: {
    baseURL: externalBaseUrl ?? 'http://localhost:4200',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: externalBaseUrl
    ? undefined
    : [
        {
          command: 'npm --prefix ../cms run develop',
          url: 'http://localhost:1337/_health',
          reuseExistingServer: true,
          timeout: 240_000,
        },
        {
          command: 'npm start',
          url: 'http://localhost:4200',
          reuseExistingServer: true,
          timeout: 120_000,
        },
      ],
});
