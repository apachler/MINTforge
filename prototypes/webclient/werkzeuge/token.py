#!/usr/bin/env python3
"""Erzeugt einen Startlink mit kurzlebigem Token für den Web-Client (nur für Tests und Vorführungen).

Später übernimmt das der MINTforge-Dienst beim LTI-Launch. Das Verfahren muss zu
mods/mintforge_quest/token.lua passen:

    token = "mf1-" + erste 24 Hex-Zeichen von HMAC-SHA256(schlüssel, "mf1|<pseudonym>|<zeitfenster>")
    zeitfenster = unix_zeit // fenster_sekunden

Den Schlüssel nie ins Repo schreiben; er kommt aus der Umgebungsvariable MINTFORGE_TOKEN_SCHLUESSEL.

    MINTFORGE_TOKEN_SCHLUESSEL=… python3 werkzeuge/token.py Fuchs_07 --basis https://localhost:8443/
"""

import argparse
import hashlib
import hmac
import os
import re
import sys
import time
from urllib.parse import urlencode

NAME_MUSTER = re.compile(r"^[A-Za-z0-9_-]{1,20}$")


def passwort(schluessel: bytes, name: str, fenster: int) -> str:
    nachricht = f"mf1|{name}|{fenster}".encode()
    return "mf1-" + hmac.new(schluessel, nachricht, hashlib.sha256).hexdigest()[:24]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("name", help="Pseudonym, [A-Za-z0-9_-], höchstens 20 Zeichen")
    ap.add_argument("--basis", default="https://localhost:8443/", help="Adresse der PWA")
    ap.add_argument("--server", default="luanti:30000", help="Luanti-Server, wie der Proxy ihn kennt")
    ap.add_argument("--proxy", default="", help="WebSocket-Proxy; leer = /proxy auf dem Host der PWA")
    ap.add_argument("--fenster", type=int, default=86400, help="Zeitfenster in Sekunden (mintforge.token_fenster)")
    ap.add_argument("--zeit", type=int, default=None, help="Unix-Zeit (nur für Tests)")
    ap.add_argument("--nur-token", action="store_true", help="nur das Token ausgeben")
    args = ap.parse_args()

    if not NAME_MUSTER.match(args.name):
        sys.exit("Name ungültig: nur A-Z, a-z, 0-9, _ und -, höchstens 20 Zeichen")
    schluessel = os.environ.get("MINTFORGE_TOKEN_SCHLUESSEL", "")
    if len(schluessel) < 32:
        sys.exit("MINTFORGE_TOKEN_SCHLUESSEL fehlt oder ist kürzer als 32 Zeichen")

    jetzt = args.zeit if args.zeit is not None else int(time.time())
    token = passwort(schluessel.encode(), args.name, jetzt // args.fenster)
    if args.nur_token:
        print(token)
        return
    teile = {"server": args.server, "name": args.name, "token": token}
    if args.proxy:
        teile["proxy"] = args.proxy
    print(f"{args.basis.split('#')[0]}#{urlencode(teile)}")


if __name__ == "__main__":
    main()
