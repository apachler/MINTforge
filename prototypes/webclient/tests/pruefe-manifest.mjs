// Prüft das Web-App-Manifest und die Seiten der PWA-Hülle auf die Regeln aus AGENTS.md.
//   node pruefe-manifest.mjs ../web

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const web = process.argv[2] || '../web';
const fehler = [];
const pruefe = (bedingung, text) => { if (!bedingung) fehler.push(text); };

// --- Manifest ---------------------------------------------------------------------------------------------
const manifest = JSON.parse(readFileSync(join(web, 'manifest.webmanifest'), 'utf8'));
for (const feld of ['name', 'short_name', 'start_url', 'scope', 'display', 'icons', 'lang', 'id']) {
  pruefe(manifest[feld] !== undefined, `Manifest: Feld "${feld}" fehlt`);
}
pruefe(manifest.lang === 'de-AT', 'Manifest: lang muss de-AT sein');
pruefe(manifest.short_name.length <= 12, 'Manifest: short_name länger als 12 Zeichen');
pruefe(['fullscreen', 'standalone'].includes(manifest.display), 'Manifest: display muss fullscreen/standalone sein');
pruefe(/^#[0-9A-Fa-f]{6}$/.test(manifest.theme_color || ''), 'Manifest: theme_color fehlt');
const groessen = new Set();
for (const icon of manifest.icons || []) {
  const pfad = join(web, icon.src);
  pruefe(existsSync(pfad), `Manifest: Icon ${icon.src} fehlt`);
  if (existsSync(pfad)) {
    const png = readFileSync(pfad);
    pruefe(png.subarray(1, 4).toString() === 'PNG', `Icon ${icon.src} ist kein PNG`);
    const [b, h] = [png.readUInt32BE(16), png.readUInt32BE(20)];
    pruefe(icon.sizes === `${b}x${h}`, `Icon ${icon.src}: sizes ${icon.sizes}, Datei ist ${b}x${h}`);
  }
  groessen.add(`${icon.sizes}/${icon.purpose || 'any'}`);
}
pruefe(groessen.has('192x192/any') && groessen.has('512x512/any'), 'Manifest: Icons 192 und 512 nötig');
pruefe([...groessen].some((g) => g.endsWith('/maskable')), 'Manifest: maskable-Icon fehlt');

// --- Seiten -----------------------------------------------------------------------------------------------
for (const datei of readdirSync(web).filter((d) => d.endsWith('.html'))) {
  const html = readFileSync(join(web, datei), 'utf8');
  const titel = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  pruefe(/<html lang="de-AT">/.test(html), `${datei}: lang="de-AT" fehlt`);
  pruefe(titel && titel.length <= 70, `${datei}: Title fehlt oder länger als 70 Zeichen`);
  pruefe(/<meta name="description" content="[^"]+">/.test(html), `${datei}: Meta-Description fehlt`);
  pruefe(/http-equiv="Content-Security-Policy"/.test(html), `${datei}: CSP fehlt`);
  pruefe((html.match(/<h1[\s>]/g) || []).length === 1, `${datei}: genau eine h1`);
  pruefe(/<link rel="manifest" href="manifest.webmanifest">/.test(html), `${datei}: Manifest nicht verlinkt`);
  // Keine Inline-Skripte, keine style-Attribute, keine externen Ressourcen
  pruefe(!/<script(?![^>]*\ssrc=)[^>]*>/.test(html), `${datei}: Inline-Skript gefunden`);
  pruefe(!/\sstyle="/.test(html), `${datei}: style-Attribut gefunden`);
  pruefe(!/\son[a-z]+="/.test(html), `${datei}: Inline-Event-Handler gefunden`);
  for (const [, url] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const extern = /^(https?:)?\/\//.test(url);
    // Externe Links zum Lesen (Lizenzhinweise) sind erlaubt, geladene Ressourcen nicht.
    const istLink = new RegExp(`<a [^>]*href="${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`).test(html);
    pruefe(!extern || istLink, `${datei}: externe Ressource ${url}`);
  }
  if (datei === 'index.html') {
    pruefe(html.includes('Kein offizielles Minecraft-Produkt. Nicht von Mojang oder Microsoft genehmigt oder mit '
      + 'ihnen verbunden.'), 'index.html: Hinweis „Kein offizielles Minecraft-Produkt …“ fehlt');
  }
}

if (fehler.length) {
  console.error(fehler.map((f) => `✗ ${f}`).join('\n'));
  process.exit(1);
}
console.log('✓ Manifest und Seiten in Ordnung');
