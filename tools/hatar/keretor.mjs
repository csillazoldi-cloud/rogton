// Keretőr — F9-K1 (Vilmos szabálya 2026-09-16): MINDEN belépett lap ugyanabba a keretbe kerül (km-lap-keret).
// 1. szabály: minden <main> className-jében szerepel a km-lap-keret (kivéve a nyilvános Nyitolap.tsx).
// 2. szabály: a lapok saját osztályai (a <main>-en álló km-… tokenek) nem adhatnak keret-tulajdonságot
//             (max-width, width, margin, margin-*, padding, padding-*) — azt csak a km-lap-keret adhatja.
// 3. szabály (F9-K1/6): minden km-hf-fulsor első gyermeke km-lap-keret-sav.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const GYOKER = process.cwd();
const KIVETEL = [/node_modules/, /\.next\//];
const NYILVANOS = /Nyitolap\.tsx$/; // a nyilvános nyitólap nem belépett lap

const KERET_OSZTALY = "km-lap-keret";
const KERET_TULAJDONSAGOK = [
  { nev: "max-width", minta: /(?<![\w-])max-width\s*:/ },
  { nev: "width", minta: /(?<![\w-])width\s*:/ },
  { nev: "margin", minta: /(?<![\w-])margin\s*:/ },
  { nev: "margin-*", minta: /(?<![\w-])margin-[a-z-]+\s*:/ },
  { nev: "padding", minta: /(?<![\w-])padding\s*:/ },
  { nev: "padding-*", minta: /(?<![\w-])padding-[a-z-]+\s*:/ },
];

function fajlok(mappa, vegzodes, ki = []) {
  let be;
  try { be = readdirSync(mappa); } catch { return ki; }
  for (const n of be) {
    const p = join(mappa, n);
    const normal = p.split(sep).join("/") + "/";
    if (KIVETEL.some((k) => k.test(normal))) continue;
    if (statSync(p).isDirectory()) fajlok(p, vegzodes, ki);
    else if (vegzodes.test(n)) ki.push(p);
  }
  return ki;
}

// A <main …> sorok és a bennük lévő className literál/sablon km-… tokenjei.
function mainSorok(szoveg) {
  const sorok = szoveg.split("\n");
  const talalatok = [];
  for (let i = 0; i < sorok.length; i++) {
    const sor = sorok[i];
    if (!/<main\b/.test(sor)) continue;
    // a <main …> nyitó tag: a soron belül a className="…" vagy className={`…`} részt keressük
    const classNameM = sor.match(/className=(?:"([^"]*)"|\{`([^`]*)`\})/);
    const className = classNameM ? (classNameM[1] ?? classNameM[2] ?? "") : "";
    const tokenek = [...className.matchAll(/\b(km-[a-z0-9-]+)\b/g)].map((m) => m[1]);
    talalatok.push({ sor: i + 1, sorSzoveg: sor, className, tokenek });
  }
  return talalatok;
}

// A <main>-en álló km-… osztályok (a keret kivételével) — ezekre vonatkozik a 2. szabály.
// F9-K1/b (MÉRVE 2026-09-16: a Megjelenés lap 680-ra szűkült a <main> KÖRÜLI div miatt): a <main>-t körbefogó
// elemek osztályai is ide tartoznak — a tsx-ben a <main sora fölött a kisebb behúzású <… className="…"> sorok, a return-ig.
function lapOsztalyok(tsxFajlok) {
  const halmaz = new Set();
  for (const f of tsxFajlok) {
    const szoveg = readFileSync(f, "utf8");
    const sorok = szoveg.split("\n");
    for (const m of mainSorok(szoveg)) {
      for (const t of m.tokenek) if (t !== KERET_OSZTALY) halmaz.add(t);
      let behuzas = m.sorSzoveg.match(/^\s*/)[0].length;
      for (let i = m.sor - 2; i >= 0; i--) {
        const s = sorok[i];
        if (s.trim() === "") continue;
        const b = s.match(/^\s*/)[0].length;
        if (b >= behuzas) continue;
        behuzas = b;
        if (/^\s*(return\b|export\b|function\b|const\b|\}|\))/.test(s)) break;
        if (!/^\s*<[A-Za-z]/.test(s)) continue;
        const cm = s.match(/className=(?:"([^"]*)"|\{`([^`]*)`\})/);
        if (!cm) continue;
        for (const t of [...(cm[1] ?? cm[2] ?? "").matchAll(/\b(km-[a-z0-9-]+)\b/g)]) if (t[1] !== KERET_OSZTALY) halmaz.add(t[1]);
      }
    }
  }
  return halmaz;
}

// Egy css-szabályblokk szelektorának utolsó egyszerű eleme pontosan az osztály-e?
function szelektorEgyezik(szelektor, osztaly) {
  // a blokk szelektorát vesszőnként bontjuk; minden rész utolsó egyszerű elemét nézzük
  for (const resz of szelektor.split(",")) {
    const utolso = resz.trim().split(/\s+/).pop() ?? "";
    if (utolso.includes("::")) continue; // ::before/::after díszelem, nem a lap kerete
    // pontosan .osztaly, utána nem jöhet - vagy betű
    const m = utolso.match(/\.([a-zA-Z0-9_-]+)/g);
    if (!m) continue;
    for (const p of m) {
      const nev = p.slice(1);
      if (nev === osztaly) return true;
    }
  }
  return false;
}

// Egyszerű css-szabályblokk-bejáró: visszaadja a { szelektor, sor, torzs } hármasokat.
function cssBlokkok(szoveg) {
  const blokkok = [];
  const sorok = szoveg.split("\n");
  let i = 0;
  while (i < sorok.length) {
    const sor = sorok[i];
    const nyit = sor.indexOf("{");
    if (nyit === -1) { i++; continue; }
    const szelektor = sor.slice(0, nyit).trim();
    // @media / @supports: a benne lévő blokkokat külön kezeljük — egyszerűen tovább lépünk
    if (szelektor.startsWith("@")) { i++; continue; }
    // a blokk törzsét a záró }-ig gyűjtjük
    let mely = 1;
    let j = i;
    let torzs = sor.slice(nyit + 1);
    // az egysoros szabály ({ … }) még ugyanazon a soron zárul — a maradékban is számoljuk a zárójeleket
    for (const ch of torzs) { if (ch === "{") mely++; else if (ch === "}") mely--; }
    if (mely === 0) torzs = torzs.slice(0, torzs.lastIndexOf("}"));
    while (mely > 0 && j + 1 < sorok.length) {
      j++;
      const s = sorok[j];
      for (const ch of s) { if (ch === "{") mely++; else if (ch === "}") mely--; }
      if (mely > 0) torzs += "\n" + s;
      else torzs += "\n" + s.slice(0, s.lastIndexOf("}"));
    }
    blokkok.push({ szelektor, sor: i + 1, torzs });
    i = j + 1;
  }
  return blokkok;
}

const tsxFajlok = fajlok(join(GYOKER, "apps", "web", "app"), /\.tsx$/);
const cssFajlok = fajlok(join(GYOKER, "apps", "web", "app"), /\.css$/);

let hibak = 0;
let mainDb = 0;

// 1. szabály: minden <main> a keretben (kivéve Nyitolap.tsx)
for (const f of tsxFajlok) {
  if (NYILVANOS.test(f)) continue;
  const szoveg = readFileSync(f, "utf8");
  for (const m of mainSorok(szoveg)) {
    mainDb++;
    if (!m.tokenek.includes(KERET_OSZTALY)) {
      console.error(`  hiba ${relative(GYOKER, f)}:${m.sor} — a <main> nincs a közös keretben (km-lap-keret)`);
      hibak++;
    }
  }
}

// 2. szabály: a lapok saját osztályai nem adhatnak keret-tulajdonságot
const sajatOsztalyok = lapOsztalyok(tsxFajlok);
for (const f of cssFajlok) {
  const szoveg = readFileSync(f, "utf8");
  for (const b of cssBlokkok(szoveg)) {
    for (const osztaly of sajatOsztalyok) {
      if (!szelektorEgyezik(b.szelektor, osztaly)) continue;
      for (const t of KERET_TULAJDONSAGOK) {
        if (t.minta.test(b.torzs)) {
          console.error(`  hiba ${relative(GYOKER, f)}:${b.sor} — a lap saját osztálya (.${osztaly}) keret-tulajdonságot ad (${t.nev}): ezt csak a km-lap-keret adhatja`);
          hibak++;
        }
      }
    }
  }
}

// 3. szabály (F9-K1/6): minden km-hf-fulsor első gyermeke km-lap-keret-sav
for (const f of tsxFajlok) {
  const szoveg = readFileSync(f, "utf8");
  const sorok = szoveg.split("\n");
  for (let i = 0; i < sorok.length; i++) {
    if (!/className="km-hf-fulsor"/.test(sorok[i])) continue;
    // a következő nem üres sorban kell lennie az első <div … km-lap-keret-sav
    let j = i + 1;
    while (j < sorok.length && sorok[j].trim() === "") j++;
    const kov = sorok[j] ?? "";
    if (!/<div\b[^>]*className="[^"]*km-lap-keret-sav/.test(kov)) {
      console.error(`  hiba ${relative(GYOKER, f)}:${i + 1} — a km-hf-fulsor első gyermeke nem km-lap-keret-sav`);
      hibak++;
    }
  }
}

if (hibak) { console.error(`✖ keretőr: ${hibak} sértés.`); process.exit(1); }
console.log(`✔ keretőr: minden lap a közös keretben (${mainDb} main, ${cssFajlok.length} css-fájl).`);
