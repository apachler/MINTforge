#!/usr/bin/env python3
"""Erzeugt alle Markendateien von MINTforge aus brand/tokens.json.

    python3 brand/build_brand.py           # erzeugt alles neu
    python3 brand/build_brand.py --check   # nur Kontraste prüfen, nichts schreiben

Ausgabe (nie von Hand bearbeiten, immer neu erzeugen und committen):
    brand/logo/bildmarke.svg          Amboss mit glühendem Block
    brand/logo/lockup-hell.svg        Bildmarke + Wortmarke für hellen Grund
    brand/logo/lockup-dunkel.svg      Bildmarke + Wortmarke für dunklen Grund
    brand/logo/favicon.svg            Bildmarke auf Eisen
    brand/bereiche/<bereich>.svg      Symbole der fünf Bereiche
    website/public/brand/...          Kopien für die Website
    website/public/favicon.svg
    website/src/styles/tokens.css     CSS-Variablen (hell, dunkel, Esse, Bereichshäute)

Die Wortmarke wird aus der Schrift Big Shoulders Display (OFL, npm-Paket @fontsource/big-shoulders-display)
in Pfade umgewandelt, damit das Logo ohne Schrift überall gleich aussieht. Dafür muss in website/ einmal
`npm ci` gelaufen sein. Nur Python-Standardbibliothek.
"""
from __future__ import annotations

import json
import struct
import sys
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BRAND = ROOT / "brand"
TOKENS = json.loads((BRAND / "tokens.json").read_text(encoding="utf-8"))
HEADER = "Erzeugt von brand/build_brand.py aus brand/tokens.json – nicht von Hand bearbeiten."


# --------------------------------------------------------------------------------------------------------------------
# Farben und Kontrast
# --------------------------------------------------------------------------------------------------------------------

def farbe(ref: str) -> str:
    """'esse.glut' -> '#FF8A2B'."""
    gruppe, name = ref.split(".", 1)
    return TOKENS["farben"][gruppe][name]


def luminanz(hexfarbe: str) -> float:
    h = hexfarbe.lstrip("#")
    kanal = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in kanal]
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]


def kontrast(a: str, b: str) -> float:
    la, lb = sorted((luminanz(a), luminanz(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def haut(bereich: dict, rolle: str) -> str:
    return bereich["farben"][bereich["haut"][rolle]]


def kontraste_pruefen() -> list[str]:
    """Prüft alle in tokens.json genannten Textpaare. Gibt Fehler zurück."""
    fehler, zeilen = [], []
    for stufe, minimum in (("text", 4.5), ("gross", 3.0)):
        for art, vorne, hinten in TOKENS["kontrast"][stufe]:
            paare = []
            if art == "themen":
                for thema, werte in TOKENS["themen"].items():
                    if thema.startswith("$"):
                        continue
                    paare.append((f"Thema {thema}: {vorne} auf {hinten}", farbe(werte[vorne]), farbe(werte[hinten])))
            elif art == "haut":
                for key, b in TOKENS["bereiche"].items():
                    paare.append((f"Bereich {key}: {vorne} auf {hinten}", haut(b, vorne), haut(b, hinten)))
            else:
                paare.append((f"{vorne} auf {hinten}", farbe(vorne), farbe(hinten)))
            for name, a, b in paare:
                k = kontrast(a, b)
                zeilen.append(f"  {k:5.2f}:1  {'ok ' if k >= minimum else 'ZU WENIG'}  {name} ({a} / {b}, mind. {minimum})")
                if k < minimum:
                    fehler.append(name)
    print("Kontraste (WCAG 2.2):")
    print("\n".join(zeilen))
    return fehler


# --------------------------------------------------------------------------------------------------------------------
# Schrift -> Pfade (WOFF 1.0 mit TrueType-Konturen)
# --------------------------------------------------------------------------------------------------------------------

class Schrift:
    def __init__(self, pfad: Path):
        daten = pfad.read_bytes()
        if daten[:4] != b"wOFF":
            raise SystemExit(f"{pfad}: keine WOFF-Datei")
        anzahl = struct.unpack(">H", daten[12:14])[0]
        self.t: dict[str, bytes] = {}
        for i in range(anzahl):
            tag, off, clen, olen, _ = struct.unpack(">4sIIII", daten[44 + i * 20:64 + i * 20])
            roh = daten[off:off + clen]
            self.t[tag.decode("latin-1")] = zlib.decompress(roh) if clen < olen else roh
        head = self.t["head"]
        self.upm = struct.unpack(">H", head[18:20])[0]
        self.loca_lang = struct.unpack(">h", head[50:52])[0] == 1
        os2 = self.t["OS/2"]
        self.versalhoehe = struct.unpack(">h", os2[88:90])[0] if struct.unpack(">H", os2[0:2])[0] >= 2 else int(self.upm * 0.7)
        self.anzahl_metriken = struct.unpack(">H", self.t["hhea"][34:36])[0]
        self.cmap = self._cmap()
        self.kern = self._gpos_kern()

    # Zeichen -> Glyphe
    def _cmap(self) -> dict[int, int]:
        c = self.t["cmap"]
        n = struct.unpack(">H", c[2:4])[0]
        beste = None
        for i in range(n):
            plat, enc, off = struct.unpack(">HHI", c[4 + i * 8:12 + i * 8])
            fmt = struct.unpack(">H", c[off:off + 2])[0]
            if plat in (0, 3) and fmt in (4, 12) and (beste is None or fmt > beste[1]):
                beste = (off, fmt)
        off, fmt = beste
        abb: dict[int, int] = {}
        if fmt == 12:
            ngr = struct.unpack(">I", c[off + 12:off + 16])[0]
            for g in range(ngr):
                start, ende, gid = struct.unpack(">III", c[off + 16 + g * 12:off + 28 + g * 12])
                for z in range(start, ende + 1):
                    abb[z] = gid + z - start
            return abb
        segx2 = struct.unpack(">H", c[off + 6:off + 8])[0]
        seg = segx2 // 2
        ends = struct.unpack(f">{seg}H", c[off + 14:off + 14 + segx2])
        p = off + 16 + segx2
        starts = struct.unpack(f">{seg}H", c[p:p + segx2])
        deltas = struct.unpack(f">{seg}h", c[p + segx2:p + 2 * segx2])
        ro_pos = p + 2 * segx2
        ranges = struct.unpack(f">{seg}H", c[ro_pos:ro_pos + segx2])
        for s in range(seg):
            for z in range(starts[s], ends[s] + 1):
                if z == 0xFFFF:
                    continue
                if ranges[s] == 0:
                    gid = (z + deltas[s]) & 0xFFFF
                else:
                    a = ro_pos + s * 2 + ranges[s] + (z - starts[s]) * 2
                    gid = struct.unpack(">H", c[a:a + 2])[0]
                    gid = (gid + deltas[s]) & 0xFFFF if gid else 0
                abb[z] = gid
        return abb

    def vorschub(self, gid: int) -> int:
        i = min(gid, self.anzahl_metriken - 1)
        return struct.unpack(">H", self.t["hmtx"][i * 4:i * 4 + 2])[0]

    def _loca(self, gid: int) -> tuple[int, int]:
        loca = self.t["loca"]
        if self.loca_lang:
            return struct.unpack(">II", loca[gid * 4:gid * 4 + 8])
        a, b = struct.unpack(">HH", loca[gid * 2:gid * 2 + 4])
        return a * 2, b * 2

    def konturen(self, gid: int) -> list[list[tuple[float, float, bool]]]:
        start, ende = self._loca(gid)
        if start == ende:
            return []
        g = self.t["glyf"][start:ende]
        nk = struct.unpack(">h", g[0:2])[0]
        if nk < 0:
            return self._zusammengesetzt(g)
        enden = struct.unpack(f">{nk}H", g[10:10 + nk * 2])
        npunkte = enden[-1] + 1
        p = 10 + nk * 2
        ilen = struct.unpack(">H", g[p:p + 2])[0]
        p += 2 + ilen
        flags = []
        while len(flags) < npunkte:
            f = g[p]
            p += 1
            flags.append(f)
            if f & 8:
                wdh = g[p]
                p += 1
                flags.extend([f] * wdh)

        def koords(kurz, gleich):
            werte, v = [], 0
            nonlocal p
            for f in flags:
                if f & kurz:
                    d = g[p]
                    p += 1
                    v += d if f & gleich else -d
                elif not f & gleich:
                    v += struct.unpack(">h", g[p:p + 2])[0]
                    p += 2
                werte.append(v)
            return werte

        xs = koords(2, 16)
        ys = koords(4, 32)
        result, s = [], 0
        for e in enden:
            result.append([(xs[i], ys[i], bool(flags[i] & 1)) for i in range(s, e + 1)])
            s = e + 1
        return result

    def _zusammengesetzt(self, g: bytes) -> list:
        p, result = 10, []
        while True:
            flags, gid = struct.unpack(">HH", g[p:p + 4])
            p += 4
            if flags & 1:
                dx, dy = struct.unpack(">hh", g[p:p + 4])
                p += 4
            else:
                dx, dy = struct.unpack(">bb", g[p:p + 2])
                p += 2
            sx = sy = 1.0
            if flags & 8:
                sx = sy = struct.unpack(">h", g[p:p + 2])[0] / 16384
                p += 2
            elif flags & 0x40:
                sx, sy = (v / 16384 for v in struct.unpack(">hh", g[p:p + 4]))
                p += 4
            elif flags & 0x80:
                sx, _, _, sy = (v / 16384 for v in struct.unpack(">hhhh", g[p:p + 8]))
                p += 8
            for k in self.konturen(gid):
                result.append([(x * sx + dx, y * sy + dy, on) for x, y, on in k])
            if not flags & 0x20:
                return result

    # Unterschneidung aus GPOS (Feature 'kern', Lookup-Typ 2, auch über Extension)
    def _gpos_kern(self) -> dict[tuple[int, int], int]:
        gpos = self.t.get("GPOS")
        paare: dict[tuple[int, int], int] = {}
        if not gpos:
            return paare
        u16 = lambda d, o: struct.unpack(">H", d[o:o + 2])[0]
        i16 = lambda d, o: struct.unpack(">h", d[o:o + 2])[0]
        feat_off, look_off = u16(gpos, 6), u16(gpos, 8)
        lookups = set()
        for i in range(u16(gpos, feat_off)):
            rec = feat_off + 2 + i * 6
            if gpos[rec:rec + 4] == b"kern":
                f = feat_off + u16(gpos, rec + 4)
                for j in range(u16(gpos, f + 2)):
                    lookups.add(u16(gpos, f + 4 + j * 2))

        def abdeckung(o):
            fmt, n = u16(gpos, o), u16(gpos, o + 2)
            if fmt == 1:
                return [u16(gpos, o + 4 + i * 2) for i in range(n)]
            out = []
            for i in range(n):
                s, e = u16(gpos, o + 4 + i * 6), u16(gpos, o + 6 + i * 6)
                out.extend(range(s, e + 1))
            return out

        def klassen(o):
            fmt, out = u16(gpos, o), {}
            if fmt == 1:
                start, n = u16(gpos, o + 2), u16(gpos, o + 4)
                for i in range(n):
                    out[start + i] = u16(gpos, o + 6 + i * 2)
            else:
                for i in range(u16(gpos, o + 2)):
                    s, e, k = (u16(gpos, o + 4 + i * 6 + j) for j in (0, 2, 4))
                    for gid in range(s, e + 1):
                        out[gid] = k
            return out

        def wertlaenge(fmt):
            return bin(fmt).count("1") * 2

        def x_vorschub(o, fmt):
            # nur XAdvance (Bit 2) wird für die Unterschneidung gebraucht
            if not fmt & 4:
                return 0
            vor = bin(fmt & 3).count("1") * 2
            return i16(gpos, o + vor)

        def tabelle(o):
            fmt = u16(gpos, o)
            cov = abdeckung(o + u16(gpos, o + 2))
            vf1, vf2 = u16(gpos, o + 4), u16(gpos, o + 6)
            l1, l2 = wertlaenge(vf1), wertlaenge(vf2)
            if fmt == 1:
                for i, erste in enumerate(cov):
                    ps = o + u16(gpos, o + 10 + i * 2)
                    for j in range(u16(gpos, ps)):
                        r = ps + 2 + j * (2 + l1 + l2)
                        zweite = u16(gpos, r)
                        v = x_vorschub(r + 2, vf1)
                        if v:
                            paare.setdefault((erste, zweite), v)
            elif fmt == 2:
                k1, k2 = klassen(o + u16(gpos, o + 8)), klassen(o + u16(gpos, o + 10))
                n1, n2 = u16(gpos, o + 12), u16(gpos, o + 14)
                werte = {}
                for a in range(n1):
                    for b in range(n2):
                        r = o + 16 + (a * n2 + b) * (l1 + l2)
                        v = x_vorschub(r, vf1)
                        if v:
                            werte[(a, b)] = v
                self._klassenkern.append((set(cov), k1, k2, werte))

        self._klassenkern = []
        for li in sorted(lookups):
            lo = look_off + u16(gpos, look_off + 2 + li * 2)
            typ, n = u16(gpos, lo), u16(gpos, lo + 4)
            for s in range(n):
                so = lo + u16(gpos, lo + 6 + s * 2)
                if typ == 9:
                    if u16(gpos, so + 2) != 2:
                        continue
                    so = so + struct.unpack(">I", gpos[so + 4:so + 8])[0]
                elif typ != 2:
                    continue
                tabelle(so)
        return paare

    def unterschneidung(self, a: int, b: int) -> int:
        if (a, b) in self.kern:
            return self.kern[(a, b)]
        for cov, k1, k2, werte in self._klassenkern:
            if a in cov:
                v = werte.get((k1.get(a, 0), k2.get(b, 0)))
                if v:
                    return v
        return 0

    def pfad(self, text: str, x0: float, grundlinie: float, groesse: float, sperrung: float) -> tuple[str, float]:
        """SVG-Pfad für text; gibt (d, Breite) zurück."""
        s = groesse / self.upm
        teile, x = [], 0.0
        gids = [self.cmap.get(ord(z), 0) for z in text]
        for i, gid in enumerate(gids):
            for k in self.konturen(gid):
                teile.append(_kontur_pfad(k, lambda px, py: (x0 + (x + px) * s, grundlinie - py * s)))
            x += self.vorschub(gid)
            if i + 1 < len(gids):
                x += self.unterschneidung(gid, gids[i + 1]) + sperrung * self.upm
        return "".join(teile), x * s


def _n(v: float) -> str:
    t = f"{v:.2f}".rstrip("0").rstrip(".")
    return "0" if t in ("-0", "") else t


def _kontur_pfad(punkte, tf) -> str:
    """TrueType-Kontur (quadratisch, mit impliziten Punkten) -> SVG-Pfad."""
    pts = [(x, y, on) for x, y, on in punkte]
    if not pts:
        return ""
    # mit einem Punkt auf der Kurve beginnen
    if not pts[0][2]:
        if pts[-1][2]:
            pts = [pts[-1]] + pts[:-1]
        else:
            mx, my = (pts[0][0] + pts[-1][0]) / 2, (pts[0][1] + pts[-1][1]) / 2
            pts = [(mx, my, True)] + pts
    sx, sy = tf(pts[0][0], pts[0][1])
    d = [f"M{_n(sx)} {_n(sy)}"]
    i, n = 1, len(pts)
    folge = pts[1:] + [pts[0]]
    kontrolle = None
    for x, y, on in folge:
        if on:
            px, py = tf(x, y)
            if kontrolle is None:
                d.append(f"L{_n(px)} {_n(py)}")
            else:
                cx, cy = tf(*kontrolle)
                d.append(f"Q{_n(cx)} {_n(cy)} {_n(px)} {_n(py)}")
                kontrolle = None
        else:
            if kontrolle is not None:
                mx, my = (kontrolle[0] + x) / 2, (kontrolle[1] + y) / 2
                cx, cy = tf(*kontrolle)
                px, py = tf(mx, my)
                d.append(f"Q{_n(cx)} {_n(cy)} {_n(px)} {_n(py)}")
            kontrolle = (x, y)
    return "".join(d) + "Z"


# --------------------------------------------------------------------------------------------------------------------
# SVG
# --------------------------------------------------------------------------------------------------------------------

def svg(viewbox: str, inhalt: str, titel: str, breite: float | None = None, hoehe: float | None = None) -> str:
    groesse = f' width="{_n(breite)}" height="{_n(hoehe)}"' if breite else ""
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{viewbox}"{groesse} role="img" aria-labelledby="t">\n'
        f"  <!-- {HEADER} -->\n"
        f'  <title id="t">{titel}</title>\n'
        f"{inhalt}"
        "</svg>\n"
    )


def amboss(koerper: str, ox: float = 0, oy: float = 0) -> str:
    """Bildmarke im 120er-Raster: Amboss, glühender Block, drei Funken."""
    g = f'  <g transform="translate({_n(ox)} {_n(oy)})">\n' if (ox or oy) else "  <g>\n"
    return (
        g
        + f'    <path d="M10 46 L86 46 Q108 46 112 30 L112 58 Q100 66 84 66 L78 66 L78 82 L92 96 L92 108 L28 108 L28 96 L42 82 L42 66 L22 66 Q10 66 10 54 Z" fill="{koerper}"/>\n'
        + f'    <rect x="44" y="22" width="22" height="22" fill="{farbe("esse.glut")}"/>\n'
        + f'    <rect x="70" y="10" width="8" height="8" fill="{farbe("akzent.minze")}"/>\n'
        + f'    <rect x="84" y="20" width="6" height="6" fill="{farbe("esse.funke")}"/>\n'
        + f'    <rect x="28" y="12" width="6" height="6" fill="{farbe("akzent.minze")}"/>\n'
        + "  </g>\n"
    )


def lockup(schrift: Schrift, koerper: str, mint: str, forge: str) -> str:
    teil1, teil2 = TOKENS["marke"]["wortmarke"]
    if TOKENS["marke"].get("grossschreibung"):
        teil1, teil2 = teil1.upper(), teil2.upper()
    groesse = 98.0  # Schriftgröße im 120er-Raster der Bildmarke (wie im Musterblatt: 92 px neben 112 px)
    sperrung = 0.01
    versal = schrift.versalhoehe * groesse / schrift.upm
    grundlinie = 60 + versal / 2
    x0 = 120 + 22
    d1, b1 = schrift.pfad(teil1, x0, grundlinie, groesse, sperrung)
    abstand = sperrung * groesse
    d2, b2 = schrift.pfad(teil2, x0 + b1 + abstand, grundlinie, groesse, sperrung)
    breite = round(x0 + b1 + abstand + b2 + 4)
    name = TOKENS["marke"]["name"]
    inhalt = (
        amboss(koerper)
        + f'  <path d="{d1}" fill="{mint}"/>\n'
        + f'  <path d="{d2}" fill="{forge}"/>\n'
    )
    return svg(f"0 0 {breite} 120", inhalt, name, breite * 0.5, 60)


def bereichssymbol(key: str, b: dict) -> str:
    f = b["farben"]
    minze = farbe("akzent.minze")
    grund = haut(b, "grund")
    kachel = f'  <rect width="40" height="40" rx="4" fill="{grund}"/>\n'
    if key == "blaupause":
        motiv = (
            f'  <rect x="7" y="7" width="22" height="22" fill="none" stroke="{f["tinte"]}" stroke-width="2.5"/>\n'
            f'  <path d="M7 35 L29 35 M7 32 L7 38 M29 32 L29 38" stroke="{f["linie"]}" stroke-width="2"/>\n'
            f'  <rect x="25" y="3" width="8" height="8" fill="{minze}"/>\n'
        )
    elif key == "labor":
        motiv = (
            f'  <path d="M15 4 L25 4 M17 4 L17 16 L6 34 Q5 37 8 37 L32 37 Q35 37 34 34 L23 16 L23 4" fill="none" stroke="{f["tinte"]}" stroke-width="2.5" stroke-linejoin="round"/>\n'
            f'  <rect x="11" y="28" width="6" height="6" fill="{minze}"/>\n'
            f'  <rect x="18" y="28" width="6" height="6" fill="{f["flieder"]}"/>\n'
            f'  <rect x="25" y="28" width="5" height="6" fill="{minze}"/>\n'
        )
    elif key == "biom":
        w, m, l = f["wald"], f["moos"], f["lehm"]
        motiv = (
            '  <g shape-rendering="crispEdges">\n'
            f'    <rect x="20" y="4" width="8" height="8" fill="{w}"/><rect x="12" y="12" width="8" height="8" fill="{w}"/>\n'
            f'    <rect x="20" y="12" width="8" height="8" fill="{m}"/><rect x="28" y="12" width="7" height="8" fill="{m}"/>\n'
            f'    <rect x="4" y="20" width="8" height="8" fill="{m}"/><rect x="12" y="20" width="8" height="8" fill="{w}"/>\n'
            f'    <rect x="20" y="20" width="8" height="8" fill="{minze}"/><rect x="12" y="28" width="8" height="8" fill="{l}"/>\n'
            "  </g>\n"
        )
    elif key == "schaltwerk":
        motiv = (
            f'  <path d="M14 10 L14 3 M20 10 L20 3 M26 10 L26 3 M14 30 L14 37 M20 30 L20 37 M26 30 L26 37 M10 20 L3 20 M30 20 L37 20" stroke="{f["kupfer"]}" stroke-width="2.5"/>\n'
            f'  <rect x="10" y="10" width="20" height="20" fill="{f["karte"]}" stroke="{f["bestueckung"]}" stroke-width="2"/>\n'
            f'  <rect x="16" y="16" width="8" height="8" fill="{minze}"/>\n'
        )
    elif key == "pixelpuls":
        motiv = (
            f'  <g shape-rendering="crispEdges" fill="{minze}">\n'
            '    <rect x="4" y="4" width="6" height="32"/><rect x="30" y="4" width="6" height="32"/>\n'
            '    <rect x="10" y="10" width="5" height="6"/><rect x="25" y="10" width="5" height="6"/><rect x="15" y="16" width="10" height="6"/>\n'
            "  </g>\n"
            f'  <rect x="15" y="28" width="10" height="5" fill="{f["magenta"]}"/>\n'
        )
    else:
        raise SystemExit(f"kein Symbol für Bereich {key}")
    return svg("0 0 40 40", kachel + motiv, f"Bereich {b['name']}: {b['faecher']}", 40, 40)


# --------------------------------------------------------------------------------------------------------------------
# CSS
# --------------------------------------------------------------------------------------------------------------------

def _rgba(hexfarbe: str, deckung: float) -> str:
    h = hexfarbe.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    return f"rgb({r} {g} {b} / {_n(deckung)})"


def muster(b: dict) -> tuple[str, str]:
    m = b["muster"]
    c = _rgba(b["farben"][m["farbe"]], m["deckung"])
    s, w = m["groesse"], m["staerke"]
    if m["art"] == "raster":
        bild = f"linear-gradient({c} {_n(w)}px, transparent {_n(w)}px), linear-gradient(90deg, {c} {_n(w)}px, transparent {_n(w)}px)"
        return bild, f"{s}px {s}px"
    if m["art"] == "punkte":
        return f"radial-gradient({c} {_n(w)}px, transparent {_n(w)}px)", f"{s}px {s}px"
    return f"linear-gradient({c} 50%, transparent 50%)", f"100% {s}px"


def css() -> str:
    z = [f"/* {HEADER} */", "", ":root {"]
    z.append("  /* Farben der Dachmarke, des Akzents und Textvarianten für hellen Grund */")
    for werte in TOKENS["farben"].values():
        for name, wert in werte.items():
            if not name.startswith("$"):
                z.append(f"  --{name}: {wert};")
    z.append("")
    z.append("  /* Bereiche */")
    for key, b in TOKENS["bereiche"].items():
        for name, wert in b["farben"].items():
            z.append(f"  --{key}-{name}: {wert};")
    z.append("")
    z.append("  /* Schrift */")
    for rolle, f in TOKENS["schrift"]["familien"].items():
        z.append(f"  --schrift-{rolle}: \"{f['name']}\", {f['ersatz']};")
    for name, wert in TOKENS["schrift"]["groessen"].items():
        z.append(f"  --groesse-{name}: {wert};")
    for name, wert in TOKENS["schrift"]["zeilenhoehe"].items():
        z.append(f"  --zeile-{name}: {wert};")
    z.append("")
    z.append("  /* Abstände (8-px-Raster), Radien, Layout */")
    for name, wert in TOKENS["abstand"].items():
        if not name.startswith("$"):
            z.append(f"  --abstand-{name}: {wert};")
    for name, wert in TOKENS["radius"].items():
        z.append(f"  --radius-{name}: {wert};")
    for name, wert in TOKENS["layout"].items():
        z.append(f"  --layout-{name}: {wert};")
    z.append("")

    def thema(name: str, einzug: str = "  ") -> list[str]:
        return [f"{einzug}--farbe-{rolle}: var(--{ref.split('.', 1)[1]});" for rolle, ref in TOKENS["themen"][name].items()]

    z.append("  /* Thema hell (Standard) */")
    z.append("  color-scheme: light;")
    z.extend(thema("hell"))
    z.append("}")
    z.append("")
    z.append("@media (prefers-color-scheme: dark) {")
    z.append("  :root {")
    z.append("    color-scheme: dark;")
    z.extend(thema("dunkel", "    "))
    z.append("  }")
    z.append("}")
    z.append("")
    z.append("/* Dunkle Akzentflächen der Dachmarke (Kopf, Hero, Fuß) in beiden Modi */")
    z.append(".esse {")
    z.append("  color-scheme: dark;")
    z.extend(thema("esse"))
    z.append("}")
    z.append("")
    z.append("/* Häute der Bereiche: setzen --haut-* für die Quest-Karte */")
    for key, b in TOKENS["bereiche"].items():
        bild, groesse = muster(b)
        z.append(f".haut-{key} {{")
        for rolle, ref in b["haut"].items():
            z.append(f"  --haut-{rolle}: var(--{key}-{ref});")
        z.append(f"  --haut-muster: {bild};")
        z.append(f"  --haut-muster-groesse: {groesse};")
        z.append("}")
    z.append("")
    z.append("/* Farbfelder für die Markenseite: Fläche plus lesbare Schriftfarbe (Eisen oder Weiß, je nach Kontrast) */")
    felder = [(n, w) for g in TOKENS["farben"].values() for n, w in g.items() if not n.startswith("$")]
    felder += [(f"{k}-{n}", w) for k, b in TOKENS["bereiche"].items() if b["website"] for n, w in b["farben"].items()]
    eisen, weiss = farbe("esse.eisen"), "#FFFFFF"
    for name, wert in felder:
        text = "var(--eisen)" if kontrast(eisen, wert) >= kontrast(weiss, wert) else "#FFFFFF"
        z.append(f".farbfeld-{name} {{ --farbfeld: var(--{name}); --farbfeld-text: {text}; }}")
    return "\n".join(z) + "\n"


# --------------------------------------------------------------------------------------------------------------------

def schreiben(pfad: Path, inhalt: str) -> None:
    pfad.parent.mkdir(parents=True, exist_ok=True)
    pfad.write_text(inhalt, encoding="utf-8", newline="\n")
    print(f"  {pfad.relative_to(ROOT)}")


def main() -> int:
    fehler = kontraste_pruefen()
    if fehler:
        print(f"\n{len(fehler)} Farbpaar(e) unter dem WCAG-Minimum – tokens.json anpassen.", file=sys.stderr)
        return 1
    if "--check" in sys.argv:
        return 0

    schriftdatei = ROOT / TOKENS["schrift"]["logo"]["datei"]
    if not schriftdatei.exists():
        print(f"{schriftdatei.relative_to(ROOT)} fehlt – zuerst `npm ci` in website/ ausführen.", file=sys.stderr)
        return 1
    schrift = Schrift(schriftdatei)

    e = TOKENS["farben"]["esse"]
    t = TOKENS["farben"]["tief"]
    name = TOKENS["marke"]["name"]
    dateien = {
        "logo/bildmarke.svg": svg("0 0 120 120", amboss(e["stahl"]), f"{name}: Amboss mit glühendem Block und Funken", 120, 120),
        "logo/lockup-hell.svg": lockup(schrift, t["stahl-tief"], e["eisen"], t["glut-logo"]),
        "logo/lockup-dunkel.svg": lockup(schrift, e["stahl"], e["licht"], e["glut"]),
        "logo/favicon.svg": svg("0 0 120 120", f'  <rect width="120" height="120" rx="16" fill="{e["eisen"]}"/>\n' + amboss(e["stahl"], 0, 2), name),
    }
    for key, b in TOKENS["bereiche"].items():
        dateien[f"bereiche/{key}.svg"] = bereichssymbol(key, b)

    print("\nSchreibe:")
    for rel, inhalt in dateien.items():
        schreiben(BRAND / rel, inhalt)
        schreiben(ROOT / "website/public/brand" / rel, inhalt)
    schreiben(ROOT / "website/public/favicon.svg", dateien["logo/favicon.svg"])
    schreiben(ROOT / "website/src/styles/tokens.css", css())
    return 0


if __name__ == "__main__":
    sys.exit(main())
