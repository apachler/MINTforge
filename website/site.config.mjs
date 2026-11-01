// Öffentliche Adresse der Website – an genau einer Stelle, für Astro, tools/check-site.mjs und die Tests.
//
//   SITE_URL   volle Adresse inkl. Basispfad, z. B. https://apachler.github.io/mintforge oder https://mintforge.at
//              (in CI aus actions/configure-pages `base_url`)
//   BASE_PATH  optional, überschreibt den Basispfad (sonst der Pfad aus SITE_URL)
//
// Ohne SITE_URL wird die Adresse aus GITHUB_REPOSITORY (owner/repo) abgeleitet, sonst gilt der Standard.
// Ein Domainwechsel ändert nur SITE_URL.
const STANDARD = "https://apachler.github.io/mintforge";

function ausRepo() {
  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo || !repo.includes("/")) return undefined;
  const [owner, name] = repo.split("/");
  return `https://${owner.toLowerCase()}.github.io/${name}`;
}

const url = new URL(process.env.SITE_URL || ausRepo() || STANDARD);
const pfad = process.env.BASE_PATH ?? url.pathname;

/** Ursprung ohne Pfad, z. B. https://apachler.github.io */
export const origin = url.origin;
/** Basispfad mit Schrägstrich am Anfang und am Ende, z. B. /mintforge/ oder / */
export const base = ("/" + pfad.replace(/^\/+|\/+$/g, "") + "/").replace(/^\/\/$/, "/");
/** Volle Adresse der Startseite, z. B. https://apachler.github.io/mintforge/ */
export const siteUrl = origin + base;
/** Repo für den Quellcode-Link */
export const repo = process.env.GITHUB_REPOSITORY || "apachler/mintforge";
