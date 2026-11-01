// Platzhalter für den MINTforge-Dienst: nimmt Quest-Ergebnisse per HTTP-POST an und schreibt sie ins Log.
// Später ersetzt der Dienst (Phase 3) diesen Empfänger und gibt das Ergebnis per LTI an Moodle weiter.
// Keine Abhängigkeiten, läuft mit dem node-Image.

import { createServer } from 'node:http';

const PORT = Number(process.env.PORT || 8080);
const TOKEN = process.env.MINTFORGE_ERGEBNIS_TOKEN || '';
const FELDER = ['quest', 'welt', 'pseudonym', 'geschafft', 'flaeche', 'zaunlaenge'];

createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/gesund') {
    res.writeHead(200).end('ok\n');
    return;
  }
  if (req.method !== 'POST' || req.url !== '/ergebnis') {
    res.writeHead(404).end();
    return;
  }
  if (TOKEN && req.headers.authorization !== `Bearer ${TOKEN}`) {
    res.writeHead(401).end();
    return;
  }
  let roh = '';
  req.setEncoding('utf8');
  req.on('data', (teil) => {
    roh += teil;
    if (roh.length > 4096) {
      req.destroy();
    }
  });
  req.on('end', () => {
    let daten;
    try {
      daten = JSON.parse(roh);
    } catch (e) {
      res.writeHead(400).end();
      return;
    }
    const fehlt = FELDER.filter((f) => !(f in daten));
    if (fehlt.length) {
      res.writeHead(422).end(`fehlt: ${fehlt.join(', ')}\n`);
      return;
    }
    console.log(`ERGEBNIS ${JSON.stringify(daten)}`);
    res.writeHead(204).end();
  });
}).listen(PORT, () => console.log(`Ergebnis-Empfänger hört auf Port ${PORT}`));
