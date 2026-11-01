// Prüft den Proxy so, wie der WebAssembly-Client ihn benutzt (Ablauf aus webshims src/emsocket/proxy.js):
// NEWADDR, BIND, gekapselte UDP-Pakete hin und zurück, Namensdienst unter fd00::1:53.
// Statt eines echten Luanti-Servers antwortet ein UDP-Echo.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createSocket } from 'node:dgram';
import WebSocket from 'ws';
import { starteProxy, leseKonfiguration, kapsle, entkapsle, ipZuBytes, bytesZuIp } from '../proxy.mjs';

const stumm = { info() {}, warn() {} };
let echo;
let proxy;
let url;

before(async () => {
  echo = createSocket('udp4');
  echo.on('message', (m, r) => echo.send(Buffer.concat([Buffer.from('echo:'), m]), r.port, r.address));
  await new Promise((r) => echo.bind(0, '127.0.0.1', r));
  const konfig = leseKonfiguration({
    PORT: '0',
    ZIELE: `10.77.0.1:30000=127.0.0.1:${echo.address().port}`,
    NAMEN: 'luanti=10.77.0.1',
  });
  proxy = await starteProxy(konfig, stumm);
  url = `ws://127.0.0.1:${proxy.port}`;
});

after(async () => {
  await proxy.schliessen();
  echo.close();
});

function verbinde() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.binaryType = 'nodebuffer';
    ws.once('open', () => resolve(ws));
    ws.once('error', reject);
  });
}

function naechsteNachricht(ws) {
  return new Promise((resolve, reject) => {
    ws.once('message', (d, binaer) => resolve(binaer ? d : d.toString()));
    ws.once('close', () => reject(new Error('geschlossen')));
  });
}

async function neueAdresse() {
  const ws = await verbinde();
  ws.send('NEWADDR');
  const antwort = await naechsteNachricht(ws);
  ws.close();
  const teile = antwort.split(' ');
  assert.equal(teile.length, 4);
  assert.equal(teile[0], 'ADDR');
  return { adresse: teile[1], passcode: teile[2], joincode: teile[3] };
}

test('Adressen werden umgerechnet wie im Client', () => {
  assert.equal(bytesZuIp(ipZuBytes('10.77.0.1')), '10.77.0.1');
  assert.equal(bytesZuIp(ipZuBytes('fd00::1')), 'fd00::1');
  assert.equal(bytesZuIp(ipZuBytes('2001:db8:0:0:1:0:0:1')), '2001:db8::1:0:0:1');
  const p = entkapsle(kapsle('10.77.0.1', 30000, Buffer.from('abc')));
  assert.deepEqual([p.ip, p.port, p.nutzdaten.toString()], ['10.77.0.1', 30000, 'abc']);
});

test('NEWADDR liefert Adresse, Passcode und 16-stelligen Joincode', async () => {
  const z = await neueAdresse();
  assert.match(z.adresse, /^10\.77\.1\.\d+$/);
  assert.match(z.passcode, /^[0-9a-f]{32}$/);
  // Der Launcher prüft Joincodes mit /^[0-9a-f]{16}$/.
  assert.match(z.joincode, /^[0-9a-f]{16}$/);
});

test('BIND mit falschem Passcode wird abgelehnt', async () => {
  const ws = await verbinde();
  ws.send('BIND falsch UDP 5000');
  assert.equal(await naechsteNachricht(ws), 'BIND FAILED');
  ws.close();
});

test('UDP-Pakete erreichen den freigegebenen Server und kommen gekapselt zurück', async () => {
  const z = await neueAdresse();
  const ws = await verbinde();
  ws.send(`BIND ${z.passcode} UDP 5001`);
  assert.equal(await naechsteNachricht(ws), 'BIND OK');
  ws.send(kapsle('10.77.0.1', 30000, Buffer.from('hallo')));
  const antwort = entkapsle(await naechsteNachricht(ws));
  assert.equal(antwort.ip, '10.77.0.1');
  assert.equal(antwort.port, 30000);
  assert.equal(antwort.nutzdaten.toString(), 'echo:hallo');
  ws.close();
});

test('Nicht freigegebene Ziele werden verworfen (kein offenes Relais)', async () => {
  const z = await neueAdresse();
  const ws = await verbinde();
  ws.send(`BIND ${z.passcode} UDP 5002`);
  assert.equal(await naechsteNachricht(ws), 'BIND OK');
  ws.send(kapsle('8.8.8.8', 53, Buffer.from('x')));
  ws.send(kapsle('10.77.0.1', 30000, Buffer.from('danach')));
  // Nur die Antwort auf das zweite Paket kommt an.
  assert.equal(entkapsle(await naechsteNachricht(ws)).nutzdaten.toString(), 'echo:danach');
  ws.close();
});

test('Namensdienst löst nur freigegebene Namen auf', async () => {
  const ws = await verbinde();
  ws.send('PROXY IPV6 TCP fd00::1 53');
  assert.equal(await naechsteNachricht(ws), 'PROXY OK');
  ws.send('luanti ANY');
  assert.deepEqual([...await naechsteNachricht(ws)], [1, 4, 10, 77, 0, 1]);
  ws.close();

  const ws2 = await verbinde();
  ws2.send('PROXY IPV6 TCP fd00::1 53');
  await naechsteNachricht(ws2);
  ws2.send('example.org A');
  assert.deepEqual([...await naechsteNachricht(ws2)], [0]);
  ws2.close();
});

test('Andere TCP-Ziele werden abgelehnt', async () => {
  const ws = await verbinde();
  const zu = new Promise((r) => ws.once('close', r));
  ws.send('PROXY IPV4 TCP 1.2.3.4 80');
  await zu;
});
