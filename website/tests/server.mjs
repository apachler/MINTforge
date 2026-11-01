// Kleiner statischer Server für dist/ unter dem Basispfad – wie GitHub Pages (inkl. 404.html), ohne Abhängigkeiten.
//   node tests/server.mjs [port]
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { base } from "../site.config.mjs";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const port = Number(process.argv[2] ?? process.env.PORT ?? 4321);
const typen = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

async function datei(pfad) {
  const f = join(dist, normalize(pfad).replace(/^(\.\.[/\\])+/, ""));
  try {
    const s = await stat(f);
    return s.isDirectory() ? (await stat(join(f, "index.html")), join(f, "index.html")) : f;
  } catch {
    return null;
  }
}

createServer(async (req, res) => {
  const pfad = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (pfad === "/" && base !== "/") {
    res.writeHead(302, { Location: base }).end();
    return;
  }
  const f = pfad.startsWith(base) ? await datei(pfad.slice(base.length)) : null;
  if (f) {
    res.writeHead(200, { "Content-Type": typen[extname(f)] ?? "application/octet-stream" });
    res.end(await readFile(f));
  } else {
    res.writeHead(404, { "Content-Type": typen[".html"] });
    res.end(await readFile(join(dist, "404.html")));
  }
}).listen(port, "127.0.0.1", () => console.log(`dist/ unter http://127.0.0.1:${port}${base}`));
