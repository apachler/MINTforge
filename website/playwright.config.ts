import { defineConfig, devices } from "@playwright/test";
import { base } from "./site.config.mjs";

// Browser-Tests gegen den fertigen Build (dist/) unter dem Basispfad.
// Visuelle Referenzbilder entstehen nur im Playwright-Container in CI (feste Schriften, stabile Pixel):
// Workflow .github/workflows/site.yml, Label „visual-update“.
const PORT = 4321;
const breiten = [390, 768, 1440];
const schemata = ["light", "dark"] as const;
// Nur lokal ohne Playwright-Browser: vorhandenes Chrome nutzen (CHROME_PATH=/usr/bin/google-chrome). In CI nie gesetzt.
const chrome = process.env.CHROME_PATH ? { launchOptions: { executablePath: process.env.CHROME_PATH } } : {};

export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",
  snapshotPathTemplate: "{testDir}/__screenshots__/{projectName}/{arg}{ext}",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]] : "list",
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.002, animations: "disabled", caret: "hide" },
  },
  use: {
    baseURL: `http://127.0.0.1:${PORT}${base}`,
    trace: "retain-on-failure",
  },
  projects: [
    // Barrierefreiheit: Chromium und WebKit, je hell und dunkel, mobil und Desktop
    ...(["chromium", "webkit"] as const).flatMap((browser) =>
      schemata.flatMap((colorScheme) =>
        [390, 1440].map((width) => ({
          name: `a11y-${browser}-${colorScheme}-${width}`,
          testMatch: /a11y\.spec\.ts/,
          use: {
            ...(browser === "webkit" ? devices["Desktop Safari"] : { ...devices["Desktop Chrome"], ...chrome }),
            colorScheme,
            viewport: { width, height: 900 },
          },
        })),
      ),
    ),
    // Aussehen: Chromium, 3 Breiten × hell/dunkel
    ...breiten.flatMap((width) =>
      schemata.map((colorScheme) => ({
        name: `visual-${width}-${colorScheme}`,
        testMatch: /visual\.spec\.ts/,
        use: { ...devices["Desktop Chrome"], ...chrome, colorScheme, viewport: { width, height: 900 }, deviceScaleFactor: 1 },
      })),
    ),
  ],
  webServer: {
    command: `node tests/server.mjs ${PORT}`,
    url: `http://127.0.0.1:${PORT}${base}`,
    reuseExistingServer: !process.env.CI,
  },
});
