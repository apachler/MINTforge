// Hilfen für Adressen: alle internen Links laufen über den Basispfad (astro.config.mjs → site.config.mjs).
const BASE = import.meta.env.BASE_URL.endsWith("/") ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + "/";

/** Interner Pfad mit Basispfad: url("konzept/") → /mintforge/konzept/ */
export function url(pfad = ""): string {
  return BASE + pfad.replace(/^\/+/, "");
}

export const navigation = [
  { pfad: "", titel: "Start" },
  { pfad: "konzept/", titel: "Konzept" },
  { pfad: "lehrkraefte/", titel: "Für Lehrkräfte" },
  { pfad: "schulen/", titel: "Für Schulen" },
  { pfad: "marke/", titel: "Marke" },
];

export const disclaimer =
  "Kein offizielles Minecraft-Produkt. Nicht von Mojang oder Microsoft genehmigt oder mit ihnen verbunden.";
