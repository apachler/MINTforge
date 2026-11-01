// Barrierefreiheit: axe-core auf jeder Seite, WCAG 2.0/2.1/2.2 A und AA, null Verstöße.
// Dazu Grundlagen, die axe nicht abdeckt: Seite funktioniert ohne JavaScript, Sprunglink, keine horizontale Rolle.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { seiten } from "./seiten";

for (const seite of seiten) {
  test(`${seite.name}: keine WCAG-2.2-AA-Verstöße`, async ({ page }) => {
    await page.goto(seite.pfad);
    await page.evaluate(() => document.fonts.ready);
    const ergebnis = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
      .analyze();
    const kurz = ergebnis.violations.map((v) => ({
      regel: v.id,
      wirkung: v.impact,
      hilfe: v.help,
      stellen: v.nodes.map((n) => `${n.target.join(" ")} – ${n.failureSummary?.split("\n").join(" ")}`),
    }));
    expect(kurz, JSON.stringify(kurz, null, 2)).toEqual([]);
  });

  test(`${seite.name}: kein horizontales Scrollen`, async ({ page }) => {
    await page.goto(seite.pfad);
    const zuBreit = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(zuBreit).toBe(false);
  });
}

test.describe("ohne JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  for (const seite of seiten) {
    test(`${seite.name}: Inhalt und Navigation sichtbar`, async ({ page }) => {
      await page.goto(seite.pfad);
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Hauptnavigation" })).toBeVisible();
    });
  }
});

test("Sprunglink führt zum Inhalt", async ({ page }) => {
  await page.goto("");
  await page.keyboard.press("Tab");
  const sprung = page.getByRole("link", { name: "Zum Inhalt springen" });
  await expect(sprung).toBeFocused();
  await expect(sprung).toBeInViewport();
});

test("keine Konsolenfehler und keine CSP-Verstöße", async ({ page }) => {
  const fehler: string[] = [];
  page.on("console", (m) => m.type() === "error" && fehler.push(m.text()));
  page.on("pageerror", (e) => fehler.push(e.message));
  for (const seite of seiten.filter((s) => s.name !== "404")) {
    await page.goto(seite.pfad);
    await page.evaluate(() => document.fonts.ready);
  }
  expect(fehler).toEqual([]);
});
