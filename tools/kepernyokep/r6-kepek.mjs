// R-6 (F-6b): az „Arculati anyagok" blokk képei a FUTÓ rendszerről, a rajz hat artboardja mellé.
//   node tools/kepernyokep/r6-kepek.mjs --cim http://127.0.0.1:8401 --ki <mappa> [--resolve saas.mediapartizan.ro:443:192.168.1.144]
//   01 üres blokk a profilon · 02 kész (feltöltött PNG, előnézet két háttéren) + néző nézete · 03 hibaút (SVG a felületen át)
//   05/A csere-megerősítő (a fájl kiválasztva, mostani → új) · 05/B a lista a csere után (használatban · az 1. jóváhagyott tervezetben) · 06 telefon
// Az arculat a próbában JÓVÁHAGYOTT (v1, logó nélkül), így a logó feltöltése és cseréje a rajz szerint új tervezetet nyit.
// Próbafiókkal, jóváhagyott profillal; a PNG itt készül (valódi, 1×1-es átlátszó kép), az SVG szöveg — mindkettő a felületen át megy fel.
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const CIM = arg("--cim", "http://127.0.0.1:8401"), KI = arg("--ki", "kepek-r6"), NYELV = arg("--nyelv", "hu"), RESOLVE = arg("--resolve", "");
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
  await lap.waitForTimeout(600);
  const f = join(KI, `${nev}.png`); await lap.screenshot({ path: f, fullPage: true }); console.log(`kép: ${nev}`);
}
async function fiok(lap, nev, email) {
  kell(await api(lap, "/api/fiok/regisztracio", { nev, email, jelszo: JELSZO }), `regisztráció ${nev}`, [201]);
  kell(await api(lap, "/api/fiok/belepes", { email, jelszo: JELSZO }), `belépés ${nev}`, [200]);
}
// egy valódi, 1×1-es átlátszó PNG (68 bájt) — a típusfelismerés a fejlécből dönt
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
const pngUt = join(KI, "minta-logo.png"); writeFileSync(pngUt, PNG);
const PNG2 = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==", "base64");
const png2Ut = join(KI, "minta-logo-2.png"); writeFileSync(png2Ut, PNG2);
const svgUt = join(KI, "minta-logo.svg"); writeFileSync(svgUt, '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>');
const t = Date.now().toString(36);

const a = await ujLap("A");
await fiok(a, "Portik Vilmos", `proba-r6-a-${t}@proba.example`);
kell(await api(a, "/api/szervezet", { nev: "Aitmetica SRL" }), "szervezet", [201]);
kell(await api(a, "/api/onboarding/piszkozat", {
  bemutatkozas: { nev: "Aitmetica SRL", osszefoglalo: "Kommunikációs munkakörnyezetet fejlesztő cég Marosvásárhelyen; ügyfelei kis- és középvállalkozások.", osszefoglalo_forras: "ai", forras_tipus: "leiras", leiras: "Az Aitmetica SRL több ügyfélnek eladható, AI-központú kommunikációs munkakörnyezetet fejleszt, iparágtól függetlenül." },
  arculat: (() => {
    const terv = { elsodleges: "#1d4ed8", masodlagos: "#9a9a9a", hatter: "#f2f2ef", betu_cim: "Georgia, serif", betu_szoveg: "system-ui, sans-serif", betu_iranymutatas: "", kepvilag: "", kovetendo: "", kerulendo: "", lekerekites: 8, nyelv: "hu", eredet: "ai", modositva: true, logo_fajl_id: null };
    return { allapot: "jovahagyott", tervezet: terv, verzio: 1, jovahagyott_verzio: 1, verziok: { "1": { ...terv, jovahagyva: new Date().toISOString(), verzio: 1 } } };
  })(),
  kommunikacio: { celkozonseg: "kis- és középvállalkozások kommunikációs vezetői", celkozonseg_forras: "ai", cel: "", cel_forras: "sajat", cel_kesobb: true, nyelvek: ["hu"], nyelvek_forras: "ai", hangnem_leiras: "közvetlen, szakmai", hangnem_minta: "", hangnem_nyelv: "hu", hangnem_forras: "sajat" },
}, "PUT"), "piszkozat", [200]);
kell(await api(a, "/api/onboarding/jovahagyas", {}), "jóváhagyás", [200]);

// 01 · üres blokk a profilon
await kep(a, "/fiok", "01-anyagok-ures");
// 03 · hibaút: SVG a felületen át (a logó mezőjébe)
await kep(a, "/fiok", "03-hiba-svg", 1440, 900, async (lap) => {
  const be = lap.locator(".km-af-mezo input[type=file], .km-af input[type=file]").first();
  await be.setInputFiles(svgUt); await lap.waitForTimeout(1200);
});
// 02/B · kész: PNG a felületen át → lista + előnézet két háttéren
await kep(a, "/fiok", "02b-feltoltve-elonezet", 1440, 900, async (lap) => {
  const be = lap.locator(".km-af-mezo input[type=file], .km-af input[type=file]").first();
  await be.setInputFiles(pngUt); await lap.waitForTimeout(2000);
});
// a feltöltés a jóváhagyott arculatot új tervezetbe (v2) tette — a próbában jóváhagyjuk, hogy a csere a rajz 05-ös helyzetéből induljon
const profil = kell(await api(a, "/api/profil", undefined, "GET"), "profil", [200]).profil;
const arc = profil.arculat;
if (arc.tervezet) {
  kell(await api(a, "/api/profil", { arculat: { ...arc, allapot: "jovahagyott", jovahagyott_verzio: arc.verzio, verziok: { ...arc.verziok, [String(arc.verzio)]: { ...arc.tervezet, jovahagyva: new Date().toISOString(), verzio: arc.verzio } } } }, "PUT"), "arculat jóváhagyás", [200]);
}
// 05/A · csere-megerősítő: a Csere a fájlválasztót nyitja, a kiválasztott fájl a kártyára kerül (mostani → új)
await kep(a, "/fiok", "05a-csere-parbeszed", 1440, 900, async (lap) => {
  const valaszto = lap.waitForEvent("filechooser");
  await lap.getByRole("button", { name: "Csere" }).first().click();
  await (await valaszto).setFiles(png2Ut); await lap.waitForTimeout(600);
});
// 05/B · a lista a csere után: az új „ez van használatban", a régi halványan „a 2. jóváhagyott tervezetben"
await kep(a, null, "05b-lista-csere-utan", 1440, 900, async (lap) => {
  await lap.getByRole("button", { name: "Csere és új tervezet" }).click(); await lap.waitForTimeout(2500);
});
// 06 · telefon
await kep(a, "/fiok", "06-anyagok-telefon", 390, 844);
// 02/C · néző nézete
const mC = kell(await api(a, "/api/tagok/meghivo", { szerep: "nezo" }), "meghívó", [201]).hozzaferes.jegy;
const c = await ujLap("C"); await fiok(c, "Néző Nóra", `proba-r6-c-${t}@proba.example`);
kell(await api(c, "/api/meghivo/elfogad", { jegy: mC }), "C elfogad", [200]);
await kep(c, "/fiok", "02c-nezo-csak-olvasas");
await bongeszo.close();
console.log("kész");
