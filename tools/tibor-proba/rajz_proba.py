#!/usr/bin/env python3
"""Rajz-próba (R-15, 2026-09-26): a Tibor-próba a Design RAJZÁN, kódolás előtt.

Vilmos (2026-09-26): „miért a kirakásnál nézi Tibor? miért nem a munka, a kódolás elkezdése előtt?” — ezért a mérés és a
Tibor-bíráló a rajzon fut: piros rajz nem megy kódolásra, visszamegy a Designhoz azzal, amit Tibor nem értett.

Használat:  python3 rajz_proba.py <rajz.dc.html> [--ki kimenet] [--csak "04 Hírek,08 Posztszöveg"]
Bemenet:    a Design .dc.html rajza. Egy képernyő = `[data-r15-kepernyo="telefon|asztali"]` elem (a Design jelöli, a lap neve
            a legközelebbi `section[data-screen-label]`). Jelölés nélkül: minden 390 vagy 1440 széles „legkülső” doboz.
Kimenet:    ugyanaz, mint a tibor_proba.py-é (<ki>/jelentes.json, jelentes.md, kep/<lap>-<nezet>[-n].png és -elso.png),
            tehát a Tibor-bíráló (tools/tibor-biro) és a zár (zar.py --rajz) változtatás nélkül megy rajta.
Hogyan mér: a képernyőt kiemeli a vászonból (a lap tetejére teszi, minden mást elrejt, a séma-jelölést átviszi), az ablakot
            a képernyő szélességére állítja (390×844 / 1440×900), és ugyanazt a mérőt futtatja, mint az élő lapon.
Kilépési kód: 0 = minden képernyő zöld; 1 = van piros.
"""
import argparse, asyncio, json, os, re, sys, time
from playwright.async_api import async_playwright

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tibor_proba import MERO_JS, ertekel  # noqa: E402 — ugyanaz a mérő és ugyanazok a határok, mint élőben

NEZET = {390: ("telefon", 844), 1440: ("asztali", 900)}

KERES_JS = r"""
() => {
  const jelolt = [...document.querySelectorAll('[data-r15-kepernyo]')];
  const lista = jelolt.length ? jelolt : [...document.querySelectorAll('section[data-screen-label] *')].filter((el) => {
    const w = Math.round(el.getBoundingClientRect().width);
    if (w !== 390 && w !== 1440) return false;
    const p = el.parentElement; return !p || Math.round(p.getBoundingClientRect().width) !== w;   // a legkülső ilyen doboz
  }).filter((el, i, t) => !t.some((m) => m !== el && m.contains(el)));
  return lista.map((el, i) => { el.setAttribute('data-rajz-sorszam', String(i));
    const sec = el.closest('section[data-screen-label]');
    const w = Math.round(el.getBoundingClientRect().width);
    return { i, lap: sec ? sec.getAttribute('data-screen-label') : 'lap', nezet: el.getAttribute('data-r15-kepernyo') || (w === 390 ? 'telefon' : 'asztali'), w }; });
}
"""

KIEMEL_JS = r"""
(i) => {
  const el = document.querySelector(`[data-rajz-sorszam="${i}"]`);
  const sema = el.closest('[data-sema]'); const s = sema ? sema.getAttribute('data-sema') : null;
  const kinn = getComputedStyle(el.parentElement);
  const doboz = document.createElement('div');
  if (s && !el.hasAttribute('data-sema')) doboz.setAttribute('data-sema', s);
  doboz.style.cssText = `font-family:${kinn.fontFamily};font-size:${kinn.fontSize};line-height:${kinn.lineHeight};color:${kinn.color}`;
  for (const c of [...document.body.children]) c.style.display = 'none';
  document.body.style.margin = '0';
  el.style.width = '100%'; el.style.maxWidth = 'none'; el.style.margin = '0'; el.style.border = '0'; el.style.borderRadius = '0';
  el.style.minHeight = '100vh'; el.style.boxSizing = 'border-box';
  doboz.appendChild(el); document.body.prepend(doboz);
  document.documentElement.setAttribute('data-sema', s || document.documentElement.getAttribute('data-sema') || '');
}
"""


def fajlnev(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower().encode("ascii", "ignore").decode()).strip("-") or "lap"


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("rajz")
    ap.add_argument("--ki", default="rajz-proba-ki")
    ap.add_argument("--csak", default="", help="vesszővel: csak ezek a lapok (data-screen-label)")
    a = ap.parse_args()
    os.makedirs(os.path.join(a.ki, "kep"), exist_ok=True)
    cim = "file://" + os.path.abspath(a.rajz)
    csak = {x.strip() for x in a.csak.split(",") if x.strip()}
    eredmeny, darab = [], {}
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 1720, "height": 1200})
        await pg.goto(cim, wait_until="networkidle"); await pg.wait_for_timeout(2500)
        kepernyok = await pg.evaluate(KERES_JS)
        await pg.close()
        for k in kepernyok:
            if csak and k["lap"] not in csak:
                continue
            w = 390 if k["nezet"] == "telefon" else 1440
            h = NEZET[w][1]
            pg = await b.new_page(viewport={"width": w, "height": h})
            await pg.goto(cim, wait_until="networkidle"); await pg.wait_for_timeout(2500)
            await pg.evaluate(KERES_JS); await pg.evaluate(KIEMEL_JS, k["i"]); await pg.wait_for_timeout(300)
            m = await pg.evaluate(MERO_JS)
            hibak, jelz = ertekel(m, k["nezet"])
            nev = fajlnev(k["lap"]); kulcs = (nev, k["nezet"]); darab[kulcs] = darab.get(kulcs, 0) + 1
            lapnev = nev if darab[kulcs] == 1 else f"{nev}-{darab[kulcs]}"
            kep = f"kep/{lapnev}-{k['nezet']}.png"
            await pg.screenshot(path=os.path.join(a.ki, kep), full_page=True)
            await pg.screenshot(path=os.path.join(a.ki, kep.replace(".png", "-elso.png")))
            eredmeny.append({"lap": lapnev, "cimke": k["lap"], "nezet": k["nezet"], "ut": a.rajz, "zold": not hibak, "hibak": hibak,
                             "jelzesek": jelz, "meres": {x: v for x, v in m.items() if x != "szoveg"}, "kep": kep})
            await pg.close()
        await b.close()
    json.dump(eredmeny, open(os.path.join(a.ki, "jelentes.json"), "w"), ensure_ascii=False, indent=1)
    zold = sum(e["zold"] for e in eredmeny)
    sorok = [f"# Rajz-próba — {os.path.basename(a.rajz)} — {time.strftime('%Y-%m-%d %H:%M')}", "",
             f"**{zold} / {len(eredmeny)} képernyő zöld.**", "",
             "| Lap | Nézet | Szó | Fő gomb | Doboz-mélység | Eredmény |", "|---|---|---|---|---|---|"]
    for e in eredmeny:
        m = e["meres"]
        sorok.append(f"| {e['lap']} | {e['nezet']} | {m['szavak']} | {len(m['fo'])} | {m['melyseg']} | "
                     f"{('✅' if e['zold'] else '❌ ' + ' · '.join(e['hibak'])).replace(chr(10), ' ')} |")
    open(os.path.join(a.ki, "jelentes.md"), "w").write("\n".join(sorok) + "\n")
    print("\n".join(sorok))
    sys.exit(0 if eredmeny and zold == len(eredmeny) else 1)


if __name__ == "__main__":
    asyncio.run(main())
