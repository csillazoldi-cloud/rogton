#!/usr/bin/env python3
"""Térköz-átírás (R-0 / F-1): a stíluslapokban a PIXELBEN írt térköz-értékeket a skála tokenjeire írja át.

Ugyanazt a szabályt alkalmazza, mint a terkoz-meres.py: margin*/padding*/gap deklarációkban minden px-szám a
legközelebbi fokra megy (holtversenyben a sűrűbb), 1px → --ter-1, 0 és 0px → var(--ter-0), negatív →
calc(-1 * var(--ter-n)), tört → a fok kerekítve. Ami nem térköz (top/left/inset, width/height, border, radius, font), marad.
A `var(...)`, `calc(...)`, `auto`, `%`, `em` értékek érintetlenek; csak a csupasz px-számok és a csupasz 0 változik.

Használat:  python tools/meres/terkoz-atir.py [--csak fajl.css ...] [--szaraz] [gyökér]
  --szaraz   nem ír, csak kiírja, mi változna (fájl: hány deklaráció)
  --csak     csak a megadott fájl(ok)
"""
import re, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from importlib import import_module
m = import_module("terkoz-meres".replace("-", "_")) if False else None  # (a modulnév kötőjeles; lent másolat)

SKALA = [0, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 32, 40, 56, 80]
TERKOZ = re.compile(r"^(margin|padding)(-(top|right|bottom|left|inline|block|inline-start|inline-end|block-start|block-end))?$|^(row-|column-|grid-|grid-row-|grid-column-)?gap$")
DEKL = re.compile(r"([a-zA-Z-]+)(\s*:\s*)([^;{}]+)(;)")
TOKEN = re.compile(r"(?<![\w.\-%])(-?\d+(?:\.\d+)?)(px)?(?![\w.%-])")

def fok(v):
    v = abs(v)
    if v == 1: return 1
    return min(range(len(SKALA)), key=lambda i: (abs(SKALA[i] - v), SKALA[i]))

def ertek_atir(ert):
    """Egy deklaráció értéke: a csupasz px-számok és a csupasz 0 → var(--ter-n). Zárójeles rész (var/calc) érintetlen."""
    ki, melyseg, i = [], 0, 0
    darab = ""
    # csak zárójelen kívül írunk át
    resz = []
    for ch in ert:
        if ch == "(": melyseg += 1
        if ch == ")": melyseg -= 1
        resz.append((ch, melyseg))
    # szegmensekre bontás zárójel-mélység szerint
    szeg, akt, aktm = [], "", 0
    for ch, md in resz:
        if (md > 0 or ch == ")") != (aktm > 0):
            szeg.append((akt, aktm)); akt, aktm = "", (1 if (md > 0 or ch == ")") else 0)
        akt += ch
    szeg.append((akt, aktm))
    def csere(mt):
        szam, px = mt.group(1), mt.group(2)
        v = float(szam)
        if v == 0: return "var(--ter-0)"
        if not px: return mt.group(0)  # csupasz nem nulla szám px nélkül (pl. flex: 1) marad
        i = fok(v)
        return f"calc(-1 * var(--ter-{i}))" if v < 0 else f"var(--ter-{i})"
    return "".join(TOKEN.sub(csere, s) if md == 0 else s for s, md in szeg)

def fajl_atir(ut, szaraz):
    s = open(ut, encoding="utf-8").read()
    db = 0
    def dekl_csere(mt):
        nonlocal db
        tul = mt.group(1).lower()
        if tul.startswith("--") or not TERKOZ.match(tul): return mt.group(0)
        uj = ertek_atir(mt.group(3))
        if uj != mt.group(3): db += 1
        return f"{mt.group(1)}{mt.group(2)}{uj}{mt.group(4)}"
    # a megjegyzéseket nem bántjuk: ideiglenesen kivesszük
    megj = []
    def megj_ki(mt): megj.append(mt.group(0)); return f"\x00{len(megj)-1}\x00"
    s2 = re.sub(r"/\*.*?\*/", megj_ki, s, flags=re.S)
    s2 = DEKL.sub(dekl_csere, s2)
    s2 = re.sub(r"\x00(\d+)\x00", lambda mt: megj[int(mt.group(1))], s2)
    if db and not szaraz:
        open(ut, "w", encoding="utf-8", newline="\n").write(s2)
    return db

def main():
    argv = sys.argv[1:]
    szaraz = "--szaraz" in argv; argv = [a for a in argv if a != "--szaraz"]
    csak = []
    if "--csak" in argv:
        i = argv.index("--csak"); csak = [a for a in argv[i+1:] if a.endswith(".css")]; argv = argv[:i]
    gyoker = argv[0] if argv else "."
    fajlok = csak or [os.path.join(d, f).replace("\\", "/") for d, _, fs in os.walk(gyoker)
                      if not any(x in d for x in ("node_modules", ".next", "_torolni", "design")) for f in fs if f.endswith(".css")]
    ossz = 0
    for f in sorted(fajlok):
        db = fajl_atir(f, szaraz)
        if db: print(f"{db:4d}  {f}"); ossz += db
    print(f"{'(száraz) ' if szaraz else ''}összesen {ossz} deklaráció")

if __name__ == "__main__":
    main()
