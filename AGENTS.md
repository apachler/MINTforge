# MINTcraft – Projektkontext für KI-Assistenten

Diese Datei ist die gemeinsame Grundlage für **Claude Code** und **GitHub Copilot** (`CLAUDE.md` bindet sie ein).
Regeln hier gelten für alle Änderungen im Repo. Das ausführliche Konzept steht in [`docs/konzept.md`](docs/konzept.md).

## Projekt

MINTcraft ist eine Lernplattform für Mathematik, Informatik, Naturwissenschaften und Technik im deutschsprachigen Raum,
von der Volksschule bis zur HTL. Minecraft ist das Labor, eine Lernplattform (voraussichtlich Moodle) das Forschungsheft.
Zielgruppe der Website sind vor allem **Lehrkräfte, Schulen und Förderstellen**.

**Aktuelle Phase: 1 – Brand und Website.** Lernplattform (Phase 3) und Minecraft-Server (Phase 4) kommen später;
dafür nichts vorwegnehmen, was die Entscheidungen in `docs/konzept.md` Kapitel 13 vorgreift.

- **Website:** GitHub Pages, Deploy über GitHub Actions
- **Sprache der Website und Inhalte:** Deutsch (`de-AT`). **Doku, Kommentare, Commits:** Deutsch.
- **Verantwortlich:** Andreas Pachler

## Grundsätze

- **Das Repo ist die einzige Quelle der Wahrheit:** Quests, Marke, Website, später Configs und Plugins.
- **Marke aus einem Generator:** Logos und Farben entstehen aus `brand/` (Skript + Design-Tokens), nie von Hand
  bearbeitete SVGs. Farben stehen an genau einer Stelle.
- **Alles wird in CI geprüft:** Funktion, Barrierefreiheit (WCAG 2.2 AA) und Aussehen (visuelle Tests). Fertig ist eine
  Änderung erst, wenn alle Prüfungen grün sind.
- **Pädagogik vor Spielmechanik:** Keine öffentlichen Ranglisten, keine Belohnungen gegen Geld, Reflexion gehört zu
  jeder Quest.

## Regeln für die Website

- Statische Seiten, Ausgabe reines HTML/CSS. JavaScript nur, wo es ohne nicht geht; die Seite funktioniert ohne.
- **Keine externen Ressourcen:** Schriften, Bilder und Skripte selbst gehostet, keine CDNs, Tracker, Embeds, Cookies.
- CSP als `<meta http-equiv="Content-Security-Policy">` (GitHub Pages kennt keine eigenen Header): nur `'self'`.
  Keine Inline-Skripte, keine `style`-Attribute.
- Farben, Abstände, Schriften nur über Design-Tokens. Mobile first ab 390 px, hell als Standard, dunkler Modus.
- Semantisch: eine `h1` pro Seite, Überschriften der Reihe nach, sprechende Linktexte, `alt`, `width`/`height`,
  Bilder als AVIF/WebP.
- Jede Seite: `lang="de-AT"`, Title ≤ 70 Zeichen, Meta-Description, Canonical, Eintrag in der Sitemap, Footer mit
  „Kein offizielles Minecraft-Produkt. Nicht von Mojang oder Microsoft genehmigt oder mit ihnen verbunden.“
- **Keine Minecraft-/Mojang-Logos, -Grafiken oder -Schriften**, kein „Minecraft“ im Namen oder Logo.
- **Keine erfundenen Fakten:** keine Nutzerzahlen, Testimonials, Partner- oder Schullogos, Auszeichnungen oder
  Versprechen, die es nicht gibt. Geplantes ist als geplant gekennzeichnet.
- Sprache: ermutigend, klar, kein Marketing-Sprech. Gegenüber Lehrkräften fachlich, gegenüber Kindern einfach.
  Gendern mit Doppelpunkt (Schüler:innen).

## Abmachungen

Frei umsetzen: Website-Texte, Gestaltung im Rahmen der Marke, Tests, CI, Doku, Quest-Entwürfe.
**Vorher bei Andreas nachfragen:** alles, was Geld kostet (Domains, Dienste, Server), Markenentscheidungen (finales
Logo, Name, Claim), Lizenzwahl, rechtliche Texte (Impressum, Datenschutz) und alles, was personenbezogene Daten
verarbeitet.

## Was nie passieren darf

- Secrets committen (Tokens, Passwörter, Schlüssel).
- Externe Ressourcen oder Tracker auf der Website.
- Mojang-/Minecraft-Material verwenden.
- Personenbezogene Daten von Schüler:innen im Repo – auch nicht als Testdaten (nur erfundene Pseudonyme).

## Git

- **Nie** `git push --force`, `git push --delete` oder Historie auf `main` umschreiben – Fehler mit neuem Commit oder
  `git revert` beheben.
- Commit-Nachrichten kurz und aussagekräftig auf Deutsch.
- **Keine Werbung oder Attribution von Coding-Assistenten** in Commits oder PR-Beschreibungen: keine
  `Co-authored-by: Claude/Copilot`-Trailer, keine „Generated with …“-Fußzeilen, keine Session-Links. Der Workflow
  `attribution` lehnt sie ab; Claude Code hat sie in `.claude/settings.json` abgeschaltet.
- Git-Identität ist die des Menschen; ohne Identität setzt `tools/set-git-identity.sh` (SessionStart-Hook) die des
  Repo-Owners.
- Visuelle Referenzbilder nur bewusst aktualisieren (Label `visual-update`), nie, um einen roten Test grün zu machen.
