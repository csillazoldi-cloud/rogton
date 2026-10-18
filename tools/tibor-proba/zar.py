#!/usr/bin/env python3
"""Kirakás-zár (R-15e, 2026-09-26): a Tibor-próba és a Tibor-bíráló eredményéből eldönti, maradhat-e kint a kirakás.

Két szabály (DESIGN-KERES-R15-TIBOR.md, 2. pont: „ha egy lap átlépi, nem mehet ki”):
  1. ÚJ LAP: a Tibor-szabálylapból épült lapnak (van rajta `data-r15` jelölés) a próbán ZÖLDNEK kell lennie,
     és a bíráló szerint nem lehet piros (Tibor tudja a dolgát, és a fő gombot nyomná meg).
  2. NEM ROMOLHAT: egy lapnézet sem lehet rosszabb, mint az alapban (tools/tibor-proba/alap.json) —
     ami a próbán zöld volt, zöld marad; ami a bírálónál nem volt piros, nem lesz piros.
  A régi, még át nem rajzolt lapok hibái NEM zárnak (azokat a rajz javítja) — csak a romlásuk.
  ELFOGADOTT PIROS (2026-10-04, docs/decisions/2026-10-04-elfogadott-pirosak.md): ha Csilla egy lapnézet
  bíráló-pirosát kifejezetten elfogadta (elfogadott.json), az 1. szabály bíráló-része nem zár rajta — a zar.md
  külön sorban mutatja. A próba-piros és a 2. szabály (romlás) továbbra is zár.

RAJZ-ZÁR (--rajz, kódolás ELŐTT — Vilmos 2026-09-26): a rajz_proba.py + tibor_biro.py kimenetén minden képernyő új lap.

Használat:  python3 zar.py --ki <a próba+bíráló kimeneti mappája> [--alap tools/tibor-proba/alap.json] [--frissit]
  --frissit: ha a zár nyitva, a javulásokat beírja az alapba (a racsni csak felfelé mozdul).
Kilépési kód: 0 = mehet; 1 = zárva (a zar.md-ben az ok).
"""
import argparse, json, os, sys, time

RANG = {"piros": 0, "hiba": 0, "sarga": 1, "zold": 2}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ki", required=True)
    ap.add_argument("--alap", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "alap.json"))
    ap.add_argument("--frissit", action="store_true")
    ap.add_argument("--rajz", action="store_true", help="RAJZ-zár (kódolás előtt): minden képernyő új — próbán zöld, bírálónál nem piros; alap nélkül")
    a = ap.parse_args()
    proba = {f"{e['lap']}/{e['nezet']}": e for e in json.load(open(os.path.join(a.ki, "jelentes.json")))}
    bpath = os.path.join(a.ki, "biralat.json")
    biro = {f"{x['lap']}/{x['nezet']}": x for x in json.load(open(bpath))} if os.path.exists(bpath) else {}
    epath = os.path.join(os.path.dirname(os.path.abspath(__file__)), "elfogadott.json")
    elfogadott = {} if a.rajz or not os.path.exists(epath) else json.load(open(epath))["lapok"]
    alap = {"lapok": {}} if a.rajz else (json.load(open(a.alap)) if os.path.exists(a.alap) else {"lapok": {}})

    okok, tudomasul = [], []
    if not biro:
        okok.append("nincs bírálat (biralat.json) — a zár bíráló nélkül nem nyit")
    for k, regi in alap["lapok"].items():
        if k not in proba:
            okok.append(f"{k}: eltűnt a mérésből")
    for k, e in proba.items():
        regi = alap["lapok"].get(k, {})
        b = biro.get(k)
        itelet = b["itelet"] if b else None
        jelolt = a.rajz or e["meres"].get("vanJeloles", False)
        if jelolt and not e["zold"]:
            okok.append(f"{k}: új (R-15) lap, a próbán piros — " + " · ".join(e["hibak"]))
        if jelolt and b and RANG[itelet] == 0 and k in elfogadott:
            tudomasul.append(f"ELFOGADVA {k} (nem zár — {elfogadott[k]['dontes']}): " + "; ".join(b["okok"]))
        elif jelolt and b and RANG[itelet] == 0:
            okok.append(f"{k}: új (R-15) lap, Tibor szerint piros — " + "; ".join(b["okok"]))
        if regi.get("proba") and not e["zold"]:
            okok.append(f"{k}: ROMLOTT a próbán (zöld volt) — " + " · ".join(e["hibak"]))
        if b and "biro" in regi and RANG[regi["biro"]] > 0 and RANG[itelet] == 0:
            okok.append(f"{k}: ROMLOTT Tibor szemében ({regi['biro']} → piros) — " + "; ".join(b["okok"]))

    nyitva = not okok
    if a.rajz:
        sorok = [f"# Rajz-zár — {time.strftime('%Y-%m-%d %H:%M')}", "",
                 f"**{'NYITVA — kódolható' if nyitva else 'ZÁRVA — vissza a Designhoz'}**", ""]
    else:
        sorok = [f"# Kirakás-zár — {time.strftime('%Y-%m-%d %H:%M')}", "",
                 f"**{'NYITVA — mehet' if nyitva else 'ZÁRVA — nem maradhat kint'}**", ""]
    sorok += [f"- {o}" for o in okok]
    if tudomasul:
        sorok += ["", "Elfogadott pirosak (láthatók, de nem zárnak):"] + [f"- {t}" for t in tudomasul]
    zold_p = sum(e["zold"] for e in proba.values())
    sorok += ["", f"Próba: {zold_p}/{len(proba)} zöld (alap: {sum(1 for v in alap['lapok'].values() if v.get('proba'))}). "
              f"Bíráló: {sum(1 for x in biro.values() if x['itelet'] == 'zold')} zöld, "
              f"{sum(1 for x in biro.values() if x['itelet'] == 'piros')} piros."]
    open(os.path.join(a.ki, "zar.md"), "w").write("\n".join(sorok) + "\n")
    print("\n".join(sorok))

    if nyitva and a.frissit and not a.rajz:
        uj = {"frissitve": time.strftime("%Y-%m-%d %H:%M"), "lapok": {}}
        for k, e in proba.items():
            regi = alap["lapok"].get(k, {})
            v = {"proba": bool(e["zold"] or regi.get("proba"))}
            if k in biro:
                itelet = biro[k]["itelet"] if biro[k]["itelet"] != "hiba" else regi.get("biro", "piros")
                v["biro"] = max([itelet, regi.get("biro", itelet)], key=lambda x: RANG[x])
            elif "biro" in regi:
                v["biro"] = regi["biro"]
            uj["lapok"][k] = v
        json.dump(uj, open(a.alap, "w"), ensure_ascii=False, indent=1, sort_keys=True)
        print(f"alap frissítve: {a.alap}")
    sys.exit(0 if nyitva else 1)


if __name__ == "__main__":
    main()
