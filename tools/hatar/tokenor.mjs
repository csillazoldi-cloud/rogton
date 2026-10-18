// Tokenőr — R-11: komponensbe nem éghet szín, betű, betűméret, lekerekítés. Csak var(--…) jöhet.
// Átnézi az apps/**/app és packages/**/src alatti .css/.tsx/.ts fájlokat (a design-system csomag kivétel: ott születnek a tokenek).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const GYOKER = process.cwd();
const KIVETEL = [/packages\/design-system\//, /packages\/vizual-core\//, /node_modules/, /\.next\//, /adatbazis\/migraciok\//, /\/probak\//, /apps\/web\/onboarding\/szinek\.ts\//, /packages\/arculat-core\/src\/szettek\.ts\//]; // szettek.ts (R-16 K3, 2026-09-30): a hat bevált színszett ADAT (egy ügyfél képeinek alapszínei), nem a felületet festi; szinek.ts (2026-09-28): a cég honlapjának színeit ELEMZI (adat), nem a felületet festi; a próbák témaértékeket küldenek adatként, nem felületet festenek; a vizual-core a FIÓK ARCULATÁBÓL rajzol képet (a színek, betűk adatként jönnek), nem a felületet festi
const SZABALYOK = [
  { nev: "szín (hex)", minta: /#[0-9a-fA-F]{3,8}\b/g },
  { nev: "szín (rgb/hsl)", minta: /\b(rgba?|hsla?|color-mix)\(/g },
  { nev: "betűcsalád", minta: /font-family\s*:(?!\s*var\()/g },
  { nev: "betűméret", minta: /font-size\s*:(?!\s*var\()/g },
  { nev: "lekerekítés", minta: /border-radius\s*:(?!\s*var\()/g },
  { nev: "betűvastagság", minta: /font-weight\s*:(?!\s*var\()/g },
  // R-0 (F-1, 2026-09-12): TÉRKÖZ SEM éghet be — margin/padding/gap értékében nem állhat px-szám, csak var(--ter-N).
  // A csupasz 0 is tilos ("a kódban sem marad csupasz 0"): var(--ter-0) a neve. Alakérték (width/height), keret, lekerekítés nem ide tartozik.
  { nev: "térköz (px)", minta: /(?<![\w-])(?:margin|padding)(?:-(?:top|right|bottom|left|inline|block)(?:-(?:start|end))?)?\s*:\s*[^;{}]*?(?<![\w.(-])\d+(?:\.\d+)?px/g, csakCss: true },
  { nev: "térköz (px)", minta: /(?<![\w-])(?:row-|column-|grid-)?gap\s*:\s*[^;{}]*?(?<![\w.(-])\d+(?:\.\d+)?px/g, csakCss: true },
  { nev: "térköz (csupasz 0)", minta: /(?<![\w-])(?:margin|padding|gap)(?:-[a-z-]+)?\s*:\s*[^;{}]*?(?<![\w.(-])0(?![\w.%])/g, csakCss: true },
];

function fajlok(mappa, ki = []) {
  for (const n of readdirSync(mappa)) {
    const p = join(mappa, n);
    if (KIVETEL.some((k) => k.test(p.split(sep).join("/") + "/"))) continue; // Windowson is / a minta (2026-09-12, a Dellen mérve)
    if (statSync(p).isDirectory()) fajlok(p, ki);
    else if (/\.(css|tsx|ts)$/.test(n)) ki.push(p);
  }
  return ki;
}

const celok = ["apps", "packages"].map((m) => join(GYOKER, m));
let hibak = 0, db = 0;
for (const f of celok.flatMap((m) => fajlok(m))) {
  db++;
  const szoveg = readFileSync(f, "utf8");
  for (const sz of SZABALYOK) {
    if (sz.csakCss && !f.endsWith(".css")) continue; // a térköz-szabály a stíluslapokra vonatkozik (a tsx inline stílusa a rajz adata lehet)
    for (const t of szoveg.matchAll(sz.minta)) {
      const sor = szoveg.slice(0, t.index).split("\n").length;
      const sorSzoveg = szoveg.split("\n")[sor - 1] ?? "";
      if (/\/\/\s*tokenőr:\s*ok|\/\*\s*tokenőr:\s*ok/.test(sorSzoveg)) continue; // indokolt kivétel, megjegyzéssel
      console.error(`  hiba ${sz.nev}: ${relative(GYOKER, f)}:${sor}  ${sorSzoveg.trim().slice(0, 80)}`);
      hibak++;
    }
  }
}
if (hibak) { console.error(`✖ tokenőr: ${hibak} beégetett érték ${db} fájlban.`); process.exit(1); }
console.log(`✔ tokenőr: nincs beégetett szín/betű/méret/lekerekítés (${db} fájl).`);
