// Statischer Testserver für die PWA-Hülle: liefert web/ mit denselben Headern wie der Caddyfile
// (COOP/COEP, damit die Seite cross-origin-isoliert ist). Nur für Tests, ohne Abhängigkeiten.
//   node browser/server.mjs [port]

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const WEB = resolve(fileURLToPath(new URL('../../web', import.meta.url)));
const PORT = Number(process.argv[2] || 4173);
const TYPEN = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
  '.wasm': 'application/wasm',
};

createServer(async (req, res) => {
  const pfad = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const datei = normalize(join(WEB, pfad.endsWith('/') ? `${pfad}index.html` : pfad));
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  if (!datei.startsWith(WEB)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const inhalt = await readFile(datei);
    res.writeHead(200, { 'Content-Type': TYPEN[extname(datei)] || 'application/octet-stream' });
    res.end(inhalt);
  } catch (e) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('nicht gefunden\n');
  }
}).listen(PORT, '127.0.0.1', () => console.log(`Testserver auf http://127.0.0.1:${PORT}/`));
