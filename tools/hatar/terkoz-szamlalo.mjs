// Térköz-számláló (R-0 / F-1): megszámolja, hány helyen használja a kód a skála fokait (`var(--ter-N)`), és
// az eredményt az `apps/web/app/tema/ter-hasznalat.json` fájlba írja — ezt mutatja a Theme-lap Térköz-csoportja
// („--ter-4 · 142 helyen”). Az ATADO 8. pontja szerinti egyetlen új gépezet. Futtatás: `pnpm terkoz` (az `ellenoriz` része).
// `--ellenoriz` kapcsolóval nem ír, csak elbukik, ha a tárolt szám elavult — így a lapon nem hal el észrevétlenül egy fok.
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from "node:fs";
import { join, sep } from "node:path";

const GYOKER = process.cwd();
const KIVETEL = [/node_modules/, /\.next\//, /_torolni\//, /\/design\//, /\/probak\//];
const CEL = join(GYOKER, "apps", "web", "app", "tema", "ter-hasznalat.json");

function fajlok(mappa, ki = []) {
  for (const n of readdirSync(mappa)) {
    const p = join(mappa, n), pp = p.split(sep).join("/") + "/";
    if (KIVETEL.some((k) => k.test(pp))) continue;
    if (statSync(p).isDirectory()) fajlok(p, ki);
    else if (/\.(css|tsx|ts)$/.test(n)) ki.push(p);
  }
  return ki;
}

const db = Object.fromEntries(Array.from({ length: 15 }, (_, i) => [`--ter-${i}`, 0]));
let fajlDb = 0;
for (const f of ["apps", "packages"].flatMap((m) => fajlok(join(GYOKER, m)))) {
  const s = readFileSync(f, "utf8");
  fajlDb++;
  for (const t of s.matchAll(/var\(--ter-(\d{1,2})\)/g)) { const k = `--ter-${t[1]}`; if (k in db) db[k]++; }
}
const uj = JSON.stringify(db, null, 2) + "\n";
if (process.argv.includes("--ellenoriz")) {
  const regi = existsSync(CEL) ? readFileSync(CEL, "utf8") : "";
  if (regi !== uj) { console.error(`✖ térköz-számláló: a ${CEL} elavult — futtasd: pnpm terkoz`); process.exit(1); }
  console.log(`✔ térköz-számláló: a használati számok naprakészek (${fajlDb} fájl).`);
} else {
  writeFileSync(CEL, uj);
  console.log(`✔ térköz-számláló: ${Object.values(db).reduce((a, b) => a + b, 0)} használat ${fajlDb} fájlban → ter-hasznalat.json`);
}
