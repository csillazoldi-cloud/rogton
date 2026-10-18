# R-16 K7 helyi végigjátszás: honlap-logó (PNG, SVG, hibás), R7 (meglévő logó), /fiok belépő sor, 12b „Honnan?”, /kepek, Tibor-számok.
import asyncio, json, os, random, subprocess, sys, time, importlib.util
from playwright.async_api import async_playwright

CIM = "http://127.0.0.1:3017"
KI = "/home/claude/wt/o-k7/design/R16-arculat/meres/k7"
os.makedirs(KI, exist_ok=True)
spec = importlib.util.spec_from_file_location("tp", "/home/claude/wt/o-k7/tools/tibor-proba/tibor_proba.py")
tp = importlib.util.module_from_spec(spec); spec.loader.exec_module(tp)
NAPLO = open(os.path.join(KI, "naplo.txt"), "w")
MERES = []
CTX = [None]
def log(*a):
    s = " ".join(str(x) for x in a); print(s); NAPLO.write(s + "\n"); NAPLO.flush()
def sql(q):
    return subprocess.run(["psql", "-h", "127.0.0.1", "-p", "5487", "-U", "km_tulaj", "-d", "km", "-tAF", "|", "-c", q], capture_output=True, text=True).stdout.strip()

async def tibor(pg, nev, nezet):
    m = await pg.evaluate(tp.MERO_JS); hibak, jelz = tp.ertekel(m, nezet)
    MERES.append({"lap": nev, "nezet": nezet, "ut": pg.url.replace(CIM, ""), "zold": not hibak, "hibak": hibak, "jelzesek": jelz, "meres": {k: v for k, v in m.items() if k != "szoveg"}})
    log(f"  TIBOR {nev} {nezet}: {'ZÖLD' if not hibak else 'PIROS'} szó={m['szavak']} fő={m['fo']} cím={m['cim']!r} mélység={m['melyseg']} {hibak} {jelz}")
    return m

async def munkater(req, nev, honlap, osszefoglalo, nyelv="hu", feltolt=None):
    email = f"k7-{random.randint(10**6, 10**7)}@proba.example"; jelszo = "ProbaJelszo123!"
    r = await req.post(CIM + "/api/fiok/regisztracio", data={"nev": "Próba Tibor", "email": email, "jelszo": jelszo}); assert r.status == 201, await r.text()
    r = await req.post(CIM + "/api/fiok/belepes", data={"email": email, "jelszo": jelszo}); assert r.status == 200, await r.text()
    # a munkamenet-süti Secure — http-n kézzel adjuk a környezetnek (a próbák is így: segedek.ts sutiKinyer)
    for h in r.headers_array:
        if h["name"].lower() == "set-cookie" and h["value"].startswith("km_munkamenet="):
            await CTX[0].add_cookies([{"name": "km_munkamenet", "value": h["value"].split(";")[0].split("=", 1)[1], "url": CIM}])
    r = await req.post(CIM + "/api/szervezet", data={"nev": nev}); assert r.status == 201, await r.text()
    sz = (await r.json())["id"]
    r = await req.put(CIM + "/api/onboarding/piszkozat", data={
        "bemutatkozas": {"nev": nev, "osszefoglalo": osszefoglalo, "osszefoglalo_forras": "weboldal", "forras_tipus": "weboldal", "weboldal": honlap, "leiras": ""},
        "kommunikacio": {"celkozonseg": "a környék családjai", "celkozonseg_forras": "sajat", "cel": "", "cel_forras": "sajat", "cel_kesobb": True, "nyelvek": [nyelv], "nyelvek_forras": "sajat", "hangnem_leiras": "", "hangnem_minta": "", "hangnem_nyelv": nyelv, "hangnem_forras": "sajat"}})
    assert r.status == 200, await r.text()
    if feltolt:
        r = await req.post(CIM + "/api/arculat/fajl", data=feltolt, headers={"x-fajl-nev": "saj%C3%A1t%20log%C3%B3.png", "x-fajl-cel": "logo", "x-logo-valtozat": "vilagos", "content-type": "application/octet-stream"})
        log("  feltöltés a jóváhagyás előtt:", r.status, (await r.text())[:120])
    t0 = time.time()
    r = await req.post(CIM + "/api/onboarding/jovahagyas", data={}); assert r.status == 200, await r.text()
    log(f"  jóváhagyás: {r.status} ({time.time() - t0:.1f} s) — az első beállítás kész")
    return sz

async def var_hatter(sz, mp=40):
    for _ in range(mp * 2):
        t = sql(f"SELECT adatok->'arculat'->>'allapot' FROM szervezet_profil WHERE szervezet_id='{sz}'")
        if t == "tervezet": return True
        await asyncio.sleep(0.5)
    return False

def fajlok(sz):
    return sql(f"SELECT tipus, cel, eredet, coalesce(logo_valtozat,''), meret, nev, id FROM arculat_fajl WHERE szervezet_id='{sz}' ORDER BY feltoltve")

def tervezet(sz):
    return sql(f"SELECT adatok->'arculat'->'tervezet'->>'elsodleges', adatok->'arculat'->'tervezet'->>'masodlagos', adatok->'arculat'->'tervezet'->>'hatter', adatok->'arculat'->'tervezet'->>'szin_forras', adatok->'arculat'->'tervezet'->>'forras_cim', adatok->'arculat'->'tervezet'->'szin_jeloltek' FROM szervezet_profil WHERE szervezet_id='{sz}'")

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        # ——— A. Cipó Pékség: PNG logó a honlapon ———
        log("A. Cipó Pékség — honlap http://cipo-pekseg.proba:8701/ (PNG logó <img class=site-logo>, színek a CSS-ben)")
        ctx = await b.new_context(viewport={"width": 1440, "height": 900}); req = ctx.request; CTX[0] = ctx
        await ctx.add_cookies([{"name": "km_nyelv", "value": "hu", "url": CIM}])
        sz = await munkater(req, "Cipó Pékség", "http://cipo-pekseg.proba:8701/", "Pékség a Kossuth utcában: kovászos kenyér, kalács, pogácsa és friss kifli minden reggel.")
        log("  háttér-tervezet megjött:", await var_hatter(sz))
        log("  arculat_fajl:", fajlok(sz) or "—")
        log("  tervezet (fő|második|háttér|szin_forras|forras_cim|jelöltek):", tervezet(sz))
        pg = await ctx.new_page()
        await pg.goto(CIM + "/fiok"); await pg.wait_for_timeout(2500)
        belepo = pg.locator(".km-fp-arculat-belepo")
        log("  /fiok: belépő sor:", await belepo.count(), "·", (await belepo.inner_text()).replace("\n", " / ") if await belepo.count() else "",
            "· régi doboz (details):", await pg.locator("details.km-fp-arculat-csukott").count(), "· ArculatAnyagok:", await pg.locator("#km-fp-anyagok").count())
        await tibor(pg, "szervezet-adatai", "asztali")
        await pg.screenshot(path=f"{KI}/fiok-asztali.png", full_page=True); await pg.screenshot(path=f"{KI}/fiok-asztali-elso.png")
        await belepo.get_by_role("link").click(); await pg.wait_for_url("**/fiok/arculat"); await pg.wait_for_timeout(3000)
        log("  a belépő sor →", pg.url.replace(CIM, ""), "· cím:", await pg.locator("h1").first.inner_text())
        await tibor(pg, "arculat-12b-honlap", "asztali")
        logo_img = pg.locator("img[src*='/api/arculat/fajl/']")
        log("  12b logó-kép(ek):", await logo_img.count(), [await logo_img.nth(i).get_attribute("alt") for i in range(await logo_img.count())])
        await pg.screenshot(path=f"{KI}/12b-cipo-honlap-logo.png", full_page=True)
        honnan = pg.get_by_text("Honnan?")
        if await honnan.count():
            await honnan.first.click(); await pg.wait_for_timeout(500)
            log("  „Honnan?” után:", (await pg.locator("main").inner_text()).split("Honnan?")[1][:160].replace("\n", " / "))
            await pg.screenshot(path=f"{KI}/12b-cipo-honnan.png", full_page=True)
        else:
            log("  „Honnan?” nincs a lapon")
        # a 12f Vissza → a szakasz
        await pg.goto(CIM + "/fiok/arculat/logok"); await pg.wait_for_timeout(2000)
        v = pg.get_by_role("link", name="Vissza")
        log("  12f „Vissza” href:", await v.get_attribute("href") if await v.count() else "—")
        # /kepek
        await pg.goto(CIM + "/kepek"); await pg.wait_for_timeout(5000)
        await tibor(pg, "kepek", "asztali"); await pg.screenshot(path=f"{KI}/kepek-cipo-asztali.png", full_page=True)
        # telefon
        tctx = await b.new_context(viewport={"width": 390, "height": 844}, storage_state=await ctx.storage_state()); tp_ = await tctx.new_page()
        await tp_.goto(CIM + "/fiok"); await tp_.wait_for_timeout(2500)
        await tibor(tp_, "szervezet-adatai", "telefon")
        await tp_.screenshot(path=f"{KI}/fiok-telefon.png", full_page=True); await tp_.screenshot(path=f"{KI}/fiok-telefon-elso.png")
        sw = await tp_.evaluate("document.documentElement.scrollWidth"); log("  /fiok telefon scrollWidth:", sw)
        await tp_.goto(CIM + "/fiok/arculat"); await tp_.wait_for_timeout(3000)
        await tibor(tp_, "arculat-12b-honlap", "telefon"); await tp_.screenshot(path=f"{KI}/12b-cipo-telefon.png", full_page=True)
        await tp_.goto(CIM + "/kepek"); await tp_.wait_for_timeout(5000)
        await tibor(tp_, "kepek", "telefon"); await tp_.screenshot(path=f"{KI}/kepek-cipo-telefon.png", full_page=True)
        # a kép a logóval (a Képek kész munka mintaképe)
        r = await req.get(CIM + "/api/vizual/helyzet-minta/kesz?valtozat=vilagos")
        log("  Képek helyzet-minta kesz (GET):", r.status, len(await r.body()), "bájt")
        if r.status == 200: open(f"{KI}/kep-kesz-cipo-honlap-logo.png", "wb").write(await r.body())
        await tctx.close(); await ctx.close()

        # ——— B. Știință și Țară: SVG logó ———
        log("B. Știință și Țară SRL — honlap http://stiinta-tara.proba:8701/ (SVG logó)")
        ctx = await b.new_context(viewport={"width": 1440, "height": 900}); req = ctx.request; CTX[0] = ctx
        await ctx.add_cookies([{"name": "km_nyelv", "value": "ro", "url": CIM}])
        sz = await munkater(req, "Știință și Țară SRL", "http://stiinta-tara.proba:8701/", "Consultanță agricolă pentru fermierii din județul Mureș: analize de sol, planuri de irigare și cursuri.", nyelv="ro")
        log("  háttér-tervezet megjött:", await var_hatter(sz))
        f = fajlok(sz); log("  arculat_fajl:", f or "—")
        log("  tervezet:", tervezet(sz))
        if f:
            fid = f.split("|")[-1]
            r = await req.get(f"{CIM}/api/arculat/fajl/{fid}")
            body = await r.body(); log("  a tárolt fájl:", r.status, r.headers.get("content-type"), len(body), "bájt · PNG-fej:", body[:8] == b"\x89PNG\r\n\x1a\n")
            open(f"{KI}/stiinta-svg-bol-png.png", "wb").write(body)
        pg = await ctx.new_page(); await pg.goto(CIM + "/fiok/arculat"); await pg.wait_for_timeout(3000)
        await tibor(pg, "arculat-12b-svg", "asztali"); await pg.screenshot(path=f"{KI}/12b-stiinta-svg-logo.png", full_page=True)
        await ctx.close()

        # ——— C. Hibás logó (404): az első beállítás megy tovább ———
        log("C. Hibás Logó Kft. — a logó címe 404")
        ctx = await b.new_context(viewport={"width": 1440, "height": 900}); req = ctx.request; CTX[0] = ctx
        await ctx.add_cookies([{"name": "km_nyelv", "value": "hu", "url": CIM}])
        sz = await munkater(req, "Hibás Logó Kft.", "http://hibas-logo.proba:8701/", "Térkövezés, udvarok és járdák kivitelezése Marosvásárhelyen és környékén.")
        log("  háttér-tervezet megjött:", await var_hatter(sz))
        log("  arculat_fajl:", fajlok(sz) or "— (nincs sor)")
        log("  tervezet:", tervezet(sz))
        pg = await ctx.new_page(); await pg.goto(CIM + "/fiok/arculat"); await pg.wait_for_timeout(3000)
        log("  /fiok/arculat cím:", await pg.locator("h1").first.inner_text())
        await pg.screenshot(path=f"{KI}/12b-hibas-logo-nelkul.png", full_page=True)
        await ctx.close()

        # ——— D. R7: feltöltött logó a jóváhagyás előtt → a honlap logója nem kerül be ———
        log("D. Cipó Pékség 2 — saját logó feltöltve a jóváhagyás ELŐTT, a honlapon PNG logó")
        ctx = await b.new_context(viewport={"width": 1440, "height": 900}); req = ctx.request; CTX[0] = ctx
        png = open("/tmp/_k7/oldal/stiinta-sajat.png", "rb").read()
        sz = await munkater(req, "Cipó Pékség Kettő", "http://cipo-pekseg.proba:8701/", "Pékség a Kossuth utcában: kovászos kenyér és kalács.", feltolt=png)
        elotte = fajlok(sz); log("  arculat_fajl a jóváhagyás után:", elotte)
        log("  háttér-tervezet megjött:", await var_hatter(sz))
        await asyncio.sleep(3)
        utana = fajlok(sz); log("  arculat_fajl a háttérmunka után:", utana, "· változatlan:", elotte == utana)
        await ctx.close()
        await b.close()
    json.dump(MERES, open(os.path.join(KI, "tibor-meres.json"), "w"), ensure_ascii=False, indent=1)
    log("oldal-kérések:", open("/tmp/_k7/oldal/keresek.txt").read().count("\n"))

asyncio.run(main())
