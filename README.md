<div align="center">

# MINTforge

### Wissen schmieden.

Mathematik, Informatik, Naturwissenschaften und Technik – bauen und experimentieren in der Blockwelt, verstehen und
reflektieren auf der Lernplattform. Für Oberstufe, HTL und andere höhere Schulen mit technischem Unterricht.

<sub>Früher MINTcraft.</sub>

[![site](https://github.com/apachler/mintforge/actions/workflows/site.yml/badge.svg)](https://github.com/apachler/mintforge/actions/workflows/site.yml)
[![deploy](https://github.com/apachler/mintforge/actions/workflows/deploy.yml/badge.svg)](https://github.com/apachler/mintforge/actions/workflows/deploy.yml)
[![attribution](https://github.com/apachler/mintforge/actions/workflows/attribution.yml/badge.svg)](https://github.com/apachler/mintforge/actions/workflows/attribution.yml)

**[Website](https://apachler.github.io/mintforge/)** · **[Konzeptpapier](docs/konzept.md)** · [Marke](brand) · [Marken- und Marktrecherche](docs/marktrecherche.md)

</div>

---

## Idee

**Minecraft ist das Labor, die Lernplattform ist das Forschungsheft.** Jede Quest folgt demselben Kreislauf:
verstehen (Plattform) → anwenden und experimentieren (Minecraft) → reflektieren und bewerten (Plattform).
Lehrkräfte bekommen fertige Stundenbilder, Differenzierung in drei Stufen, Lehrplanbezug und einen Live-Überblick.

## Stand

| Phase | Inhalt | Status |
|---|---|---|
| 0 · Grundlagen | Repo, Regeln, [Konzept](docs/konzept.md) | ✅ |
| 1 · Brand und Website | [Marke](brand), [Website](website) auf GitHub Pages, CI mit Barrierefreiheits- und visuellen Tests | 🔨 in Arbeit |
| 2 · Quest-Format | Quests als Daten, erste Quests, Katalog | ⏳ |
| 3 · MINTforge-Dienst | LTI-1.3-Werkzeug für eduvidual, Moodle und andere Lernplattformen | ⏳ |
| 4 · Spielserver und Self-Service | Welten je Klasse automatisch in der Hetzner Cloud; Minecraft Education oder Luanti im Browser | ⏳ |
| 5 · Pilot | eine Klasse | ⏳ |

## Aufbau

| Pfad | Inhalt |
|---|---|
| [`brand/`](brand) | Design-Tokens (`tokens.json`) und Generator für Logos, Symbole und CSS-Variablen |
| [`website/`](website) | Website (Astro, statisch), Tests mit Playwright |
| [`docs/`](docs) | Konzept und Doku |
| [`tools/`](tools) | Hilfsskripte, u. a. `check-site.mjs` |
| `.github/` | Workflows (`site`, `deploy`, `attribution`), Dependabot |
| [`AGENTS.md`](AGENTS.md), [`CLAUDE.md`](CLAUDE.md) | Regeln für KI-Assistenten |

## Lizenz

Code (Website, Werkzeuge) unter der [EUPL-1.2](LICENSE). Quests und Unterrichtsmaterial sollen unter CC BY-SA 4.0
stehen (ab Phase 2). Name und Logo von MINTforge sind von den freien Lizenzen ausgenommen.

---

<div align="center">
<sub>MINTforge ist kein offizielles Minecraft-Produkt. Nicht von Mojang oder Microsoft genehmigt oder mit ihnen verbunden.</sub>
</div>
