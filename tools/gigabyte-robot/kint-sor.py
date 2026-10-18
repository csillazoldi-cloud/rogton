#!/usr/bin/env python3
"""A robot „Kint” sorai az élő állapotlapon (Csilla 2026-10-11: „az állapotlap soha nem maradhat le”).

    python3 kint-sor.py <nas-allapot.json> <tortenet.jsonl> <frissitve>  > uj.json
    python3 kint-sor.py --sor <sha> <ido> <mi>                             > egy történet-sor (JSON)

Python, mert a Gigabyte gazdagépén nincs node (tools/kapu/kapu.sh:19). A NAS-ról olvasott allapot.json-ba (a kirakás épp most
másolta ki a tárhelyből) beleolvasztja a robot saját „Kint” sorait (tortenet.jsonl, a legutóbbi 30) a helyükre (a legfrissebb
legfelül; a meglévő sorrend érintetlen), ismétlés nélkül; átállítja a `frissitve` mezőt; a sémát ellenőrzi (tools/allapot/sema.mjs
szabályai). Hibás JSON vagy séma → 3-as kilépés, semmit nem ír ki (a hívó ilyenkor nem tölt fel).
"""
import json, re, sys

ALLAPOT = {"kesz", "folyamatban", "hatra"}
DATUMOS = re.compile(r"^\d{2}-\d{2} \d{2}:\d{2}$")


def hibak(d):
    """A tools/allapot/sema.mjs ellenőrzése, Pythonban (ugyanazok a szabályok)."""
    h = []
    if not isinstance(d, dict):
        return ["nem objektum"]
    if not isinstance(d.get("frissitve"), str):
        h.append("frissitve")
    for k in ("projekt", "megjegyzes"):
        if not isinstance(d.get(k), str):
            h.append(f"{k}: hiányzik")
    for k in ("szakaszok", "beallitas", "lepesek", "rajtad", "naplo"):
        if not isinstance(d.get(k), list):
            h.append(f"{k}: nem lista")
    if h:
        return h
    for i, s in enumerate(d["szakaszok"]):
        if not all(isinstance(s.get(k), str) for k in ("kod", "nev", "leiras")) or s.get("allapot") not in ALLAPOT \
           or not isinstance(s.get("szazalek"), (int, float)) or not 0 <= s["szazalek"] <= 100:
            h.append(f"szakaszok[{i}]")
    for i, b in enumerate(d["beallitas"]):
        if not isinstance(b.get("nev"), str) or b.get("allapot") not in ALLAPOT:
            h.append(f"beallitas[{i}]")
    kodok = set()
    for i, l in enumerate(d["lepesek"]):
        if not isinstance(l.get("kod"), str) or not isinstance(l.get("nev"), str) or l.get("allapot") not in ALLAPOT \
           or not isinstance(l.get("ora"), (int, float)) or l.get("kod") in kodok \
           or any(k not in ("kod", "nev", "allapot", "ora", "agens", "ki", "rajtad") for k in l):
            h.append(f"lepesek[{i}]")
        kodok.add(l.get("kod"))
    for i, r in enumerate(d["rajtad"]):
        if not isinstance(r.get("mit"), str) or not isinstance(r.get("miert"), str):
            h.append(f"rajtad[{i}]")
    for i, n in enumerate(d["naplo"]):
        if not isinstance(n.get("ido"), str) or not isinstance(n.get("mi"), str):
            h.append(f"naplo[{i}]")
    return h


def main(a):
    if a[:1] == ["--sor"]:
        sha, ido, mi = a[1:4]
        print(json.dumps({"sha": sha, "ido": ido, "mi": mi}, ensure_ascii=False, separators=(",", ":")))
        return 0
    nas_fajl, tortenet_fajl, frissitve = a[:3]
    try:
        d = json.load(open(nas_fajl, encoding="utf-8"))
    except Exception as e:  # noqa: BLE001 — bármi: nem írunk
        print(f"a NAS-on lévő allapot.json nem érvényes JSON: {e}", file=sys.stderr)
        return 3
    h = hibak(d)
    if h:
        print("a NAS-on lévő allapot.json sémája hibás: " + ", ".join(h[:10]), file=sys.stderr)
        return 3
    sorok = []
    for s in open(tortenet_fajl, encoding="utf-8").read().splitlines():
        try:
            x = json.loads(s)
            if isinstance(x.get("ido"), str) and isinstance(x.get("mi"), str):
                sorok.append(x)
        except Exception:  # noqa: BLE001 — sérült történet-sor: kimarad
            pass
    megvan = {n["mi"] for n in d["naplo"]}
    # a helyére: az első olyan DÁTUMOS sor elé, ami nem újabb (a régi „23:50” sorokat átlépi); a meglévő sorrend érintetlen
    for s in sorok:  # a legrégebbivel kezd, így azonos percen belül is a frissebb kerül feljebb
        if s["mi"] in megvan:
            continue
        i = next((k for k, n in enumerate(d["naplo"]) if DATUMOS.match(n["ido"]) and n["ido"] <= s["ido"]), len(d["naplo"]))
        d["naplo"].insert(i, {"ido": s["ido"], "mi": s["mi"]})
        megvan.add(s["mi"])
    d["frissitve"] = frissitve
    h = hibak(d)
    if h:
        print("összeolvasztás után hibás a séma: " + ", ".join(h[:10]), file=sys.stderr)
        return 3
    sys.stdout.write(json.dumps(d, ensure_ascii=False, indent=2) + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
