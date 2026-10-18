#!/usr/bin/env python3
"""Tibor-próba (R-15, 2026-09-26): a teszt minden lapját egy friss fiókkal végigjárja asztali (1440) és telefonos (390)
nézetben, és lapnként megméri a Tibor-szabálylap számait. A mérés a képernyőről megy (a böngésző látja, amit Tibor), nem a kódból.

Használat:  python3 tibor_proba.py [--cim http://127.0.0.1:8410] [--ki kimenet_mappa] [--allapot fiok.json]
Kimenet:    <ki>/jelentes.md, <ki>/jelentes.json, <ki>/kep/<lap>-<nezet>.png (+ <lap>-<nezet>-elso.png: az első képernyő)
Kilépési kód: 0 = minden lap zöld; 1 = van piros lap (ezt a kirakás-őr használja).

A menüsor (header, nav) szövege nem számít bele a szószámba és a tiltott szavakba — a menüt a szabálylap külön rendezi.
A lapon lévő `data-r15` jelöléseket (design/R15/tokenek.md 3. pont) előnyben részesíti; ahol nincs jelölés, becsül.
A mért szabályok (DESIGN-KERES-R15-TIBOR.md 2. pont):
  T1 cím ≤ 6 szó · T2 pontosan 1 fő gomb · T3 tiltott szavak · T5 ≤ 60 / 40 szó görgetés nélkül
  T6 doboz a dobozban · T7 figyelmeztető szín baj nélkül (jelzés, nem hiba) · T10 vízszintes görgetés, lebegő elem takar-e
"""
import argparse, asyncio, json, os, random, re, sys, time
from playwright.async_api import async_playwright

LAPOK = [
    ("kezdolap", "/kezdolap"), ("hirek", "/hirfigyelo"), ("mit-figyeljunk", "/hirfigyelo/beallitas"),
    ("pontositas", "/hirfigyelo/finomhangolas"), ("posztszoveg", "/poszt"), ("kepek", "/kepek"),
    ("kepek-kitolto", "/kepek/uj/akcio"), ("iranytu", "/iranytu"), ("szervezet-adatai", "/fiok"),
    ("beallitasok", "/gephaz"), ("ertesitesek", "/beallitasok"), ("tagok", "/tagok"),
    # R-18 8. kör (Round 8 rajz): a Beállítások Adatkezelés része és a Naptár hete is mérve
    ("adatkezeles", "/beallitasok?ful=adatpolitika"), ("naptar", "/naptar"),
    # R-16 · Arculat — a végleges lista (K7, 2026-09-30): a K7 óta a /fiok belépő sorából („Logó, színek, betűk” · Megnyitás)
    # elérhetők, már nem sötét lapok. A /fiok („szervezet-adatai”) fent, a belépő sorral együtt mérve.
    ("arculat-logok", "/fiok/arculat/logok"),  # R-16 K1 · 12f
    ("arculat", "/fiok/arculat"),  # R-16 K3 · 12a/12b/12c
    ("arculat-szinek", "/fiok/arculat/szinek"),  # R-16 K4 · 12d
    ("arculat-mas-szin", "/fiok/arculat/szinek/mas?ful=masodik"),  # R-16 K4 · 12d2
    ("arculat-betuk", "/fiok/arculat/betuk"),  # R-16 K5 · 12e
    ("arculat-nevlogo", "/fiok/arculat/nevlogo"),  # R-16 K6 · 12g
]
NYILVANOS = [("nyitolap", "/"), ("regisztracio", "/regisztracio"), ("belepes", "/belepes")]
# T3 — a szabálylap (design/R15/tokenek.md 3. pont) listája. A ro · en megfelelőket később a feliratok.json kulcsaiból kell venni.
TILTOTT = ["futás", "modul", "szűrés", "verzió", "ai-keret", "token", "forrás-állapot", "ai-javaslat"]
SZO_HATAR = {"asztali": 60, "telefon": 40}

MERO_JS = r"""
() => {
  const vw = innerWidth, vh = innerHeight;
  const lathato = (el) => { const s = getComputedStyle(el); if (s.visibility === 'hidden' || s.display === 'none' || +s.opacity === 0) return false;
    const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  // T5: szavak görgetés nélkül — a látható szövegcsomópontok, amelyek a képernyő első magasságán belül vannak
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let szavak = 0, szoveg = [];
  while (w.nextNode()) { const n = w.currentNode; const t = n.textContent.trim(); if (!t) continue;
    const p = n.parentElement; if (!p || !lathato(p) || p.closest('script,style,noscript,[aria-hidden="true"],header,nav,.km-vj-gomb,[data-r15="reszletek"],[data-r15="mely"],[data-r15="sotet-sav"],[data-r15="eredmeny"]')) continue;
    const r = p.getBoundingClientRect(); if (r.top >= vh || r.bottom <= 0) continue;
    szavak += t.split(/\s+/).filter(Boolean).length; szoveg.push(t); }
  // T1: a legnagyobb betűs látható cím szószáma
  let cim = null; let cimMeret = 0;
  for (const el of document.querySelectorAll('h1,h2')) { if (!lathato(el)) continue; const r = el.getBoundingClientRect(); if (r.top > vh) continue;
    const m = parseFloat(getComputedStyle(el).fontSize); if (m > cimMeret) { cimMeret = m; cim = el.innerText.trim(); } }
  // T2: fő gomb = kitöltött (színátmenetes vagy telt, nem átlátszó) hátterű gomb/link a képernyőn
  const gombok = [...document.querySelectorAll('button,a,[role=button],input[type=submit]')].filter(lathato).filter((el) => {
    const r = el.getBoundingClientRect(); return r.top < vh && r.bottom > 0 && r.width >= 48 && el.getAttribute('role') !== 'switch' && el.getAttribute('role') !== 'tab'; });
  const jelolt = [...document.querySelectorAll('[data-r15="fo-gomb"]')].filter(lathato).filter((el) => { const r = el.getBoundingClientRect(); return r.top < vh && r.bottom > 0; });
  const vanJeloles = document.querySelector('[data-r15]:not([data-r15="lebego"])') !== null; // a lebegő Visszajelzés gomb minden lapon jelölt — az nem tesz R-15 lappá
  const vanFoJel = document.querySelector('[data-r15="fo-gomb"]') !== null; // jelöletlen fő gomb: a látvány dönt (és jelzés megy róla)
  const fo = vanFoJel ? jelolt.map((el) => el.innerText.trim().slice(0, 40)) : gombok.filter((el) => { const s = getComputedStyle(el); const kep = s.backgroundImage || '';
    if (kep.includes('gradient')) return true;
    const bg = s.backgroundColor.match(/[\d.]+/g); if (!bg) return false; const a = bg.length > 3 ? +bg[3] : 1; if (a < 0.9) return false;
    const [r0,g0,b0] = bg.map(Number); const tel = Math.max(r0,g0,b0) - Math.min(r0,g0,b0) > 60; return tel; })
    .filter((el) => !el.closest('header,nav,[class*="sav"]') && !(el.className||'').toString().includes('km-vj'))
    .map((el) => el.innerText.trim().slice(0, 40));
  // T6: doboz a dobozban — keretes ÉS/VAGY hátteres doboz, amelynek őse is az
  const doboz = (el) => { const s = getComputedStyle(el); const keret = ['Top','Right','Bottom','Left'].filter((o) => parseFloat(s['border'+o+'Width']) > 0 && s['border'+o+'Style'] !== 'none').length >= 3;
    const r = el.getBoundingClientRect(); return keret && r.width > 120 && r.height > 40 && !['BUTTON','A','INPUT','TEXTAREA','SELECT'].includes(el.tagName); };
  let melyseg = 0, melyPelda = '';
  for (const el of document.querySelectorAll('main *, body > div *')) { if (!lathato(el) || !doboz(el)) continue;
    let d = 1, p = el.parentElement; while (p) { if (doboz(p)) d++; p = p.parentElement; }
    if (d > melyseg) { melyseg = d; melyPelda = (el.innerText || '').trim().slice(0, 50); } }
  // T7: figyelmeztető (narancs/piros) keret vagy háttér — jelzés
  const figyel = [...document.querySelectorAll('main *')].filter(lathato).filter((el) => { const s = getComputedStyle(el);
    const c = (s.borderTopColor + ' ' + s.backgroundColor).match(/\d+/g); if (!c) return false;
    for (let i = 0; i + 2 < c.length; i += 3) { const r = +c[i], g = +c[i+1], b = +c[i+2]; if (r > 180 && g < 150 && b < 120 && r - g > 60) return true; }
    return false; }).length;
  // T10 (szabálylap 2. szállítmány, 09-26): vízszintes görgetés; a lebegő elem SEMMIT nem fedhet — szöveg, gomb, mező, kép —
  // és görgetés közben sem. Lebegő = position:fixed, vagy a rajzon data-r15="lebego".
  const vizszintes = document.documentElement.scrollWidth > vw + 1;
  const lebegok = [...document.querySelectorAll('body *')].filter((el) => lathato(el) && (getComputedStyle(el).position === 'fixed' || el.getAttribute('data-r15') === 'lebego'))
    .filter((f) => { const a = f.getBoundingClientRect(); return a.width * a.height <= vw * vh * 0.5; });
  const sajatSzoveg = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  const celok = [...document.querySelectorAll('body *')].filter((el) => lathato(el) && !lebegok.some((f) => f.contains(el) || el.contains(f))
    && (['BUTTON','A','INPUT','TEXTAREA','SELECT','IMG','SVG','VIDEO','CANVAS'].includes(el.tagName.toUpperCase()) || sajatSzoveg(el)));
  // 2026-09-27: csak a LÁTSZÓ rész számít — amit egy overflow:hidden/auto ős levág, azt a lebegő elem nem takarhatja (a rajz
  // telefonos képernyőjén a tartalom a Visszajelzés sávja fölött véget ér; a levágott rész nem látszik, nem takart).
  const latszoResz = (el) => { const r = el.getBoundingClientRect(); let t = r.top, bo = r.bottom, l = r.left, ri = r.right;
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const st = getComputedStyle(p);
      if (st.overflowY !== 'visible' || st.overflowX !== 'visible') { const q = p.getBoundingClientRect();
        t = Math.max(t, q.top); bo = Math.min(bo, q.bottom); l = Math.max(l, q.left); ri = Math.min(ri, q.right); } }
    return (bo - t > 1 && ri - l > 1) ? { top: t, bottom: bo, left: l, right: ri } : null; };
  const takarSet = new Set();
  const felso = scrollY, magas = document.documentElement.scrollHeight;
  const allasok = []; for (let y = 0; y < Math.max(1, magas - vh + 1); y += Math.max(1, Math.round(vh / 2))) allasok.push(y);
  if (magas > vh) allasok.push(magas - vh);
  for (const y of allasok) { scrollTo(0, y);
    for (const f of lebegok) { const a = f.getBoundingClientRect();
      for (const c of celok) { const b = latszoResz(c); if (!b || b.bottom <= 0 || b.top >= vh) continue;
        if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) takarSet.add((c.innerText || c.placeholder || c.alt || c.tagName).trim().slice(0, 30)); } } }
  scrollTo(0, felso);
  const takar = [...takarSet];
  // T6 a jelölésből: tájékoztató sor kerettel/háttérrel/gombbal
  const infoHiba = [...document.querySelectorAll('[data-r15="info"]')].filter(lathato).filter((el) => { const s = getComputedStyle(el);
    const bg = (s.backgroundColor.match(/[\d.]+/g) || []); const alfa = bg.length > 3 ? +bg[3] : (bg.length ? 1 : 0);
    return parseFloat(s.borderTopWidth) > 0 || alfa > 0.05 || el.querySelector('button'); }).length;
  // T7 a jelölésből: baj gomb nélkül
  const bajGombNelkul = [...document.querySelectorAll('[data-r15="baj"]')].filter(lathato).filter((el) => !el.querySelector('button,a')).length;
  // T10 a jelölésből: fő gomb mérete
  const kicsiFo = jelolt.filter((el) => el.getBoundingClientRect().height < 52).length;
  return { szavak, szoveg: szoveg.join(' ').slice(0, 4000), cim, fo, melyseg, melyPelda, figyel, vizszintes, takar: takar.slice(0, 5), vanJeloles, vanFoJel, infoHiba, bajGombNelkul, kicsiFo };
}
"""

def ertekel(m, nezet):
    hibak, jelzesek = [], []
    cimszo = len((m["cim"] or "").split())
    if m["cim"] is None: jelzesek.append("nincs látható cím")
    elif cimszo > 6: hibak.append(f"T1 cím {cimszo} szó (≤ 6)")
    if len(m["fo"]) != 1: hibak.append(f"T2 fő gomb: {len(m['fo'])} (pontosan 1) {m['fo'][:3]}")
    kis = m["szoveg"].lower()
    tilt = [t for t in TILTOTT if t in kis]
    if tilt: hibak.append("T3 tiltott szó: " + ", ".join(tilt))
    if m["szavak"] > SZO_HATAR[nezet]: hibak.append(f"T5 {m['szavak']} szó görgetés nélkül (≤ {SZO_HATAR[nezet]})")
    if m["melyseg"] >= 2: hibak.append(f"T6 doboz a dobozban ({m['melyseg']} szint): „{m['melyPelda']}”")
    if m["figyel"] > 0: jelzesek.append(f"T7 figyelmeztető szín {m['figyel']} elemen — csak valódi bajnál szabad")
    if m["vizszintes"]: hibak.append("T10 vízszintes görgetés")
    if m["takar"]: hibak.append("T10 lebegő elem takar: " + ", ".join(m["takar"]))
    if m.get("infoHiba"): hibak.append(f"T6 tájékoztatás kerettel/háttérrel/gombbal: {m['infoHiba']}")
    if m.get("bajGombNelkul"): hibak.append(f"T7 baj-jelzés gomb nélkül: {m['bajGombNelkul']}")
    if m.get("kicsiFo"): hibak.append(f"T10 a fő gomb 52 px-nél alacsonyabb: {m['kicsiFo']}")
    if m.get("vanJeloles") and not m.get("vanFoJel"): jelzesek.append("a fő gomb nincs data-r15=\"fo-gomb\" jelöléssel — a látványból becsülve")
    if not m.get("vanJeloles"): jelzesek.append("nincs data-r15 jelölés — a mérés becslés (a lap még nem az R-15 rajzból épült)")
    return hibak, jelzesek

async def regisztral(b, cim):
    ctx = await b.new_context(viewport={"width": 1440, "height": 900}); pg = await ctx.new_page()
    await pg.goto(cim + "/regisztracio"); await pg.wait_for_timeout(1500)
    await pg.locator("select:visible").first.select_option("hu"); await pg.wait_for_selector("text=Fiók létrehozása", timeout=15000); await pg.wait_for_timeout(800)
    await pg.fill("input[name=nev]", "Próba Tibor"); await pg.fill("input[name=email]", f"proba-tibor{random.randint(10000,99999)}@proba.example")
    await pg.fill("input[name=jelszo]", "Tibor-Terko-2026"); await pg.click("button[type=submit]"); await pg.wait_for_url("**/szervezet/uj", timeout=20000)
    await pg.wait_for_timeout(1000); await pg.fill("input", "Próba Térkő"); await pg.click("button[type=submit]"); await pg.wait_for_url("**/onboarding", timeout=20000)
    await pg.wait_for_timeout(2000)
    # c5 (2026-10-10, R15-lapok-4 02a, kerdesek-4 · 10 — Csilla jóváhagyta): a leírás mezője a „Nincs weboldalunk — leírom pár mondatban”
    # link mögött van; a próba-fiók weboldal nélkül regisztrál, ezért előbb kinyitja. A mért lapok és a határok nem változtak.
    if await pg.locator("textarea:visible").count() == 0: await pg.get_by_text("Nincs weboldalunk").click(); await pg.wait_for_timeout(300)
    await pg.fill("textarea", "térkövezés, udvarok és járdák kivitelezése Marosvásárhelyen")
    await pg.get_by_role("button", name="Készítsük el").click()
    for _ in range(60):
        await pg.wait_for_timeout(2000)
        if "Nézd át" in await pg.inner_text("body"): break
    for _ in range(20):
        await pg.wait_for_timeout(1500)
        if await pg.get_by_role("button", name=re.compile("Jóváhagyom")).is_enabled(): break
    await pg.get_by_role("button", name=re.compile("Jóváhagyom")).click(); await pg.wait_for_timeout(8000)
    allapot = await ctx.storage_state(); await ctx.close(); return allapot

async def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--cim", default="http://127.0.0.1:8410"); ap.add_argument("--ki", default="tibor-proba-ki")
    ap.add_argument("--allapot", default=None); ap.add_argument("--varakozas", type=int, default=150, help="másodperc a regisztráció után (az első gyűjtés)")
    a = ap.parse_args(); os.makedirs(os.path.join(a.ki, "kep"), exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        if a.allapot: allapot = json.load(open(a.allapot))
        else:
            allapot = await regisztral(b, a.cim); json.dump(allapot, open(os.path.join(a.ki, "fiok.json"), "w"))
            await asyncio.sleep(a.varakozas)
        eredmeny = []
        for nezet, w, h in (("asztali", 1440, 900), ("telefon", 390, 844)):
            for belepve, lista in ((False, NYILVANOS), (True, LAPOK)):
                ctx = await b.new_context(viewport={"width": w, "height": h}, storage_state=allapot if belepve else None)
                if not belepve: await ctx.add_cookies([{"name": "km_nyelv", "value": "hu", "url": a.cim}])
                pg = await ctx.new_page()
                for nev, ut in lista:
                    await pg.goto(a.cim + ut); await pg.wait_for_timeout(4000)
                    m = await pg.evaluate(MERO_JS); hibak, jelz = ertekel(m, nezet)
                    kep = f"kep/{nev}-{nezet}.png"; await pg.screenshot(path=os.path.join(a.ki, kep), full_page=True)
                    # az első képernyő (görgetés nélkül) külön — ezt nézi a Tibor-bíráló (tools/tibor-biro)
                    await pg.screenshot(path=os.path.join(a.ki, kep.replace(".png", "-elso.png")))
                    eredmeny.append({"lap": nev, "nezet": nezet, "ut": ut, "zold": not hibak, "hibak": hibak, "jelzesek": jelz, "meres": {k: v for k, v in m.items() if k != "szoveg"}, "kep": kep})
                await ctx.close()
        await b.close()
    json.dump(eredmeny, open(os.path.join(a.ki, "jelentes.json"), "w"), ensure_ascii=False, indent=1)
    zold = sum(e["zold"] for e in eredmeny)
    sorok = [f"# Tibor-próba — {time.strftime('%Y-%m-%d %H:%M')}", "", f"**{zold} / {len(eredmeny)} lapnézet zöld.**", "",
             "| Lap | Nézet | Szó | Fő gomb | Doboz-mélység | Eredmény |", "|---|---|---|---|---|---|"]
    for e in eredmeny:
        m = e["meres"]; sorok.append(f"| {e['lap']} | {e['nezet']} | {m['szavak']} | {len(m['fo'])} | {m['melyseg']} | {('✅' if e['zold'] else '❌ ' + ' · '.join(e['hibak'])).replace(chr(10), ' ')} |")
    open(os.path.join(a.ki, "jelentes.md"), "w").write("\n".join(sorok) + "\n")
    print("\n".join(sorok[:4])); sys.exit(0 if zold == len(eredmeny) else 1)

if __name__ == "__main__":
    asyncio.run(main())
