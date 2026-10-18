#!/usr/bin/env python3
"""Fizetős ágens futtatása — Vilmos gépének Linux-munkakörnyezetében fut, mert a kulcsok a vaultban
vannak, és a vault nem kerül a felhőbe.

Használat:
  python3 agens.py --szolgaltato deepseek|kimi --feladat feladat.md --kimenet /tmp/agens-ki/nev \
                   [--melleklet fajl ...] [--lepes E-3] [--szerep epito]

A feladatfájl a rendszerutasítás + feladat. A mellékletek (forrásfájlok) a kérés végére kerülnek.
Az ágens a fájlokat ilyen blokkokban adja vissza:
    === FÁJL: relatív/út/fajl.ts ===
    ...tartalom...
    === FÁJL VÉGE ===
Ezeket a script a --kimenet mappába írja. A hívás tokenszáma és becsült ára a naplóba kerül
(docs/agens-naplo.jsonl a tárhelyen, ide: /tmp/repo, ha van), a kulcs sehol nem jelenik meg.
"""
import argparse, io, json, os, re, sys, time, urllib.request, datetime, pathlib

# A vault harom helyen allhat, ebben a sorrendben: a tarhely melletti `vault/` (a Dellen, 2026-09-11-tol; a .gitignore
# kihagyja), a Gigabyte-on a SynologyDrive alatt, a regi Cowork-hid munkakornyezeteben a ~/mnt/SaaS alatt.
_ITT = os.path.dirname(os.path.abspath(__file__))
_VAULT_HELYEK = (os.path.join(_ITT, "..", "..", "vault"), "~/SynologyDrive/SaaS/vault", "~/mnt/SaaS/vault")
VAULT = next((os.path.normpath(os.path.expanduser(h)) for h in _VAULT_HELYEK
              if os.path.isdir(os.path.expanduser(h))), os.path.expanduser("~/mnt/SaaS/vault"))
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")
SZOLGALTATOK = {
    # ár: USD / 1 millió token (be gyorsítótár nélkül, ki) — 2026-09-06-án nézve:
    #  DeepSeek V4-Flash 0,14 / 0,28 (a "deepseek-chat" név erre fut; a válasz "model" mezője a naplóba kerül)
    #  Kimi k2.6 0,95 / 4,00 (platform.kimi.ai/docs/pricing/chat-k26)
    "deepseek": {"url": "https://api.deepseek.com/chat/completions", "modell": "deepseek-chat",
                 "kulcs": "deepseek-key.txt", "ar_be": 0.14, "ar_ki": 0.28},
    "kimi": {"url": "https://api.moonshot.ai/v1/chat/completions", "modell": "kimi-k2.6",
             "kulcs": "kimi-key.txt", "ar_be": 0.95, "ar_ki": 4.00},
    # helyi, ingyenes: a Dell Ollamaja a sajat /api/chat felulettel (gondolkodas kikapcsolva; a 128k-s Modelfile-valtozat: 131072 szovegkeret ingyen, merve 2026-09-11)
    "qwen": {"url": OLLAMA_URL + "/api/chat", "modell": "qwen3.8-128k:27b",
             "kulcs": None, "ar_be": 0.0, "ar_ki": 0.0, "helyi": True},
}

def kulcs(f):
    return io.open(os.path.join(VAULT, f), encoding="utf-8-sig").read().strip()

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--szolgaltato", required=True, choices=SZOLGALTATOK)
    ap.add_argument("--feladat", required=True)
    ap.add_argument("--kimenet", required=True)
    ap.add_argument("--melleklet", nargs="*", default=[])
    ap.add_argument("--lepes", default="?")
    ap.add_argument("--szerep", default="?")
    ap.add_argument("--max-tokens", type=int, default=16000)
    ap.add_argument("--modell", default=None, help="a szolgaltato alapmodellje helyett (pl. qwen3.8-128k:27b)")
    # a tárhely-másolat (/tmp/repo) az igazság; a SaaS-mappát az rsync onnan frissíti — oda írva a napló felülíródna
    # A naplo a tarhely-masolatba megy (az az igazsag). A tarhelyt a script sajat helyehez kepest
    # keressuk (tools/agens/agens.py -> ../../docs), igy mindegy, hova van klonozva; ha nincs meg,
    # a SaaS mappaba irunk. (2026-09-09: a hid a Gigabyte gepre kerult, ott $HOME/repo a masolat.)
    _repo_naplo = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "docs", "agens-naplo.jsonl")
    ap.add_argument("--naplo", default=os.path.normpath(_repo_naplo) if os.path.isdir(os.path.dirname(_repo_naplo)) else os.path.expanduser("~/mnt/SaaS/docs/agens-naplo.jsonl"))
    a = ap.parse_args()
    sz = dict(SZOLGALTATOK[a.szolgaltato])
    if a.modell: sz["modell"] = a.modell

    feladat = io.open(a.feladat, encoding="utf-8").read()
    mell = []
    for m in a.melleklet:
        mell.append(f"\n\n=== MELLÉKLET: {m} ===\n" + io.open(m, encoding="utf-8").read() + "\n=== MELLÉKLET VÉGE ===")
    uzenetek = [
        {"role": "system", "content": "Tapasztalt TypeScript/Next.js fejlesztő vagy egy magyar csapatban. "
         "Pontosan a kapott szerződést tartod, nem találsz ki új felületet. A kódban a megjegyzések és az "
         "azonosítók magyarul vannak (ékezet nélkül az azonosítókban). Kizárólag a kért fájlokat add vissza, "
         "mindegyiket külön blokkban:\n=== FÁJL: relatív/út ===\n(tartalom)\n=== FÁJL VÉGE ===\n"
         "A blokkokon kívül legfeljebb 10 sor magyarázat lehet."},
        {"role": "user", "content": feladat + "".join(mell)},
    ]
    t0 = time.time()
    fejlec = {"Content-Type": "application/json"}
    if sz.get("helyi"):
        # Ollama: gondolkodas ki (a kimeneti keretet enne), alacsony homerseklet, 32k szovegkeret, hosszkorlat
        keres = {"model": sz["modell"], "messages": uzenetek, "stream": False, "think": False,
                 "options": {"temperature": 0.2, "num_ctx": 32768, "num_predict": a.max_tokens}}
        idokorlat = 3600
    else:
        keres = {"model": sz["modell"], "messages": uzenetek, "max_tokens": a.max_tokens}
        if a.szolgaltato == "kimi":
            # a k2.7-code gondolkodó modell: a gondolkodás nem kapcsolható ki, és a kimeneti keretet felemészti;
            # a k2.6 gondolkodás nélkül fut (mérve 2026-09-06), így kód-válaszra ez a jó
            keres["thinking"] = {"type": "disabled"}
        else:
            keres["temperature"] = 0.2
        fejlec["Authorization"] = "Bearer " + kulcs(sz["kulcs"])
        idokorlat = 900
    def hivas():
        req = urllib.request.Request(sz["url"], data=json.dumps(keres).encode(), headers=fejlec)
        try:
            return json.load(urllib.request.urlopen(req, timeout=idokorlat))
        except urllib.error.HTTPError as e:
            print("HIBA", e.code, e.read().decode(errors="replace")[:500]); sys.exit(2)
        except urllib.error.URLError as e:
            print("HIBA kapcsolat:", e.reason, "-", sz["url"]); sys.exit(2)
    r = hivas()
    ismetelt = False
    if sz.get("helyi"):
        # 2026-09-13: egy Qwen-válasz 4391 tokennél, mondat közben szakadt meg (a keret és a hosszkorlát alatt) — ha a megállás oka nem "stop",
        # vagy nincs fájl-blokk a válaszban, EGY ismétlés jár (helyben ingyen); a napló mindkettőt őrzi
        elso = r.get("message", {}).get("content", "")
        if r.get("done_reason") != "stop" or "=== FÁJL:" not in elso:
            print(f"FIGYELEM: az első válasz nem teljes (done_reason={r.get('done_reason')}, fájl-blokk: {'van' if '=== FÁJL:' in elso else 'nincs'}) — ismétlés", file=sys.stderr)
            r2 = hivas(); ismetelt = True
            if r2.get("done_reason") == "stop" and "=== FÁJL:" in r2.get("message", {}).get("content", ""): r = r2
            elif "=== FÁJL:" in r2.get("message", {}).get("content", "") and "=== FÁJL:" not in elso: r = r2
    ido = round(time.time() - t0, 1)
    if sz.get("helyi"):
        szoveg = r["message"]["content"]
        szoveg = re.sub(r"<think>.*?</think>\s*", "", szoveg, flags=re.S)  # ha megis gondolkodna
        be, ki = r.get("prompt_eval_count", 0), r.get("eval_count", 0)
        # az Ollama megmondja, miért állt meg: "stop" = kész, "length" = a szövegkeret/hosszkorlát vágta el — ezt a napló is őrzi
        megallas = r.get("done_reason")
        if megallas == "length":
            print(f"FIGYELEM: a válasz elvágva (done_reason=length) — prompt {be} + válasz {ki} token; a szövegkeret (num_ctx) vagy a hosszkorlát kevés", file=sys.stderr)
    else:
        szoveg = r["choices"][0]["message"]["content"]
        u = r.get("usage", {})
        be, ki = u.get("prompt_tokens", 0), u.get("completion_tokens", 0)
    ar = be / 1e6 * sz["ar_be"] + ki / 1e6 * sz["ar_ki"]

    ki_mappa = pathlib.Path(a.kimenet); ki_mappa.mkdir(parents=True, exist_ok=True)
    (ki_mappa / "_nyers-valasz.md").write_text(szoveg, encoding="utf-8")
    fajlok = re.findall(r"=== FÁJL: (.+?) ===\n(.*?)\n=== FÁJL VÉGE ===", szoveg, re.S)
    for ut, tartalom in fajlok:
        ut = ut.strip().lstrip("/")
        if ".." in ut: continue
        c = ki_mappa / ut; c.parent.mkdir(parents=True, exist_ok=True)
        c.write_text(tartalom.rstrip() + "\n", encoding="utf-8")
    bejegyzes = {"ido": datetime.datetime.now().isoformat(timespec="seconds"), "lepes": a.lepes, "szerep": a.szerep,
                 "szolgaltato": a.szolgaltato, "modell": sz["modell"], "modell_valasz": r.get("model"), "feladat": os.path.basename(a.feladat),
                 "tokenek_be": be, "tokenek_ki": ki, "becsult_usd": round(ar, 4), "masodperc": ido,
                 **({"megallas": megallas, "ismetelt": ismetelt} if sz.get("helyi") else {}),
                 "fajlok": [f[0].strip() for f in fajlok]}
    with io.open(a.naplo, "a", encoding="utf-8") as n:
        n.write(json.dumps(bejegyzes, ensure_ascii=False) + "\n")
    print(json.dumps(bejegyzes, ensure_ascii=False, indent=1))

if __name__ == "__main__":
    main()
