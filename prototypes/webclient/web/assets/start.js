// Startseite: Browser prüfen, Startlink prüfen, Service Worker registrieren, weiter ins Labor.
(function () {
  'use strict';

  const statusEl = document.getElementById('status');
  const pruefung = document.getElementById('pruefung');
  const pruefliste = document.getElementById('pruefliste');
  const ohneLink = document.getElementById('ohne-link');
  const weiter = document.getElementById('weiter');

  function zeige(el) { el.classList.remove('versteckt'); }

  // Was minetest-wasm braucht (siehe README, Abschnitt Browser-Voraussetzungen).
  function browserPruefen() {
    const punkte = [
      ['WebAssembly', typeof WebAssembly === 'object'],
      ['WebGL 2', (() => {
        try { return !!document.createElement('canvas').getContext('webgl2'); } catch (e) { return false; }
      })()],
      ['Threads (SharedArrayBuffer, Cross-Origin-Isolation)',
        typeof SharedArrayBuffer === 'function' && window.crossOriginIsolated === true],
      ['JSPI (WebAssembly.Suspending)', typeof WebAssembly === 'object' && typeof WebAssembly.Suspending === 'function'],
      ['WebSocket', typeof WebSocket === 'function'],
      ['OffscreenCanvas', typeof OffscreenCanvas === 'function'],
    ];
    pruefliste.replaceChildren(...punkte.map(([text, ok]) => {
      const li = document.createElement('li');
      li.className = ok ? 'ok' : 'fehlt';
      li.textContent = `${ok ? '✓' : '✗'} ${text}`;
      return li;
    }));
    return punkte.every(([, ok]) => ok);
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {
      // Ohne Service Worker geht es auch, nur ohne Zwischenspeicher.
    });
  }

  const browserOk = browserPruefen();
  const parameter = window.MintforgeParameter.lese(window.location);

  if (parameter.leer) {
    statusEl.textContent = 'Dieser Seite fehlt dein persönlicher Startlink.';
    zeige(ohneLink);
    zeige(pruefung);
    document.body.dataset.zustand = 'ohne-link';
    return;
  }
  if (!parameter.ok) {
    statusEl.textContent = 'Der Startlink ist unvollständig. Öffne ihn bitte noch einmal aus deiner Lernplattform.';
    statusEl.classList.add('meldung-fehler');
    zeige(pruefung);
    document.body.dataset.zustand = 'link-fehler';
    return;
  }
  if (!browserOk) {
    statusEl.textContent = 'Dein Browser kann das Labor noch nicht starten. Unten steht, was fehlt.';
    statusEl.classList.add('meldung-fehler');
    zeige(pruefung);
    document.body.dataset.zustand = 'browser-fehlt';
    return;
  }

  statusEl.textContent = `Hallo ${parameter.werte.name}! Alles bereit.`;
  weiter.href = `spiel.html${window.location.hash}`;
  zeige(weiter);
  document.body.dataset.zustand = 'bereit';
})();
