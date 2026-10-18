// R-4 (F-5b): a Beállítások lap (Értesítések · Adatpolitika) képei a FUTÓ rendszerről, a rajz hat megépülő artboardja mellé.
//   node tools/kepernyokep/r4-kepek.mjs --cim http://127.0.0.1:8401 --ki <mappa> [--resolve saas.mediapartizan.ro:443:192.168.1.144]
//   02 üres lista (friss fiók) · 01 teli lista (valódi események: egy hibás forrás, egy próbafutás) + a harang a sávban · 03 adatpolitika (tulajdonos)
//   04 a néző nézete (adatpolitika: felhő-kapcsoló nincs; értesítések: rendszergazdai csoport nincs) · 05/06 telefon · +01b „Mind olvasottnak jelölöm" után
// Próbafiókokkal, a valódi végpontokon; az események a gépezetből jönnek (forras_hibas a forrás ellenőrzéséből, futas_kesz a próbafutásból).
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const CIM = arg("--cim", "http://127.0.0.1:8401"), KI = arg("--ki", "kepek-r4"), NYELV = arg("--nyelv", "hu"), RESOLVE = arg("--resolve", "");
const PROBA_RSS = process.env.PROBA_RSS ?? "https://marosvasarhelyiek.ro/feed";
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
  await lap.waitForTimeout(500);
  const f = join(KI, `${nev}.png`); await lap.screenshot({ path: f, fullPage: true }); console.log(`kép: ${nev}`);
}
async function fiok(lap, nev, email) {
  kell(await api(lap, "/api/fiok/regisztracio", { nev, email, jelszo: JELSZO }), `regisztráció ${nev}`, [201]);
  kell(await api(lap, "/api/fiok/belepes", { email, jelszo: JELSZO }), `belépés ${nev}`, [200]);
}
const t = Date.now().toString(36);

// A: tulajdonos + munkatér + jóváhagyott profil (a hírfigyelő beállításához kell)
const a = await ujLap("A");
await fiok(a, "Portik Vilmos", `proba-r4-a-${t}@proba.example`);
kell(await api(a, "/api/szervezet", { nev: "Aitmetica SRL" }), "szervezet", [201]);
if (NYELV !== "hu") await api(a, "/api/nyelv", { nyelv: NYELV });

// 02 · üres lista — friss fiók, esemény még nincs
await kep(a, "/beallitasok", "02-ertesitesek-ures");

kell(await api(a, "/api/onboarding/piszkozat", {
  bemutatkozas: { nev: "Aitmetica SRL", osszefoglalo: "Kommunikációs munkakörnyezetet fejlesztő cég Marosvásárhelyen; ügyfelei kis- és középvállalkozások.", osszefoglalo_forras: "ai", forras_tipus: "leiras", leiras: "Az Aitmetica SRL több ügyfélnek eladható, AI-központú kommunikációs munkakörnyezetet fejleszt, iparágtól függetlenül." },
  kommunikacio: { celkozonseg: "kis- és középvállalkozások kommunikációs vezetői", celkozonseg_forras: "ai", cel: "", cel_forras: "sajat", cel_kesobb: true, nyelvek: ["hu"], nyelvek_forras: "ai", hangnem_leiras: "közvetlen, szakmai", hangnem_minta: "", hangnem_nyelv: "hu", hangnem_forras: "sajat" },
}, "PUT"), "piszkozat", [200]);
kell(await api(a, "/api/onboarding/jovahagyas", {}), "jóváhagyás", [200]);

// események a gépezetből: egy hibás forrás (forras_hibas az ellenőrzésből) és egy próbafutás (futas_kesz)
kell(await api(a, "/api/hirfigyelo/beallitas", {
  celok: ["sajat_marka"], temak: [{ nev: "Marosvásárhely", nevvaltozatok: ["Târgu Mureș"], megkulonboztetes: "" }],
  foldrajzi_fokusz: "Maros megye", nyelvek: ["hu"], kizarasok: [], idozites: { mod: "napi", ora: 18, perc: 0, idozona: "Europe/Bucharest" }, szabad_szoveg: "Helyi gazdasági hírek",
}, "PUT"), "beállítás", [200]);
const rss = kell(await api(a, "/api/hirfigyelo/forrasok", { cim: PROBA_RSS }), "forrás rss", [200]);
const rssId = rss?.hirfigyelo?.forras?.id;
if (rssId) console.log("rss ellenőrzés:", (await api(a, `/api/hirfigyelo/forrasok/${rssId}/ellenoriz`, {})).torzs?.hirfigyelo?.forras?.allapot);
const rossz = kell(await api(a, "/api/hirfigyelo/forrasok", { cim: "https://kozteruleti-hirek.proba.example/rss" }), "forrás hibás", [200]);
const rosszId = rossz?.hirfigyelo?.forras?.id;
if (rosszId) console.log("hibás forrás ellenőrzése:", (await api(a, `/api/hirfigyelo/forrasok/${rosszId}/ellenoriz`, {})).torzs?.hirfigyelo?.forras?.allapot);
const futas = await api(a, "/api/hirfigyelo/futas", { proba: true });
if (futas.statusz === 202) {
  const sorId = futas.torzs.hirfigyelo.sor.id; const hatar = Date.now() + 120000; let vege = null;
  while (Date.now() < hatar) {
    const s = await api(a, `/api/hirfigyelo/futas/sor/${sorId}`, undefined, "GET");
    if (s.torzs?.hirfigyelo?.sor?.allapot === "kesz" || s.torzs?.hirfigyelo?.sor?.allapot === "hiba") { vege = s.torzs.hirfigyelo.sor; break; }
    await new Promise((r) => setTimeout(r, 2000));
  }
  console.log("próbafutás:", vege ? vege.allapot : "nem ért véget 120 mp alatt");
} else console.log("próbafutás nem indult:", futas.statusz, JSON.stringify(futas.torzs).slice(0, 200));
const lista = kell(await api(a, "/api/ertesites/lista", undefined, "GET"), "lista", [200]).lista;
console.log("értesítések:", lista.osszes, "olvasatlan:", lista.olvasatlan, lista.sorok.map((s) => s.fajta).join(","));

// B: néző (meghívóval)
const meghivo = kell(await api(a, "/api/tagok/meghivo", { szerep: "nezo" }), "meghívó", [201]);
const b = await ujLap("B");
await fiok(b, "Néző Nóra", `proba-r4-b-${t}@proba.example`);
kell(await api(b, "/api/meghivo/elfogad", { jegy: meghivo.hozzaferes.jegy }), "elfogadás", [200]);
if (NYELV !== "hu") await api(b, "/api/nyelv", { nyelv: NYELV });

// 01 · teli lista (a harang számmal a sávban) · 03 · adatpolitika (tulajdonos) · 05/06 telefon
await kep(a, "/beallitasok", "01-ertesitesek-teli");
await kep(a, "/beallitasok?ful=adatpolitika", "03-adatpolitika-tulajdonos");
await kep(a, "/beallitasok", "05-ertesitesek-telefon", 390, 844);
await kep(a, "/beallitasok?ful=adatpolitika", "06-adatpolitika-telefon", 390, 844);
// 01/B · „Mind olvasottnak jelölöm" után — a gomb eltűnik, a pontok eltűnnek, a harangon nincs szám
await kep(a, "/beallitasok", "01b-mind-olvasott-utan", 1440, 900, async (lap) => {
  await lap.getByRole("button", { name: "Mind olvasottnak jelölöm" }).click().catch(() => {}); await lap.waitForTimeout(800);
  await lap.reload({ waitUntil: "networkidle" });
});
// 04 · a néző nézete: adatpolitika felhő-kapcsoló nélkül; értesítések rendszergazdai csoport nélkül
await kep(b, "/beallitasok?ful=adatpolitika", "04a-adatpolitika-nezo");
await kep(b, "/beallitasok", "04b-ertesitesek-nezo");
await bongeszo.close();
console.log("kész");
