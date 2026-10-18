#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""F-8.3 · Élő mérés a hírfigyelő AI-szövegeiről egy FUTÓ rendszeren (teszt vagy helyi):
próbafiók → szervezet → jóváhagyott profil (kis pékség, Marosvásárhely) → figyelési beállítás egy valódi RSS-forrással →
próbafutás → az áttekintő kártyái (fontosság, összefoglaló, miért, indoklás) + egy tartalomötlet → markdown jelentés.

Használat (a Dellről a tesztoldalra a NAS LAN-címén át):
  python tools/meres/hf-elo-meres.py --cim https://saas.mediapartizan.ro --resolve saas.mediapartizan.ro:443:192.168.1.144 --kimenet docs/meres/F-8.3-elo-teszt.md
  python tools/meres/hf-elo-meres.py --cim http://127.0.0.1:8401 --kimenet docs/meres/F-8.3-elo-helyi.md

A hívások `curl`-lal mennek (a --resolve miatt), a sütiket egy ideiglenes cookie-jar tartja. Titok nincs benne: a próbafiók
jelszava itt áll, a fiók a `proba-…@proba.example` mintát követi (a takarítás viszi).
"""
import argparse, json, subprocess, sys, tempfile, time, os, io, datetime

def curl(cim, resolve, jar, ut, modszer="GET", torzs=None):
    parancs = ["curl", "-s", "-m", "60", "-o", "-", "-w", "\n__STATUS__%{http_code}", "-b", jar, "-c", jar, "-X", modszer, f"{cim}{ut}"]
    if resolve: parancs += ["--resolve", resolve]
    if torzs is not None:
        parancs += ["-H", "content-type: application/json", "--data-binary", json.dumps(torzs, ensure_ascii=False).encode("utf-8")]
    r = subprocess.run(parancs, capture_output=True)
    ki = r.stdout.decode("utf-8", errors="replace")
    szoveg, _, statusz = ki.rpartition("\n__STATUS__")
    try: adat = json.loads(szoveg) if szoveg.strip() else {}
    except json.JSONDecodeError: adat = {"_nyers": szoveg[:300]}
    return int(statusz or 0), adat

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cim", required=True)
    ap.add_argument("--resolve", default="")
    ap.add_argument("--rss", default="https://marosvasarhelyiek.ro/feed")
    ap.add_argument("--kimenet", required=True)
    ap.add_argument("--nyelv", default="hu")
    a = ap.parse_args()
    jar = os.path.join(tempfile.gettempdir(), f"hf-elo-{int(time.time())}.jar")
    C = lambda ut, m="GET", t=None: curl(a.cim, a.resolve, jar, ut, m, t)
    email = f"proba-f83-{int(time.time())}@proba.example"; jelszo = "ProbaJelszo123!"
    s, _ = C("/api/fiok/regisztracio", "POST", {"nev": "Mérés Próba", "email": email, "jelszo": jelszo}); assert s == 201, f"regisztráció {s}"
    s, _ = C("/api/fiok/belepes", "POST", {"email": email, "jelszo": jelszo}); assert s == 200, f"belépés {s}"
    s, _ = C("/api/nyelv", "POST", {"nyelv": a.nyelv})
    s, sz = C("/api/szervezet", "POST", {"nev": "Kis Pékség Marosvásárhely [MÉRÉS]"}); assert s == 201, f"szervezet {s}"
    piszkozat = {
        "bemutatkozas": {"nev": "Kis Pékség Marosvásárhely [MÉRÉS]", "osszefoglalo": "Családi pékség Marosvásárhelyen: kovászos kenyeret és péksüteményt sütünk helyi családoknak, és kis boltoknak szállítunk a városban és Maros megyében.", "osszefoglalo_forras": "sajat", "forras_tipus": "leiras", "leiras": "Családi pékség Marosvásárhelyen, kovászos kenyér, péksütemény, helyi családok és kis boltok."},
        "kommunikacio": {"celkozonseg": "marosvásárhelyi családok és kis boltok", "celkozonseg_forras": "sajat", "cel": "tájékoztatni és érdeklődőket szerezni", "cel_forras": "sajat", "cel_kesobb": False, "nyelvek": [a.nyelv], "nyelvek_forras": "sajat", "hangnem_leiras": "közvetlen, barátságos", "hangnem_minta": "", "hangnem_nyelv": a.nyelv, "hangnem_forras": "sajat"},
    }
    s, _ = C("/api/onboarding/piszkozat", "PUT", piszkozat); assert s == 200, f"piszkozat {s}"
    s, _ = C("/api/onboarding/jovahagyas", "POST", {}); assert s == 200, f"jóváhagyás {s}"
    beallitas = {"celok": ["sajat_marka", "szakmai", "tartalomotlet"],
                 "temak": [{"nev": "Marosvásárhely", "nevvaltozatok": ["Târgu Mureș", "marosvásárhelyi"], "megkulonboztetes": "a város hírei: piac, közlekedés, rendezvények"},
                           {"nev": "pékség", "nevvaltozatok": ["kenyér", "péksütemény", "élelmiszer"], "megkulonboztetes": "élelmiszer, kiskereskedelem, helyi termelők"}],
                 "foldrajzi_fokusz": "Marosvásárhely és Maros megye", "nyelvek": [a.nyelv], "kizarasok": ["sport", "bűnügy"],
                 "idozites": {"mod": "kezi", "ora": 7, "perc": 0, "idozona": "Europe/Bucharest"}, "szabad_szoveg": ""}
    s, _ = C("/api/hirfigyelo/beallitas", "PUT", beallitas); assert s == 200, f"beállítás {s}"
    s, f = C("/api/hirfigyelo/forrasok", "POST", {"cim": a.rss}); assert s == 200, f"forrás {s} {f}"
    fid = f["hirfigyelo"]["forras"]["id"]
    s, f2 = C(f"/api/hirfigyelo/forrasok/{fid}/ellenoriz", "POST", {}); print("forrás:", f2.get("hirfigyelo", {}).get("forras", {}).get("allapot"), file=sys.stderr)
    t0 = time.time()
    s, fut = C("/api/hirfigyelo/futas", "POST", {"proba": True}); assert s == 202, f"futás {s} {fut}"
    sor_id = fut["hirfigyelo"]["sor"]["id"]
    allapot = "var"
    while time.time() - t0 < 600 and allapot in ("var", "fut"):
        time.sleep(5); s, so = C(f"/api/hirfigyelo/futas/sor/{sor_id}"); allapot = so.get("hirfigyelo", {}).get("sor", {}).get("allapot", "?")
    futas_mp = time.time() - t0
    s, at = C("/api/hirfigyelo/attekintes"); kartyak = at.get("hirfigyelo", {}).get("kartyak", [])
    otlet = None
    if kartyak:
        s, o = C(f"/api/hirfigyelo/talalatok/{kartyak[0]['fo_talalat_id']}/tartalomotlet", "POST", {}); otlet = o.get("hirfigyelo", {}).get("kartya", {}).get("tartalomotlet") or o.get("hirfigyelo", {}).get("tartalomotlet") or o
    # jelentés
    sorok = [f"# F-8.3 · Élő mérés — {a.cim} · {datetime.datetime.now():%Y-%m-%d %H:%M}", "",
             f"Forrás: {a.rss} · a futás állapota: **{allapot}** · {futas_mp:.0f} mp · kártyák: **{len(kartyak)}**", "",
             "| # | fontosság | cím | összefoglaló (kar.) | miért (kar.) | indoklás (kar.) |", "|---|---|---|---|---|---|"]
    for i, k in enumerate(kartyak, 1):
        sorok.append(f"| {i} | {k.get('fontossag')} | {str(k.get('cim',''))[:60]} | {len(k.get('osszefoglalo') or '')} | {len(k.get('miert') or '')} | {len(k.get('indoklas') or '')} |")
    eloszlas = {}
    for k in kartyak: eloszlas[str(k.get("fontossag"))] = eloszlas.get(str(k.get("fontossag")), 0) + 1
    sorok += ["", f"**Eloszlás:** {eloszlas}", "", "## A szövegek", ""]
    for i, k in enumerate(kartyak, 1):
        sorok += [f"### {i}. {k.get('cim')}", f"- **fontosság:** {k.get('fontossag')} · állapot: {k.get('ertekeles_allapot')}",
                  f"- **összefoglaló:** {k.get('osszefoglalo')}", f"- **miért:** {k.get('miert')}", f"- **indoklás:** {k.get('indoklas')}", ""]
    sorok += ["## Tartalomötlet (az 1. kártyára)", "", "```", json.dumps(otlet, ensure_ascii=False, indent=1)[:1500], "```", ""]
    io.open(a.kimenet, "w", encoding="utf-8", newline="\n").write("\n".join(sorok))
    print(f"kész: {a.kimenet} · kártyák {len(kartyak)} · {eloszlas} · {futas_mp:.0f} mp")

if __name__ == "__main__":
    main()
