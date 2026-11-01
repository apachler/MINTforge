// Startparameter aus der URL lesen und prüfen (gemeinsam für Startseite, Spielseite und Tests).
//
// Der Link aus der Lernplattform sieht so aus (Fragment statt Query, damit das Token nicht in
// Server-Logs oder im Referer landet):
//
//   https://labor.example/#server=luanti:30000&name=Fuchs_07&token=mf1-…&proxy=wss://labor.example/proxy
//
//   server  Adresse des Luanti-Servers, wie der Proxy sie kennt (Name oder IP, optional :Port)
//   name    Pseudonym, [A-Za-z0-9_-], höchstens 20 Zeichen
//   token   kurzlebiges Passwort, siehe mods/mintforge_quest/token.lua
//   proxy   optional; Standard ist /proxy auf demselben Host (wss)

(function (global) {
  'use strict';

  const NAME_MUSTER = /^[A-Za-z0-9_-]{1,20}$/;
  const TOKEN_MUSTER = /^mf1-[0-9a-f]{24}$/;
  const HOST_MUSTER = /^[A-Za-z0-9.-]{1,253}$|^\[[0-9A-Fa-f:]+\]$/;

  function standardProxy(ort) {
    const schema = ort.protocol === 'http:' ? 'ws:' : 'wss:';
    return `${schema}//${ort.host}/proxy`;
  }

  // Gibt {ok: true, werte} oder {ok: false, fehler: [...]} zurück. `ort` ist window.location oder ein URL-Objekt.
  function lese(ort) {
    const roh = (ort.hash || '').replace(/^#/, '');
    const p = new URLSearchParams(roh);
    const fehler = [];

    if (!roh) {
      return { ok: false, leer: true, fehler: ['kein Startlink'] };
    }

    const server = (p.get('server') || '').trim();
    let host = server;
    let port = 30000;
    // "name:port", "1.2.3.4:port" oder "[v6]:port"; eine nackte IPv6-Adresse muss in Klammern stehen.
    const mitPort = server.match(/^([^:]+|\[[0-9A-Fa-f:]+\]):(\d{1,5})$/);
    if (mitPort) {
      host = mitPort[1];
      port = Number(mitPort[2]);
    }
    if (!HOST_MUSTER.test(host)) {
      fehler.push('Server-Adresse fehlt oder ist ungültig');
    }
    if (!(port > 0 && port < 65536)) {
      fehler.push('Port ist ungültig');
    }

    const name = p.get('name') || '';
    if (!NAME_MUSTER.test(name)) {
      fehler.push('Name fehlt oder ist ungültig');
    }

    const token = p.get('token') || '';
    if (!TOKEN_MUSTER.test(token)) {
      fehler.push('Schlüssel fehlt oder ist ungültig');
    }

    let proxy = p.get('proxy') || standardProxy(ort);
    try {
      const u = new URL(proxy);
      if (u.protocol !== 'wss:' && !(u.protocol === 'ws:' && ort.protocol === 'http:')) {
        fehler.push('Proxy muss wss:// verwenden');
      }
      proxy = u.toString();
    } catch (e) {
      fehler.push('Proxy-Adresse ist ungültig');
    }

    if (fehler.length) {
      return { ok: false, fehler };
    }
    return { ok: true, werte: { host: host.replace(/^\[|\]$/g, ''), port, name, token, proxy } };
  }

  global.MintforgeParameter = { lese, NAME_MUSTER, TOKEN_MUSTER };
})(typeof window !== 'undefined' ? window : globalThis);
