// MINTforge-WebSocket-Proxy für den Luanti-Web-Client (Prototyp)
//
// Browser können kein UDP. Der WebAssembly-Client (minetest-wasm) leitet seine Sockets deshalb über
// WebSockets an einen Proxy. Das Protokoll ist aus dem Client-Code abgeleitet, nicht aus einer Spezifikation:
//   https://github.com/paradust7/webshims  src/emsocket/proxy.js und src/emsocket/emsocket.cpp
//   (Commit 70653a91c974aa2b20df09a39f858d92e663c1a7, den minetest-wasm 5bfae52 verwendet)
//
// Was der Client schickt (jede Anfrage auf einer eigenen WebSocket-Verbindung):
//   NEWADDR                       -> "ADDR <adresse> <passcode> <joincode>", danach schließt der Client
//   BIND <passcode> UDP <port>    -> "BIND OK" (oder "BIND FAILED"), danach Binärdaten mit 24-Byte-Kopf:
//                                    Magic u32 0x778B4CF6 | Adresse 16 Byte (IPv6, IPv4 als ::ffff:a.b.c.d)
//                                    | Port u16 | Länge u16 | Nutzdaten
//   PROXY <IPV4|IPV6> TCP <ip> <port> -> "PROXY OK", danach rohe TCP-Daten. Der Client nutzt das für seinen
//                                    Namensdienst unter fd00::1:53 ("<name> A|AAAA|ANY" -> Anzahl + Einträge)
//   JOIN <code>                   -> Einladungslinks für Desktop-Luanti; hier nicht unterstützt
//
// Anders als der öffentliche Proxy des Autors ist dieser hier absichtlich eng: Er leitet UDP nur an die
// konfigurierten Luanti-Server weiter (Zuordnung virtuelle Adresse -> echter Server), nie ins Internet und nie
// zwischen Browsern. So kann ein Schulnetz-Proxy nicht als offenes UDP-Relais missbraucht werden.

import { createServer } from 'node:http';
import { createSocket } from 'node:dgram';
import { randomBytes } from 'node:crypto';
import { isIPv4, isIPv6 } from 'node:net';
import { WebSocketServer } from 'ws';

export const EP_MAGIC = 0x778b4cf6;
export const EP_HEADER_LEN = 24;
const PROXY_SERVICE_ADDRESS = 'fd00::1';
const DNS_TAG_IPV4 = 4;
const DNS_TAG_IPV6 = 6;
// Luanti-Pakete sind höchstens 512 Byte groß (mtp/internal.h, MAX_PACKET_SIZE); etwas Luft lassen.
const MAX_PAYLOAD = 2048;

// ---------------------------------------------------------------------------------------------------------
// Adressen
// ---------------------------------------------------------------------------------------------------------

// 16 Byte IPv6 aus einem Adress-Literal; IPv4 wird als ::ffff:a.b.c.d abgelegt (wie inet6_pton im Client).
export function ipZuBytes(ip) {
  const out = Buffer.alloc(16);
  if (isIPv4(ip)) {
    out[10] = 0xff;
    out[11] = 0xff;
    ip.split('.').forEach((teil, i) => { out[12 + i] = Number(teil); });
    return out;
  }
  if (!isIPv6(ip)) {
    throw new Error(`Keine IP-Adresse: ${ip}`);
  }
  const [kopf, rest] = ip.includes('::') ? ip.split('::') : [ip, null];
  const k = kopf ? kopf.split(':') : [];
  const r = rest ? rest.split(':') : [];
  const gruppen = rest === null ? k : [...k, ...new Array(8 - k.length - r.length).fill('0'), ...r];
  gruppen.forEach((g, i) => out.writeUInt16BE(parseInt(g, 16), 2 * i));
  return out;
}

// Gegenstück: IPv4-gemappte Adressen kommen als IPv4 zurück (wie inet6_ntop im Client).
export function bytesZuIp(buf) {
  const gemappt = buf.subarray(0, 10).every((b) => b === 0) && buf[10] === 0xff && buf[11] === 0xff;
  if (gemappt) {
    return `${buf[12]}.${buf[13]}.${buf[14]}.${buf[15]}`;
  }
  const gruppen = [];
  for (let i = 0; i < 8; i++) {
    gruppen.push(buf.readUInt16BE(2 * i));
  }
  // Längste Folge von Null-Gruppen (mindestens zwei) durch "::" ersetzen, wie RFC 5952.
  let besterStart = -1;
  let besteLaenge = 0;
  for (let i = 0; i < 8;) {
    if (gruppen[i] !== 0) {
      i++;
      continue;
    }
    let j = i;
    while (j < 8 && gruppen[j] === 0) {
      j++;
    }
    if (j - i > besteLaenge) {
      besterStart = i;
      besteLaenge = j - i;
    }
    i = j;
  }
  const hex = gruppen.map((g) => g.toString(16));
  if (besteLaenge < 2) {
    return hex.join(':');
  }
  return `${hex.slice(0, besterStart).join(':')}::${hex.slice(besterStart + besteLaenge).join(':')}`;
}

function normalisiere(ip) {
  return bytesZuIp(ipZuBytes(ip));
}

export function kapsle(ip, port, nutzdaten) {
  const kopf = Buffer.alloc(EP_HEADER_LEN);
  kopf.writeUInt32BE(EP_MAGIC, 0);
  ipZuBytes(ip).copy(kopf, 4);
  kopf.writeUInt16BE(port, 20);
  kopf.writeUInt16BE(nutzdaten.length, 22);
  return Buffer.concat([kopf, nutzdaten]);
}

export function entkapsle(daten) {
  if (daten.length < EP_HEADER_LEN || daten.readUInt32BE(0) !== EP_MAGIC) {
    throw new Error('Kopf fehlt oder ist beschädigt');
  }
  const laenge = daten.readUInt16BE(22);
  if (daten.length !== EP_HEADER_LEN + laenge) {
    throw new Error('Längenangabe passt nicht');
  }
  return {
    ip: bytesZuIp(daten.subarray(4, 20)),
    port: daten.readUInt16BE(20),
    nutzdaten: daten.subarray(EP_HEADER_LEN),
  };
}

// ---------------------------------------------------------------------------------------------------------
// Konfiguration
// ---------------------------------------------------------------------------------------------------------

// ZIELE="10.77.0.1:30000=luanti:30000,…"  virtuelle Adresse:Port = echter Host:Port
// NAMEN="luanti=10.77.0.1,…"              Namen, die der Namensdienst des Clients auflösen darf
export function leseKonfiguration(env = process.env) {
  const ziele = new Map();
  for (const eintrag of (env.ZIELE || '10.77.0.1:30000=luanti:30000').split(',').filter(Boolean)) {
    const [virtuell, echt] = eintrag.split('=');
    const v = virtuell.match(/^(.+):(\d+)$/);
    const e = echt && echt.match(/^(.+):(\d+)$/);
    if (!v || !e) {
      throw new Error(`ZIELE: ungültiger Eintrag "${eintrag}"`);
    }
    ziele.set(`${normalisiere(v[1])}|${Number(v[2])}`, { host: e[1], port: Number(e[2]) });
  }
  const namen = new Map();
  for (const eintrag of (env.NAMEN || 'luanti=10.77.0.1').split(',').filter(Boolean)) {
    const [name, ip] = eintrag.split('=');
    namen.set(name.toLowerCase(), normalisiere(ip));
  }
  return {
    port: Number(env.PORT || 8765),
    ziele,
    namen,
    adressNetz: env.ADRESS_NETZ || '10.77.1',
    zuteilungStunden: Number(env.ZUTEILUNG_STUNDEN || 12),
    maxVerbindungenProIp: Number(env.MAX_VERBINDUNGEN_PRO_IP || 64),
  };
}

// ---------------------------------------------------------------------------------------------------------
// Proxy
// ---------------------------------------------------------------------------------------------------------

export function starteProxy(konfig, log = console) {
  // passcode -> { adresse, joincode, ablauf }
  const zuteilungen = new Map();
  let naechsteAdresse = 1;
  const verbindungenProIp = new Map();

  function neueZuteilung() {
    const jetzt = Date.now();
    for (const [code, z] of zuteilungen) {
      if (z.ablauf < jetzt) {
        zuteilungen.delete(code);
      }
    }
    // Die virtuelle Adresse ist nur ein Etikett zwischen Client und Proxy. Sie ist nie von außen erreichbar.
    const n = naechsteAdresse++;
    const adresse = `${konfig.adressNetz}.${(n % 250) + 2}`;
    const passcode = randomBytes(16).toString('hex');
    const joincode = randomBytes(8).toString('hex');
    zuteilungen.set(passcode, { adresse, joincode, ablauf: jetzt + konfig.zuteilungStunden * 3600_000 });
    return { adresse, passcode, joincode };
  }

  function bindeUdp(ws, passcode, bindPort) {
    const zuteilung = zuteilungen.get(passcode);
    if (!zuteilung || zuteilung.ablauf < Date.now()) {
      ws.send('BIND FAILED');
      return false;
    }
    zuteilung.ablauf = Date.now() + konfig.zuteilungStunden * 3600_000;
    // Ein UDP-Socket je Browser-Socket: Der Luanti-Server sieht jede Verbindung als eigenen Absender.
    const sockets = new Map();
    const socketFuer = (ziel) => {
      const schluessel = `${ziel.host}|${ziel.port}`;
      if (!sockets.has(schluessel)) {
        const s = createSocket(isIPv6(ziel.host) ? 'udp6' : 'udp4');
        s.on('message', (nachricht) => {
          if (ws.readyState === ws.OPEN) {
            ws.send(kapsle(ziel.virtuellIp, ziel.virtuellPort, nachricht));
          }
        });
        s.on('error', (err) => log.warn(`UDP-Fehler (${schluessel}): ${err.message}`));
        sockets.set(schluessel, s);
      }
      return sockets.get(schluessel);
    };
    let verworfen = 0;
    ws.on('message', (daten, istBinaer) => {
      if (!istBinaer) {
        return;
      }
      let paket;
      try {
        paket = entkapsle(Buffer.from(daten));
      } catch (err) {
        log.warn(`Ungültiges Paket von ${zuteilung.adresse}: ${err.message}`);
        ws.close();
        return;
      }
      const ziel = konfig.ziele.get(`${paket.ip}|${paket.port}`);
      if (!ziel || paket.nutzdaten.length > MAX_PAYLOAD) {
        if (verworfen++ === 0) {
          log.warn(`Verworfen: ${zuteilung.adresse} -> ${paket.ip}:${paket.port} ist kein freigegebenes Ziel`);
        }
        return;
      }
      const s = socketFuer({ ...ziel, virtuellIp: paket.ip, virtuellPort: paket.port });
      s.send(paket.nutzdaten, ziel.port, ziel.host);
    });
    ws.on('close', () => {
      for (const s of sockets.values()) {
        s.close();
      }
    });
    ws.send('BIND OK');
    log.info(`BIND ${zuteilung.adresse} Port ${bindPort}`);
    return true;
  }

  // Namensdienst des Clients (emsocket.cpp, _proxy_dns_query): Anfrage "<name> A|AAAA|ANY",
  // Antwort 1 Byte Anzahl, dann je Eintrag 1 Byte Familie (4/6) und 4 bzw. 16 Byte Adresse.
  function namensdienst(ws) {
    ws.once('message', (daten) => {
      const [name, typ] = Buffer.from(daten).toString('utf8').trim().split(/\s+/);
      const ip = konfig.namen.get((name || '').toLowerCase());
      const eintraege = [];
      if (ip && isIPv4(ip) && typ !== 'AAAA') {
        eintraege.push(Buffer.from([DNS_TAG_IPV4, ...ip.split('.').map(Number)]));
      } else if (ip && isIPv6(ip) && typ !== 'A') {
        eintraege.push(Buffer.concat([Buffer.from([DNS_TAG_IPV6]), ipZuBytes(ip)]));
      }
      ws.send(Buffer.concat([Buffer.from([eintraege.length]), ...eintraege]));
      if (!ip) {
        log.info(`Namensdienst: "${name}" ist nicht freigegeben`);
      }
    });
  }

  const http = createServer((req, res) => {
    if (req.url === '/gesund') {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('ok\n');
      return;
    }
    res.writeHead(426, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Nur WebSocket\n');
  });

  const wss = new WebSocketServer({ server: http, maxPayload: EP_HEADER_LEN + MAX_PAYLOAD });
  wss.on('connection', (ws, req) => {
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    const anzahl = (verbindungenProIp.get(ip) || 0) + 1;
    verbindungenProIp.set(ip, anzahl);
    ws.on('close', () => {
      const rest = (verbindungenProIp.get(ip) || 1) - 1;
      if (rest > 0) {
        verbindungenProIp.set(ip, rest);
      } else {
        verbindungenProIp.delete(ip);
      }
    });
    if (anzahl > konfig.maxVerbindungenProIp) {
      ws.close(1008, 'zu viele Verbindungen');
      return;
    }
    ws.once('message', (daten, istBinaer) => {
      if (istBinaer) {
        ws.close();
        return;
      }
      const teile = daten.toString('utf8').trim().split(' ');
      if (teile[0] === 'NEWADDR' && teile.length === 1) {
        const z = neueZuteilung();
        ws.send(`ADDR ${z.adresse} ${z.passcode} ${z.joincode}`);
      } else if (teile[0] === 'BIND' && teile.length === 4 && teile[2] === 'UDP') {
        if (!bindeUdp(ws, teile[1], Number(teile[3]))) {
          // Der Client holt sich bei "BIND FAILED" einmal eine neue Adresse und bindet auf derselben
          // Verbindung erneut (proxy.js, rebound).
          ws.once('message', (zweit) => {
            const t = zweit.toString('utf8').trim().split(' ');
            if (t[0] !== 'BIND' || t.length !== 4 || !bindeUdp(ws, t[1], Number(t[3]))) {
              ws.close();
            }
          });
        }
      } else if (teile[0] === 'PROXY' && teile.length === 5 && teile[2] === 'TCP'
          && normalisiere(teile[3]) === PROXY_SERVICE_ADDRESS && teile[4] === '53') {
        ws.send('PROXY OK');
        namensdienst(ws);
      } else if (teile[0] === 'JOIN') {
        ws.send('JOIN FAILED');
        ws.close();
      } else {
        // Auch der HTTP-CONNECT-Proxy des Clients (fd00::1:8080, für Medien-Downloads) landet hier.
        log.info(`Abgelehnt: ${teile.slice(0, 2).join(' ')}`);
        ws.close();
      }
    });
  });

  return new Promise((resolve) => {
    http.listen(konfig.port, () => {
      resolve({
        port: http.address().port,
        schliessen: () => new Promise((fertig) => {
          for (const c of wss.clients) {
            c.terminate();
          }
          wss.close();
          http.close(fertig);
        }),
      });
    });
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const konfig = leseKonfiguration();
  starteProxy(konfig).then(({ port }) => {
    const ziele = [...konfig.ziele].map(([v, e]) => `${v.replace('|', ':')} -> ${e.host}:${e.port}`);
    console.log(`MINTforge-Proxy hört auf Port ${port}; Ziele: ${ziele.join(', ')}`);
  });
}
