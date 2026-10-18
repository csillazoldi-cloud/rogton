#!/usr/bin/env python3
"""Térköz-mérés (R-0 / F-0). Megszámolja a stíluslapokban a PIXELBEN írt térköz-értékeket, és kiadja,
hogy a tizenöt fokú skálára (0 2 4 6 8 10 12 14 16 20 24 32 40 56 80) állítva mennyi mozdulna.

Térköz-tulajdonság: margin*, padding*, gap, row-gap, column-gap, grid-gap, grid-row-gap, grid-column-gap,
inset*, top/right/bottom/left NEM (az elhelyezés, nem térköz — külön, tájékoztató számként jelenik meg).
Nem térköz: width/height/min-*/max-* (alakérték), border (--bw), border-radius (--r-*), font-size (--fs-*).

Használat:  python tools/meres/terkoz-meres.py [--md] [gyökér]
  --md   markdown-táblák (a MERES.md-be illeszthető)
  A számlálás egysége: a "szám" = egy px-érték egy deklarációban (padding: 8px 12px = 2 szám, 1 előfordulás).
"""
import re, sys, os, collections, json

SKALA = [0, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 32, 40, 56, 80]
TERKOZ = re.compile(r"^(margin|padding)(-(top|right|bottom|left|inline|block|inline-start|inline-end|block-start|block-end))?$|^(row-|column-|grid-|grid-row-|grid-column-)?gap$")
ELHELYEZES = re.compile(r"^(top|right|bottom|left|inset(-.*)?)$")
PX = re.compile(r"(?<![\w.-])(-?\d+(?:\.\d+)?)px(?![\w-])")
DEKL = re.compile(r"([a-zA-Z-]+)\s*:\s*([^;{}]+);")

def fok(ertek):
    """A legközelebbi fok; holtversenyben a sűrűbb (kisebb). Az 1px a --ter-1-re megy (2px), nem a nullára."""
    v = abs(ertek)
    if v == 1: return 1
    legjobb = min(range(len(SKALA)), key=lambda i: (abs(SKALA[i] - v), SKALA[i]))
    return legjobb

def css_fajlok(gyoker):
    for d, _, fs in os.walk(gyoker):
        if any(x in d for x in ("node_modules", ".next", "_torolni", "design")): continue
        for f in fs:
            if f.endswith(".css"): yield os.path.join(d, f).replace("\\", "/")

def mer(gyoker):
    per_fajl = {}
    ertekek = collections.Counter()      # px-szám -> hányszor (térköz)
    kombinaciok = collections.Counter()  # deklaráció értéke -> hányszor
    elhelyezes_db = 0
    nagy = []                            # (fajl, sor, tulajdonsag, ertek, fok, elmozdulas) ha |elmozdulás| > 2
    for f in css_fajlok(gyoker):
        s = open(f, encoding="utf-8").read()
        s = re.sub(r"/\*.*?\*/", lambda m: " " * len(m.group()), s, flags=re.S)
        db_szam = db_elof = 0
        for m in DEKL.finditer(s):
            tul, ert = m.group(1).strip().lower(), m.group(2).strip()
            if tul.startswith("--"): continue
            pxek = [float(x) for x in PX.findall(ert)]
            if not pxek: continue
            if ELHELYEZES.match(tul): elhelyezes_db += len(pxek); continue
            if not TERKOZ.match(tul): continue
            sor = s.count("\n", 0, m.start()) + 1
            db_elof += 1; db_szam += len(pxek)
            kombinaciok[f"{tul}: {ert}"] += 1
            for p in pxek:
                p_int = int(p) if p == int(p) else p
                ertekek[p_int] += 1
                if p != 0:
                    i = fok(p); elm = SKALA[i] - abs(p)
                    if abs(elm) > 2: nagy.append((f, sor, tul, p_int, i, elm))
        if db_szam: per_fajl[f] = (db_szam, db_elof)
    merleg = collections.Counter()
    for ertek, db in ertekek.items():
        if ertek == 0: merleg["pontos"] += db; continue
        elm = abs(SKALA[fok(ertek)] - abs(ertek))
        merleg["pontos" if elm == 0 else "1px" if elm == 1 else "2px" if elm == 2 else "tobb"] += db
    fokonkent = collections.Counter()
    for ertek, db in ertekek.items():
        fokonkent[0 if ertek == 0 else fok(ertek)] += db
    return dict(per_fajl=per_fajl, ertekek=ertekek, kombinaciok=kombinaciok, elhelyezes=elhelyezes_db,
                nagy=nagy, merleg=merleg, fokonkent=fokonkent)

def main():
    md = "--md" in sys.argv
    argv = [a for a in sys.argv[1:] if a != "--md"]
    gyoker = argv[0] if argv else "."
    r = mer(gyoker)
    ossz_szam = sum(v[0] for v in r["per_fajl"].values()); ossz_elof = sum(v[1] for v in r["per_fajl"].values())
    if md:
        print("| Stíluslap | px-számok | előfordulás (deklaráció) |\n|---|---|---|")
        for f, (n, e) in sorted(r["per_fajl"].items(), key=lambda x: -x[1][0]):
            print(f"| `{f}` | {n} | {e} |")
        print(f"| **Összesen** | **{ossz_szam}** | **{ossz_elof}** |")
        print(f"\nKülönböző px-értékek: **{len(r['ertekek'])}** · különböző értékkombinációk: **{len(r['kombinaciok'])}** · "
              f"elhelyezés (top/left/inset, nem térköz, nem számít): {r['elhelyezes']}\n")
        print("| px | hányszor | fok |\n|---|---|---|")
        for v, db in sorted(r["ertekek"].items(), key=lambda x: -x[1]):
            print(f"| {v} | {db} | `--ter-{0 if v == 0 else fok(v)}` |")
        m = r["merleg"]
        print(f"\n| Mi történik | Hány szám |\n|---|---|\n| pontosan a skálára esik | {m['pontos']} |\n| 1 pixelt mozdul | {m['1px']} |"
              f"\n| 2 pixelt mozdul | {m['2px']} |\n| 2 pixelnél többet mozdul | **{m['tobb']}** |")
        print("\n| Fok | Használat (szám) |\n|---|---|")
        for i in range(len(SKALA)): print(f"| `--ter-{i}` ({SKALA[i]}px) | {r['fokonkent'].get(i, 0)} |")
        print("\n**A 2 pixelnél nagyobb elmozdulások helye:**\n\n| Fájl | Sor | Tulajdonság | Ma | Fok | Mozdul |\n|---|---|---|---|---|---|")
        for f, sor, tul, ert, i, elm in sorted(r["nagy"]):
            print(f"| `{f}` | {sor} | {tul} | {ert}px | `--ter-{i}` ({SKALA[i]}px) | {elm:+g} |")
    else:
        print(json.dumps(dict(per_fajl=r["per_fajl"], ossz_szam=ossz_szam, ossz_elof=ossz_elof, kulonbozo_ertek=len(r["ertekek"]),
                              kulonbozo_kombinacio=len(r["kombinaciok"]), merleg=r["merleg"], fokonkent=r["fokonkent"],
                              nagy=len(r["nagy"])), ensure_ascii=False, indent=1))

if __name__ == "__main__":
    main()
