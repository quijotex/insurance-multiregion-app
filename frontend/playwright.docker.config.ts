import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

/** Runs e2e against the Docker stack (`docker compose up --build`); starts no servers. */
export default defineConfig({
  ...baseConfig,
  use: { ...baseConfig.use, baseURL: 'http://localhost:4200' },
  webServer: undefined,
});
