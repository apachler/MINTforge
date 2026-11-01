// Rauchtest der PWA-Hülle in Chromium und WebKit. Der WebAssembly-Client selbst wird hier nicht gestartet
// (er ist nur nach wasm/build.sh vorhanden); der Verbindungstest zu einem echten Server ist ein TODO.

import { test, expect } from '@playwright/test';

const LINK = '#server=luanti:30000&name=Fuchs_07&token=mf1-24e0b156d5b2420bdea73b78';

test('Startseite lädt ohne Konsolenfehler und erklärt den Startlink', async ({ page }) => {
  const fehler = [];
  page.on('pageerror', (e) => fehler.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') fehler.push(m.text()); });
  await page.goto('index.html');
  await expect(page.locator('h1')).toHaveText('MINTforge-Labor');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de-AT');
  await expect(page.locator('body')).toHaveAttribute('data-zustand', 'ohne-link');
  await expect(page.locator('#ohne-link')).toBeVisible();
  await expect(page.locator('footer')).toContainText('Kein offizielles Minecraft-Produkt');
  expect(fehler).toEqual([]);
});

test('Seite ist cross-origin-isoliert (Voraussetzung für Threads)', async ({ page }) => {
  await page.goto('index.html');
  expect(await page.evaluate(() => window.crossOriginIsolated)).toBe(true);
  expect(await page.evaluate(() => typeof SharedArrayBuffer)).toBe('function');
});

test('Manifest wird geladen und ist gültig', async ({ page, request }) => {
  await page.goto('index.html');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  const antwort = await request.get(href);
  expect(antwort.ok()).toBe(true);
  const manifest = await antwort.json();
  expect(manifest.lang).toBe('de-AT');
  expect(manifest.start_url).toBe('./index.html');
  for (const icon of manifest.icons) {
    const bild = await request.get(icon.src);
    expect(bild.ok(), icon.src).toBe(true);
    expect(bild.headers()['content-type']).toBe('image/png');
  }
});

test('Service Worker registriert sich', async ({ page }) => {
  await page.goto('index.html');
  const aktiv = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return 'nicht unterstützt';
    const reg = await navigator.serviceWorker.ready;
    return reg.active ? 'aktiv' : 'inaktiv';
  });
  expect(aktiv).toBe('aktiv');
});

test('Startlink wird gelesen; Browserprüfung entscheidet über „Ins Labor“', async ({ page }) => {
  await page.goto(`index.html${LINK}`);
  const zustand = await page.locator('body').getAttribute('data-zustand');
  // Je nach Engine-Version fehlt z. B. JSPI; dann zeigt die Seite, was fehlt, statt zu starten.
  expect(['bereit', 'browser-fehlt']).toContain(zustand);
  if (zustand === 'bereit') {
    await expect(page.locator('#weiter')).toHaveAttribute('href', `spiel.html${LINK}`);
  } else {
    await expect(page.locator('#pruefliste .fehlt').first()).toBeVisible();
  }
});

test('Unvollständiger Startlink wird abgelehnt', async ({ page }) => {
  await page.goto('index.html#server=luanti&name=Fuchs_07');
  await expect(page.locator('body')).toHaveAttribute('data-zustand', 'link-fehler');
  await expect(page.locator('#weiter')).toBeHidden();
});

test('Spielseite entfernt das Token aus der Adresszeile und meldet fehlenden Client', async ({ page }) => {
  await page.goto(`spiel.html${LINK}`);
  await expect(page.locator('body')).toHaveAttribute('data-zustand', 'kein-client');
  expect(new URL(page.url()).hash).toBe('');
  await expect(page.locator('#status')).toContainText('nicht installiert');
});

test('Mobile Breite 390 px ohne horizontales Scrollen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('index.html');
  const breit = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(breit).toBeLessThanOrEqual(390);
});

// TODO: Verbindungstest mit gebautem Client gegen den Compose-Stack (Luanti-Server + Proxy):
//       Start per Link, Welt geladen, Ladezeit < 30 s, Bildrate messen. Siehe README, „Offen“.
