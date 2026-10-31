# MINTforge – Marken- und Marktrecherche

> **Nachtrag 01.11.2026:** Das Projekt heißt jetzt mit Arbeitsnamen **MINTforge** (siehe Abschnitt 1b), der
> Schwerpunkt liegt auf höheren Schulen mit technischem Unterricht. Die Recherche unten bezieht sich teils noch auf den
> alten Namen und den damals geplanten Start in der Unterstufe.

| | |
|---|---|
| Stand | 31.10.2026 |
| Fragen | Ist der Name „MINTcraft“ frei? Gibt es den Ansatz schon? Würden Schulen MINTcraft einsetzen? |
| Folgen fürs Konzept | eingearbeitet in [Konzept, Entwurf 2](konzept.md) |

---

## Kurzfassung

- **Name:** Keine Kollision im Bildungsbereich gefunden. Eine eingetragene Marke MINTCRAFT gibt es in Kanada für
  Werkzeug und Haushaltswaren. **Das größte Risiko ist die Nähe zu „Minecraft“.** Vor Logo und Domain anwaltlich prüfen.
- **Wettbewerb:** Einzelteile gibt es, die Kombination aus deutschsprachiger, lehrplanbezogener Quest-Bibliothek,
  automatischer Prüfung und Rückmeldung in die Lernplattform der Schule nicht.
- **Einsatz an Schulen:** realistisch als Nische mit klarem Kern (Digitale Grundbildung, Mathematik Unterstufe,
  MINT-Schwerpunkte, HTL-Informatik) – wenn es mit vorhandenen Lizenzen, vorhandenen Geräten und der vorhandenen
  Lernplattform ohne Installation funktioniert.
- **Folgen:** keine Java-Lizenzen; Minecraft Education und Luanti mit Web-Client als Prototypen vergleichen, LTI 1.3 statt Moodle-Plugin, enger Start,
  Validierung mit Lehrkräften vor größerem Bau.

## 1. Markenrecherche „MINTcraft“

### Gefunden

| Wer / was | Bereich | Bedeutung für uns |
|---|---|---|
| [MINTCRAFT, Orgill Inc. (Kanada, CIPO)](https://ised-isde.canada.ca/cipo/trademark-search/1618608) | Werkzeug, Garten, Haushalt; eingetragen bis 2030 | anderer Bereich, anderes Land – geringes Risiko |
| [MINTCRAFT (USA, USPTO)](https://trademark.justia.com/858/78/mintcraft-85878398.html) | gleiche Waren | 2021 gelöscht |
| [Mintcraft Modpack (CurseForge)](https://www.curseforge.com/minecraft/modpacks/mintcraft) | Minecraft-Modpack, letztes Update 2021 | inaktiv, aber zeigt Namensnähe im Minecraft-Umfeld |
| [Mintcraft Resource Pack (Modrinth)](https://modrinth.com/resourcepack/mintcraft) | Minecraft-Texturen | wie oben |
| [mintcraft.io](https://mintcraft.io/), [mintcraft.fun](https://www.mintcraft.fun/) | Krypto-Token-Plattformen | ungünstige Assoziation bei Suchmaschinen |
| [Mintcraft Studios](https://mintcraftstudios.com/), [Mint+Craft](https://www.eventbrite.com/o/mintcraft-13330122220) | Studio, Bastelworkshops (USA) | anderer Bereich |

Im deutschsprachigen Bildungsbereich wurde **nichts** unter dem Namen gefunden.

### Nicht geprüft (von hier aus nicht erreichbar)

- [ ] TMview (EUIPO und nationale Ämter): „MINTcraft“, „Mint craft“, „Mintkraft“ in den Klassen 9 (Software),
      41 (Bildung), 42 (Software als Dienst)
- [ ] see.ip (Österreichisches Patentamt) und DPMA
- [ ] Domains: `mintcraft.at`, `.de`, `.eu`, `.org` bei nic.at und DENIC

### Risiko Nähe zu „Minecraft“

„MINTcraft“ unterscheidet sich von „Minecraft“ im Schriftbild nur durch einen Buchstaben, richtet sich an dieselbe
Zielgruppe und wird mit Minecraft verwendet. Die Minecraft Usage Guidelines verbieten den Eindruck einer offiziellen
Verbindung; Mojang achtet auch auf ähnliche Bezeichnungen, etwa bei Währungsnamen ähnlich „Minecoins“
([Zusammenfassung der Richtlinien](https://minehut.wiki.gg/wiki/MUG_FAQ)). Ob „MINTcraft“ als zu ähnlich gilt, ist
eine Einschätzungsfrage.

**Empfehlung:** kurze Einschätzung einer Markenanwältin oder eines Markenanwalts, bevor Logo und Domain fixiert werden;
zwei bis drei Ausweichnamen bereithalten.

## 1b. Neuer Arbeitsname „MINTforge“

| Wer / was | Bereich | Bedeutung für uns |
|---|---|---|
| [MintForge](https://mintforge.site/terms) | Erstellen von Solana-Token | Krypto-Assoziation wie bei „mintcraft“ |
| [Mint Forge (Crunchbase)](https://www.crunchbase.com/organization/mint-forge) | Unternehmen, Branche nicht prüfbar | in der Markenprüfung klären |
| [MintForge (YouTube)](https://www.youtube.com/channel/UCglI9jgjl2XlBWY5P665gmw), [mintforge (GitHub)](https://github.com/Waleed-Ilyas/mintforge) | Kanal, kleines Projekt | gering |
| „Forge“ als Mod-Loader für Minecraft | Gaming | bekannte Assoziation bei Jugendlichen, keine Mojang-Marke |

**Eigenprüfung durch Andreas (01.11.2026):** keine eingetragenen Rechte an „MINTforge“ gefunden, Domains frei.

Im Bildungsbereich wurde nichts gefunden. Vorteil gegenüber „MINTcraft“: keine Ein-Buchstaben-Nähe zu „Minecraft“ und
unabhängig von der Spielplattform. Offen: Register (TMview, see.ip, DPMA) und Domains `mintforge.at`, `.de`, `.eu`.

## 2. Gibt es den Ansatz schon?

| Angebot | Was es macht | Was fehlt |
|---|---|---|
| **Minecraft Education** (Microsoft) | Lernwelten, Lektionen, Code Builder, Klassenmodus; seit August 2026 Server über Schulgrenzen ([Ankündigung](https://mc.merill.net/message/RM567317)) | meist englisch, keine Lehrplanpfade für Österreich/Deutschland, keine Bewertung in der Lernplattform der Schule |
| [**BukkitLTI**](https://www.curseforge.com/minecraft/bukkit-plugins/bukkitlti) (2014) | Minecraft-Server als LTI-Werkzeug: Aufgaben an Orte in der Welt knüpfen, automatisch bewerten | seit 2014 eingeschlafen – zeigt: technisch machbar, aber ohne Inhalte und Pflege wertlos |
| [**EduLuanti**](https://nlnet.nl/project/EduLuanti/) (Frankreich) | Open-Source-Werkzeuge für Luanti im Unterricht, gefördert 2024–2025 | französisch, keine Anbindung an Lernplattformen, keine Quest-Bibliothek |
| [**Luanti for Education**](https://www.luanti.org/ja/education/) | Community-Mods, Projekte (Stadtplanung, Geschichte), Hosting-Dashboard BLOCKALOT mit deutschem Support | kein Lehrplanbezug, keine Bewertung |
| **Schul-Server**, z. B. [Goetheschule Essen](https://www.goetheschule-essen.de/faecher/mint/informatik/schul-minecraft-server/) | Java-Server mit Schulkonto, Bauen und Teamarbeit | eher Freizeit/AG, nicht im Fachunterricht |
| **Einzelmaterial** – [Friedrich Verlag](https://www.friedrich-verlag.de/bildung-plus/digitale-schule/medieneinsatz-im-unterricht/spielerisch-lernen/spielerisches-lernen-mit-minecraft/), [Zentrum polis (BMB)](https://politik-lernen.at/minecraft), Forschung zu [Raumgeometrie in der 5./6. Schulstufe](https://eprints-dev5.cs.univie.ac.at/5543) | Artikel, Stundenideen, Studien | keine Plattform, keine Durchgängigkeit |

**Die Lücke:** eine deutschsprachige, auf die Lehrpläne gemappte Quest-Bibliothek mit automatischer Prüfung in der
Welt und Rückmeldung in die Lernplattform der Schule.

## 3. Würden Schulen MINTcraft einsetzen?

### Was dafür spricht (Österreich)

- **Digitale Grundbildung** ist seit 2022/23 Pflichtfach in der 5.–8. Schulstufe, mit einer Wochenstunde und
  Computational Thinking im Lehrplan ([futurezone](https://futurezone.at/netzpolitik/digitale-grundbildung-schulfach-schule-pflicht-unterricht-oesterreich/402063997)).
- **Lizenzen:** Minecraft Education war Teil des Microsoft-Schulvertrags, dessen Lizenzkosten das Ministerium trägt
  ([Parlament 5740/J, 2021](https://www.parlament.gv.at/dokument/XXVII/J/5740/fnameorig_931162.html)); außerdem ist es in
  Microsoft 365 Education A3/A5 enthalten ([Microsoft](https://news.microsoft.com/de-de/minecraft-microsoft-365-education/)).
  **Aktuellen Stand prüfen.**
- **Geräte:** Bei der Geräteinitiative wählten rund zwei Drittel der Schulen Windows, 27 % iPads, etwa 5 %
  Chromebooks ([Notebookcheck, 2021](https://www.notebookcheck.com/Geraeteinitiative-Digitales-Lernen-OEsterreichs-Schulen-vertrauen-vorerst-auf-Windows-Laptops.579278.0.html)).
  Minecraft Education läuft auf allen.
- **Lernplattform:** eduvidual ist das zentrale Moodle des Bildungsministeriums für alle Schulen
  ([GTN Solutions](https://gtn-solutions.com/en/showcase-single/eduvidual-1)).
- **Interesse des Ministeriums an Minecraft** zeigt das 2025 erschienene Material von Zentrum polis.

### Was dagegen spricht

| Hürde | Folge für MINTcraft |
|---|---|
| Java braucht eine Lizenz pro Kind und läuft nicht auf iPads/Chromebooks | **Minecraft Education oder Luanti mit Web-Client** |
| Auf eduvidual können Schulen keine eigenen Plugins installieren | **LTI-1.3-Werkzeug** statt Moodle-Plugin |
| Anmelden und Starten kosten in 50 Minuten viel Zeit | Start mit einem Klick, fertige Stundenbilder, Welten vorbereitet |
| Lehrkräfte haben wenig Zeit für Einarbeitung | Fortbildungen über Pädagogische Hochschulen, Material ohne Vorbereitung nutzbar |
| Datenschutz: Microsoft 365 an Schulen in Teilen Deutschlands umstritten | **Luanti** als lizenzfreie, selbst gehostete Alternative |
| Schulnetze und Firewalls blockieren oft Spiele-Server | früh an echten Schulnetzen testen |
| Von Volksschule bis HTL ist zu breit | Start mit Unterstufe: Digitale Grundbildung und Mathematik |

### Einschätzung

Realistisch ist ein Einsatz als **Nische mit klarem Kern**: Digitale Grundbildung, Mathematik in der Unterstufe,
Schulen mit MINT-Schwerpunkt, Projekttage und HTL-Informatik. Regulärer Mathematikunterricht in der Breite ist
unwahrscheinlich. Ob es gelingt, hängt weniger an der Idee als an drei Dingen: **null Installationsaufwand**,
**Material, das sofort funktioniert**, und **ein Vertriebsweg über Fortbildungen**.

## 4. Luanti als Alternative

Luanti (früher Minetest) ist eine freie Blockwelt-Engine ([luanti.org](https://www.luanti.org/en)), auf der EduLuanti aufbaut.

| | Bewertung |
|---|---|
| Lizenzproblem | **gelöst** – kostenlos (MIT), keine Microsoft-Konten, eigene Pseudonyme, selbst gehostet in der EU |
| Erweiterbarkeit | **besser als Minecraft Education** – volle Lua-Mod-API, Server-seitige Prüfung problemlos |
| Geräte | Windows, Mac, Linux, Android – **keine offizielle iPad-Version**; das betrifft etwa ein Viertel der Schulen in Österreich |
| Motivation | ähnliches Spielgefühl, aber nicht „echtes Minecraft“ – für viele Kinder ein Unterschied |
| Lehrerwerkzeuge | kein fertiger Klassenmodus; müssten wir selbst bauen |
| EduLuanti als Basis | als Ideenquelle und für Mods nützlich, als Fundament zu klein (französisch, Förderung bis 2025, keine Lernplattform-Anbindung) |

**Web-Client:** Mit [minetest-wasm](https://github.com/paradust7/minetest-wasm) gibt es einen experimentellen
WebAssembly-Port von Luanti (MIT, [Live-Demo](https://minetest.dustlabs.io/)); Mehrspieler läuft über einen
WebSocket-Proxy. Ein darauf aufbauender Client im Browser bzw. als PWA würde das iPad-Problem lösen und Installation
überflüssig machen. Ob er auf Schul-iPads flüssig läuft, ist offen – deshalb Prototyp (siehe Konzept).

**Folgerung:** Luanti löst das Lizenz- und Datenschutzproblem, schafft aber ohne Web-Client ein Geräteproblem (iPad). Deshalb
Minecraft Education als Hauptplattform und Luanti als zweites Standbein – besonders für Deutschland und Schulen
ohne Microsoft-Lizenz. Weil Quests als Daten im Repo stehen und der MINTcraft-Dienst die Prüfung übernimmt, kann
dieselbe Quest auf beiden Plattformen laufen.

## 5. Offene Prüfungen

- [ ] Markenregister und Domains (siehe oben), anwaltliche Einschätzung des Namens
- [ ] Ist Minecraft Education heute im österreichischen Microsoft-Schulvertrag enthalten?
- [ ] Erlaubt eduvidual Lehrkräften, externe LTI-1.3-Werkzeuge selbst einzubinden, oder braucht es eine Freigabe?
- [ ] Geräteverteilung heute (die Zahlen sind von 2021)
- [ ] Machbarkeit: Skript-API von Minecraft Education für Prüfung und Verbindung zum Dienst
- [ ] Machbarkeit: Luanti-Web-Client auf Schul-iPad, Chromebook und Windows-Gerät
- [ ] Läuft der Dedicated Server von Minecraft Education unter Linux in Containern?
- [ ] 5–10 Gespräche mit Lehrkräften: Geräte, Lizenzen, Lernplattform, Fach, Hürden
- [ ] Wie verbreitet sind Teams und OneNote-Kursnotizbuch an den Zielschulen im Vergleich zu Moodle/eduvidual? (in den Gesprächen mitfragen)
