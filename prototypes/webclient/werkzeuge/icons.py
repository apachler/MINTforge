#!/usr/bin/env python3
"""Erzeugt die Platzhalter-Icons der PWA (nur Python-Standardbibliothek).

Motiv: ein glühender Block auf einem Amboss-Sockel, in den Farben des Markenentwurfs „Esse“
(docs/konzept.md, Kapitel 9). Kein Minecraft-Material. Das endgültige Logo kommt später aus brand/.

    python3 werkzeuge/icons.py            # schreibt web/icons/*.png
    python3 werkzeuge/icons.py --check    # prüft, ob die Dateien aktuell sind (für CI)
"""

import struct
import sys
import zlib
from pathlib import Path

EISEN = (0x1A, 0x17, 0x14)
GLUT = (0xFF, 0x8A, 0x2B)
FUNKE = (0xFF, 0xB4, 0x5E)
STAHL = (0x8A, 0x96, 0xA3)
LICHT = (0xF4, 0xED, 0xE4)

ZIEL = Path(__file__).resolve().parent.parent / "web" / "icons"

# Motiv auf einem 16er-Raster; Zeichen -> Farbe
MOTIV = [
    "................",
    "................",
    "..........*.....",
    ".....GGGGGG..*..",
    "....GFFFFFG.....",
    "....GFFFFGG.....",
    "....GFFFGGG.....",
    "....GGGGGGG.....",
    "................",
    "..SSSSSSSSSSSS..",
    "...SSSSSSSSSSS..",
    ".....SSSSSSS....",
    "......SSSSS.....",
    ".....SSSSSSS....",
    "....SSSSSSSSS...",
    "................",
]
FARBEN = {"G": GLUT, "F": FUNKE, "S": STAHL, "*": FUNKE}


def png(breite, hoehe, pixel):
    """pixel: Funktion (x, y) -> (r, g, b)"""
    roh = bytearray()
    for y in range(hoehe):
        roh.append(0)
        for x in range(breite):
            roh.extend(pixel(x, y))

    def block(art, daten):
        inhalt = art + daten
        return struct.pack(">I", len(daten)) + inhalt + struct.pack(">I", zlib.crc32(inhalt) & 0xFFFFFFFF)

    kopf = struct.pack(">IIBBBBB", breite, hoehe, 8, 2, 0, 0, 0)
    return (b"\x89PNG\r\n\x1a\n" + block(b"IHDR", kopf)
            + block(b"IDAT", zlib.compress(bytes(roh), 9)) + block(b"IEND", b""))


def icon(groesse, rand_anteil):
    """rand_anteil: Anteil der Kantenlänge, der frei bleibt (maskable braucht eine Sicherheitszone)."""
    innen = groesse * (1 - 2 * rand_anteil)
    zelle = innen / 16
    versatz = groesse * rand_anteil

    def pixel(x, y):
        gx = int((x - versatz) // zelle)
        gy = int((y - versatz) // zelle)
        if 0 <= gx < 16 and 0 <= gy < 16:
            return FARBEN.get(MOTIV[gy][gx], EISEN)
        return EISEN

    return png(groesse, groesse, pixel)


DATEIEN = {
    "icon-192.png": (192, 0.06),
    "icon-512.png": (512, 0.06),
    # Maskable: Inhalt in den inneren 80 % (W3C-Empfehlung für die Sicherheitszone)
    "icon-maskable-512.png": (512, 0.12),
    "apple-touch-icon.png": (180, 0.08),
}


def pixel_daten(png_bytes):
    """Entpackte Bilddaten eines PNG. Zum Vergleich in --check: Die komprimierten Bytes hängen von der
    zlib-Version ab, die Pixel nicht."""
    i, idat, kopf = 8, b"", b""
    while i < len(png_bytes):
        laenge = struct.unpack(">I", png_bytes[i:i + 4])[0]
        art = png_bytes[i + 4:i + 8]
        if art == b"IHDR":
            kopf = png_bytes[i + 8:i + 8 + laenge]
        elif art == b"IDAT":
            idat += png_bytes[i + 8:i + 8 + laenge]
        i += 12 + laenge
    return kopf, zlib.decompress(idat)


def main():
    pruefen = "--check" in sys.argv
    ZIEL.mkdir(parents=True, exist_ok=True)
    veraltet = []
    for name, (groesse, rand) in DATEIEN.items():
        daten = icon(groesse, rand)
        pfad = ZIEL / name
        if pruefen:
            if not pfad.exists() or pixel_daten(pfad.read_bytes()) != pixel_daten(daten):
                veraltet.append(name)
        else:
            pfad.write_bytes(daten)
            print(f"{pfad.relative_to(ZIEL.parent.parent)}  {groesse}×{groesse}")
    if veraltet:
        print("Veraltet, bitte `python3 werkzeuge/icons.py` ausführen: " + ", ".join(veraltet))
        sys.exit(1)


if __name__ == "__main__":
    main()
