// Ende-zu-Ende-Rauchtest: Browser-Protokoll -> Proxy -> echter Luanti-Server.
//
// Schickt über den Proxy das erste Paket, mit dem jeder Luanti-Client eine Verbindung beginnt, und erwartet
// vom Server die Zuteilung einer Peer-ID. Das beweist, dass Kapselung, Weiterleitung und Rückweg mit einem
// echten Server funktionieren – nicht, dass der WebAssembly-Client sich anmelden kann.
//
// Aufbau des Pakets (Luanti src/network/mtp/internal.h und threads.cpp, ConnectionSendThread::connect):
//   u32 PROTOCOL_ID 0x4f457403 | u16 peer_id 0 (PEER_ID_INEXISTENT) | u8 Kanal 0
//   | u8 Typ 3 (RELIABLE) | u16 seqnum 65500 (SEQNUM_INITIAL) | u8 Typ 1 (ORIGINAL)   – leerer Inhalt
// Antwort des Servers (Connection::createPeer):
//   … | u8 Typ 0 (CONTROL) | u8 1 (SET_PEER_ID) | u16 neue Peer-ID
//
//   node test/luanti-handshake.mjs <luanti-host> <luanti-port>

import { once } from 'node:events';
import WebSocket from 'ws';
import { starteProxy, leseKonfiguration, kapsle, entkapsle } from '../proxy.mjs';

const [host = '127.0.0.1', port = '30000'] = process.argv.slice(2);
const PROTOCOL_ID = 0x4f457403;

function verbindungspaket() {
  const b = Buffer.alloc(11);
  b.writeUInt32BE(PROTOCOL_ID, 0);
  b.writeUInt16BE(0, 4);
  b.writeUInt8(0, 6);
  b.writeUInt8(3, 7);
  b.writeUInt16BE(65500, 8);
  b.writeUInt8(1, 10);
  return b;
}

// Sucht SET_PEER_ID in einem Datagramm, auch wenn es in ein RELIABLE-Paket verpackt ist (Typ 3, seqnum, Typ 0/1).
function peerIdAus(antwort) {
  if (antwort.length < 11 || antwort.readUInt32BE(0) !== PROTOCOL_ID) {
    return null;
  }
  let i = 7;
  if (antwort[i] === 3) {
    i += 3;
  }
  if (antwort[i] === 0 && antwort[i + 1] === 1 && antwort.length >= i + 4) {
    return antwort.readUInt16BE(i + 2);
  }
  return null;
}

const konfig = leseKonfiguration({ PORT: '0', ZIELE: `10.77.0.1:30000=${host}:${port}`, NAMEN: 'luanti=10.77.0.1' });
const proxy = await starteProxy(konfig, { info() {}, warn: console.warn });
const url = `ws://127.0.0.1:${proxy.port}`;
let ok = false;

try {
  const a = new WebSocket(url);
  await once(a, 'open');
  a.send('NEWADDR');
  const [adresse] = await once(a, 'message');
  a.close();
  const passcode = adresse.toString().split(' ')[2];

  const ws = new WebSocket(url);
  ws.binaryType = 'nodebuffer';
  await once(ws, 'open');
  ws.send(`BIND ${passcode} UDP 4711`);
  const [bindAntwort] = await once(ws, 'message');
  if (bindAntwort.toString() !== 'BIND OK') {
    throw new Error(`BIND: ${bindAntwort}`);
  }
  const antworten = new Promise((resolve, reject) => {
    const zeit = setTimeout(() => reject(new Error('keine Antwort vom Luanti-Server')), 5000);
    ws.on('message', (daten) => {
      const p = entkapsle(daten);
      const id = peerIdAus(p.nutzdaten);
      if (id !== null) {
        clearTimeout(zeit);
        resolve({ id, von: `${p.ip}:${p.port}` });
      }
    });
  });
  ws.send(kapsle('10.77.0.1', 30000, verbindungspaket()));
  const { id, von } = await antworten;
  console.log(`OK: Luanti-Server hat über den Proxy Peer-ID ${id} vergeben (Antwort von ${von})`);
  ok = id >= 2;
  ws.close();
} catch (err) {
  console.error(`FEHLER: ${err.message}`);
} finally {
  await proxy.schliessen();
}
process.exit(ok ? 0 : 1);
