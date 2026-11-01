#!/usr/bin/env node
// Prüft den Astro-Build (website/dist) vor dem Deploy, ohne Abhängigkeiten:
// - jedes lokale href, src und srcset zeigt auf eine vorhandene Datei, jedes #fragment auf eine id der Zielseite;
//   interne Links laufen über den Basispfad (z. B. /mintforge/)
// - jede Seite: lang="de-AT", genau eine h1, Title (≤ 70 Zeichen), Meta-Description, Canonical = eigene Adresse
//   (außer noindex-Seiten wie 404), Eintrag in der Sitemap, CSP-Meta nur mit 'self', Footer-Hinweis zu Minecraft
// - Bilder mit alt, width und height
// - keine externen Ressourcen (Skripte, Styles, Bilder, Schriften, iframes, CSS-url()/@import auf fremde Hosts)
// - keine Inline-Skripte, <style>-Blöcke, style-Attribute oder on*-Handler (CSP)
// Externe Links (<a href="https://…">) werden nicht abgerufen.
//
//   node tools/check-site.mjs [build-dir]
// Adresse und Basispfad kommen aus website/site.config.mjs (Umgebungsvariablen SITE_URL, BASE_PATH).
// Übernommen aus apachler/violetveinsmp (tools/check-site.mjs) und für Astro/GitHub Pages erweitert.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const { origin: ORIGIN, base: BASE } = await import(join(here, "..", "website", "site.config.mjs"));
const root = resolve(process.argv[2] ?? join(here, "..", "website", "dist"));
const DISCLAIMER = "Kein offizielles Minecraft-Produkt. Nicht von Mojang oder Microsoft genehmigt oder mit ihnen verbunden.";
const problems = [];
const fail = (page, msg) => problems.push(`${page}: ${msg}`);

if (!existsSync(root)) {
  console.error(`kein Ordner ${root}: nichts geprüft (zuerst npm run build)`);
  process.exit(1);
}
const walk = (dir) =>
  readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));
const files = walk(root);
const pages = files.filter((f) => f.endsWith(".html"));
if (pages.length === 0) {
  console.error(`keine Seiten unter ${root}: nichts geprüft`);
  process.exit(1);
}

const attrs = (html, name) => [...html.matchAll(new RegExp(`\\s${name}="([^"]*)"`, "g"))].map((m) => m[1]);
const ids = (html) => new Set(attrs(html, "id"));
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map((m) => m[0]);
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
// Adresse einer Datei im Build, mit Basispfad: index.html → /mintforge/, konzept/index.html → /mintforge/konzept/
const urlPath = (file) => BASE + relative(root, file).replace(/(^|\/)index\.html$/, "$1");
const fileFor = (path) => {
  const f = join(root, decodeURIComponent(path.slice(BASE.length)));
  if (existsSync(f) && statSync(f).isDirectory()) return join(f, "index.html");
  return f;
};

const html = new Map(pages.map((p) => [urlPath(p), readFileSync(p, "utf8")]));
let links = 0;

// Sitemap: alle <loc>-Einträge aus sitemap-*.xml
const sitemap = new Set(
  files
    .filter((f) => /sitemap-\d+\.xml$/.test(f))
    .flatMap((f) => [...readFileSync(f, "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])),
);
if (sitemap.size === 0) fail("sitemap", "keine Sitemap (sitemap-0.xml) im Build");
const robots = join(root, "robots.txt");
if (!existsSync(robots)) fail("robots.txt", "fehlt");
else if (!readFileSync(robots, "utf8").includes(`Sitemap: ${ORIGIN}${BASE}sitemap-index.xml`))
  fail("robots.txt", `nennt nicht die Sitemap ${ORIGIN}${BASE}sitemap-index.xml`);

for (const [page, src] of html) {
  const self = ORIGIN + page;
  const noindex = /<meta name="robots" content="noindex"/.test(src);

  // Kopf und Metadaten
  if (!/<html lang="de-AT"/.test(src)) fail(page, 'kein lang="de-AT" auf <html>');
  const title = src.match(/<title>([^<]*)<\/title>/)?.[1];
  if (!title) fail(page, "kein <title>");
  else if (decode(title).length > 70) fail(page, `Title hat ${decode(title).length} Zeichen (max. 70): ${decode(title)}`);
  const description = src.match(/<meta name="description" content="([^"]*)"/)?.[1];
  if (!description || description.trim().length < 50) fail(page, "keine oder zu kurze Meta-Description");
  const canonical = src.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
  if (noindex) {
    if (canonical) fail(page, "noindex-Seite mit Canonical");
    if (sitemap.has(self)) fail(page, "noindex-Seite steht in der Sitemap");
  } else {
    if (!canonical) fail(page, "kein Canonical");
    else if (canonical !== self) fail(page, `Canonical ${canonical} ist nicht die eigene Adresse ${self}`);
    if (!sitemap.has(self)) fail(page, `fehlt in der Sitemap (${self})`);
  }
  const csp = src.match(/<meta http-equiv="Content-Security-Policy" content="([^"]*)"/)?.[1];
  if (!csp) fail(page, "keine CSP als <meta http-equiv>");
  else {
    if (!/default-src 'self'/.test(csp)) fail(page, "CSP ohne default-src 'self'");
    if (/unsafe-inline|unsafe-eval|https?:|data:|\*/.test(csp)) fail(page, `CSP erlaubt mehr als 'self': ${csp}`);
  }
  const h1 = tags(src, "h1").length;
  if (h1 !== 1) fail(page, `${h1} <h1> statt genau einer`);
  if (!src.includes(DISCLAIMER)) fail(page, "Hinweis „Kein offizielles Minecraft-Produkt …“ fehlt");

  // Bilder
  for (const img of tags(src, "img")) {
    for (const a of ["alt", "width", "height"]) if (attr(img, a) === undefined) fail(page, `Bild ohne ${a}: ${img}`);
  }

  // CSP: nichts Inline
  for (const s of tags(src, "script")) if (!attr(s, "src")) fail(page, `Inline-Skript: ${s}`);
  if (/<style\b/i.test(src)) fail(page, "<style>-Block (CSP erlaubt nur Stylesheets als Datei)");
  if (/\sstyle="/i.test(src)) fail(page, "style-Attribut (CSP)");
  const handler = src.match(/<[^>]+\son[a-z]+="/i);
  if (handler) fail(page, `Event-Handler-Attribut (CSP): ${handler[0]}`);
  if (/(href|src)="javascript:/i.test(src)) fail(page, "javascript:-URL");

  // externe Ressourcen: alles, was der Browser lädt (nicht <a href>)
  const geladen = [
    ...tags(src, "script").map((t) => attr(t, "src")),
    ...tags(src, "link").filter((t) => !/rel="(canonical|alternate)"/.test(t)).map((t) => attr(t, "href")),
    ...tags(src, "img").flatMap((t) => [attr(t, "src"), ...(attr(t, "srcset") ?? "").split(",").map((c) => c.trim().split(/\s+/)[0])]),
    ...tags(src, "source").flatMap((t) => [attr(t, "src"), ...(attr(t, "srcset") ?? "").split(",").map((c) => c.trim().split(/\s+/)[0])]),
    ...tags(src, "iframe").map((t) => attr(t, "src")),
    ...tags(src, "video").map((t) => attr(t, "src")),
    ...tags(src, "audio").map((t) => attr(t, "src")),
    ...tags(src, "object").map((t) => attr(t, "data")),
    ...tags(src, "embed").map((t) => attr(t, "src")),
  ].filter(Boolean);
  for (const r of geladen) if (/^(https?:)?\/\//i.test(r) && !r.startsWith(ORIGIN + BASE)) fail(page, `externe Ressource: ${r}`);
  if (tags(src, "iframe").length) fail(page, "iframe/Embed (keine Embeds)");

  // lokale Links und Anker
  const refs = [...attrs(src, "href"), ...attrs(src, "src"), ...attrs(src, "srcset").flatMap((s) => s.split(",").map((c) => c.trim().split(/\s+/)[0]))];
  for (let ref of refs.map(decode)) {
    if (ref.startsWith(ORIGIN)) ref = ref.slice(ORIGIN.length) || "/";
    if (/^[a-z]+:/i.test(ref) || ref.startsWith("//")) continue;
    links++;
    const [pathPart, frag] = ref.split("#");
    const path = pathPart === "" ? page : new URL(pathPart, ORIGIN + page).pathname;
    if (!path.startsWith(BASE)) {
      fail(page, `${ref} liegt außerhalb des Basispfads ${BASE} (Link ohne base?)`);
      continue;
    }
    const file = fileFor(path);
    if (!existsSync(file)) {
      fail(page, `${ref} → keine Datei ${relative(root, file)}`);
      continue;
    }
    if (frag) {
      const target = /\.(html|svg)$/.test(file) ? readFileSync(file, "utf8") : "";
      if (!ids(target).has(frag)) fail(page, `${ref} → keine id "${frag}"`);
    }
  }
}

// Stylesheets: keine fremden Hosts in url() oder @import
for (const css of files.filter((f) => f.endsWith(".css"))) {
  const src = readFileSync(css, "utf8");
  const name = relative(root, css);
  for (const m of src.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
    const u = m[1];
    if (/^(https?:)?\/\//i.test(u) && !u.startsWith(ORIGIN + BASE)) fail(name, `externe Ressource in CSS: ${u}`);
    else if (!/^(data:|#|https?:)/.test(u)) {
      const target = u.startsWith("/") ? fileFor(u.split(/[?#]/)[0]) : join(dirname(css), u.split(/[?#]/)[0]);
      if (!existsSync(target)) fail(name, `${u} → keine Datei`);
    }
  }
  for (const m of src.matchAll(/@import\s+(?:url\()?["']?([^"');]+)/g)) {
    if (/^(https?:)?\/\//i.test(m[1])) fail(name, `@import von fremdem Host: ${m[1]}`);
  }
}

if (links === 0) {
  console.error("keine lokalen Links gefunden: der Parser hat nichts gesehen, also wurde nichts geprüft");
  process.exit(1);
}
if (problems.length) {
  console.error(problems.join("\n"));
  console.error(`${problems.length} Problem(e) in ${html.size} Seiten`);
  process.exit(1);
}
console.log(
  `${html.size} Seiten unter ${ORIGIN}${BASE}, ${links} lokale Links: alle auflösbar; Metadaten, Canonicals, Sitemap, ` +
    "CSP und Footer passen; keine externen Ressourcen, nichts Inline",
);
