// R-3 v2 (F-4b): a Saját fiók lap képei a FUTÓ rendszerről, a rajz hat artboardja mellé.
//   node tools/kepernyokep/r3-kepek.mjs --cim http://127.0.0.1:8401 --ki <mappa> [--resolve saas.mediapartizan.ro:443:192.168.1.144]
//   01 alaphelyzet (két munkatér: tulajdonos + szerkesztő; belépések listája) · 02/A egy munkatér · 03/B jelszóváltás sikere · 03/C a kiléptetés válasza
//   04 a hibautak (üres név · rossz jelenlegi jelszó · rövid új jelszó · nem egyező) · 05 kilépés egy munkatérből — a megerősítő sáv · 06 telefon
// Próbafiókokkal, a valódi végpontokon; a belépések listája valódi (egy sikertelen belépési kísérlettel).
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const CIM = arg("--cim", "http://127.0.0.1:8401"), KI = arg("--ki", "kepek-r3"), NYELV = arg("--nyelv", "hu"), RESOLVE = arg("--resolve", "");
const JELSZO = "ProbaJelszo123!";
mkdirSync(KI, { recursive: true });
const bongeszo = await chromium.launch({ channel: process.env.BONGESZO ?? "msedge", args: RESOLVE ? [`--host-resolver-rules=MAP ${RESOLVE.split(":")[0]} ${RESOLVE.split(":")[2]}`] : [] });

async function ujLap(cimke) {
  const ktx = await bongeszo.newContext({ viewport: { width: 1440, height: 900 }, locale: NYELV, ignoreHTTPSErrors: true });
  const lap = await ktx.newPage();
  lap.on("pageerror", (e) => console.log(`LAPHIBA[${cimke}] ${new URL(lap.url()).pathname}: ${e.message.slice(0, 60)}`));
  lap.on("response", (r) => { if (r.status() >= 500) console.log(`VÁLASZ ${r.status()}: ${r.url()}`); });
  await lap.goto(`${CIM}/belepes`, { waitUntil: "domcontentloaded" });
  return lap;
}
async function api(lap, ut, torzs, modszer = "POST") {
  return lap.evaluate(async ([u, t, m]) => {
    const v = await fetch(u, { method: m, headers: { "content-type": "application/json", "x-forwarded-for": `198.51.100.${1 + Math.floor(Math.random() * 250)}` }, body: t === undefined ? undefined : JSON.stringify(t), credentials: "same-origin" });
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
  const f = join(KI, `${nev}.png`);
  // a Chromium néha „Unable to capture screenshot"-ot ad, ha a lap épp újratöltődik (átmeneti) — egy ismétlés elég
  try { await lap.screenshot({ path: f, fullPage: true }); } catch { await lap.waitForTimeout(1000); await lap.screenshot({ path: f, fullPage: true }); }
  console.log(`kép: ${nev}`);
}
async function fiok(lap, nev, email) {
  kell(await api(lap, "/api/fiok/regisztracio", { nev, email, jelszo: JELSZO }), `regisztráció ${nev}`, [201]);
  kell(await api(lap, "/api/fiok/belepes", { email, jelszo: JELSZO }), `belépés ${nev}`, [200]);
}
const t = Date.now().toString(36);

// A: tulajdonos + saját munkatér; egy sikertelen belépési kísérlet is (a lista „sikertelen" sora), majd még egy sikeres belépés
const a = await ujLap("A");
const emailA = `proba-r3-a-${t}@proba.example`;
await fiok(a, "Portik Vilmos", emailA);
kell(await api(a, "/api/szervezet", { nev: "Aitmetica SRL" }), "szervezet", [201]);
await api(a, "/api/fiok/belepes", { email: emailA, jelszo: "RosszJelszo999!" }); // sikertelen kísérlet — a naplóban marad
kell(await api(a, "/api/fiok/belepes", { email: emailA, jelszo: JELSZO }), "belépés A újra", [200]);
if (NYELV !== "hu") await api(a, "/api/nyelv", { nyelv: NYELV });

// 02/A · egy munkatér — látszik, de nincs mire váltani
await kep(a, "/sajat-fiok", "02a-egy-munkater");

// B: a „Demo ügyfél Kft." tulajdonosa, A-t szerkesztőnek hívja
const b = await ujLap("B");
await fiok(b, "Kis Anna", `proba-r3-b-${t}@proba.example`);
kell(await api(b, "/api/szervezet", { nev: "Demo ügyfél Kft." }), "szervezet B", [201]);
const meghivo = kell(await api(b, "/api/tagok/meghivo", { szerep: "szerkeszto" }), "meghívó", [201]);
kell(await api(a, "/api/meghivo/elfogad", { jegy: meghivo.hozzaferes.jegy }), "elfogadás", [200]);
const szA = kell(await api(a, "/api/fiok/en", undefined, "GET"), "en", [200]).szervezetek.find((s) => s.nev === "Aitmetica SRL");
kell(await api(a, "/api/szervezet/valt", { szervezet_id: szA.id }), "váltás A", [200]);

// 01 · alaphelyzet: két munkatér, kétféle szerep, belépések
await kep(a, "/sajat-fiok", "01-sajat-fiok-alaphelyzet");
// 06 · telefon
await kep(a, "/sajat-fiok", "06-sajat-fiok-telefon", 390, 844);

// 04 · hibautak: üres név → mentés; rossz jelenlegi jelszó; rövid új jelszó; nem egyező
await kep(a, "/sajat-fiok", "04a-hiba-ures-nev", 1440, 900, async (lap) => {
  await lap.getByLabel("Név", { exact: true }).fill("");
  await lap.getByRole("button", { name: "Név mentése" }).click(); await lap.waitForTimeout(600);
});
await kep(a, "/sajat-fiok", "04b-hiba-rossz-jelenlegi", 1440, 900, async (lap) => {
  await lap.getByLabel("Jelenlegi jelszó", { exact: true }).fill("NemEzAJelszo123!");
  await lap.getByLabel("Új jelszó", { exact: true }).fill("UjJelszoHosszu456!");
  await lap.getByLabel("Új jelszó még egyszer", { exact: true }).fill("UjJelszoHosszu456!");
  await lap.getByRole("button", { name: "Jelszó megváltoztatása" }).click(); await lap.waitForTimeout(800);
});
await kep(a, "/sajat-fiok", "04c-hiba-rovid-es-nem-egyezo", 1440, 900, async (lap) => {
  await lap.getByLabel("Jelenlegi jelszó", { exact: true }).fill(JELSZO);
  await lap.getByLabel("Új jelszó", { exact: true }).fill("rovid1");
  await lap.getByLabel("Új jelszó még egyszer", { exact: true }).fill("rovid12");
  await lap.waitForTimeout(400);
});

// 05 · kilépés a másik munkatérből — a megerősítő sáv (a saját munkatér gombja zárt: egyetlen tulajdonos)
await kep(a, "/sajat-fiok", "05-kilepes-megerosito-sav", 1440, 900, async (lap) => {
  const gombok = lap.getByRole("button", { name: "Kilépek", exact: true });
  const n = await gombok.count();
  for (let i = 0; i < n; i++) { if (await gombok.nth(i).isEnabled()) { await gombok.nth(i).click(); break; } }
  await lap.waitForTimeout(500);
});

// 03/B · jelszóváltás sikere (A-nak nincs más munkamenete → „0 másik eszközről"); 03/C · a kiléptetés válasza
await kep(a, "/sajat-fiok", "03b-jelszo-siker", 1440, 900, async (lap) => {
  await lap.getByLabel("Jelenlegi jelszó", { exact: true }).fill(JELSZO);
  await lap.getByLabel("Új jelszó", { exact: true }).fill("UjJelszoHosszu456!");
  await lap.getByLabel("Új jelszó még egyszer", { exact: true }).fill("UjJelszoHosszu456!");
  await lap.getByRole("button", { name: "Jelszó megváltoztatása" }).click(); await lap.waitForTimeout(1200);
});
await kep(a, "/sajat-fiok", "03c-kileptetes-valasz", 1440, 900, async (lap) => {
  await lap.getByRole("button", { name: "Kiléptetés minden más eszközről" }).click(); await lap.waitForTimeout(1000);
});
await bongeszo.close();
console.log("kész");
