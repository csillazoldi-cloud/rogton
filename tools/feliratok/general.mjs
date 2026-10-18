#!/usr/bin/env node
// A Hírfigyelő feliratainak migrációja a KÖZÖS adatfájlokból (E-29).
// Használat: node tools/feliratok/general.mjs <migracio-sorszam> [kimeneti-fajl]
// A `packages/news-monitor-feliratok/feliratok/hf.<nyelv>.json` a forrás; ez a szkript csak ÍR, nem talál ki semmit.
// KORLÁT: a migráció beszúr és FELÜLÍR, de nem TÖRÖL. Ha egy kulcs kikerül az adatfájlból, a törlő sort kézzel kell megírni
// (a szinkron-próba jelzi, ha ilyen kulcs maradt az adatbázisban).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const gyoker = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const NYELVEK = ["hu", "ro", "en"];

function idezojel(szoveg) {
  if (/[\r\n]/.test(szoveg)) {
    throw new Error(`Sortörés a feliratban, ez a migrációban olvashatatlan: ${JSON.stringify(szoveg)}`);
  }
  return `'${szoveg.replaceAll("'", "''")}'`; // SQL-ben az aposztróf duplázva (a visszaperjel a Postgresben önmaga)
}

const sorszam = process.argv[2];
if (!sorszam || !/^\d{4}$/.test(sorszam)) {
  console.error("Használat: node tools/feliratok/general.mjs <migracio-sorszam, 4 jegy> [kimeneti-fajl]");
  process.exit(2);
}

const szotarak = Object.fromEntries(
  NYELVEK.map((ny) => [ny, JSON.parse(readFileSync(join(gyoker, "packages/news-monitor-feliratok/feliratok", `hf.${ny}.json`), "utf-8"))]),
);

const kulcsok = Object.keys(szotarak.hu).sort();
const hianyzo = [];
for (const ny of NYELVEK) {
  for (const k of kulcsok) if (szotarak[ny][k] === undefined) hianyzo.push(`${k} (${ny})`);
}
if (hianyzo.length > 0) {
  console.error(`Hiányzó feliratok:\n  ${hianyzo.join("\n  ")}`);
  process.exit(1);
}

const sorok = [];
for (const k of kulcsok) for (const ny of NYELVEK) sorok.push(`  (${idezojel(k)}, '${ny}', ${idezojel(szotarak[ny][k])})`);

const tartalom = `-- GÉPPEL KÉSZÜLT (E-29): ne szerkeszd kézzel. Forrás: packages/news-monitor-feliratok/feliratok/hf.<nyelv>.json
-- Újrakészítés: node tools/feliratok/general.mjs ${sorszam}
-- ${kulcsok.length} kulcs × ${NYELVEK.length} nyelv = ${sorok.length} sor. A meglévő szöveget felülírja (a kulcs+nyelv az azonosító).
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
${sorok.join(",\n")}
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg";
`;

const kimenet = process.argv[3] ?? join(gyoker, "apps/web/adatbazis/migraciok", `${sorszam}_hirfigyelo_feliratok_kozos.sql`);
if (process.argv[3] === undefined && existsSync(kimenet)) {
  console.error(`Ez a migráció már létezik: ${kimenet}\nA lefutott migrációt nem írjuk felül — adj új sorszámot.`);
  process.exit(1);
}
writeFileSync(kimenet, tartalom, "utf-8");
console.log(`${kimenet}: ${kulcsok.length} kulcs, ${sorok.length} sor.`);
