// Spielseite: startet den Luanti-WebAssembly-Client direkt in die Welt, ohne Hauptmenü.
//
// Nutzt die öffentliche API von launcher.js aus minetest-wasm (Commit 5bfae52, static/launcher.js):
//   new LuantiLauncher(), setProxy(url), setLang(code), setConf(k, v), onready/onprogress/onerror/onexit,
//   new LuantiArgs() mit go, name, password, address, port -> launch(args)
// LuantiArgs.toArray() macht daraus: --go --name … --password … --address … --port …
// --go überspringt das Hauptmenü (Luanti: "Skip main menu, go directly in-game").
//
// client/launcher.js legt das Build-Skript (wasm/build.sh) ab; es ist launcher.js aus minetest-wasm mit
// angepasstem RELEASE_DIR. Ohne Build fehlt die Datei, dann meldet die Seite, dass der Client fehlt.
// launcher.js deklariert LuantiLauncher/LuantiArgs als Klassen auf oberster Ebene eines klassischen Skripts:
// global sichtbar, aber keine Eigenschaften von window.

(function () {
  'use strict';

  const statusEl = document.getElementById('status');
  const fortschritt = document.getElementById('fortschritt');
  const startKnopf = document.getElementById('start');
  const zurueck = document.getElementById('zurueck');

  function zeige(el) { el.classList.remove('versteckt'); }
  function verstecke(el) { el.classList.add('versteckt'); }
  function status(text, fehler) {
    statusEl.textContent = text;
    statusEl.classList.toggle('meldung-fehler', !!fehler);
  }
  function abbruch(text, zustand) {
    status(text, true);
    verstecke(fortschritt);
    zeige(zurueck);
    document.body.dataset.zustand = zustand;
  }

  const parameter = window.MintforgeParameter.lese(window.location);
  if (!parameter.ok) {
    abbruch('Der Startlink ist unvollständig. Öffne ihn bitte noch einmal aus deiner Lernplattform.', 'link-fehler');
    return;
  }
  const p = parameter.werte;

  // Das Token gehört nicht in die Adresszeile, den Verlauf oder ein Lesezeichen.
  history.replaceState(null, '', window.location.pathname);

  if (!window.crossOriginIsolated) {
    abbruch('Der Server liefert die Seite ohne die nötigen Sicherheits-Header (COOP/COEP). '
      + 'Bitte der Technik Bescheid geben.', 'nicht-isoliert');
    return;
  }

  // launcher.js erzeugt Knöpfe mit onclick-Attributen. Die blockiert unsere CSP (keine Inline-Skripte);
  // deshalb hängen wir dieselben Funktionen hier per addEventListener an.
  // TODO(Fork): onclick in launcher.js durch addEventListener ersetzen, dann entfällt dieser Teil.
  const MENUE = {
    settings_button: 'settingsToggle',
    settings_exit: 'exitLuanti',
    settings_console_toggle: 'consoleToggle',
    settings_address: 'selectAddress',
    settings_address_copy: 'copyAddress',
    settings_invite_copy: 'copyInviteLink',
  };
  function menueVerdrahten() {
    let fertig = 0;
    for (const [id, fn] of Object.entries(MENUE)) {
      const el = document.getElementById(id);
      if (el && !el.dataset.mintforge && typeof window[fn] === 'function') {
        el.dataset.mintforge = '1';
        el.addEventListener('click', () => window[fn]());
        fertig++;
      }
    }
    return fertig;
  }
  const beobachter = new MutationObserver(() => {
    if (menueVerdrahten() > 0) {
      beobachter.disconnect();
    }
  });

  if (typeof LuantiLauncher !== 'function') { // eslint-disable-line no-undef
    abbruch('Der Spiel-Client ist auf diesem Server nicht installiert (Prototyp ohne Build).', 'kein-client');
    return;
  }

  {
    const mtl = new LuantiLauncher(); // eslint-disable-line no-undef

    mtl.setProxy(p.proxy);
    mtl.setLang('de');
    // Werte wie in der index.html von minetest-wasm (enableMemorySaving) – schont Speicher auf Tablets.
    mtl.setConf('viewing_range', 85);
    // Touch-Steuerung von Luanti selbst; „auto“ schaltet sie bei Touch-Eingabe ein.
    mtl.setConf('touch_controls', 'auto');

    mtl.onprogress = (name, anteil) => {
      zeige(fortschritt);
      fortschritt.value = Math.round(anteil * 100);
      fortschritt.textContent = `${Math.round(anteil * 100)} %`;
      status(`Lade ${name} …`);
    };
    mtl.onprint = (text) => console.log(text);
    mtl.onerror = (meldung) => {
      console.error(meldung);
      abbruch('Das Labor ist abgestürzt. Lade die Seite neu oder frag deine Lehrkraft.', 'fehler');
    };
    mtl.onexit = () => {
      document.location.replace('index.html');
    };
    mtl.oncancel = () => {
      abbruch('Das Labor läuft schon in einem anderen Tab.', 'anderer-tab');
    };

    mtl.onready = () => {
      verstecke(fortschritt);
      document.body.dataset.zustand = 'bereit';
      const args = new LuantiArgs(); // eslint-disable-line no-undef
      args.go = true;
      args.name = p.name;
      args.password = p.token;
      args.address = p.host;
      args.port = p.port;

      // Browser verlangen für Vollbild, Zeigersperre und Audio eine Nutzergeste. Deshalb ein Knopf,
      // statt sofort zu starten.
      status(`Hallo ${p.name}! Tippe auf „Ins Labor“.`);
      zeige(startKnopf);
      startKnopf.focus();
      startKnopf.addEventListener('click', () => {
        beobachter.observe(document.body, { childList: true, subtree: true });
        mtl.launch(args);
      }, { once: true });
    };
  }
})();
