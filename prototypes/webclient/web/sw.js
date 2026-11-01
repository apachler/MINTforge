// Service Worker der MINTforge-PWA (Prototyp)
//
// - Hülle (Seiten, Skripte, Icons): beim Installieren vorab gespeichert, danach „erst Netz, sonst Speicher“,
//   damit Änderungen sofort ankommen und die Startseite auch offline erscheint.
// - Client-Dateien unter client/<release>/ (luanti.wasm, luanti.js, Packs): „erst Speicher“. Das Verzeichnis
//   trägt eine zufällige Release-Kennung aus build_www.sh, ein neuer Build hat also neue Adressen.
// - WebSocket-Verbindungen zum Proxy laufen nicht über den Service Worker.
//
// Gespeicherte Antworten behalten ihre Header (COOP/COEP), sonst wäre die Seite nicht mehr cross-origin-isoliert.
// Die Packs speichert minetest-wasm zusätzlich im OPFS; der Zwischenspeicher hier spart vor allem den
// Download von luanti.wasm bei jedem Start.

const VERSION = 'huelle-1';
const HUELLE = `mintforge-${VERSION}`;
const CLIENT = 'mintforge-client';

const HUELLE_DATEIEN = [
  './',
  './index.html',
  './spiel.html',
  './manifest.webmanifest',
  './assets/huelle.css',
  './assets/parameter.js',
  './assets/start.js',
  './assets/spiel.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(HUELLE).then((c) => c.addAll(HUELLE_DATEIEN)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith('mintforge-huelle-') && name !== HUELLE) {
        await caches.delete(name);
      }
    }
    // Alte Releases aus dem Client-Speicher werfen: behalten wird nur, was release.js gerade nennt.
    try {
      const antwort = await fetch('./client/release.js', { cache: 'no-store' });
      const aktuell = antwort.ok && (await antwort.text()).match(/MINTFORGE_RELEASE\s*=\s*'([^']+)'/);
      if (aktuell) {
        const c = await caches.open(CLIENT);
        for (const req of await c.keys()) {
          if (!new URL(req.url).pathname.includes(`/${aktuell[1]}/`)) {
            await c.delete(req);
          }
        }
      }
    } catch (e) {
      // offline: aufräumen beim nächsten Mal
    }
    await self.clients.claim();
  })());
});

function istClientDatei(url) {
  return /\/client\/[0-9a-f]{12}\//.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  if (istClientDatei(url)) {
    event.respondWith((async () => {
      const c = await caches.open(CLIENT);
      const gespeichert = await c.match(event.request);
      if (gespeichert) {
        return gespeichert;
      }
      const antwort = await fetch(event.request);
      if (antwort.ok) {
        c.put(event.request, antwort.clone());
      }
      return antwort;
    })());
    return;
  }

  event.respondWith((async () => {
    try {
      const antwort = await fetch(event.request);
      if (antwort.ok && HUELLE_DATEIEN.some((d) => url.pathname.endsWith(d.replace(/^\./, '')))) {
        const c = await caches.open(HUELLE);
        c.put(event.request, antwort.clone());
      }
      return antwort;
    } catch (e) {
      const gespeichert = await caches.match(event.request, { ignoreSearch: true });
      if (gespeichert) {
        return gespeichert;
      }
      throw e;
    }
  })());
});
