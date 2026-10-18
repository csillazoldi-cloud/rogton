// c4 kapu — az eredmény összevetése az ismert bukások alapvonalával (tools/kapu/ismert-bukasok.json).
//   node tools/kapu/osszevet.mjs <eredmeny.json> <alapvonal.json> [<előző alapvonal.json>]
// Kimenet: JSON a döntéssel; kilépési kód 0 = mehet (zold | nem-rosszabb), 1 = piros.
//
// A szabály (Csilla, 2026-10-07, Q1/Q3 — docs/decisions/2026-10-07-c4-vedett-main.md):
//   mehet, ha minden bukás benne van az alapvonal „bukasok” listájában, minden kimaradt próba a „kimaradhat” listában,
//   és az alapvonal maga ép (minden sornak van legalább 15 betűs oka és dátuma, nincs kétszer ugyanaz).
//   Ha a vizsgált változat BŐVÍTETTE az alapvonalat, attól még mehet — de az üzenet hangosan kimondja.
//   Ha egy alapvonalbeli próba már zöld, az nem piros: „kivehető” jelzést kap.
// Azonosító-minta: a sor végi „*” bármit helyettesít (pl. egy egész fájl kimaradt próbái).
import { readFileSync } from "node:fs";

const [eredmenyUt, alapUt, elozoUt] = process.argv.slice(2);
if (!eredmenyUt || !alapUt) { console.error("használat: osszevet.mjs <eredmeny.json> <alapvonal.json> [<előző alapvonal>]"); process.exit(2); }

const eredmeny = JSON.parse(readFileSync(eredmenyUt, "utf8"));
const olvas = (ut) => { try { return JSON.parse(readFileSync(ut, "utf8")); } catch { return null; } };
const alap = olvas(alapUt);
const elozo = elozoUt ? olvas(elozoUt) : null;

const piros = [];
const jelzes = [];

// 1. az alapvonal épsége
if (!alap || !Array.isArray(alap.bukasok) || !Array.isArray(alap.kimaradhat)) piros.push("az alapvonal hiányzik vagy nem érvényes (tools/kapu/ismert-bukasok.json)");
const bukasok = alap?.bukasok ?? [];
const kimaradhat = alap?.kimaradhat ?? [];
const latott = new Set();
for (const s of [...bukasok, ...kimaradhat]) {
  if (typeof s.azonosito !== "string" || !s.azonosito) { piros.push("alapvonal: azonosító nélküli sor"); continue; }
  if (latott.has(s.azonosito)) piros.push(`alapvonal: kétszer szerepel: ${s.azonosito}`);
  latott.add(s.azonosito);
  if (typeof s.ok !== "string" || s.ok.trim().length < 15) piros.push(`alapvonal: nincs érdemi oka (≥ 15 betű): ${s.azonosito}`);
  if (typeof s.datum !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(s.datum)) piros.push(`alapvonal: nincs dátuma: ${s.azonosito}`);
}

const illik = (minta, id) => (minta.endsWith("*") ? id.startsWith(minta.slice(0, -1)) : minta === id);
const benne = (lista, id) => lista.some((s) => illik(s.azonosito, id));

// 2. az eredmény
const tesztek = eredmeny.tesztek ?? [];
if ((eredmeny.hianyzo_kimenet ?? []).length) piros.push(`nem adott eredményt: ${eredmeny.hianyzo_kimenet.join(", ")}`);
if (tesztek.filter((t) => !t.azonosito.startsWith("ellenoriz::")).length === 0) piros.push("egyetlen próba sem futott le");
const ujBukas = tesztek.filter((t) => t.allapot === "bukik" && !benne(bukasok, t.azonosito));
const ujKimarad = tesztek.filter((t) => t.allapot === "kimarad" && !benne(kimaradhat, t.azonosito));
for (const t of ujBukas) piros.push(`új hiba: ${t.azonosito}`);
for (const t of ujKimarad) piros.push(`új kimaradt próba: ${t.azonosito}`);

// 3. jelzések (nem pirosak)
const allapotok = new Map(tesztek.map((t) => [t.azonosito, t.allapot]));
const javult = bukasok.filter((s) => !s.azonosito.endsWith("*") && allapotok.get(s.azonosito) === "zold").map((s) => s.azonosito);
const eltunt = bukasok.filter((s) => !s.azonosito.endsWith("*") && !allapotok.has(s.azonosito)).map((s) => s.azonosito);
if (javult.length) jelzes.push(`${javult.length} ismert hiba már zöld — kivehető az alapvonalból`);
if (eltunt.length) jelzes.push(`${eltunt.length} alapvonal-sorhoz nincs már próba`);
let bovult = [];
if (elozo && Array.isArray(elozo.bukasok)) {
  const regi = new Set([...(elozo.bukasok ?? []), ...(elozo.kimaradhat ?? [])].map((s) => s.azonosito));
  bovult = [...bukasok, ...kimaradhat].filter((s) => !regi.has(s.azonosito)).map((s) => `${s.azonosito} — ${s.ok}`);
  if (bovult.length) jelzes.push(`AZ ALAPVONAL BŐVÜLT ${bovult.length} sorral (ez a változat tette bele)`);
}

const szam = (x) => tesztek.filter((t) => t.allapot === x && !t.azonosito.startsWith("ellenoriz::")).length;
const dontes = piros.length ? "piros" : tesztek.some((t) => t.allapot !== "zold") ? "nem-rosszabb" : "zold";
console.log(JSON.stringify({
  dontes,
  probak: { osszes: szam("zold") + szam("bukik") + szam("kimarad"), zold: szam("zold"), bukik: szam("bukik"), kimarad: szam("kimarad") },
  piros, jelzes, javult, eltunt, bovult,
  uj_hibak: ujBukas.map((t) => ({ azonosito: t.azonosito, uzenet: t.uzenet })),
}, null, 2));
process.exit(piros.length ? 1 : 0);
