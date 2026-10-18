// node osszesit.mjs <mappa> [részletes] — az audit összesítése: típusonként, útvonalanként, és a leggyakoribb (elem, szöveg) párok
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
const [M, RESZ] = process.argv.slice(2);
const sorok = readdirSync(M + "/r").map((f) => JSON.parse(readFileSync(`${M}/r/${f}`, "utf8")));
const tip = {}, ut = {}, par = {}; let hiba = 0, ossz = 0;
for (const j of sorok) { if (j.hiba) hiba++; for (const t of j.talalatok) { ossz++; tip[t.tipus] = (tip[t.tipus] ?? 0) + 1; ut[j.ut] = (ut[j.ut] ?? 0) + 1; const k = `${t.tipus} | ${j.ut} | ${t.hol.split(" > ").slice(-2).join(" > ")} | ${t.szoveg.slice(0, 40)} | ${t.adat ?? ""}`.slice(0, 230); (par[k] ??= { db: 0, pl: [] }).db++; if (par[k].pl.length < 3) par[k].pl.push(`${j.ny}/${j.w}/${j.m}`); } }
console.log(`kombináció: ${sorok.length} · hibás betöltés: ${hiba} · találat: ${ossz}`);
console.log("típus:", JSON.stringify(tip));
console.log("útvonal:", JSON.stringify(Object.fromEntries(Object.entries(ut).sort((a, b) => b[1] - a[1]))));
const lista = Object.entries(par).sort((a, b) => b[1].db - a[1].db);
console.log("különböző (típus, elem, szöveg):", lista.length);
for (const [k, v] of lista.slice(0, Number(RESZ ?? 60))) console.log(v.db, k, v.pl.join(" "));
writeFileSync(M + "/osszesites.json", JSON.stringify({ kombinacio: sorok.length, hibas_betoltes: hiba, talalat: ossz, tipus: tip, utvonal: ut }, null, 1));
