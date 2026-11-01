import { defineConfig, devices } from '@playwright/test';

// Chromium (Chrome/Edge/Chromebook) und WebKit (Safari-Engine, wie auf dem iPad).
// Hinweis: Das WebKit von Playwright ist nicht identisch mit Safari auf iPadOS; echte Geräte bleiben nötig.
export default defineConfig({
  testDir: './browser',
  timeout: 30_000,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173/',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node browser/server.mjs 4173',
    url: 'http://127.0.0.1:4173/index.html',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit-ipad', use: { ...devices['iPad (gen 7) landscape'] } },
  ],
});
