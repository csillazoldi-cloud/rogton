// R-2 (F-3e): a Tagok lap és a beváltó lap képernyőképei a FUTÓ rendszerről, a rajz hét artboardja mellé.
//   node tools/kepernyokep/r2-kepek.mjs --cim http://127.0.0.1:8401 --ki <mappa> [--resolve saas.mediapartizan.ro:443:192.168.1.144]
//   01 Tagok normál (3 tag + 1 függő meghívó) · 02 első használat · 03 meghívás párbeszéd (A) és a kiadott link (B) · 04 szerep-átállítás megerősítő sávval
//   05 zárt utak (saját sor) · 06 telefon · 07 beváltó lap: belépés nélkül (B), belépve (A), már tag (C)
// Próbafiókokkal, a valódi végpontokon; a jegy csak a böngésző címsorába kerül, kimenetbe nem.
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const CIM = arg("--cim", "http://127.0.0.1:8401"), KI = arg("--ki", "kepek-r2"), NYELV = arg("--nyelv", "hu"), RESOLVE = arg("--resolve", "");
const JELSZO = "ProbaJelszo123!";
mkdirSync(KI, { recursive: true });
const bongeszo = await chromium.launch({ channel: process.env.BONGESZO ?? "msedge", args: RESOLVE ? [`--host-resolver-rules=MAP ${RESOLVE.split(":")[0]} ${RESOLVE.split(":")[2]}`] : [] });

async function ujLap(cimke) {
  const ktx = await bongeszo.newContext({ viewport: { width: 1440, height: 900 }, locale: NYELV, ignoreHTTPSErrors: true });
  const lap = await ktx.newPage();
  lap.on("pageerror", (e) => console.log(`LAPHIBA[${cimke}] ${new URL(lap.url()).pathname.replace(/\/meghivo\/.*/, "/meghivo/<jegy>")}: ${e.message.slice(0, 60)}`));
  lap.on("response", (r) => { if (r.status() >= 500) console.log(`VÁLASZ ${r.status()}: ${r.url()}`); });
  await lap.goto(`${CIM}/belepes`, { waitUntil: "domcontentloaded" });
  return lap;
}
async function api(lap, ut, torzs, modszer = "POST") {
  return lap.evaluate(async ([u, t, m]) => {
    const v = await fetch(u, { method: m, headers: { "content-type": "application/json" }, body: t === undefined ? undefined : JSON.stringify(t), credentials: "same-origin" });
    let torzs = null; try { torzs = JSON.parse(await v.text()); } catch { /* üres */ }
    return { statusz: v.status, torzs };
  }, [ut, torzs, modszer]);
}
function kell(r, mit, elvart) { if (!elvart.includes(r.statusz)) throw new Error(`${mit}: ${r.statusz} ${JSON.stringify(r.torzs).slice(0, 200)}`); return r.torzs; }
async function kep(lap, ut, nev, w = 1440, h = 900, elotte) {
  await lap.setViewportSize({ width: w, height: h });
  if (ut) await lap.goto(`${CIM}${ut}`, { waitUntil: "networkidle" });
  if (elotte) await elotte(lap);
  await lap.waitForTimeout(500);
  const f = join(KI, `${nev}.png`); await lap.screenshot({ path: f, fullPage: true }); console.log(`kép: ${nev}`);
}
async function fiok(lap, nev, email) {
  kell(await api(lap, "/api/fiok/regisztracio", { nev, email, jelszo: JELSZO }), `regisztráció ${nev}`, [201]);
  kell(await api(lap, "/api/fiok/belepes", { email, jelszo: JELSZO }), `belépés ${nev}`, [200]);
}
const t = Date.now().toString(36);

// A: tulajdonos + munkatér
const a = await ujLap("A");
await fiok(a, "Portik Vilmos", `proba-r2-a-${t}@proba.example`);
kell(await api(a, "/api/szervezet", { nev: "Aitmetica SRL" }), "szervezet", [201]);
if (NYELV !== "hu") await api(a, "/api/nyelv", { nyelv: NYELV });

// 02 · első használat
await kep(a, "/tagok", "02-tagok-elso-hasznalat");

// 03 · meghívás párbeszéd (A), aztán a kiadott link (B) — a gombok szövege a feliratok.json-ból (hu)
await kep(a, "/tagok", "03a-meghivas-parbeszed", 1440, 900, async (lap) => {
  await lap.getByRole("button", { name: "Meghívás" }).first().click(); await lap.waitForTimeout(400);
});
await kep(a, null, "03b-kiadott-link", 1440, 900, async (lap) => {
  await lap.getByText("szerkesztő", { exact: false }).first().click().catch(() => {});
  await lap.getByRole("button", { name: "Meghívó kiadása" }).click(); await lap.waitForTimeout(800);
});

// tagok: B szerkesztő, C néző (meghívóval), plusz egy függő meghívó
const mB = kell(await api(a, "/api/tagok/meghivo", { szerep: "szerkeszto" }), "meghívó B", [201]).hozzaferes.jegy;
const mC = kell(await api(a, "/api/tagok/meghivo", { szerep: "nezo" }), "meghívó C", [201]).hozzaferes.jegy;
kell(await api(a, "/api/tagok/meghivo", { szerep: "szerkeszto", email: "nagy.eva@proba.example" }), "függő meghívó", [201]);
const b = await ujLap("B"); await fiok(b, "Kis Anna", `proba-r2-b-${t}@proba.example`);
// 07/B · beváltó lap belépés nélkül (új, be nem lépett böngésző) — a jegy a címsorban, kimenetbe nem
const idegen = await (await bongeszo.newContext({ viewport: { width: 1440, height: 900 }, locale: NYELV, ignoreHTTPSErrors: true })).newPage();
await kep(idegen, `/meghivo/${mC}`, "07b-bevalto-belepes-nelkul");
// 07/A · belépve (B, a szerkesztői jegyével)
await kep(b, `/meghivo/${mB}`, "07a-bevalto-belepve");
kell(await api(b, "/api/meghivo/elfogad", { jegy: mB }), "B elfogad", [200]);
// 07/C · már tag (B ugyanazzal a jeggyel újra → felhasznált; és B a saját munkaterének másik jegyével → már tag)
await kep(b, `/meghivo/${mB}`, "07c-bevalto-felhasznalt");
await kep(b, `/meghivo/${mC}`, "07c-bevalto-mar-tag");
const c = await ujLap("C"); await fiok(c, "Molnár Tamás", `proba-r2-c-${t}@proba.example`);
kell(await api(c, "/api/meghivo/elfogad", { jegy: mC }), "C elfogad", [200]);

// 01 · normál: 3 tag + 1 függő meghívó (A nézete)
await kep(a, "/tagok", "01-tagok-normal");
// 04 · szerep-átállítás: a listán a szerep lenyílója → megerősítő sáv
await kep(a, "/tagok", "04-szerep-megerosito-sav", 1440, 900, async (lap) => {
  const valaszto = lap.locator("select").filter({ hasText: "néző" }).first();
  if (await valaszto.count()) { await valaszto.selectOption({ label: "néző" }).catch(() => {}); }
  else { await lap.getByRole("button", { name: "Szerep" }).first().click().catch(() => {}); }
  await lap.waitForTimeout(500);
});
// 05 · a szerkesztő (B) nézete: Meghívás van, Szerep/Eltávolítás nincs
await kep(b, "/tagok", "05-tagok-szerkeszto-nezete");
// 06 · telefon
await kep(a, "/tagok", "06-tagok-telefon", 390, 844);
await bongeszo.close();
console.log("kész");
