# Website

Statische Website von MINTforge mit [Astro](https://astro.build), veröffentlicht auf GitHub Pages:
**https://apachler.github.io/mintforge/**. Regeln in [`AGENTS.md`](../AGENTS.md#regeln-für-die-website).

```sh
cd website
npm ci
npm run dev          # Entwicklungsserver
npm run build        # Ausgabe in dist/
npm run check        # tools/check-site.mjs + html-validate
npm run test:a11y    # axe-core in Chromium und WebKit (npx playwright install chromium webkit)
```

## Aufbau

| Pfad | Inhalt |
|---|---|
| `site.config.mjs` | Adresse und Basispfad aus `SITE_URL` (sonst `GITHUB_REPOSITORY`, sonst `https://apachler.github.io/mintforge`) |
| `astro.config.mjs` | Astro: statisch, `base` aus `site.config.mjs`, keine Inline-Styles (`inlineStylesheets: 'never'`), Sitemap |
| `src/pages/` | Seiten: Start, Konzept, Für Lehrkräfte, Für Schulen, Marke, Impressum, Datenschutz, 404, `robots.txt` |
| `src/layouts/Seite.astro` | Kopf, CSP-Meta, Navigation, Fuß |
| `src/components/` | Quest-Karte mit Bereichs-Haut, Bereich, Hinweis |
| `src/styles/tokens.css` | **erzeugt** von `brand/build_brand.py` – nicht bearbeiten |
| `src/styles/site.css` | Gestaltung, nur mit Variablen aus `tokens.css` |
| `public/brand/`, `public/favicon.svg` | **erzeugt** von `brand/build_brand.py` |
| `tests/` | Playwright: `a11y.spec.ts`, `visual.spec.ts`; Referenzbilder in `tests/__screenshots__/` |

## Adresse und Domainwechsel

Alle internen Links laufen über den Basispfad (`url()` in `src/site.ts`). Für eine eigene Domain genügt
`SITE_URL=https://mintforge.at` – im Deploy kommt die Adresse automatisch aus `actions/configure-pages`.

## Visuelle Tests

Screenshots jeder Seite bei 390, 768 und 1440 px, hell und dunkel, laufen nur in CI im Container
`mcr.microsoft.com/playwright` (feste Version = `@playwright/test`), damit Schriften und Pixel stabil sind.

- Abweichung → Workflow `site` schlägt fehl, Diff-Bilder liegen im Artifact `playwright-report`.
- Gewollte Änderung → Label **`visual-update`** am PR: der Workflow erzeugt neue Referenzbilder und committet sie in den Branch.
- Die aktuellen Screenshots liegen bei jedem Lauf im Artifact `screenshots`, die gebaute Seite im Artifact `vorschau-dist`.

Nie Referenzbilder lokal erzeugen, und nie, um einen roten Test grün zu machen.
