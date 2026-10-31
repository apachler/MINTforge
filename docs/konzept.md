# MINTcraft – Konzeptpapier

**Lernen mit Kopf, Hand und Blöcken.** Eine Lernplattform für Mathematik, Informatik, Naturwissenschaften und Technik,
die Minecraft als Labor und eine Lernplattform als Forschungsheft verbindet – für den deutschsprachigen Raum, von der
Volksschule bis zur HTL.

| | |
|---|---|
| Stand | 31.10.2026, Entwurf 2 (nach [Marken- und Marktrecherche](marktrecherche.md)) |
| Verantwortlich | Andreas Pachler |
| Status | Phase 0 (Grundlagen) abgeschlossen mit diesem Dokument, Phase 1 (Brand und Website) als Nächstes |

---

## Inhalt

1. [Kurzfassung](#1-kurzfassung)
2. [Die Idee](#2-die-idee)
3. [Zielgruppen und Rollen](#3-zielgruppen-und-rollen)
4. [Pädagogisches Konzept](#4-pädagogisches-konzept)
5. [Welt und Geschichte](#5-welt-und-geschichte)
6. [Inhalte über alle Schulstufen](#6-inhalte-über-alle-schulstufen)
7. [Systemarchitektur](#7-systemarchitektur)
8. [Phasenplan](#8-phasenplan)
9. [Phase 1 im Detail: Brand und Website](#9-phase-1-im-detail-brand-und-website)
10. [CI: Alles automatisch prüfen](#10-ci-alles-automatisch-prüfen)
11. [Was wir von VioletVein SMP übernehmen](#11-was-wir-von-violetvein-smp-übernehmen)
12. [Recht, Datenschutz und Lizenzen](#12-recht-datenschutz-und-lizenzen)
13. [Offene Entscheidungen](#13-offene-entscheidungen)
14. [Nächste Schritte](#14-nächste-schritte)

---

## 1. Kurzfassung

MINTcraft ist kein Spiel mit angehängten Aufgaben und keine Lernplattform mit Spielpunkten. Es ist ein **Lernkreislauf**:
Schüler:innen verstehen ein Konzept auf der Lernplattform, wenden es in Minecraft an, experimentieren, scheitern,
verbessern – und reflektieren danach wieder auf der Plattform, wo die Lehrkraft Fortschritt sieht und bewertet.

Drei Dinge machen MINTcraft im Unterricht wirklich einsetzbar:

1. **Lehrplanbezug:** Jede Quest ist auf österreichische Lehrpläne und Kompetenzmodelle gemappt, später auch auf
   KMK-Bildungsstandards (DE) und Lehrplan 21 (CH).
2. **Werkzeuge für Lehrkräfte:** fertige Stundenbilder, Differenzierung in drei Stufen, Live-Überblick, Kontrolle über
   die Spielwelt, automatische Prüfung und Rückmeldung in die Bewertung.
3. **Quests als offene Daten:** Jede Quest ist eine Datei im Repo – geprüft durch CI, angezeigt auf der Website,
   importiert in Lernplattform und Server. Eine Quelle der Wahrheit, frei lizenziert als Open Educational Resource.

Zwei Grundentscheidungen folgen aus der [Marktrecherche](marktrecherche.md):

- **Keine Java-Lizenzen:** Java pro Kind ist an Schulen unrealistisch. Zwei Wege werden als Prototypen verglichen:
  Minecraft Education (Lizenzen an Schulen oft vorhanden) und Luanti mit eigenem Web-Client – ohne Installation,
  ohne Lizenz, auch auf iPads.
- **MINTcraft als LTI-Werkzeug statt Moodle-Plugin:** Lehrkräfte binden es selbst in eduvidual, jedes Moodle oder
  andere Lernplattformen ein, ohne dass jemand etwas installieren muss.
- **Self-Service-Backend:** Spielwelten je Klasse entstehen automatisch nach Stundenplan in der Hetzner Cloud und
  verschwinden danach wieder.

Gebaut wird in Phasen. **Zuerst die Marke und die Website**, weil sie Lehrkräfte, Schulen und Förderstellen überzeugen
müssen, bevor es Technik gibt. Parallel prüfen zwei Prototypen die Technik; MINTcraft-Dienst und Spielserver folgen. Von Anfang an prüft CI jede Änderung –
Funktion, Barrierefreiheit und Aussehen.

## 2. Die Idee

### Minecraft ist das Labor, die Plattform ist das Forschungsheft

```mermaid
flowchart LR
    V["📖 Verstehen<br/>Lernplattform:<br/>Erklärung, Video, Beispiel"] --> A["⛏️ Anwenden<br/>Minecraft:<br/>bauen, messen, programmieren"]
    A --> R["📝 Reflektieren<br/>Lernplattform:<br/>Fragen, Daten, Begründung"]
    R --> B["✅ Rückmeldung<br/>automatisch + Lehrkraft"]
    B --> V
```

| Ort | Wofür er stark ist |
|---|---|
| **Lernplattform** | Erklären, strukturieren, dokumentieren, bewerten, differenzieren, Elternkommunikation |
| **Minecraft** | räumliches Denken, Ausprobieren ohne Kosten und Gefahr, Zusammenarbeit, sofortige Rückmeldung der Welt |

Die Spielwelt wird nicht als Belohnung *nach* dem Lernen verwendet, sondern als Ort, an dem gelernt wird. Wer die Fläche
eines Geheges falsch berechnet, sieht es: Die Tiere passen nicht hinein.

### Was MINTcraft von bestehenden Angeboten unterscheidet

| Bestehend | Lücke | MINTcraft |
|---|---|---|
| Minecraft Education mit Lernwelten | meist englisch, Einzelstunden ohne Lehrplanpfad, wenig Bewertungsanbindung | deutschsprachig, durchgehender Pfad von VS bis HTL, Bewertung direkt in der Lernplattform der Schule |
| Moodle-Kurse | trocken, wenig Handlungsorientierung | Handeln in der Welt, Ergebnis automatisch zurück |
| Coding-Plattformen | auf Informatik beschränkt | alle vier MINT-Bereiche, fächerverbindend |

## 3. Zielgruppen und Rollen

| Rolle | Braucht | Bekommt |
|---|---|---|
| **Schüler:in** | Motivation, klare Ziele, Erfolgserlebnisse auf eigenem Niveau | Quests, Stufen, sichtbaren Fortschritt in der Welt |
| **Lehrkraft** | wenig Vorbereitung, Kontrolle, Bewertungsgrundlage, Lehrplanbezug | Stundenbilder, Dashboard, Werkzeuge im Spiel, Kompetenzmapping |
| **Schule / Direktion** | Datenschutz, Kosten, pädagogischer Wert, einfache Einführung | DSGVO-Konzept, Hosting in der EU, Pilotberichte |
| **Eltern** | Vertrauen, kein „nur Spielen“ | transparente Lernziele, Elterninfo, kein offener Chat |
| **Quest-Autor:in** (später auch Lehrkräfte) | einfaches Format, Qualitätsrahmen | Quest-Vorlage, Prüfung durch CI, Review |

## 4. Pädagogisches Konzept

### Die Quest als Lerneinheit

Jede Quest folgt derselben Struktur – so kennen sich Lehrkräfte und Schüler:innen nach der ersten Quest aus.

| Feld | Beispiel |
|---|---|
| Titel | Das Gehege im Zahlenturm |
| Fach, Schulstufe | Mathematik, 5.–6. Schulstufe |
| Lernziel (Kompetenz) | Flächeninhalt von Rechtecken berechnen und anwenden |
| Lehrplanbezug | Lehrplan MS/AHS-Unterstufe Mathematik, Bereich Geometrie; Bildungsstandards M8 |
| Dauer | 1 Unterrichtseinheit (50 min) |
| Vorwissen | Multiplikation, Begriff Fläche |
| Ablauf | Verstehen (10 min) → Anwenden (25 min) → Reflektieren (15 min) |
| Stufen | 🥉 Bronze: Rechteck mit 24 m² · 🥈 Silber: zwei Gehege, gesamt 60 m² · 🥇 Gold: größtes Gehege mit 30 m Zaun |
| Automatische Prüfung | Fläche der eingezäunten Region, Zaun geschlossen |
| Reflexion | Warum ist das quadratische Gehege bei gleichem Zaun das größte? |
| Lehrerhandreichung | Lösungen, typische Fehler, Differenzierungstipps, Varianten |

### Didaktische Grundsätze

- **Handlung vor Belohnung:** Spielerisches entsteht aus dem Tun, nicht aus Punkten.
- **Drei Stufen statt drei Klassen:** Alle arbeiten am selben Thema, auf eigenem Niveau. Wer Gold schafft, hilft.
- **Fehler sind Daten:** Die Welt zeigt sofort, was nicht stimmt. Wiederholen kostet nichts.
- **Zusammenarbeit:** Viele Quests gibt es als Teamvariante mit verteilten Rollen (Planer:in, Bauer:in, Prüfer:in).
- **Reflexion ist Pflicht:** Erst die Begründung auf der Plattform schließt eine Quest ab. Das ist die Bewertungsgrundlage.
- **Fächerverbindend:** Größere Projekte verbinden Bereiche, z. B. ein Kraftwerk (Physik, Mathe, Informatik).

### Gamification mit Bedacht

| Ja | Nein |
|---|---|
| Klassenziele („Wir haben die Brücke gemeinsam gebaut“) | öffentliche Ranglisten |
| Freischaltungen in der Welt, die man sieht | Punkte als Selbstzweck |
| Open Badges für Kompetenzen, die außerhalb gelten | Belohnungen gegen echtes Geld |
| kosmetische Belohnungen | Zeitdruck als Standard |

### Bewertung

Die Bewertung kombiniert **automatische Prüfung** (Ziel in der Welt erreicht, Stufe) und **Reflexion** (Begründung,
Daten, Fehleranalyse). Die Lehrkraft entscheidet, was in die Note einfließt. Ergebnisse werden als Kompetenzen
erfasst, nicht nur als Punkte – passend zu kompetenzorientierter Leistungsbeurteilung.

### Inklusion und Barrierefreiheit

- Plattform und Website nach WCAG 2.2 AA, gut lesbare Schrift, einfache Sprache in den unteren Stufen.
- Aufgaben zusätzlich vorgelesen (Plattform), Bauvorgaben auch als Bild.
- Stufen und Teamrollen erlauben unterschiedliche Stärken.
- Kein Pflicht-Ressourcenpaket, das schwache Schulrechner überfordert.

## 5. Welt und Geschichte

Eine durchgehende Geschichte macht aus einzelnen Stunden eine Reise. Arbeitsname: **MINTaria** – eine Welt, deren
Wissen verloren ging und die Stück für Stück wieder aufgebaut wird. Jede gelöste Quest stellt etwas wieder her,
das alle sehen.

| Reich | Fach | Bild |
|---|---|---|
| 🔢 Zahlenturm | Mathematik | ein Turm, dessen Stockwerke durch Rätsel und Konstruktionen freigeschaltet werden |
| 💡 Redstone-Werkstatt | Informatik | Logik, Schaltungen, Automaten, Roboter |
| 🌱 Biom-Labor | Biologie, Ökologie | Ökosysteme, Wachstum, Kreisläufe |
| ⚗️ Alchemistenhalle | Chemie | Stoffe, Reaktionen, Brauen als Modell |
| ⚙️ Ingenieursinsel | Physik, Technik | Mechanik, Energie, Bauwerke, Stromnetze |

Die Geschichte bleibt kindgerecht und gewaltfrei. Für ältere Stufen wird sie zur Kulisse; im Vordergrund stehen echte
Projekte und Daten.

## 6. Inhalte über alle Schulstufen

| Stufe | Mathematik | Informatik | Naturwissenschaften | Technik |
|---|---|---|---|---|
| **Volksschule** (1.–4.) | Zählen, Muster, Formen, Symmetrie, Maßstab mit Blöcken | Befehlsfolgen, Schleifen mit Blöcken | Wasserkreislauf, Tiere und Lebensräume | nach Bauplan bauen, Hebel |
| **Unterstufe** (5.–8.) | Koordinaten, Flächen, Volumen, Prozent, Proportionen | Logikgatter, Binärzahlen, Algorithmen | Ökosysteme, Nahrungsnetze, Stoffe trennen | Stromkreise, einfache Maschinen |
| **Oberstufe** (9.–12./13.) | Funktionen, Vektoren, Trigonometrie, Statistik, Wahrscheinlichkeit | Python, Datenstrukturen, Simulation | Reaktionen, Genetik, Experimente mit Datenauswertung | Energie, Wirkungsgrad, Regelkreise |
| **HTL** | angewandte Mathematik, numerische Verfahren | Redstone-ALU bis Mini-CPU, Python/Lua-Automatisierung, Netzwerke, Datenbanken | Werkstoffe, Prozesse | Elektrotechnik, Automatisierung, Steuerungen, Projektarbeit |

Am Anfang steht **ein enger Kern: Unterstufe (5.–8. Schulstufe), Digitale Grundbildung und Mathematik.**
Digitale Grundbildung ist seit 2022 Pflichtfach mit einer Wochenstunde und Computational Thinking im Lehrplan –
der natürlichste Einstieg. Mathematik (Geometrie) ist gut erforscht und passt ideal zur Blockwelt. Weitere Fächer und
Stufen folgen erst, wenn der Kern im Unterricht funktioniert.

## 7. Systemarchitektur

```mermaid
flowchart TB
    Q["📂 quests/<br/>Quest-Dateien im Repo<br/>(Single Source of Truth)"] --> CI{"⚙️ CI<br/>Schema, Inhalte, Links"}
    CI --> W["🌐 Website<br/>GitHub Pages<br/>Marke + Quest-Katalog"]
    CI --> T["🧩 MINTcraft-Dienst<br/>LTI-1.3-Werkzeug<br/>Quests, Dashboard, Prüfung"]
    LMS["📚 Lernplattform der Schule<br/>eduvidual, Moodle, …"] <-- "LTI 1.3:<br/>Anmeldung, Aufgabe,<br/>Bewertung" --> T
    T -- "Self-Service:<br/>Welten starten/stoppen" --> H["☁️ Hetzner Cloud<br/>Spielserver je Klasse<br/>Education oder Luanti"]
    H -- "Ergebnis" --> T
    L["👩‍🏫 Lehrkraft"] --> LMS
    K["🧒 Schüler:in"] --> LMS
    K -- "Minecraft Education<br/>oder Browser (PWA)" --> H
```

**Kernprinzip aus VioletVein SMP übernommen: Das Repo ist die einzige Quelle der Wahrheit.** Quests, Marke, Website,
Konfigurationen und Plugins stehen im Repo. Nichts wird von Hand an einem Server geändert.

### Quests als Daten

Eine Quest ist ein Ordner unter `quests/` mit einer Datei für die Metadaten und Markdown für die Texte:

```text
quests/mathe/gehege-zahlenturm/
├── quest.yml          Metadaten: Fach, Stufe, Kompetenzen, Lehrplanbezug, Dauer, Stufen, Prüfregeln
├── schueler.md        Aufgabentext für Schüler:innen
├── lehrkraft.md       Handreichung mit Lösungen, typischen Fehlern, Varianten
├── reflexion.md       Reflexionsfragen
└── welt/              Bauvorlage und Startpunkt, ab Phase 4
```

CI prüft jede Quest gegen ein JSON-Schema. Die Website zeigt daraus den Quest-Katalog, der MINTcraft-Dienst bietet
sie Lehrkräften zur Auswahl an, der Server liest Startpunkt und Prüfregeln.

### Lernplattform: MINTcraft als LTI-Werkzeug

**Entscheidung: kein eigenes Moodle-Plugin, sondern ein eigener kleiner Dienst, der über LTI 1.3 in jede
Lernplattform eingebunden wird.** Grund: Auf eduvidual, der zentralen Moodle-Plattform des Bildungsministeriums,
kann keine Schule eigene Plugins installieren. Ein LTI-Werkzeug fügt die Lehrkraft dagegen selbst als „externes Tool“
in ihren Kurs ein – wie ein YouTube-Video, nur mit Anmeldung und Rückmeldung.

Was LTI 1.3 dabei übernimmt:

| LTI-Dienst | Wofür in MINTcraft |
|---|---|
| **Launch** (sichere Anmeldung) | Schüler:in klickt in Moodle auf die Quest und ist bei MINTcraft angemeldet – ohne zweites Passwort |
| **Deep Linking** | Lehrkraft wählt beim Einfügen eine Quest aus dem Katalog |
| **Assignment and Grade Services** | Stufe und Bewertung landen automatisch in der Bewertungsübersicht von Moodle |
| **Names and Role Provisioning** | Klassenliste für das Dashboard und die Server-Whitelist, als Pseudonyme |

Der Dienst selbst zeigt Aufgabe, Reflexion und das Live-Dashboard für die Lehrkraft. Bewertung, Kompetenzen, Badges
und Eltern bleiben in der Lernplattform der Schule – dort, wo Lehrkräfte ohnehin arbeiten.

Für Entwicklung und CI läuft eine Moodle-Testinstanz in Docker; der Dienst wird dort wie an einer Schule eingebunden.

### Spielplattform

**Ausgangspunkt: Minecraft Education oder Luanti – Java scheidet aus.** Für Minecraft Education spricht: Schulen haben die Lizenz oft schon (Microsoft-Schulvertrag bzw.
Microsoft 365 Education A3/A5), es läuft auf allen gängigen Schulgeräten, und seit August 2026 funktionieren Dedicated
Server auch über Schulgrenzen hinweg. Java ist an Schulen kaum lizenzierbar und läuft nicht auf iPads oder Chromebooks.

| | Minecraft Education | Minecraft Java + Paper | Luanti (Open Source) |
|---|---|---|---|
| Lizenzen an Schulen | Schullizenz, oft schon vorhanden | je Kind eine Java-Lizenz – unrealistisch | keine nötig, kostenlos (MIT) |
| Konten | Microsoft-Konto der Schule | Microsoft-Konto je Kind | eigene, frei wählbar (Pseudonyme) |
| Geräte | Windows, Mac, iPad, Chromebook, Android | Windows, Mac, Linux | Windows, Mac, Linux, Android – **kein iPad** |
| Eigene Erweiterungen | Bedrock-Add-ons und Skript-API | volle Paper-API | volle Lua-Mod-API, am offensten |
| Eigene Server | Dedicated Server, schulübergreifend | ja | ja, selbst gehostet |
| Lernwerkzeuge | Code Builder, Klassenmodus | keine | Mods aus der Community, kein fertiger Klassenmodus |
| Motivation der Kinder | „echtes Minecraft“ | „echtes Minecraft“ | ähnlich, aber nicht Minecraft |

| Baustein | Aufgabe |
|---|---|
| **Education Dedicated Server** | eigene Welten je Klasse, per Knopfdruck zurücksetzbar |
| **MINTcraft-Add-on** (Skript-API) | Quest starten (Teleport, Material), automatisch prüfen, Ergebnis an den MINTcraft-Dienst |
| **Lehrer-Werkzeuge** | Klassenmodus von Education plus eigene Befehle: alle zu mir holen, Bauen sperren, Welt zurücksetzen |
| **Code-Quests** | Code Builder (Blöcke, Python) |

**Für Luanti spricht:** keine Lizenzen, keine Microsoft-Konten (wichtig bei Datenschutzbedenken, in Deutschland
häufig), technisch die offenere Plattform – und mit eigenem Web-Client (unten) ohne Installation auf allen Geräten. Weil Quests als Daten im Repo
stehen und der MINTcraft-Dienst die Prüfung übernimmt, kann dieselbe Quest später auf beiden Plattformen laufen.
Java/Paper bleibt Option für HTL-Projekte und außerschulische Angebote; die Erfahrung aus VioletVein hilft dort.
Die technische Machbarkeit prüfen wir **früh mit zwei Prototypen** an echten Schulgeräten, nicht erst in Phase 4:
Minecraft Education mit Add-on und der Luanti-Web-Client (unten). Danach entscheiden wir mit Daten, welche Plattform
Hauptplattform wird.

### Luanti-Web-Client (Prototyp)

Ein Luanti-Client, der **im Browser** läuft – auch auf iPads, Chromebooks und gesperrten Schul-PCs, als PWA direkt vom
Startbildschirm. Damit entfallen Installation, Lizenzen und Microsoft-Konten, und das iPad-Problem von Luanti (kein
App Store) ist gelöst.

Grundlage ist der bestehende experimentelle Port [minetest-wasm](https://github.com/paradust7/minetest-wasm)
(WebAssembly/Emscripten, MIT, [Live-Demo](https://minetest.dustlabs.io/)) – ein Fork, kein Neubau.

```mermaid
flowchart LR
    LMS["📚 Moodle / eduvidual"] -- "LTI-Launch<br/>(ein Klick)" --> PWA["📱 MINTcraft-PWA<br/>Luanti als WebAssembly<br/>Touch-Steuerung"]
    PWA -- "WebSocket (wss)" --> P["🔀 Proxy<br/>WebSocket ↔ UDP"]
    P --> LS["⛏️ Luanti-Server<br/>Klassen-Welt<br/>MINTcraft-Mod"]
    LS -- "Ergebnis" --> T["🧩 MINTcraft-Dienst"]
```

| Baustein | Aufgabe |
|---|---|
| **WebAssembly-Client** | Fork von minetest-wasm, auf aktuelle Luanti-Version gebracht, ohne Hauptmenü: startet direkt in die Klassen-Welt |
| **Anmeldung** | LTI-Launch erzeugt ein kurzlebiges Token; der Client meldet sich damit unter Pseudonym an – kein Passwort |
| **Touch-Steuerung** | Steuerkreuz und Gesten für Tablets (iOS kennt keine Mauszeiger-Sperre) |
| **PWA** | Manifest, Service Worker, Symbol am Startbildschirm; Client-Dateien werden zwischengespeichert, Welten liegen am Server |
| **WebSocket-Proxy** | Browser können kein UDP; der Proxy auf Hetzner übersetzt WebSocket in das Luanti-Protokoll |
| **MINTcraft-Mod** (Lua) | Quest starten, automatisch prüfen, Lehrer-Werkzeuge, Ergebnis an den Dienst |

**Was der Prototyp beweisen muss** (auf einem Schul-iPad, einem Chromebook und einem Windows-Schulgerät):

- [ ] Start aus Moodle in die Welt in unter 30 Sekunden
- [ ] flüssig spielbar (Ziel ≥ 30 Bilder pro Sekunde) mit 25 Schüler:innen in einer Welt
- [ ] Touch-Steuerung ist für Kinder ohne Erklärung bedienbar
- [ ] läuft im Schulnetz (nur HTTPS/WSS über Port 443)
- [ ] eine Quest wird automatisch geprüft, das Ergebnis landet in Moodle

Risiken: Der Port ist experimentell und nur unter Ubuntu getestet; Leistung und Speichergrenzen von Safari auf älteren
iPads sind offen; die Pflege eines eigenen Forks kostet laufend Zeit.

### Self-Service-Backend auf Hetzner

Der MINTcraft-Dienst wird zur **Steuerzentrale** (Control Plane): Schulen und Lehrkräfte klicken, das Backend stellt
Spielserver, Welten und Speicher selbstständig in der Hetzner Cloud bereit, und baut sie wieder ab.

```mermaid
flowchart TB
    subgraph CP["🧩 MINTcraft-Dienst (Control Plane)"]
        R["Mandanten<br/>Schulen, LTI-Registrierungen"]
        PL["Planer<br/>Stundenplan → Welten"]
        O["Orchestrierung<br/>Hetzner-Cloud-API"]
    end
    SA["🏫 Schule"] -- "Registrierung" --> R
    LK["👩‍🏫 Lehrkraft"] -- "Quest im Kurs" --> PL
    PL --> O
    O --> POOL
    subgraph POOL["☁️ Hetzner Cloud: Server-Pool (wächst und schrumpft)"]
        C1["Container<br/>Welt 3a"]
        C2["Container<br/>Welt 4b"]
        C3["Container<br/>Welt 2c"]
    end
    POOL <--> OS["🗄️ Object Storage<br/>Welten, Sicherungen"]
```

**Ablauf für eine Schule:**

1. **Registrieren:** Die Schule legt einen Mandanten an und bekommt die LTI-Daten für ihr Moodle oder eduvidual.
2. **Quest einfügen:** Die Lehrkraft wählt im Kurs eine Quest; das Backend erzeugt die Klassen-Welt aus der Vorlage
   im Repo.
3. **Nach Stundenplan:** Die Welt startet kurz vor der Stunde, wird danach gesichert und gestoppt. Hetzner rechnet
   stundenweise ab – bezahlt wird im Wesentlichen die Unterrichtszeit.
4. **Zurücksetzen, wiederholen, weitergeben:** Welten liegen versioniert im Object Storage.

**Technische Grundsätze:**

| Grundsatz | Umsetzung |
|---|---|
| Container statt VM pro Klasse | ein Spielserver je Klasse als Container, startet in Sekunden; die VMs bilden einen Pool, den die Hetzner-Cloud-API nach Bedarf vergrößert und verkleinert |
| Infrastruktur als Code | Pool, Netz, Firewall, Object Storage mit OpenTofu im Repo; Images und Container gebaut und getestet in CI |
| Mandantentrennung | jede Schule in eigenem Netzbereich, eigene Schlüssel, keine Daten über Schulgrenzen |
| Datensparsamkeit | nur Pseudonyme aus LTI, keine Klarnamen im Spiel, Löschfristen automatisch |
| EU-Hosting | Rechenzentren von Hetzner in Deutschland bzw. Finnland, Auftragsverarbeitungsvertrag mit jeder Schule |
| Beobachtbarkeit | Gesundheitschecks je Welt, Kosten je Schule, Warnung bei Ausfall (Muster aus `uptime` von VioletVein) |

Für Luanti passt das ideal (kleiner Server, läuft unter Linux in Containern). Ob der Dedicated Server von Minecraft
Education unter Linux und in Containern läuft, klärt der Machbarkeitsprototyp.

**Betriebsmodell:** Mit dem Backend wird MINTcraft ein Dienst für Schulen – mit Verfügbarkeit, Support, Datenschutz-
verträgen und laufenden Serverkosten. Wer das trägt (Förderung, Schullizenz, Land, Verein), ist eine offene
Entscheidung, die vor dem Pilot geklärt sein muss.


## 8. Phasenplan

```mermaid
flowchart LR
    P0["0 · Grundlagen<br/>Repo, Regeln,<br/>Konzept"] --> P1["1 · Brand +<br/>Website<br/>GitHub Pages"]
    P0 --> V["Validierung<br/>Name, Interviews,<br/>Machbarkeit"]
    V --> P1
    P1 --> P2["2 · Quest-Format<br/>+ erste Quests<br/>Katalog auf Website"]
    P2 --> P3["3 · MINTcraft-Dienst<br/>LTI 1.3"]
    P2 --> P4["4 · Minecraft-<br/>Server<br/>Education + Add-on"]
    P3 --> P5["5 · Pilot<br/>eine Klasse"]
    P4 --> P5
```

| Phase | Ergebnis | Fertig, wenn |
|---|---|---|
| **0 · Grundlagen** | Repo, Regeln für Assistenten, CI-Grundgerüst, dieses Konzept | Konzept abgenommen |
| **Validierung** (parallel zu Phase 1) | Markenprüfung des Namens, 5–10 Gespräche mit Lehrkräften, zwei Machbarkeitsprototypen: Minecraft Education mit Add-on und Luanti-Web-Client, beide auf einem Testserver bei Hetzner | Name freigegeben oder ersetzt; Erkenntnisse aus den Gesprächen im Konzept; Prüfliste des Web-Client-Prototyps abgearbeitet; Entscheidung über die Hauptplattform |
| **1 · Brand und Website** | Name geprüft, Markenkern, Logo, Farben, Schrift, Website live auf GitHub Pages | Website live, alle CI-Prüfungen grün, Brand-Seite fertig |
| **2 · Quest-Format** | `quest.yml`-Schema, Vorlage, 8–10 Quests für die Unterstufe, Quest-Katalog auf der Website | Katalog live, jede Quest von einer Lehrkraft gegengelesen |
| **3 · MINTcraft-Dienst** | LTI-1.3-Werkzeug mit Quest-Auswahl, Aufgabe, Reflexion, Dashboard; Moodle-Testinstanz (Docker) in CI | Lehrkraft fügt Quest in Moodle ein, Schüler:in meldet sich ohne zweites Passwort an, Bewertung landet in Moodle |
| **4 · Spielserver und Self-Service** | Self-Service-Backend auf Hetzner (Pool, Container, Object Storage, Stundenplan), Klassen-Welten, MINTcraft-Add-on bzw. -Mod, Web-Client produktionsreif (falls Luanti) | Schule registriert sich selbst, Welt startet nach Stundenplan, Quest wird automatisch geprüft, Ergebnis kommt über den Dienst in Moodle an |
| **5 · Pilot** | eine Klasse, eine engagierte Lehrkraft, 4–6 Wochen | Feedback ausgewertet, Pilotbericht als Grundlage für Förderanträge |

Phase 3 und 4 können parallel laufen, sobald das Quest-Format steht.

## 9. Phase 1 im Detail: Brand und Website

### Markenkern (Entwurf, wird in Phase 1 geschärft)

| | |
|---|---|
| **Name** | MINTcraft – MINT plus *craft* (Handwerk, Bauen). Groß „MINT“, klein „craft“. |
| **Versprechen** | MINT begreifen, indem man es baut. |
| **Claim-Ideen** | „Lernen mit Kopf, Hand und Blöcken.“ · „Bau dir dein Verständnis.“ · „Wo Wissen Form annimmt.“ |
| **Werte** | neugierig, handfest, fair, offen (OER), sicher |
| **Ton** | ermutigend, klar, kein Marketing-Sprech; gegenüber Lehrkräften fachlich, gegenüber Kindern einfach |
| **Abgrenzung** | kein offizielles Minecraft-Produkt; eigene Bildsprache, keine Mojang-Grafiken, kein Minecraft-Font |

### Visuelle Richtung (Vorschlag als Ausgangspunkt)

- **Hauptfarbe Minzgrün** – das Wortspiel MINT/Minze trägt die Marke, ohne Erklärung.
- **Vier Säulenfarben**, eine je Bereich: Mathematik, Informatik, Naturwissenschaften, Technik. Sie kennzeichnen Reiche,
  Quests und Badges durchgängig auf Website, Plattform und im Spiel.
- **Bildmarke:** ein „M“ aus vier Blöcken in den Säulenfarben – Pixel-Ästhetik, aber eigenständig.
- **Wortmarke:** eigene Pixel-Schrift für „MINT“, gut lesbare Grotesk für „craft“ und alle Texte.
- **Schrift:** frei lizenziert (OFL) und selbst gehostet, z. B. Atkinson Hyperlegible – entwickelt für Lesbarkeit,
  hilfreich bei Sehschwäche und Leseschwierigkeiten.
- **Hell als Standard** (Schule, Beamer, Druck), dunkler Modus als Variante.

Alle Logos entstehen aus einem **Generator-Skript** (`brand/build_brand.py`, Prinzip aus VioletVein), nie von Hand.
Farben stehen an einer Stelle (Design-Tokens) und werden von Logos, Website und später Plattform und Server verwendet.
Für die Entscheidung erzeugen wir **zwei bis drei Varianten** und vergleichen sie anhand der CI-Screenshots.

### Website-Aufbau

| Seite | Inhalt | Für wen |
|---|---|---|
| Start | Versprechen, Lernkreislauf, die vier Reiche, Mitmachen | alle |
| Konzept | pädagogischer Ansatz, Stufen, Bewertung, Lehrplanbezug | Lehrkräfte, Direktionen |
| Für Lehrkräfte | wie eine Stunde abläuft, Beispiel-Quest, Pilot-Anmeldung | Lehrkräfte |
| Für Schulen | Datenschutz, Technik, Kosten, Einführung | Direktionen, IT |
| Quests (ab Phase 2) | Katalog, filterbar nach Fach und Stufe | Lehrkräfte |
| Marke | Logos, Farben, Schrift, Regeln – auch als Arbeitsgrundlage für uns | Partner, Presse, wir |
| Über, Kontakt | wer dahintersteht, Roadmap | alle |
| Impressum, Datenschutz | Offenlegung nach Mediengesetz, DSGVO | Pflicht |

Sprache: Deutsch (`de-AT`). Begriffe für Deutschland und die Schweiz (Grundschule, Sekundarstufe) werden dort genannt,
wo Schulstufen erklärt werden.

### Technik der Website

| Entscheidung | Wahl | Warum |
|---|---|---|
| Hosting | **GitHub Pages**, Deploy über GitHub Actions | kostenlos für öffentliche Repos, HTTPS, eigene Domain möglich |
| Aufbau | **statische Seite mit kleinem Build-Schritt** (Vorschlag: Astro) | der Quest-Katalog wird aus `quests/` erzeugt, Schemas prüfen Inhalte beim Bauen; Ausgabe ist reines HTML/CSS |
| JavaScript | nur wo nötig (z. B. Katalog-Filter), Seite funktioniert ohne | Schulnetze, alte Geräte, Barrierefreiheit |
| Externe Ressourcen | keine – Schriften und Bilder selbst gehostet, keine Tracker, keine Cookies | Datenschutz an Schulen, keine Cookie-Banner |
| Domain | Vorschlag `mintcraft.at` (Verfügbarkeit prüfen), sonst `apachler.github.io/mintcraft` | |

**Unterschiede zu VioletVein (Hetzner-Webhosting):** GitHub Pages kennt keine `.htaccess` und keine eigenen
HTTP-Header. Die Content Security Policy kommt daher als `<meta>`-Tag in jede Seite, HTTPS erzwingt Pages selbst,
Weiterleitungen gibt es nur als Seiten. Für eine statische Seite ohne Formulare reicht das.

## 10. CI: Alles automatisch prüfen

Jeder Pull Request zeigt, **ob es funktioniert, ob es barrierefrei ist und wie es aussieht** – auch vom Handy aus
nachvollziehbar, ohne lokal etwas zu starten.

### Workflows

| Workflow | Wann | Prüft / macht |
|---|---|---|
| `site` | Push, PR | Build, HTML-Validierung, interne Links und Anker, keine externen Ressourcen, Meta-Daten (lang, Title, Description, Canonical, Sitemap) |
| `a11y` | Push, PR | axe-core über alle Seiten (WCAG 2.2 AA), Tastaturbedienung, Kontrast |
| `visual` | Push, PR | Playwright-Screenshots aller Seiten bei 390, 768 und 1440 px, hell und dunkel; Vergleich mit Referenzbildern; Abweichungen als Diff-Bilder im PR |
| `lighthouse` | PR | Performance, Barrierefreiheit, Best Practices, SEO gegen Budgets (Ziel ≥ 95) |
| `brand` | Push, PR in `brand/` | Generator neu laufen lassen, prüfen, dass SVGs aktuell sind; PNGs rendern; Kontraste aller Farbpaare |
| `deploy` | Push auf `main` | Website auf GitHub Pages veröffentlichen – nur wenn alle Prüfungen grün sind |
| `attribution` | Push, PR | keine Werbung von Coding-Assistenten in Commits und PRs (aus VioletVein) |
| `quests` (ab Phase 2) | Push, PR in `quests/` | JSON-Schema, Pflichtfelder, Lehrplanbezug, Rechtschreibung |
| `service` (ab Phase 3) | Push, PR | Unit-Tests des MINTcraft-Dienstes; End-to-End-Test gegen eine Moodle-Testinstanz in Docker: Quest per LTI einfügen, als Schüler:in starten, Bewertung kommt an |
| `addon` (ab Phase 4) | Push, PR | Add-on bzw. Mods bauen und testen; Integrationstest: Server in CI starten, Quest automatisiert durchspielen |
| `webclient` (ab Validierung) | Push, PR | WebAssembly-Build, Playwright startet den Client in Chromium und WebKit (Safari-Engine), verbindet zu einem Test-Server, prüft Ladezeit, Bildrate und PWA-Manifest |
| `infra` (ab Phase 4) | Push, PR | OpenTofu `validate` und `plan` gegen ein Test-Projekt, Container-Images bauen und auf Schwachstellen prüfen; auf `main` nach Freigabe anwenden |

### Visuelle Prüfung im Detail

```mermaid
flowchart LR
    PR["Pull Request"] --> B["Build"]
    B --> S["Playwright:<br/>Screenshots<br/>3 Breiten × hell/dunkel"]
    S --> C{"Vergleich mit<br/>Referenzbildern"}
    C -- "gleich" --> OK["✅ grün"]
    C -- "anders" --> D["Diff-Bilder<br/>als Artifact + PR-Kommentar"]
    D --> E{"gewollt?"}
    E -- ja --> U["Label 'visual-update'<br/>→ neue Referenzbilder"]
    E -- nein --> F["Fix"]
```

- Referenzbilder liegen im Repo, damit jede gewollte Designänderung im Diff sichtbar ist.
- Screenshots laufen immer in derselben Umgebung (Container mit festen Schriften), sonst schwanken Pixel.
- Jeder PR bekommt eine **Vorschau** des gebauten Auftritts als Artifact und die wichtigsten Screenshots im Kommentar.
  So lassen sich Brand-Varianten nebeneinander vergleichen.

### Regeln, die CI erzwingt

- Farben nur aus den Design-Tokens (Stylelint), keine Inline-Styles und -Skripte (CSP).
- Jedes Bild mit `alt`, `width`, `height`; moderne Formate (AVIF/WebP).
- Keine Minecraft-/Mojang-Grafiken; Hinweis „Kein offizielles Minecraft-Produkt …“ im Footer jeder Seite.
- Keine erfundenen Zahlen, Testimonials oder Partnerlogos (Review-Regel in `AGENTS.md`).
- Zeilenenden LF, Actions auf Commit-SHA gepinnt, Dependabot hält Abhängigkeiten aktuell.

## 11. Was wir von VioletVein SMP übernehmen

Geprüft am 31.10.2026, Stand `apachler/violetveinsmp@f798406`.

| Aus VioletVein | Übernahme | In MINTcraft |
|---|---|---|
| Prinzip „Repo = Single Source of Truth“ | ✅ als Grundsatz | Quests, Marke, Website, später Configs und Plugins |
| `AGENTS.md` + `CLAUDE.md` + `.claude/settings.json` (Attribution aus, Git-Push fragt, Force-Push verboten) | ✅ angepasst | in Phase 0 übernommen |
| `tools/set-git-identity.sh` (SessionStart-Hook) | ✅ 1:1 | in Phase 0 übernommen |
| Workflow `attribution` | ✅ 1:1 | in Phase 0 übernommen |
| `.gitattributes`, `.editorconfig`, `.gitignore` | ✅ angepasst | in Phase 0 übernommen |
| Dependabot, Actions auf SHA gepinnt | ✅ | in Phase 0 übernommen (Actions), später npm, Gradle |
| `brand/build_brand.py` (Logos per Skript, Farben an einer Stelle) | 🔁 Prinzip, neuer Inhalt | Phase 1: neuer Generator mit MINTcraft-Bildsprache |
| `tools/check-site.mjs` (Links, Anker, lang, Canonicals ohne Abhängigkeiten) | 🔁 angepasst | Phase 1: Domain/Basispfad für Pages, ergänzt um Meta- und Ressourcenprüfung |
| Website-Regeln (kein Tracker, keine externen Ressourcen, CSP, mobil 390 px, Disclaimer) | ✅ als Regeln | Phase 1; CSP als `<meta>` statt `.htaccess` |
| Workflow `website` (SFTP-Deploy) | ❌ | ersetzt durch GitHub Pages |
| Skills und Copilot-Prompts (`/website-update`, `/new-plugin` …) | 🔁 Muster | je Phase eigene Skills, z. B. `/new-quest`, `/brand-variant` |
| `plugins-src/_template` (Paper 1.21.11, Java 21, Gradle Kotlin DSL) und `build-plugins` | ⏳ nur für Java-Angebote | HTL-Projekte, außerschulisch; Education braucht Bedrock-Add-ons |
| `server.yml` + `tools/mc.py` + Workflow `updates` (Plugins mit Prüfsumme, wöchentliche Update-PRs) | 🔁 Prinzip | „alles mit Version und Prüfsumme im Repo“ auch für Education-Server und Luanti-Mods |
| `scripts/` (deploy, backup, safe-restart, sync), `system/`, `uptime`, `mc_status.py` | 🔁 Phase 4 | Ideen für das Self-Service-Backend: Sicherung vor jeder Änderung, Neustart mit Vorwarnung, Erreichbarkeits-Check; statt Skripten auf einem Server jetzt Container und Hetzner-Cloud-API |
| Admin-Anleitung Hetzner | ⏳ Phase 4 | Grundlage für Betriebsdoku |
| Gameplay-Inhalte (Economy, Crates, PvP, Tools, violettes Thema) | ❌ | passt nicht zu Schule |

## 12. Recht, Datenschutz und Lizenzen

### Minecraft und Marke

- **Minecraft Usage Guidelines** beachten: kein „Minecraft“ im Namen oder Logo, keine Mojang-Grafiken oder -Schriften,
  klarer Hinweis „Kein offizielles Minecraft-Produkt. Nicht von Mojang oder Microsoft genehmigt oder mit ihnen verbunden.“
- **Name „MINTcraft“:** Die erste Recherche ([Marktrecherche](marktrecherche.md)) fand keine Kollision im
  Bildungsbereich, aber eine eingetragene Marke für Werkzeug in Kanada. **Größtes Risiko ist die Nähe zu „Minecraft“**
  (ein Buchstabe Unterschied, gleiche Zielgruppe). Vor Logo und Domain: Register selbst prüfen (TMview, see.ip, DPMA),
  kurze Einschätzung einer Markenanwältin oder eines Markenanwalts, zwei bis drei Ausweichnamen bereithalten.
- Spielinhalte nie gegen Geld (Usage Guidelines); eine kostenpflichtige Lehrerfortbildung oder Hosting ist davon
  getrennt zu prüfen.

### Datenschutz (Schule, Kinder)

- Website: keine Cookies, keine Tracker, keine externen Ressourcen – dann ist kein Banner nötig.
- Plattform und Server: Datenminimierung (Pseudonyme statt Klarnamen im Spiel), Hosting in der EU, kein offener Chat,
  Whitelist je Klasse, Löschkonzept, Auftragsverarbeitungsvertrag mit Schulen, Datenschutz-Folgenabschätzung vor dem Pilot.
- Einwilligungen nach DSGVO Art. 8 (in Österreich ab 14 Jahren selbst) – im Schulkontext läuft das über die Schule.

### Lizenzen (Vorschlag)

| Was | Lizenz | Warum |
|---|---|---|
| Code (Website, Plugins, Werkzeuge) | MIT oder EUPL-1.2 | offen, auch für Schulen und Länder nutzbar |
| Quests und Unterrichtsmaterial | **CC BY-SA 4.0** | Open Educational Resource – Lehrkräfte dürfen anpassen und weitergeben |
| Marke (Name, Logo) | geschützt, nicht frei | damit „MINTcraft“ für Qualität steht |

### Offenlegung

Die Website braucht eine **Offenlegung nach § 25 Mediengesetz** (Impressum) und eine Datenschutzerklärung.

## 13. Offene Entscheidungen

| # | Frage | Wann | Vorschlag |
|---|---|---|---|
| 1 | Name bleibt „MINTcraft“? | Validierung, vor Logo-Final | Register prüfen, anwaltliche Einschätzung, Ausweichnamen |
| 2 | Domain | nach #1 | `mintcraft.at` prüfen, sonst Alternativen |
| 3 | Static-Site-Generator | Phase 1, Start | Astro (Inhaltsschemas, reines HTML als Ausgabe) |
| 4 | Brand-Variante | Phase 1 | 2–3 Varianten im PR vergleichen |
| 5 | Lizenz für Code | Phase 1 | EUPL-1.2 oder MIT |
| 6 | erster Kern | ✅ entschieden | Unterstufe, Digitale Grundbildung und Mathematik |
| 7 | Anbindung an Lernplattformen | ✅ entschieden | eigener Dienst als LTI-1.3-Werkzeug statt Moodle-Plugin |
| 8 | Hauptplattform: Minecraft Education oder Luanti mit Web-Client | nach den Prototypen | beide testen, mit Daten entscheiden; die andere bleibt Alternative |
| 9 | Hosting | ✅ entschieden | Hetzner Cloud (EU), Self-Service-Backend mit Container-Pool |
| 9a | Betriebsmodell: wer trägt Serverkosten, Support, Verträge? | vor dem Pilot | Förderung für Pilot, danach Schul- oder Landeslizenz prüfen; auch Verein denkbar |
| 10 | Förderung | ab Pilotplanung | Innovationsstiftung für Bildung, FFG, Erasmus+ |
| 11 | Pilotschule und Lehrkraft | Phase 2 | – |

## 14. Nächste Schritte

1. **Konzept lesen und abnehmen** – Änderungen direkt in diesem Dokument per Pull Request.
2. **Validierung starten:** Namen prüfen lassen, 5–10 Gespräche mit Lehrkräften (Geräte, Lizenzen, Lernplattform,
   Fach, Hürden), zwei Machbarkeitsprototypen: Minecraft Education mit Add-on und Luanti-Web-Client.
3. **Phase 1 starten:** Static-Site-Grundgerüst mit allen CI-Prüfungen
   (Build, Links, a11y, visuelle Tests, Deploy auf Pages) – zuerst eine leere, aber vollständig geprüfte Seite.
4. **Brand-Varianten:** Generator `brand/build_brand.py`, Design-Tokens, zwei bis drei Logo- und Farbvarianten,
   Vergleich über die CI-Screenshots.
5. **Website-Inhalte** schreiben: Start, Konzept, Für Lehrkräfte, Marke, Impressum, Datenschutz.

---

<sub>MINTcraft ist kein offizielles Minecraft-Produkt. Nicht von Mojang oder Microsoft genehmigt oder mit ihnen verbunden.</sub>
