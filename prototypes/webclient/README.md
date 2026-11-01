# Luanti-Web-Client (Prototyp)

> **Status: Gerüst.** Teile sind lokal und in CI geprüft (siehe [Was funktioniert](#was-funktioniert-und-was-gerüst-ist)).
> Der WebAssembly-Client **baut in CI** (`luanti.wasm` ≈ 14 MB), wurde aber **noch nie in einem Browser gegen unseren
> Server gestartet.**
> Nicht für den Unterricht freigegeben.

Hintergrund und Ziel stehen im Konzept, Abschnitt
[„Luanti-Web-Client (Prototyp)“](../../docs/konzept.md#luanti-web-client-prototyp): Luanti läuft als WebAssembly im
Browser (auch iPad/Safari und Chromebook), als PWA vom Startbildschirm, Start per Link mit kurzlebigem Token,
Mehrspieler über einen WebSocket-Proxy, und eine MINTforge-Mod prüft eine Quest und meldet das Ergebnis per HTTP.

Grundlage ist [paradust7/minetest-wasm](https://github.com/paradust7/minetest-wasm) (MIT), ein experimenteller
Emscripten-Port von Luanti. Wir übernehmen **keinen Fremdcode ins Repo**: Das Build-Skript klont eine feste Version
und baut sie.

## Architektur

```mermaid
flowchart LR
    LMS["📚 Lernplattform<br/>(später LTI-Launch)"] -- "Startlink mit<br/>Pseudonym + Token" --> PWA
    subgraph Browser
        PWA["📱 PWA-Hülle<br/>index.html, spiel.html,<br/>Service Worker"]
        WASM["⛏️ Luanti als WebAssembly<br/>(minetest-wasm)"]
        PWA -- "LuantiLauncher<br/>--go --name --password --address" --> WASM
    end
    subgraph Server["Server (docker compose)"]
        C["🔒 Caddy<br/>HTTPS :443, COOP/COEP"]
        P["🔀 WebSocket-Proxy<br/>proxy.mjs"]
        L["🧱 Luanti-Server 5.18.0<br/>Spiel mintforge_labor<br/>Mod mintforge_quest"]
        E["🧩 Ergebnis-Empfänger<br/>(Platzhalter für den<br/>MINTforge-Dienst)"]
    end
    PWA -- "HTTPS" --> C
    WASM -- "WSS /proxy" --> C --> P
    P -- "UDP 30000<br/>(nur freigegebene Ziele)" --> L
    L -- "HTTP POST<br/>Ergebnis als JSON" --> E
```

Alles läuft über **einen Host und Port 443** (HTTPS und WSS), weil Schulnetze oft nichts anderes durchlassen.
Luanti-UDP bleibt im internen Netz.

### Bausteine

| Pfad | Was | Stand |
|---|---|---|
| [`wasm/build.sh`](wasm/build.sh) | klont minetest-wasm (Commit gepinnt) und baut es im Docker-Container, legt das Ergebnis in `web/client/` | in CI, siehe unten |
| [`web/`](web) | PWA-Hülle: Startseite, Spielseite, Manifest, Service Worker, Platzhalter-Icons | lokal getestet (Chrome) |
| [`server/proxy/`](server/proxy) | WebSocket↔UDP-Proxy, eigenes Gegenstück zum Client-Protokoll von minetest-wasm | lokal getestet, auch gegen einen echten Luanti-Server |
| [`server/docker-compose.yml`](server/docker-compose.yml) | Caddy (HTTPS + COOP/COEP), Proxy, Luanti-Server (offizielles Image, Version gepinnt), Ergebnis-Empfänger | `docker compose config` lokal geprüft; Start nur in CI |
| [`server/luanti/`](server/luanti) | Server-Einstellungen, minimales Spiel `mintforge_labor` (flache Laborwelt) | lokal geladen (Luanti 5.6.1) |
| [`mods/mintforge_quest/`](mods/mintforge_quest) | Lua-Mod: Anmeldung mit Token, Beispiel-Quest, automatische Prüfung, HTTP-POST | Logik getestet; im Spiel nicht durchgespielt |
| [`werkzeuge/`](werkzeuge) | `token.py` (Startlink erzeugen), `icons.py` (Platzhalter-Icons erzeugen) | lokal getestet |
| [`tests/`](tests) | Lua-Tests, Manifest-/Seitenprüfung, Playwright-Rauchtest | grün, lokal (Chrome) und in CI (Chromium, WebKit) |

### Startlink und Token

Die Lernplattform (später: der MINTforge-Dienst beim LTI-Launch) öffnet:

```text
https://labor.example/#server=luanti:30000&name=Fuchs_07&token=mf1-…&proxy=wss://labor.example/proxy
```

- Die Werte stehen im **Fragment** (`#…`), damit das Token nicht in Server-Logs oder im Referer landet. Die
  Spielseite entfernt es nach dem Lesen aus der Adresszeile.
- `name` ist ein **Pseudonym** (`[A-Za-z0-9_-]`, höchstens 20 Zeichen, Luanti-Grenze). Klarnamen kommen nie ins Spiel.
- Luanti meldet mit SRP an; der Server muss das Passwort vorher kennen. Das **Token ist deshalb ein abgeleitetes
  Passwort**: `"mf1-" + HMAC-SHA256(schlüssel, "mf1|<pseudonym>|<zeitfenster>")[:24 Hex]`, gültig im laufenden
  Zeitfenster (Standard ein UTC-Tag). Server (`mods/mintforge_quest/token.lua`) und Aussteller
  (`werkzeuge/token.py`) rechnen unabhängig; CI prüft, dass beide dasselbe Ergebnis liefern.
- Die Mod registriert dafür einen eigenen Auth-Handler (`core.register_authentication_handler`): Für jeden gültigen
  Namen liefert sie den Passwort-Hash des aktuellen Tokens. Freie Registrierung gibt es nicht.
- Der Schlüssel steht **nur** in `server/.env` (nicht im Repo) und im Dienst, der die Links erzeugt.

> **Bewusste Vereinfachung:** „Kurzlebig“ heißt hier „gilt bis Ende des Zeitfensters“, nicht „einmal verwendbar“.
> Wer einen Link abfängt, kann ihn am selben Tag nutzen. Für den Pilot braucht es kürzere Fenster oder ein
> Einmal-Token, das der Dienst beim Server hinterlegt (siehe [Offen](#offen)).

### Beispiel-Quest „Gehege“

Beim Betreten der Welt bekommt jede:r Zaun und die Aufgabe: *Baue mit dem Zaun ein rechteckiges Gehege, das innen
genau 24 Blöcke Fläche hat.* Sobald ein Zaun ein geschlossenes Rechteck bildet, prüft die Mod automatisch (kein
Klick nötig) und antwortet z. B. „innen 4 × 6 = 24 Blöcke, Zaunlänge 24. Geschafft!“ – oder wie viele Blöcke
fehlen. So lassen sich verschiedene Formen mit gleicher Fläche und unterschiedlichem Umfang vergleichen
(1 × 24 braucht 54 Zaunblöcke, 4 × 6 nur 24).

Jede erkannte Form wird als JSON per `POST` an `mintforge.ergebnis_url` gemeldet (nur Pseudonym, Welt, Quest,
Maße, Zeitstempel). Lehrkräfte (`mintforge.lehrkraefte`) können mit `/quest_alle` die Quest für alle neu starten.

## Prüfliste aus dem Konzept

Was der Prototyp beweisen muss (auf einem Schul-iPad, einem Chromebook und einem Windows-Schulgerät). Noch nichts
davon ist an echten Geräten geprüft.

- [ ] Start aus Moodle in die Welt in unter 30 Sekunden
- [ ] flüssig spielbar (Ziel ≥ 30 Bilder pro Sekunde) mit 25 Schüler:innen in einer Welt
- [ ] Touch-Steuerung ist ohne Erklärung bedienbar
- [ ] läuft im Schulnetz (nur HTTPS/WSS über Port 443)
- [ ] eine Quest wird automatisch geprüft, das Ergebnis landet in Moodle

Zwischenschritte, die dieses Gerüst vorbereitet:

- [x] Proxy übersetzt das Client-Protokoll von minetest-wasm in UDP und erreicht einen echten Luanti-Server
  (lokal mit Luanti 5.6.1; in CI mit dem offiziellen Image 5.18.0)
- [x] Proxy leitet nur an freigegebene Luanti-Server weiter, nicht ins Internet
- [x] Alles über einen HTTPS-Port, Seite cross-origin-isoliert (COOP/COEP)
- [x] PWA-Hülle: Manifest, Service Worker, Icons, Start per Link, Token aus der Adresszeile entfernt
- [x] Quest-Prüfung als getestete Logik, Ergebnis per HTTP-POST
- [ ] WebAssembly-Client startet aus der Hülle mit `--go` direkt in die Welt (nicht geprüft)
- [ ] Anmeldung mit Token klappt mit dem WebAssembly-Client (nicht geprüft)
- [ ] Ergebnis kommt beim Empfänger an, nachdem eine Person die Quest im Browser gelöst hat (nicht geprüft)

## Lokal starten

Voraussetzungen: Docker mit Compose, Python 3, Node.js 24 (nur für Tests).

```bash
cd prototypes/webclient

# 1. Client bauen (dauert lange; alternativ das Artifact „webclient-wasm“ aus dem CI-Lauf nach web/client/ entpacken)
wasm/build.sh

# 2. Schlüssel anlegen (nie committen)
cp server/env.beispiel server/.env
python3 -c "import secrets; print('MINTFORGE_TOKEN_SCHLUESSEL=' + secrets.token_hex(32))" >> server/.env

# 3. Stack starten
cd server && docker compose up -d && cd ..

# 4. Startlink erzeugen und im Browser öffnen (Zertifikatswarnung von Caddy einmal bestätigen)
set -a; . server/.env; set +a
python3 werkzeuge/token.py Fuchs_07 --basis https://localhost:8443/

# Ergebnisse ansehen
docker compose -f server/docker-compose.yml logs -f ergebnis
```

Für Geräte im selben Netz (iPad, Chromebook) `MINTFORGE_HOST` auf den Rechnernamen setzen. Mit `tls internal`
vertrauen Geräte dem Zertifikat nicht von selbst; für Tests auf echten Geräten braucht es einen Testserver mit
Domain (Let's Encrypt) – das kostet Geld und ist mit Andreas abzustimmen.

### Tests

```bash
cd prototypes/webclient
luacheck mods tests && luajit tests/lua/test_mod.lua        # Lua
python3 werkzeuge/icons.py --check                          # Icons aktuell
(cd server/proxy && npm ci && npm test)                     # Proxy
(cd tests && npm ci && npx html-validate ../web/*.html && node pruefe-manifest.mjs ../web)
(cd tests && npx playwright install chromium webkit && npx playwright test)
```

### CI (`.github/workflows/webclient.yml`)

Läuft nur bei Änderungen unter `prototypes/webclient/**`. Actions sind auf Commit-SHA gepinnt.

| Job | Prüft |
|---|---|
| `lua` | luacheck, Tests der Mod-Logik mit LuaJIT, Token-Gleichheit Lua ↔ Python |
| `huelle` | Icons aktuell, html-validate, Manifest- und Seitenregeln (CSP, `lang`, keine Inline-Skripte/-Styles, keine externen Ressourcen), Playwright in Chromium und WebKit |
| `server` | shellcheck, `docker compose config`, Proxy-Tests, Stack-Start, Mod lädt im offiziellen Luanti-Image, Handshake Proxy → Luanti, HTTPS-Header |
| `wasm-build` | kompletter Emscripten-Build, Ergebnis als Artifact `webclient-wasm` (14 Tage) |

## Was funktioniert und was Gerüst ist

| Teil | Status | Belegt durch |
|---|---|---|
| Proxy-Protokoll (NEWADDR, BIND, Kapselung, Namensdienst) | ✅ funktioniert | `server/proxy/test/proxy.test.mjs`; Gegenstück aus `webshims/src/emsocket/proxy.js` und `emsocket.cpp` abgeleitet |
| Proxy ↔ echter Luanti-Server | ✅ funktioniert | `test/luanti-handshake.mjs`: Server vergibt über den Proxy eine Peer-ID |
| Mod lädt, Auth-Handler aktiv | ✅ lokal mit Luanti 5.6.1, in CI mit dem offiziellen Image 5.18.0 | Log „Anmeldung mit Token aktiv“, „mintforge_quest geladen“ |
| Quest-Prüfung, Token-Berechnung | ✅ funktioniert | `tests/lua/test_mod.lua` (14 Tests) |
| PWA-Hülle | ✅ in Chromium und WebKit (CI) | Playwright: Isolation, Manifest, Service Worker, Startlink, 390 px |
| WebAssembly-Build | ✅ in CI | Job `wasm-build`, Artifact `webclient-wasm`; zwei kleine Patches nötig (zstd und libzip nur statisch, siehe `wasm/patches/README.md`). Lokal nicht getestet (kein Zugriff auf Docker Hub/nodejs.org in der Arbeitsumgebung) |
| Client startet aus der Hülle | ⚪ Gerüst | `web/assets/spiel.js` nutzt die API von `launcher.js` (5bfae52), aber nie im Browser gestartet |
| Anmeldung mit Token im Spiel | ⚪ Gerüst | Ablauf aus dem Luanti-Quellcode (5.18.0) abgeleitet, nicht durchgespielt |
| Ergebnis per HTTP | ⚪ Gerüst | Code nach `lua_api.md` (`request_http_api`, `secure.http_mods`), nicht ausgelöst |
| Touch-Steuerung | ⚪ nur Luantis eigene | `touch_controls = auto`; keine eigene Anpassung |
| LTI / Moodle | ⚪ nicht Teil dieses Prototyps | kommt mit dem MINTforge-Dienst (Phase 3) |

## Offen

Fragen, die wir mit diesem Gerüst nicht beantworten konnten. Nichts davon ist geraten – wo es unklar ist, steht es hier.

1. **Protokollversion.** Der Luanti-Fork in minetest-wasm (5bfae52 → `paradust7/luanti` 6f532b5) ist ein
   5.18.0-dev-Stand mit `LATEST_PROTOCOL_VERSION = 53`; der Server 5.18.0 hat 54 und akzeptiert ab 37. Dass sich der
   Client verbindet, ist damit wahrscheinlich, aber **nicht getestet**. Fallback: Server-Image auf den Stand des
   Forks bringen.
2. **`--go` mit `--address`.** Laut `clientlauncher.cpp` (5.18.0) springt `--go` am Hauptmenü vorbei und `--address`
   wählt „Server beitreten“. Ob der Port im Browser dabei ohne Menü in die Welt geht, ist **nicht geprüft**.
3. **Token als Passwort über die Kommandozeile.** `LuantiArgs.password` wird zu `--password`. Ob der WebAssembly-Client
   bei einer Server-Anmeldung noch einen Bestätigungsdialog zeigt, ist offen.
4. **Namensauflösung.** Der Client fragt Namen beim Proxy unter `fd00::1:53` an (`emsocket.cpp`). Unser Proxy
   beantwortet das für freigegebene Namen. Ob Luanti im Browser `luanti` auflöst oder lieber eine IP braucht, ist
   offen; notfalls `server=10.77.0.1:30000` im Startlink.
5. **Medien-Downloads.** Luanti lädt Texturen per HTTP über einen CONNECT-Proxy unter `fd00::1:8080`
   (`httpfetch.cpp` im Fork). Unser Proxy lehnt das ab; Medien kommen dann über das Spielprotokoll. Ob das reicht
   oder `remote_media` nötig wird, ist offen.
6. **Inline-Handler in `launcher.js`.** Die CSP der Spielseite blockiert `onclick`-Attribute aus `launcher.js`;
   `spiel.js` hängt die Handler neu an, und `style-src 'unsafe-inline'` bleibt vorerst. Sauber wird es erst im
   eigenen Fork.
7. **Speicher und Threads.** `build_luanti.sh` setzt `INITIAL_MEMORY=2013265920` (≈ 1,9 GB) und
   `PTHREAD_POOL_SIZE=22`. Ob ältere Schul-iPads das schaffen, ist die größte offene Frage.
8. **Einmal-Token.** Für den Pilot: Token mit Minuten statt Tag Gültigkeit oder Einmal-Token, das der Dienst dem
   Server mitteilt; Schlüsselrotation.
9. **Ergebnis-Rückweg.** Der Empfänger ist ein Platzhalter. Der echte Weg führt über den MINTforge-Dienst und LTI
   AGS in die Bewertung von Moodle.
10. **Image-Digest.** `ghcr.io/luanti-org/luanti:5.18.0` und `caddy:2.11.7-alpine` sind per Tag gepinnt, noch nicht
    per Digest; die Digests lassen sich erst aus einem CI-Lauf ablesen.

## Risiken

- **Experimenteller Port, eine Person.** minetest-wasm wird von einer Person gepflegt und nennt sich selbst
  experimentell („only been tested on Ubuntu 20.04“). Ein eigener Fork kostet laufend Zeit.
- **Browser-Voraussetzungen.** Der Port braucht JSPI (seit dem Umbau vom 30.07.2026), Threads mit
  SharedArrayBuffer (Cross-Origin-Isolation), WebGL 2 und OffscreenCanvas. JSPI gibt es laut
  [web-features](https://web-platform-dx.github.io/web-features-explorer/features/wasm-jspi/) erst ab Chrome/Edge
  137, Firefox 153 und **Safari 27 (iOS/iPadOS 27, September 2026)**. Ältere iPads, die nicht auf iPadOS 27
  aktualisieren können, fallen damit heraus – das kann an Schulen viele Geräte betreffen.
- **Speicher.** ≈ 1,9 GB Startspeicher (siehe oben) ist für Tablets viel; Safari beendet Tabs bei Speichermangel.
- **Schulnetz.** Manche Filter blockieren WebSockets oder große Downloads (`luanti.wasm`). Muss an echten
  Schulnetzen getestet werden.
- **Kosten.** Ein öffentlich erreichbarer Testserver (Hetzner) und eine Domain kosten Geld – nur nach Absprache.
- **Lizenzen.** Luanti ist LGPL-2.1, minetest-wasm und webshims MIT, Code hier EUPL-1.2. Beim Ausliefern des
  gebauten Clients müssen die Lizenztexte mit (der Build legt sie bisher nicht gesammelt ab – TODO).

## Quellen

- [paradust7/minetest-wasm](https://github.com/paradust7/minetest-wasm) @ `5bfae52` – README, `build_*.sh`,
  `install_emsdk.sh`, `static/launcher.js`, `static/htaccess_*`
- [paradust7/webshims](https://github.com/paradust7/webshims) @ `70653a9` – `src/emsocket/proxy.js`,
  `emsocket.cpp`, `VirtualSocket.cpp`, `emsocketctl.cpp`. Der Proxy-Server des Autors (`wss://…dustlabs.io`) ist
  **nicht** veröffentlicht; `server/proxy/proxy.mjs` ist ein eigenes Gegenstück zum Client-Code.
- [luanti-org/luanti](https://github.com/luanti-org/luanti) @ Tag `5.18.0` – `doc/lua_api.md`, `Dockerfile`,
  `.github/workflows/docker_image.yml`, `src/network/mtp/*`, `src/client/clientlauncher.cpp`,
  `builtin/game/auth.lua`

---

<sub>Kein offizielles Minecraft-Produkt. Nicht von Mojang oder Microsoft genehmigt oder mit ihnen verbunden.</sub>
