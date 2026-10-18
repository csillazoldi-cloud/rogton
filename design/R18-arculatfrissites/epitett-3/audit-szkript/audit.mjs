// R-18 3. kör · elrendezés-audit (Csilla: „check elements on pages are proper aligned, and text doesn't overflow from buttons”).
// node audit.mjs <cim> <kimappa> [szuro] — minden útvonal × HU/RO/EN × 390/768/1024/1280/1440 × sötét/világos. Folytatható: a kész kombinációk
// eredménye <kimappa>/r/<kulcs>.json; ~130 s után kilép (a VM egy hívása legfeljebb 180 s), a következő hívás onnan folytatja.
import { chromium } from "playwright-core";
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
const [CIM, KI, SZURO = ""] = process.argv.slice(2);
mkdirSync(KI + "/r", { recursive: true });
const KEZD = Date.now(); const IDO = Number(process.env.AUDIT_IDO ?? 125) * 1000;
const D = process.env.HOME + "/probe/cr";
const s = JSON.parse(readFileSync(process.env.HOME + "/k/seed3.json", "utf8"));
const b = await chromium.launch({ executablePath: D + "/chromium", args: ["--no-sandbox", "--no-zygote", "--disable-gpu", "--disable-dev-shm-usage", "--no-proxy-server"], env: { ...process.env, LD_LIBRARY_PATH: D + "/lib/lib", FONTCONFIG_PATH: D + "/lib" } });
const JELSZO = "ProbaJelszo123!";
const NYELVEK = ["hu", "ro", "en"], SZELESSEG = [390, 768, 1024, 1280, 1440], MODOK = ["dark", "light"];
async function allapotKell(email) {
  const k = await b.newContext(); const lap = await k.newPage();
  await lap.goto(CIM + "/belepes", { waitUntil: "domcontentloaded" });
  const r = await lap.evaluate(async ([e, j]) => (await fetch("/api/fiok/belepes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: e, jelszo: j }) })).status, [email, JELSZO]);
  if (r !== 200) throw new Error("belepes " + r);
  const st = await k.storageState(); await k.close(); return st;
}
const tarolt = existsSync(KI + "/allapot.json") ? JSON.parse(readFileSync(KI + "/allapot.json", "utf8")) : { egy: await allapotKell(s.egy.email), ures: await allapotKell(s.ures.email) };
writeFileSync(KI + "/allapot.json", JSON.stringify(tarolt));
// az útvonalak (a dinamikusak egy valódi azonosítóval)
const UTAK = [
  ["nyilvanos", "/"], ["nyilvanos", "/belepes"], ["nyilvanos", "/regisztracio"], ["nyilvanos", "/jelszo-elfelejtve"], ["nyilvanos", "/jelszo-visszaallitas"], ["nyilvanos", "/adatkezeles"], ["nyilvanos", "/meghivo/ervenytelen-jegy"],
  ["egy", "/kezdolap"], ["egy", "/kezdolap#menu"], ["egy", "/hirfigyelo"], ["egy", "/hirfigyelo/osszes"], ["egy", "/hirfigyelo/beallitas"], ["egy", "/hirfigyelo/finomhangolas"],
  ["egy", `/poszt?munka=${s.posztok[1]}`], ["egy", "/kepek"], ["egy", "/kepek/kozlemenyek"], ["egy", "/kepek/kozlekedes"], ["egy", "/kepek/szoveges-kepek"], ["egy", "/kepek/uj/munka"], ["egy", "/kepek/@sablon"],
  ["egy", "/naptar"], ["egy", "/iranytu"], ["egy", "/fiok"], ["egy", "/fiok/arculat"], ["egy", "/fiok/arculat/szinek"], ["egy", "/fiok/arculat/szinek/mas"], ["egy", "/fiok/arculat/betuk"], ["egy", "/fiok/arculat/logok"], ["egy", "/fiok/arculat/nevlogo"], ["egy", "/fiok/arculat/logoterv"],
  ["egy", "/beallitasok"], ["egy", "/gephaz"], ["egy", "/gephaz/kimeno"], ["egy", "/gephaz/kep-jelzesek"], ["egy", "/gephaz/logoterv"], ["egy", "/sajat-fiok"], ["egy", "/tagok"], ["egy", "/tagok/kreditek"],
  ["egy", "/visszajelzes"], ["egy", "/visszajelzes/csomag"], ["egy", "/koltseg"], ["egy", "/tema"], ["egy", "/feliratok"], ["egy", "/fiokok"], ["egy", "/szervezet/uj"],
  ["egy", "/onboarding"], ["egy", "/onboarding/1"], ["egy", "/onboarding/2"], ["egy", "/onboarding/3"], ["egy", "/onboarding/kesz"],
  ["ures", "/kezdolap"], ["ures", "/poszt"], ["ures", "/naptar"], ["ures", "/kepek"],
];
// a lapon futó mérés
function meres() {
  const ki = [];
  const lathato = (e) => { const c = getComputedStyle(e); if (c.display === "none" || c.visibility === "hidden" || Number(c.opacity) === 0) return false; const r = e.getBoundingClientRect(); if (r.width <= 0 || r.height <= 0 || e.closest("[aria-hidden=true], .km-aurora, script, style")) return false; const d = e.closest("details:not([open])"); return !d || !!e.closest("summary"); }; // a csukott <details> tartalma nem látszik
  const nev = (e) => { let s = e.tagName.toLowerCase(); if (e.id) s += "#" + e.id; const o = [...e.classList].slice(0, 3).join("."); if (o) s += "." + o; return s; };
  const ut = (e) => { const r = []; let x = e; for (let i = 0; x && x !== document.body && i < 4; i++, x = x.parentElement) r.unshift(nev(x)); return r.join(" > "); };
  const szoveg = (e) => (e.innerText || e.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim().slice(0, 60);
  if (document.documentElement.scrollWidth > innerWidth + 1) ki.push({ tipus: "vizszintes-gorgetes", hol: "html", szoveg: `${document.documentElement.scrollWidth} > ${innerWidth}` });
  const GOMB = "button, [role=button], [role=tab], [role=menuitem], [role=radio], .r15-fo-gomb, .r15-halk-gomb, .r18-nav-a, .r15-csempe, .r15p-ful, .km-gomb, .km-gomb-szellem, [class*=chip], [class*=jelveny], a.r15-halk-link";
  const JELOLT = GOMB + ", [class*=cimke], [class*=badge], nav a, h1, h2, label";
  const jeloltek = [...document.querySelectorAll(JELOLT)].filter((e) => lathato(e) && !e.closest("svg"));
  for (const e of jeloltek) {
    const c = getComputedStyle(e);
    // 1) szöveg-túlcsordulás (a szándékos „…” levágás és a görgethető sáv nem hiba)
    if (c.display !== "inline" && e.scrollWidth > e.clientWidth + 1) {
      const vagott = (c.overflowX === "hidden" || c.overflowX === "clip") && c.textOverflow === "ellipsis";
      const gorget = c.overflowX === "auto" || c.overflowX === "scroll";
      if (!vagott && !gorget) ki.push({ tipus: "tulcsordulas", hol: ut(e), szoveg: szoveg(e), adat: `${e.scrollWidth} > ${e.clientWidth}` });
    }
    // 2) a gomb felirata két sorba tört
    if (e.matches(GOMB) && !e.matches(".r15-csempe") && c.display !== "inline" && e.querySelectorAll(GOMB).length < 2 && !(!/^(A|BUTTON)$/.test(e.tagName) && e.getAttribute("role") !== "button" && [...e.children].filter((g) => (g.innerText || "").trim()).length >= 2)) { // jelvény-csoport (nem gomb, több feliratos gyerek) tördelése nem feliratvágás
      const t = szoveg(e);
      if (t && t.length <= 40 && e.getBoundingClientRect().height < 90) {
        const rng = document.createRange(); rng.selectNodeContents(e);
        const sorok = new Set([...rng.getClientRects()].filter((r) => r.width > 1 && r.height > 4).map((r) => Math.round(r.top / 4)));
        const fontMeret = parseFloat(c.fontSize) || 14;
        const textRects = [...rng.getClientRects()].filter((r) => r.width > 1 && r.height > 4 && r.height < fontMeret * 2.2);
        const tetok = [...new Set(textRects.map((r) => Math.round(r.top)))].sort((a, b) => a - b);
        let sorDb = 0, elozo = -1e9; for (const tt of tetok) { if (tt - elozo > fontMeret * 0.8) { sorDb++; elozo = tt; } }
        if (sorDb > 1 && sorok.size > 1) ki.push({ tipus: "ket-soros-gomb", hol: ut(e), szoveg: t, adat: `${sorDb} sor` });
      }
    }
    // 3) átfedés a testvérrel (rögzített / abszolút helyzetű elem nem számít)
    if (c.position === "absolute" || c.position === "fixed" || c.position === "sticky") continue;
    const r1 = e.getBoundingClientRect();
    for (const t of e.parentElement ? [...e.parentElement.children] : []) {
      if (t === e || !(t.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_PRECEDING) || !lathato(t)) continue;
      const ct = getComputedStyle(t); if (ct.position === "absolute" || ct.position === "fixed" || ct.position === "sticky" || ct.display === "contents") continue;
      const r2 = t.getBoundingClientRect();
      const x = Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left), y = Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top);
      if (x > 1 && y > 1) ki.push({ tipus: "atfedes", hol: ut(e), szoveg: szoveg(e), adat: `${nev(t)} „${szoveg(t)}” ${Math.round(x)}×${Math.round(y)}` });
    }
  }
  // 3b) átfedés BÁRMELY két tartalmi elem között (nem csak testvérek): gomb, mező, cím, bekezdés, kép — egyik sem a másik őse, mindkettő
  //     a lap folyásában (nincs rögzített / abszolút / ragadó őse: a menük, lapok, lebegő gombok szándékosan fednek)
  const folyasban = new Map();
  const folyasbanE = (e) => { if (folyasban.has(e)) return folyasban.get(e); let x = e, ok = true; while (x && x !== document.body) { const p = getComputedStyle(x).position; if (p === "fixed" || p === "absolute" || p === "sticky") { ok = false; break; } x = x.parentElement; } folyasban.set(e, ok); return ok; };
  const TARTALOM = GOMB + ", h1, h2, h3, p, label, input, textarea, select, img, .r15-info, [data-r15=halad]";
  const tl = [...document.querySelectorAll(TARTALOM)].filter((e) => lathato(e) && !e.closest("svg") && folyasbanE(e)).map((e) => ({ e, r: e.getBoundingClientRect() }));
  const lattuk = new Set();
  for (let i = 0; i < tl.length; i++) for (let j = i + 1; j < tl.length; j++) {
    const a = tl[i], bb = tl[j];
    if (a.e.contains(bb.e) || bb.e.contains(a.e)) continue;
    const x = Math.min(a.r.right, bb.r.right) - Math.max(a.r.left, bb.r.left), y = Math.min(a.r.bottom, bb.r.bottom) - Math.max(a.r.top, bb.r.top);
    if (x > 2 && y > 2) { const k = ut(a.e) + "|" + ut(bb.e); if (lattuk.has(k)) continue; lattuk.add(k); ki.push({ tipus: "atfedes", hol: ut(a.e), szoveg: szoveg(a.e), adat: `${nev(bb.e)} „${szoveg(bb.e)}” ${Math.round(x)}×${Math.round(y)}` }); }
  }
  // 4) egy flex-sor elemei nem egy vonalban (az align-items szerint), > 2 px
  for (const p of document.querySelectorAll("body *")) {
    if (!lathato(p)) continue;
    const c = getComputedStyle(p);
    if (!/flex/.test(c.display) || !c.flexDirection.startsWith("row")) continue;
    const gyerek = [...p.children].filter((g) => lathato(g) && !["absolute", "fixed"].includes(getComputedStyle(g).position));
    if (gyerek.length < 2) continue;
    // a vezérlők és szövegdarabok (gomb, link, címke, ikon) a keretdobozukkal: egy margó-„igazítás” is elcsúszásnak számít;
    // a nagyobb blokkok a margódobozukkal (a szándékos térköz ott nem hiba)
    const LEVEL = /^(A|BUTTON|SPAN|LABEL|INPUT|SELECT|IMG|SVG|STRONG|EM|SMALL)$/;
    const dob = gyerek.map((g) => { const r = g.getBoundingClientRect(), cg = getComputedStyle(g); const level = LEVEL.test(g.tagName.toUpperCase()) && r.height < 80; return { g, top: r.top - (level ? 0 : parseFloat(cg.marginTop)), bottom: r.bottom + (level ? 0 : parseFloat(cg.marginBottom)), self: cg.alignSelf }; });
    const sorok = []; for (const d of dob) { const s = sorok.find((x) => d.top < x.bottom - 1 && d.bottom > x.top + 1); if (s) { s.elemek.push(d); s.top = Math.min(s.top, d.top); s.bottom = Math.max(s.bottom, d.bottom); } else sorok.push({ top: d.top, bottom: d.bottom, elemek: [d] }); }
    for (const sor of sorok) {
      if (sor.elemek.length < 2) continue;
      const mod = (d) => (d.self === "auto" ? c.alignItems : d.self);
      const csoport = {};
      for (const d of sor.elemek) {
        const m = mod(d); if (m.includes("baseline")) continue;
        const ertek = m.includes("center") ? (d.top + d.bottom) / 2 : m.includes("end") ? d.bottom : d.top;
        const kulcs = m.includes("center") ? "center" : m.includes("end") ? "end" : "start"; (csoport[kulcs] ??= []).push({ d, ertek });
      }
      for (const [kulcs, l] of Object.entries(csoport)) {
        if (l.length < 2) continue;
        if (kulcs === "start" && c.alignItems === "stretch" && l.every((x) => true)) { /* stretch: a tetők egyeznek */ }
        const min = Math.min(...l.map((x) => x.ertek)), max = Math.max(...l.map((x) => x.ertek));
        if (max - min > 2) ki.push({ tipus: "elcsuszott-sor", hol: ut(p), szoveg: l.map((x) => szoveg(x.d.g)).join(" | ").slice(0, 80), adat: `${kulcs} ${Math.round(max - min)} px` });
      }
    }
  }
  return ki;
}
// a kombinációk
const kombok = [];
for (const [ki, ut] of UTAK) for (const ny of NYELVEK) for (const w of SZELESSEG) for (const m of MODOK) kombok.push({ ki, ut, ny, w, m, kulcs: `${ki}_${ut.replace(/[^a-z0-9]+/gi, "-")}_${ny}_${w}_${m}`.replace(/-+/g, "-") });
const hatra = kombok.filter((k) => !existsSync(`${KI}/r/${k.kulcs}.json`) && (!SZURO || k.kulcs.includes(SZURO)));
let sablonUt = null;
async function egy(k) {
  const ktx = await b.newContext({ viewport: { width: k.w, height: k.w <= 390 ? 844 : 900 }, colorScheme: k.m, reducedMotion: "reduce", ...(k.ki !== "nyilvanos" ? { storageState: tarolt[k.ki] } : {}) });
  await ktx.route("**/*", (r) => { const u = r.request().url(); return u.includes("fonts.googleapis") || u.includes("fonts.gstatic") || u.endsWith(".woff2") ? r.abort() : r.continue(); });
  await ktx.addInitScript(() => { new MutationObserver((_, o) => { const s = document.getElementById("km-betuk"); if (s && s.sheet && document.querySelector("body")) { while (s.sheet.cssRules.length) s.sheet.deleteRule(0); o.disconnect(); } }).observe(document, { childList: true, subtree: true }); });
  await ktx.addCookies([{ name: "km_nyelv", value: k.ny, url: CIM }]);
  const lap = await ktx.newPage();
  let ut = k.ut.replace("#menu", "");
  if (ut === "/kepek/@sablon") {
    if (!sablonUt) { await lap.goto(CIM + "/kepek/kozlemenyek", { waitUntil: "domcontentloaded" }); sablonUt = await lap.evaluate(() => [...document.querySelectorAll("a[href^='/kepek/']")].map((a) => a.getAttribute("href")).find((h) => /^\/kepek\/[a-z0-9-]+$/.test(h) && !/kozlemenyek|kozlekedes|szoveges-kepek|uj/.test(h)) ?? "/kepek/kozlemenyek"); }
    ut = sablonUt;
  }
  let eredmeny;
  try {
    await lap.goto(CIM + ut, { waitUntil: "load", timeout: 20000 });
    await lap.waitForLoadState("networkidle", { timeout: 2500 }).catch(() => {}); // ahol a lap folyamatosan kérdez (arculat), ott nem várunk tovább
    await lap.waitForTimeout(150);
    if (k.ut.endsWith("#menu")) { if (k.w <= 640) await lap.click("button.r18-menu-t[aria-expanded]").catch(() => {}); else await lap.click(".r18-nav-lenyilo button[aria-haspopup]").catch(() => {}); await lap.waitForTimeout(250); }
    eredmeny = { ...k, vegso: new URL(lap.url()).pathname, talalatok: await lap.evaluate(meres) };
  } catch (h) { eredmeny = { ...k, hiba: String(h).slice(0, 200), talalatok: [] }; }
  writeFileSync(`${KI}/r/${k.kulcs}.json`, JSON.stringify(eredmeny));
  await ktx.close();
}
let i = 0; const PAR = 3;
await Promise.all(Array.from({ length: PAR }, async () => { while (i < hatra.length && Date.now() - KEZD < IDO) { const k = hatra[i++]; await egy(k); } }));
const kesz = readdirSync(KI + "/r").length;
console.log(`audit: ${kesz} / ${kombok.length} kombináció kész${SZURO ? " (szűrő: " + SZURO + ")" : ""}`);
await b.close();
