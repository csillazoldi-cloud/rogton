#!/usr/bin/env python3
"""Ismétlő (zár-ismétlés szabály, 2026-10-01): a bíráló megismétlése a ROMLOTT lapnézeteken.

Miért: a Sonnet bíráló a 4–6 pontos sávban futásonként ±1–2 pontot ingadozik (mérve 10-01:
ugyanaz a képernyőkép 16 futásból 1-szer piros). A zár „nem romolhat” szabálya így olyan
lapnézeteket is bezár, amelyekhez a kirakás hozzá sem nyúlt. A szabály (docs/decisions/
2026-10-01-zar-ismetles-szabaly.md): egy NEM ÉRINTETT lapnézet ROMLOTT-pirosa csak akkor
számít, ha 3 bírálatból legalább 2 piros — a többséget ez a program állítja elő.
Kibővítve 10-02: MINDEN zárat záró pirosra ez a szabály (a kapu.py hívja automatikusan).

Használat:
  ANTHROPIC_API_KEY="$(cat ~/saas/vault/anthropic-kulcs)" \\
  python3 ismetlo.py --ki <a próba kimeneti mappája> --nezetek "lap/nezet,lap/nezet" [--futas 2]

Bemenet:  <ki>/jelentes.json, <ki>/biralat.json (az 1. futás), a képek.
Kimenet:  <ki>/biralat.json frissítve — a felsorolt lapnézetek ítélete a 3 futás többsége;
          minden futás eltéve az elem "ismetlesek" mezőjébe. <ki>/biralat.md végére jegyzet.
Kilépési kód: 0 = egyik felsorolt nézet sem maradt piros; 1 = maradt piros; 2 = hiba.
"""
import argparse, json, os, sys, time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tibor_biro import KULCS, CLAUDE_ALAP, kerdez, itel  # noqa: E402 — ugyanaz a bíráló, ugyanaz a szabály


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ki", required=True)
    ap.add_argument("--nezetek", required=True, help='vesszővel: "lap/nezet,lap/nezet" — csak nem érintett, ROMLOTT nézetek')
    ap.add_argument("--futas", type=int, default=2, help="ennyi ÚJ bírálat nézetenként (az 1. futás a biralat.json-ból jön)")
    ap.add_argument("--modell", default="")
    a = ap.parse_args()
    a.modell = a.modell or (CLAUDE_ALAP if KULCS else "gemma4:31b")
    jelentes = {f"{e['lap']}/{e['nezet']}": e for e in json.load(open(os.path.join(a.ki, "jelentes.json")))}
    bpath = os.path.join(a.ki, "biralat.json")
    biralat = json.load(open(bpath))
    elemek = {f"{x['lap']}/{x['nezet']}": x for x in biralat}
    kert = [n.strip() for n in a.nezetek.split(",") if n.strip()]
    maradt_piros, jegyzet = [], []
    for nev in kert:
        if nev not in jelentes or nev not in elemek:
            print(f"{nev}: nincs ilyen lapnézet a jelentésben/bírálatban", file=sys.stderr)
            sys.exit(2)
        e, elem = jelentes[nev], elemek[nev]
        elso = os.path.join(a.ki, e["kep"].replace(".png", "-elso.png"))
        kep = elso if os.path.exists(elso) else os.path.join(a.ki, e["kep"])
        fo = e["meres"].get("fo", [])
        futasok = [{"itelet": elem["itelet"], "okok": elem["okok"], "valasz": elem["valasz"]}]
        for i in range(a.futas):
            v = kerdez(kep, a.modell)
            itelet, okok = itel(v, fo if len(fo) == 1 else [])
            if itelet == "hiba":  # a nem válaszoló bíráló nem szavazat — egyszer pótoljuk
                v2 = kerdez(kep, a.modell)
                itelet, okok = itel(v2, fo if len(fo) == 1 else [])
                v = v2
            futasok.append({"itelet": itelet, "okok": okok, "valasz": v})
        ervenyes = [f for f in futasok if f["itelet"] != "hiba"]
        if len(ervenyes) < 2:
            print(f"{nev}: nincs elég érvényes bírálat ({len(ervenyes)}) — az eredeti ítélet marad", file=sys.stderr)
            sys.exit(2)
        pirosak = sum(f["itelet"] == "piros" for f in ervenyes)
        tobbseg_piros = pirosak * 2 > len(ervenyes)
        if tobbseg_piros:
            gyoztes = next(f for f in ervenyes if f["itelet"] == "piros")
            maradt_piros.append(nev)
        else:
            nem_piros = [f for f in ervenyes if f["itelet"] != "piros"]
            gyoztes = max(nem_piros, key=lambda f: int(f["valasz"].get("pont") or 0))
        elem.update(itelet=gyoztes["itelet"], okok=gyoztes["okok"], valasz=gyoztes["valasz"],
                    ismetlesek=[{"itelet": f["itelet"], "okok": f["okok"], "pont": f["valasz"].get("pont")} for f in futasok])
        pontok = "·".join(str(f["valasz"].get("pont", "?")) for f in futasok)
        sor = f"{nev}: {pirosak}/{len(ervenyes)} piros (pontok {pontok}) → {gyoztes['itelet']}"
        print(sor, flush=True)
        jegyzet.append(sor)
    json.dump(biralat, open(bpath, "w"), ensure_ascii=False, indent=1)
    mdpath = os.path.join(a.ki, "biralat.md")
    if os.path.exists(mdpath):
        with open(mdpath, "a") as f:
            f.write(f"\n## Ismétlés — {time.strftime('%Y-%m-%d %H:%M')} ({a.modell}, 3 futás többsége, "
                    f"docs/decisions/2026-10-01-zar-ismetles-szabaly.md)\n" + "\n".join("- " + s for s in jegyzet) + "\n")
    sys.exit(1 if maradt_piros else 0)


if __name__ == "__main__":
    main()
