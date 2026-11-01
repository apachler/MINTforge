// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { origin, base } from "./site.config.mjs";

// Adresse und Basispfad kommen aus site.config.mjs (Umgebungsvariable SITE_URL), nie hart verdrahtet.
export default defineConfig({
  site: origin,
  base,
  trailingSlash: "always",
  output: "static",
  build: {
    format: "directory",
    // CSP erlaubt nur 'self': keine Inline-Styles, alles als eigene Datei
    inlineStylesheets: "never",
    assets: "assets",
  },
  compressHTML: true,
  devToolbar: { enabled: false },
  integrations: [
    sitemap({
      filter: (page) => !page.includes("/404"),
    }),
  ],
});
