// c14 + c15 füstpróba: a „Kész munka” minta példafotója — melyik fotó (szakmánként, semleges tartalék), mikor kerül a tartalomba,
// és mikor NEM (saját fotó, előtte–utána, más helyzet).
// Futtatás: pnpm --filter @km/kepgyar fust-minta   (docker és böngésző nélkül)
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MINTA_FOTOK, MINTA_KATEGORIAK, MINTA_MAPPA, mintaFotoAdat, mintaFotoval, mintaKategoria } from "../src/minta-foto.ts";

let db = 0;
const ok = (f: () => void) => { f(); db++; };
const adatUrl = (fajl: string) => `data:image/jpeg;base64,${readFileSync(join(MINTA_MAPPA, fajl)).toString("base64")}`;

// —— c15: a kategória ——
ok(() => assert.equal(mintaKategoria("vendeglatas"), "vendeglatas"));
ok(() => assert.equal(mintaKategoria("kert"), "kert"));
ok(() => assert.equal(mintaKategoria("Vendeglatas"), "semleges")); // a lista zárt, kisbetűs
ok(() => assert.equal(mintaKategoria("pizzeria"), "semleges"));
ok(() => assert.equal(mintaKategoria(undefined), "semleges"));
ok(() => assert.equal(mintaKategoria(7), "semleges"));

// —— c15: a fotó kategóriánként ——
const semleges = adatUrl(MINTA_FOTOK.semleges!);
for (const k of MINTA_KATEGORIAK) {
  const fajl = MINTA_FOTOK[k];
  ok(() => assert.equal(mintaFotoAdat(k), fajl ? adatUrl(fajl) : semleges, `${k}: ${fajl ?? "semleges"}`));
}
ok(() => assert.equal(mintaFotoAdat("epites"), adatUrl("kesz-minta-terko.jpg")));
ok(() => assert.equal(mintaFotoAdat("szepseg"), adatUrl("kesz-minta-szepseg.jpg")));
// muhely / kozlekedes / kert: 10-08-ig nem volt fotó → semleges volt; c15b (10-08 16:55) óta saját fotó — az elvárás ezért változott
ok(() => assert.equal(mintaFotoAdat("muhely"), adatUrl("kesz-minta-muhely.jpg")));
ok(() => assert.equal(mintaFotoAdat("kozlekedes"), adatUrl("kesz-minta-kozlekedes.jpg")));
ok(() => assert.equal(mintaFotoAdat("kert"), adatUrl("kesz-minta-kert.jpg")));
// c30 F11: a fesztivál fotója (a web fesztiválnál `rendezveny`-t küld)
ok(() => assert.equal(mintaKategoria("rendezveny"), "rendezveny"));
ok(() => assert.equal(mintaFotoAdat("rendezveny"), adatUrl("kesz-minta-rendezveny.jpg")));
// régi kérés kategória nélkül (a régi web, ill. kategória nélküli tárolt példák) → semleges
ok(() => assert.equal(mintaFotoAdat(undefined), semleges));
// a kategóriához megadott fájl hiányzik a lemezről → semleges, hiba nélkül
ok(() => assert.equal(mintaFotoAdat("bolt", MINTA_MAPPA, { bolt: "nincs-ilyen.jpg", semleges: MINTA_FOTOK.semleges! }), semleges));
// a semleges is hiányzik → null (a minta a régi csíkos hellyel készül)
ok(() => assert.equal(mintaFotoAdat("bolt", MINTA_MAPPA, { bolt: "nincs-ilyen.jpg", semleges: "ez-sincs.jpg" }), null));
// minden fotó kicsi (adat-URL < 600 kB)
for (const f of new Set(Object.values(MINTA_FOTOK))) ok(() => assert.ok(adatUrl(f!).length < 600_000, f));

// —— c14: mikor kerül a tartalomba ——
const foto = semleges;
const alap = { cim: "Elkészült a legújabb munkánk", sor: "Nézd meg, milyen lett!" };
ok(() => assert.deepEqual(mintaFotoval("kesz", undefined, alap, foto), { ...alap, fotok: [{ adat: foto }] }));
const sajat = { cim: "Elkészült a Rózsák terei járda", sor: "Új térkő, két nap alatt." };
ok(() => assert.deepEqual(mintaFotoval("kesz", sajat, alap, foto), { ...sajat, fotok: [{ adat: foto }] }));
const vanFoto = { ...sajat, fotok: [{ adat: "data:image/png;base64,AAAA" }] };
ok(() => assert.equal(mintaFotoval("kesz", vanFoto, alap, foto), vanFoto));
const ep = { ...sajat, elotte_utana: true };
ok(() => assert.equal(mintaFotoval("kesz", ep, alap, foto), ep));
// R-15 c5 2. kör (Csilla 2026-10-10 18:08): az „Újdonság” minta is kap példafotót — az elvárás ezért változott (régen: undefined)
const ujAlap = { cim: "Új: fagyálló antik kocka", sor: "Hol kapható, mióta." };
ok(() => assert.deepEqual(mintaFotoval("uj", undefined, ujAlap, foto), { ...ujAlap, fotok: [{ adat: foto }] }));
ok(() => assert.equal(mintaFotoval("uj", vanFoto, ujAlap, foto), vanFoto));
ok(() => assert.equal(mintaFotoval("akcio", sajat, alap, foto), sajat));
ok(() => assert.equal(mintaFotoval("kesz", undefined, alap, null), undefined));
ok(() => assert.equal(mintaFotoval("kesz", "szoveg", alap, foto), "szoveg"));

console.log(`minta-foto füstpróba: ${db}/${db} rendben`);
