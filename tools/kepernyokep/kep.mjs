// Képernyőkép a futó rendszerről — bejelentkezve, asztali (1440) és telefon (390) méretben.
// A gép saját Edge/Chrome böngészőjét használja (playwright-core, nem tölt le böngészőt).
//
//   node tools/kepernyokep/kep.mjs --cim http://127.0.0.1:8400 --ki <mappa> [--nyelv hu] [--belep] fiok tema hirfigyelo/attekintes ...
//     a lapok NEVE perjel nélkül (a Git Bash a /fiok alakot Windows-útvonallá alakítaná)
//     --belep   előbb regisztrál egy próbafiókot + szervezetet (proba-...@proba.example), és azzal nézi a lapokat
//     --profil  a --belep után jóváhagyott profilt is készít (a hírfigyelő és a fiókoldal csak így nyílik meg)
//     --resolve saas.mediapartizan.ro:443:192.168.1.144   a tesztoldal a NAS-on át (a Gigabyte/Dell LAN-járól)
//   A fájlnév: <lap>-asztali.png és <lap>-telefon.png. Titok nincs benne.
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const CIM = arg("--cim", "http://127.0.0.1:8400"), KI = arg("--ki", "kepek"), NYELV = arg("--nyelv", "hu");
const RESOLVE = arg("--resolve", ""), BELEP = process.argv.includes("--belep"), PROFIL = process.argv.includes("--profil");
const OPCIOK = new Set(["--cim", "--ki", "--nyelv", "--resolve"]);
const lapok = process.argv.slice(2).filter((a, i, t) => !a.startsWith("--") && !OPCIOK.has(t[i - 1] ?? "")).map((a) => "/" + a.replace(/^\/+/, ""));
if (!lapok.length) { console.error("nincs lap megadva (pl. fiok tema)"); process.exit(2); }
mkdirSync(KI, { recursive: true });

const args = RESOLVE ? [`--host-resolver-rules=MAP ${RESOLVE.split(":")[0]} ${RESOLVE.split(":")[2]}`] : [];
const bongeszo = await chromium.launch({ channel: process.env.BONGESZO ?? "msedge", args });
const ktx = await bongeszo.newContext({ viewport: { width: 1440, height: 900 }, locale: NYELV, ignoreHTTPSErrors: true });

// Az API-hívások a BÖNGÉSZŐBEN futnak (page.evaluate + fetch): így a --resolve szabály és a sütik is érvényesek rájuk.
const lap = await ktx.newPage();
// a böngésző hibái a kimenetre: a képernyőkép nem elég, ha a lap közben hibát dobott
lap.on("pageerror", (e) => console.log(`LAPHIBA: ${e.message}`));
lap.on("console", (m) => { if (m.type() === "error") console.log(`KONZOL: ${m.text().slice(0, 300)}`); });
lap.on("response", (r) => { if (r.status() >= 400) console.log(`VÁLASZ ${r.status()}: ${r.url()}`); });
lap.on("requestfailed", (r) => console.log(`KÉRÉS ELBUKOTT: ${r.url()} ${r.failure()?.errorText ?? ""}`));
await lap.goto(`${CIM}/belepes`, { waitUntil: "domcontentloaded" });
async function api(ut, torzs) {
  return lap.evaluate(async ([u, t]) => {
    const v = await fetch(u, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(t), credentials: "same-origin" });
    return { statusz: v.status, szoveg: await v.text() };
  }, [ut, torzs]);
}
if (BELEP) {
  const email = `proba-kep-${Date.now().toString(36)}@proba.example`, jelszo = "ProbaJelszo123!";
  const r = await api("/api/fiok/regisztracio", { nev: "Kép Próba", email, jelszo });
  if (r.statusz !== 201) throw new Error(`regisztráció: ${r.statusz} ${r.szoveg}`);
  const b = await api("/api/fiok/belepes", { email, jelszo });
  if (b.statusz !== 200) throw new Error(`belépés: ${b.statusz} ${b.szoveg}`);
  const sz = await api("/api/szervezet", { nev: "Kép Próba Kft." });
  if (sz.statusz !== 201) throw new Error(`szervezet: ${sz.statusz} ${sz.szoveg}`);
  console.log(`bejelentkezve: ${email}`);
  if (PROFIL) {
    // ugyanaz a két lépés, amivel a hirfigyelo-felulet.proba.ts jóváhagyott profilt csinál
    const pz = await lap.evaluate(async () => {
      const v = await fetch("/api/onboarding/piszkozat", { method: "PUT", headers: { "content-type": "application/json" }, credentials: "same-origin", body: JSON.stringify({
        bemutatkozas: { nev: "Kép Próba Kft.", osszefoglalo: "Ez egy próba összefoglaló a szervezetről, amely elég hosszú ahhoz, hogy érvényes legyen.", osszefoglalo_forras: "ai", forras_tipus: "leiras", leiras: "Ez egy részletes leírás a szervezetről, amely elég hosszú ahhoz, hogy érvényes legyen." },
        kommunikacio: { celkozonseg: "családok", celkozonseg_forras: "ai", cel: "", cel_forras: "sajat", cel_kesobb: true, nyelvek: ["hu"], nyelvek_forras: "ai", hangnem_leiras: "", hangnem_minta: "", hangnem_nyelv: "hu", hangnem_forras: "sajat" } }) });
      return v.status;
    });
    if (pz !== 200) throw new Error(`piszkozat: ${pz}`);
    const j = await api("/api/onboarding/jovahagyas", {});
    if (j.statusz !== 200) throw new Error(`jóváhagyás: ${j.statusz} ${j.szoveg}`);
    console.log("profil jóváhagyva");
  }
}
if (NYELV !== "hu") await api("/api/nyelv", { nyelv: NYELV }).catch(() => {});


for (const ut of lapok) {
  const nev = ut.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "fooldal";
  for (const [mod, w, h] of [["asztali", 1440, 900], ["telefon", 390, 844]]) {
    await lap.setViewportSize({ width: w, height: h });
    await lap.goto(`${CIM}${ut}`, { waitUntil: "networkidle" });
    // a kliens-oldali betöltés végét is megvárjuk (a "Betöltés…" feliratok eltűnését), legfeljebb 15 mp
    await lap.waitForFunction(() => !/Betöltés|Loading|Se încarcă/.test(document.body.innerText), null, { timeout: 15000 }).catch(() => {});
    await lap.waitForTimeout(600);
    if (process.argv.includes("--szoveg")) {
      // hibakereséshez: a lap szövege és a lap saját API-hívásának állapota
      const sz = await lap.evaluate(() => document.body.innerText.replace(/\s+/g, " ").slice(0, 400));
      const api = await lap.evaluate(async (u) => { try { const v = await fetch(`/api${u}`, { credentials: "same-origin" }); return `${v.status} ${(await v.text()).slice(0, 200)}`; } catch (e) { return `HIBA ${String(e)}`; } }, ut);
      console.log(`SZÖVEG: ${sz}
API /api${ut}: ${api}`);
    }
    const f = join(KI, `${nev}-${mod}.png`);
    await lap.screenshot({ path: f, fullPage: true });
    console.log(`kép: ${f}  (${lap.url()})`);
  }
}
await bongeszo.close();
