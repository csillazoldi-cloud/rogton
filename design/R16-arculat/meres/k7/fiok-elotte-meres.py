# /fiok ELŐTTE (rekonstrukció): ugyanaz a lap, a belépő sor helyén a régi, összecsukott <details> doboz összefoglalója
# (a régi Fiok.tsx jelölése, a régi CSS a fiok.css-ben változatlanul megvan; a becsukott tartalom úgysem látszik).
import asyncio, importlib.util, json, sys
from playwright.async_api import async_playwright
CIM = "http://127.0.0.1:3017"; KI = "/home/claude/wt/o-k7/design/R16-arculat/meres/k7"
spec = importlib.util.spec_from_file_location("tp", "/home/claude/wt/o-k7/tools/tibor-proba/tibor_proba.py"); tp = importlib.util.module_from_spec(spec); spec.loader.exec_module(tp)
REGI = """<details class="km-fp-arculat-csukott"><summary class="km-fp-arculat-summary"><span class="km-fp-szakasz-cim">Vizuális arculat</span><span class="km-fp-arculat-nemkotelezo">— nem kötelező</span><span class="km-fp-arculat-mondat">Logó, színek, kézikönyv. Akkor kérjük, amikor egy feladathoz kell — a hírfigyeléshez nem.</span><span class="km-fp-arculat-nyit">Megnyitás</span></summary><section class="km-fp-kartya km-fp-arculat"><p>(becsukva)</p></section></details>"""
async def main():
    allapot = json.load(open(sys.argv[1]))
    async with async_playwright() as p:
        b = await p.chromium.launch(); ki = {}
        for nezet, w, h in (("asztali", 1440, 900), ("telefon", 390, 844)):
            ctx = await b.new_context(viewport={"width": w, "height": h}, storage_state=allapot); pg = await ctx.new_page()
            for mikor in ("utana", "elotte"):
                await pg.goto(CIM + "/fiok"); await pg.wait_for_timeout(2500)
                if mikor == "elotte": await pg.evaluate("(h) => { document.querySelector('.km-fp-arculat-belepo').outerHTML = h; }", REGI); await pg.wait_for_timeout(300)
                m = await pg.evaluate(tp.MERO_JS); hibak, _ = tp.ertekel(m, nezet)
                ki[f"{mikor}/{nezet}"] = {"szavak": m["szavak"], "fo": m["fo"], "melyseg": m["melyseg"], "takar": m["takar"], "hibak": hibak}
                print(mikor, nezet, ki[f"{mikor}/{nezet}"])
                if mikor == "elotte": await pg.screenshot(path=f"{KI}/fiok-{nezet}-elotte-rekonstrukcio.png", full_page=True)
            await ctx.close()
        json.dump(ki, open(f"{KI}/fiok-elotte-utana.json", "w"), ensure_ascii=False, indent=1)
        await b.close()
asyncio.run(main())
