// Aussehen: ganze Seite je Breite und Farbschema, verglichen mit den Referenzbildern in tests/__screenshots__/.
// Referenzbilder nur im Playwright-Container erzeugen (CI, Label „visual-update“), nie lokal.
import { test, expect } from "@playwright/test";
import { seiten } from "./seiten";

for (const seite of seiten) {
  test(`${seite.name}`, async ({ page }) => {
    await page.goto(seite.pfad);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`${seite.name}.png`, { fullPage: true });
  });
}
