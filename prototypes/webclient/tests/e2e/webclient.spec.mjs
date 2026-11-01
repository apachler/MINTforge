// End-to-End: der echte WebAssembly-Client im Browser gegen Luanti 5.18.0 über den Proxy.
//
// Voraussetzungen (siehe Job `e2e` in .github/workflows/webclient.yml):
//   - web/client/ enthält den gebauten Client (Artifact webclient-wasm)
//   - server/docker-compose.yml läuft mit MINTFORGE_TESTMODUS=1
//   - MINTFORGE_TOKEN_SCHLUESSEL ist gesetzt (derselbe Wert wie im Stack)
//
// Belege kommen aus zwei Richtungen: Server-Logs (docker compose logs) und Browser-Konsole.

import { test, expect } from '@playwright/test';
import { createHmac } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HIER = dirname(fileURLToPath(import.meta.url));
const COMPOSE = join(HIER, '../../server/docker-compose.yml');
const LOGS = join(HIER, '../test-results-e2e/logs');
const SCHLUESSEL = process.env.MINTFORGE_TOKEN_SCHLUESSEL || '';
const FENSTER = 86400;

// Gleiches Verfahren wie mods/mintforge_quest/token.lua und werkzeuge/token.py
function token(name) {
  const fenster = Math.floor(Date.now() / 1000 / FENSTER);
  return `mf1-${createHmac('sha256', SCHLUESSEL).update(`mf1|${name}|${fenster}`).digest('hex').slice(0, 24)}`;
}

function startlink(name, tok) {
  return `spiel.html#${new URLSearchParams({ server: 'luanti:30000', name, token: tok })}`;
}

function dienstLog(dienst) {
  return execFileSync('docker', ['compose', '-f', COMPOSE, 'logs', '--no-color', '--no-log-prefix', dienst],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

async function warteAufLog(dienst, muster, ms) {
  const ende = Date.now() + ms;
  while (Date.now() < ende) {
    const zeile = dienstLog(dienst).split('\n').find((z) => muster.test(z));
    if (zeile) {
      return zeile;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return null;
}

// Startet den Client mit einem Startlink und klickt „Ins Labor“. Sammelt die Konsole in `konsole`.
async function starte(page, name, tok, konsole) {
  page.on('console', (m) => konsole.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', (e) => konsole.push(`[pageerror] ${e.message}`));
  await page.goto(startlink(name, tok));
  await expect(page.locator('body')).toHaveAttribute('data-zustand', 'bereit', { timeout: 120_000 });
  await page.locator('#start').click();
}

function sichere(datei, zeilen) {
  mkdirSync(LOGS, { recursive: true });
  writeFileSync(join(LOGS, datei), Array.isArray(zeilen) ? zeilen.join('\n') : zeilen);
}

test.describe('Web-Client gegen Luanti 5.18.0', () => {
  // Reihenfolge bleibt (ein Worker), aber ein Fehlschlag überspringt die folgenden Schritte nicht –
  // so zeigt der Bericht für jeden Punkt einzeln, ob er im Browser klappt.
  test.describe.configure({ mode: 'default' });
  const NAME = 'Fuchs_07';
  const konsole = [];
  let page;
  let context;

  test.beforeAll(async ({ browser }, info) => {
    expect(SCHLUESSEL.length, 'MINTFORGE_TOKEN_SCHLUESSEL fehlt').toBeGreaterThanOrEqual(32);
    sichere('browser-version.txt', `Chromium ${browser.version()}\n`);
    context = await browser.newContext({
      ...info.project.use,
      recordVideo: { dir: join(HIER, '../test-results-e2e/video'), size: { width: 1024, height: 600 } },
    });
    page = await context.newPage();
  });

  test.afterAll(async () => {
    sichere('browser-konsole.txt', konsole);
    await context?.close();
  });

  test('a) Client lädt, löst „luanti“ über den Proxy auf und verbindet sich', async () => {
    const fakten = await (async () => {
      await page.goto('index.html');
      return page.evaluate(() => ({
        isoliert: window.crossOriginIsolated,
        jspi: typeof WebAssembly.Suspending === 'function',
        webgl2: !!document.createElement('canvas').getContext('webgl2'),
      }));
    })();
    sichere('browser-faehigkeiten.json', JSON.stringify(fakten, null, 2));
    expect(fakten, 'Browser-Voraussetzungen').toEqual({ isoliert: true, jspi: true, webgl2: true });

    await starte(page, NAME, token(NAME), konsole);
    const beitritt = await warteAufLog('luanti', new RegExp(`${NAME} \\[[^\\]]+\\] joins game`), 180_000);
    await page.screenshot({ path: join(HIER, '../test-results-e2e/01-nach-start.png') });
    expect(beitritt, 'Server-Log „joins game“').not.toBeNull();
    // Der Proxy hat für den Client eine Adresse vergeben und UDP gebunden.
    expect(dienstLog('proxy')).toMatch(/BIND 10\.77\.1\.\d+/);
  });

  test('b) Anmeldung mit Token klappt, Spielfigur ist in der Welt', async () => {
    const inWelt = await warteAufLog('luanti', new RegExp(`\\[mintforge\\] TEST: ${NAME} ist in der Welt bei`), 30_000);
    expect(inWelt).not.toBeNull();
    expect(dienstLog('luanti')).not.toMatch(new RegExp(`User ${NAME} .*supplied wrong password`));
    // Ein paar Sekunden rendern lassen, dann Bildschirmfoto aus dem Spiel
    await page.waitForTimeout(8000);
    await page.screenshot({ path: join(HIER, '../test-results-e2e/02-in-der-welt.png') });
    await page.screenshot({ path: join(HIER, '../test-results-e2e/02-in-der-welt.jpg'), type: 'jpeg', quality: 55 });
  });

  test('c1) Chat-Befehl über die Tastatur erreicht den Server', async () => {
    await page.locator('canvas').click({ position: { x: 512, y: 300 } });
    await page.keyboard.press('t');
    await page.waitForTimeout(1000);
    await page.keyboard.type('/test_gehege', { delay: 50 });
    await page.keyboard.press('Enter');
    const befehl = await warteAufLog('luanti', new RegExp(`\\[mintforge\\] TEST: /test_gehege von ${NAME}`), 20_000);
    await page.screenshot({ path: join(HIER, '../test-results-e2e/03-nach-chat.png') });
    expect(befehl, 'Chat-Befehl kam beim Server an').not.toBeNull();
  });

  test('c) Quest gelöst: Empfänger bekommt das Ergebnis mit Pseudonym', async () => {
    // Kam die Tastatur nicht an, baut die Testhilfe das Gehege 60 s nach dem Beitritt selbst.
    const zeile = await warteAufLog('ergebnis', new RegExp(`ERGEBNIS .*"pseudonym":"${NAME}"`), 90_000);
    expect(zeile, 'POST beim Empfänger').not.toBeNull();
    const daten = JSON.parse(zeile.slice(zeile.indexOf('{')));
    expect(daten).toMatchObject({ quest: 'gehege-24', pseudonym: NAME, geschafft: true, flaeche: 24, zaunlaenge: 24 });
    sichere('ergebnis.json', JSON.stringify(daten, null, 2));
    await page.waitForTimeout(3000);
    await page.screenshot({ path: join(HIER, '../test-results-e2e/04-gehege.png') });
    await page.screenshot({ path: join(HIER, '../test-results-e2e/04-gehege.jpg'), type: 'jpeg', quality: 55 });
  });
});

test('d) Falsches Token wird abgelehnt', async ({ page }) => {
  const NAME = 'Dachs_12';
  const konsole = [];
  await starte(page, NAME, 'mf1-000000000000000000000000', konsole);
  const abgelehnt = await warteAufLog('luanti', new RegExp(`User ${NAME} at .* supplied wrong password`), 180_000);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: join(HIER, '../test-results-e2e/05-falsches-token.png') });
  sichere('browser-konsole-falsches-token.txt', konsole);
  expect(abgelehnt, 'Server lehnt das Passwort ab').not.toBeNull();
  expect(dienstLog('luanti')).not.toMatch(new RegExp(`${NAME} \\[[^\\]]+\\] joins game`));
});
