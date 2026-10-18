#!/usr/bin/env python3
"""Tibor-bíráló (R-15d, 2026-09-26): egy második gép Tibor szemével nézi meg a Tibor-próba képeit.

A Tibor-próba SZÁMOKAT mér (szószám, fő gombok, dobozmélység). A bíráló azt kérdezi, amit a számok nem tudnak:
mit lát meg először, érti-e a dolgát, HOVA NYOMNA — és az egyezik-e a lap fő gombjával.

Gép: a helyi Ollama képes modellje (OLLAMA_URL kötelező; alap modell gemma4:31b). Csak szabványos könyvtár kell.
Gép választása: ANTHROPIC_API_KEY beállítva → Claude API (alap: claude-sonnet-5-5), különben helyi Ollama.
Claude-dal:  ANTHROPIC_API_KEY="$(cat ~/saas/vault/anthropic-kulcs)" python3 tibor_biro.py --ki <mappa> [--modell claude-sonnet-5-5]
Használat:  python3 tibor_biro.py --ki <a tibor-próba kimeneti mappája> [--modell gemma4:31b] [--csak hirek,kepek]
Bemenet:    <ki>/jelentes.json és a képek (<lap>-<nezet>-elso.png = az első képernyő; ha nincs, a teljes kép)
Kimenet:    <ki>/biralat.json, <ki>/biralat.md
Ítélet lapnézetenként:
  piros  — a dolga válasza pontosan „nem tudom”; VAGY elmenne; VAGY pont ≤ 4; VAGY a lapnak van fő gombja, és Tibor mást nyomna meg
  sárga  — bizonytalan, vagy pont 5–6
  zöld   — a többi
Kilépési kód: 0 = nincs piros; 1 = van piros; 2 = még van hátra (--max-szal darabolva, újrahívásra folytatja).
"""
import argparse, base64, json, os, re, sys, time, unicodedata, urllib.error, urllib.request

OLLAMA = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")
# Claude API: csak akkor, ha a kulcs nem üres (a csupa szóköz is üresnek számít → Ollama). A kulcsot SOHA nem írjuk ki.
KULCS = (os.environ.get("ANTHROPIC_API_KEY") or "").strip()
ANTHROPIC = os.environ.get("ANTHROPIC_URL", "https://api.anthropic.com/v1/messages")  # felülírható (próbához)
CLAUDE_ALAP = "claude-sonnet-5-5"  # a Haiku bírálónak túl szigorú volt (09-30-i kalibráció: 40/42 piros)

KERDES = """Te Kovács Tibor vagy: térkövező cég tulajdonosa Marosvásárhelyen. Nem vagy marketinges, nem olvasol szabályt,
telefonról nézed este, fáradtan. Amit nem értesz elsőre, nem nyomod meg. Amitől úgy érzed, hibáztál, attól elmész.
Ez a képernyő egy programé, ami segít neked posztokat és képeket csinálni a cégednek.
Nézd meg, és válaszolj CSAK JSON-ban, magyarul, pontosan ezekkel a mezőkkel:
{"elso":"mit látsz meg legelőször (1 mondat)",
 "dolgom":"szerinted mi a dolgod itt (1 mondat), vagy pontosan: nem tudom",
 "hova_nyomnek":"melyik gombot vagy linket nyomnád meg először — a felirata szó szerint, vagy: semmit",
 "nem_ertem":["szavak vagy részek, amiket nem értesz"],
 "ijeszt":["ami hibának, veszélynek vagy kötelezőnek látszik, pedig lehet, hogy nem az"],
 "sok_szoveg":true vagy false,
 "erzes":"jó nekem itt lenni" vagy "bizonytalan vagyok" vagy "elmennék",
 "pont":1-10 egész szám (10 = pontosan tudom, mit csináljak, és szívesen csinálom)}"""


def egyszeru(s):
    s = unicodedata.normalize("NFKD", (s or "").lower())
    return re.sub(r"[^a-z0-9 ]", " ", "".join(c for c in s if not unicodedata.combining(c))).split()


def egyezik(nyomna, fo_gombok):
    """Tibor válasza egyezik-e a lap fő gombjának feliratával (a szavak legalább fele közös)."""
    ny = set(egyszeru(nyomna))
    if not ny:
        return False
    for f in fo_gombok:
        fs = [w for w in egyszeru(f) if len(w) > 2] or egyszeru(f)
        if fs and sum(w in ny for w in fs) * 2 >= len(fs):
            return True
    return False


def kerdez(kep, modell):
    return kerdez_claude(kep, modell) if KULCS else kerdez_ollama(kep, modell)


def json_bol(s):
    """A Claude néha ```json keretbe vagy egy mondat mögé teszi a választ: az első { és az utolsó } közti részt olvassuk."""
    try:
        return json.loads(s)
    except ValueError:
        m = re.search(r"\{.*\}", s or "", re.S)
        if not m:
            raise
        return json.loads(m.group(0))


def kerdez_claude(kep, modell):
    b = base64.b64encode(open(kep, "rb").read()).decode()
    torzs = {"model": modell, "max_tokens": 1500,  # temperature-t nem küldünk: az újabb Claude-modellek elutasítják (HTTP 400, 09-30)
             "messages": [{"role": "user", "content": [
                 {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": b}},
                 {"type": "text", "text": KERDES}]}]}
    fej = {"x-api-key": KULCS, "anthropic-version": "2023-06-01", "content-type": "application/json"}
    kr = urllib.request.Request(ANTHROPIC, json.dumps(torzs).encode(), fej)
    volt_rossz = False
    for probal in range(4):  # 429 (túl sok kérés) és 529 (túlterhelt) esetén legfeljebb 3 újrapróba, egyre hosszabb várással
        try:
            v = json.load(urllib.request.urlopen(kr, timeout=60))
            try:
                return json_bol(v["content"][0]["text"])
            except (ValueError, LookupError) as e:  # csonka vagy nem-JSON válasz: egyszer újrakérdezünk
                if not volt_rossz:
                    volt_rossz = True
                    continue
                return {"hiba": f"kétszer értelmezhetetlen válasz: {e}"[:200]}
        except urllib.error.HTTPError as e:
            if e.code in (429, 529) and probal < 3:
                time.sleep(5 * 2 ** probal)  # 5, 10, 20 mp
                continue
            try:  # csak az API hibaüzenete megy ki — a kérés fejléce (benne a kulcs) soha
                uzenet = json.loads(e.read().decode("utf-8", "replace"))["error"]["message"]
            except Exception:
                uzenet = e.reason
            print(f"Claude API hiba {e.code}: {uzenet}", file=sys.stderr, flush=True)
            return {"hiba": f"HTTP {e.code}: {uzenet}"[:200]}
        except Exception as e:  # időtúllépés, hálózat, értelmezhetetlen válasz → megbíráltlan lap, mint az Ollamánál
            return {"hiba": str(e)[:200]}


def kerdez_ollama(kep, modell):
    b = base64.b64encode(open(kep, "rb").read()).decode()
    torzs = {"model": modell, "stream": False, "format": "json",
             "options": {"temperature": 0, "num_ctx": 16384},
             "messages": [{"role": "user", "content": KERDES, "images": [b]}]}
    kr = urllib.request.Request(OLLAMA + "/api/chat", json.dumps(torzs).encode(), {"content-type": "application/json"})
    for probal in range(2):
        try:
            v = json.load(urllib.request.urlopen(kr, timeout=300))
            return json.loads(v["message"]["content"])
        except Exception as e:  # egy újrapróba: a helyi gép néha a modell betöltésével van elfoglalva
            if probal:
                return {"hiba": str(e)[:200]}
            time.sleep(5)


def itel(v, fo_gombok):
    if "hiba" in v:
        return "hiba", ["a bíráló nem válaszolt: " + v["hiba"]]
    okok = []
    try:
        pont = int(v.get("pont", 0))
    except (TypeError, ValueError):
        pont = 0
    dolgom = (v.get("dolgom") or "").lower()
    erzes = (v.get("erzes") or "").lower()
    # 2026-10-01 (Csilla): a „nem tudom” csak akkor piros, ha a VÁLASZ EGÉSZE ennyi — a Sonnet óvatos,
    # kifejtő mondatai („…de nem tudom pontosan, mi lesz utána”) helyes dolgom-leírás mellett sárgát érnek,
    # nem pirosat; a gemma tőmondataira írt részsztring-egyezés itt félremért (docs/decisions/2026-10-01).
    if re.fullmatch(r"\W*nem tudom\W*", dolgom):
        okok.append("nem tudja, mi a dolga")
    if "elmenn" in erzes:
        okok.append("elmenne")
    if pont <= 4:
        okok.append(f"pont {pont}")
    if fo_gombok and not egyezik(v.get("hova_nyomnek", ""), fo_gombok):
        okok.append(f"félrenyom: „{v.get('hova_nyomnek', '')}” a fő gomb („{fo_gombok[0]}”) helyett")
    if okok:
        return "piros", okok
    if "bizonytalan" in erzes or pont <= 6:
        return "sarga", [f"bizonytalan, pont {pont}"]
    return "zold", []


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ki", required=True)
    ap.add_argument("--modell", default="", help=f"alap: {CLAUDE_ALAP} (Claude) vagy gemma4:31b (Ollama)")
    ap.add_argument("--csak", default="", help="vesszővel: csak ezek a lapok")
    ap.add_argument("--max", type=int, default=0, help="legfeljebb ennyi új lapnézet ebben a hívásban (a kész bírálatot folytatja)")
    a = ap.parse_args()
    a.modell = a.modell or (CLAUDE_ALAP if KULCS else "gemma4:31b")
    jelentes = json.load(open(os.path.join(a.ki, "jelentes.json")))
    csak = {x for x in a.csak.split(",") if x}
    bpath = os.path.join(a.ki, "biralat.json")
    ki = json.load(open(bpath)) if os.path.exists(bpath) else []  # folytatás: a már megbírált lapnézet kimarad
    kesz = {(x["lap"], x["nezet"]) for x in ki if x["itelet"] != "hiba"}
    ki = [x for x in ki if (x["lap"], x["nezet"]) in kesz]
    uj = 0
    for e in jelentes:
        if csak and e["lap"] not in csak:
            continue
        if (e["lap"], e["nezet"]) in kesz:
            continue
        if a.max and uj >= a.max:
            break
        uj += 1
        elso = os.path.join(a.ki, e["kep"].replace(".png", "-elso.png"))
        kep = elso if os.path.exists(elso) else os.path.join(a.ki, e["kep"])
        t = time.time()
        v = kerdez(kep, a.modell)
        fo = e["meres"].get("fo", [])
        itelet, okok = itel(v, fo if len(fo) == 1 else [])
        ki.append({"lap": e["lap"], "nezet": e["nezet"], "itelet": itelet, "okok": okok, "valasz": v,
                   "jelolt": e["meres"].get("vanJeloles", False), "mp": round(time.time() - t)})
        json.dump(ki, open(bpath, "w"), ensure_ascii=False, indent=1)
        print(f"{e['lap']:<18} {e['nezet']:<8} {itelet:<5} {v.get('pont', '?')!s:>2}  {'; '.join(okok)}", flush=True)
    hatra = sum(1 for e in jelentes if (not csak or e["lap"] in csak) and (e["lap"], e["nezet"]) not in {(x["lap"], x["nezet"]) for x in ki})
    if hatra:
        print(f"még {hatra} lapnézet hátra — futtasd újra ugyanígy")
        sys.exit(2)
    jel = {"zold": "✅", "sarga": "🟡", "piros": "❌", "hiba": "⚠️"}
    sorok = [f"# Tibor-bíráló — {time.strftime('%Y-%m-%d %H:%M')} ({a.modell})", "",
             f"**{sum(x['itelet'] == 'zold' for x in ki)} zöld · {sum(x['itelet'] == 'sarga' for x in ki)} sárga · "
             f"{sum(x['itelet'] == 'piros' for x in ki)} piros** ({len(ki)} lapnézet)", "",
             "| Lap | Nézet | Ítélet | Pont | Mit lát először | Mi a dolga | Hova nyomna | Nem érti |", "|---|---|---|---|---|---|---|---|"]
    for x in ki:
        v = x["valasz"]
        cella = lambda s: str(s).replace("|", "/").replace("\n", " ")[:90]
        sorok.append(f"| {x['lap']} | {x['nezet']} | {jel[x['itelet']]} {cella('; '.join(x['okok']))} | {v.get('pont', '')} | "
                     f"{cella(v.get('elso', ''))} | {cella(v.get('dolgom', ''))} | {cella(v.get('hova_nyomnek', ''))} | "
                     f"{cella(', '.join(v.get('nem_ertem', []) if isinstance(v.get('nem_ertem'), list) else [str(v.get('nem_ertem', ''))]))} |")
    open(os.path.join(a.ki, "biralat.md"), "w").write("\n".join(sorok) + "\n")
    print("\n".join(sorok[:3]))
    sys.exit(1 if any(x["itelet"] == "piros" for x in ki) else 0)


if __name__ == "__main__":
    main()
