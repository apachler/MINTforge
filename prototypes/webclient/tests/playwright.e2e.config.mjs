import { defineConfig, devices } from '@playwright/test';

// End-to-End-Test gegen den laufenden Compose-Stack (server/docker-compose.yml) mit gebautem Client.
// Nur Chromium: JSPI gibt es in WebKit von Playwright (noch) nicht zuverlässig, und WebGL läuft headless über
// SwiftShader (Software-Rendering, daher langsam).
export default defineConfig({
  testDir: './e2e',
  timeout: 240_000,
  expect: { timeout: 20_000 },
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-e2e' }]],
  outputDir: 'test-results-e2e',
  use: {
    baseURL: process.env.MINTFORGE_BASIS || 'https://localhost:8443/',
    ignoreHTTPSErrors: true, // Caddy „tls internal“
    video: { mode: 'on', size: { width: 1024, height: 600 } },
    screenshot: 'on',
    trace: 'retain-on-failure',
    viewport: { width: 1024, height: 600 },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1024, height: 600 },
        launchOptions: {
          args: [
            // WebGL 2 ohne GPU: SwiftShader über ANGLE; seit Chrome 137 muss das ausdrücklich erlaubt werden.
            '--use-angle=swiftshader',
            '--enable-unsafe-swiftshader',
            '--ignore-gpu-blocklist',
            '--autoplay-policy=no-user-gesture-required',
          ],
        },
      },
    },
  ],
});
