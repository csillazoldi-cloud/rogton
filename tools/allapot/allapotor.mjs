// Az állapotlap őre (ALLAPOT-SZABALY 4.2) — az `ellenoriz` lánc része: nem lehet kiadni elavult vagy hazudó állapotlappal.
//  1. Frissebb-e a kód, mint a lap? (az apps/, packages/, nas/ alatti utolsó VÉGLEGESÍTETT változás ideje > frissitve → hiba;
//     az allapot.json saját véglegesítése nem számít)
//  2. Gazdátlan szakasz: `folyamatban` szakasz alatt legyen legalább egy `folyamatban` lépés (a lépés kódja a szakasz kódjával kezdődik)
//  3. Hazudó százalék: szazalek 100 csak akkor, ha a szakasz minden lépése kesz
//  4. Séma
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { ellenoriz } from "./sema.mjs";

const GYOKER = process.cwd();
const FAJL = join(GYOKER, "nas", "public", "allapot", "allapot.json");
const d = JSON.parse(readFileSync(FAJL, "utf8"));
const hibak = [];

// 4. séma
hibak.push(...ellenoriz(d).map((h) => `séma: ${h}`));

// 1. a kód frissebb-e a lapnál (git szerint; ha nincs git, kihagyjuk)
try {
  const utolso = execSync('git log -1 --format=%cI -- apps packages nas ":(exclude)nas/public/allapot/allapot.json"', { cwd: GYOKER, encoding: "utf8" }).trim();
  if (utolso && Date.parse(utolso) > Date.parse(d.frissitve) + 5 * 60 * 1000) {
    hibak.push(`a kód frissebb a lapnál: utolsó véglegesítés ${utolso}, a lap ${d.frissitve} — futtasd: pnpm allapot …`);
  }
} catch { /* nincs git — a szabályt nem tudjuk mérni */ }

// 2. és 3. szakaszonként
for (const sz of d.szakaszok) {
  const lepesek = d.lepesek.filter((l) => l.kod === sz.kod || l.kod.startsWith(sz.kod + ".") || (/^F-\d/.test(sz.kod) && new RegExp("^" + sz.kod + "[a-z]").test(l.kod)) /* F-1 ≠ F-10b */);
  // egy Vilmosra váró (rajtad) lépés is gazda: a szakasz nem árva, csak áll — ezt a lap „kell a szavad" bélyege mutatja
  if (sz.allapot === "folyamatban" && lepesek.length && !lepesek.some((l) => l.allapot === "folyamatban" || l.rajtad === true)) {
    hibak.push(`gazdátlan szakasz: ${sz.kod} folyamatban, de egy lépése sem folyamatban`);
  }
  if (sz.szazalek === 100 && lepesek.some((l) => l.allapot !== "kesz")) {
    hibak.push(`hazudó százalék: ${sz.kod} 100%, de van nem kész lépése (${lepesek.filter((l) => l.allapot !== "kesz").map((l) => l.kod).join(", ")})`);
  }
  if (sz.allapot === "kesz" && sz.szazalek !== 100) hibak.push(`${sz.kod}: kesz, de ${sz.szazalek}%`);
}

if (hibak.length) { console.error("✖ állapotőr:\n  " + hibak.join("\n  ")); process.exit(1); }
console.log(`✔ állapotőr: a lap naprakész (${d.frissitve}), ${d.szakaszok.length} szakasz, ${d.lepesek.length} lépés.`);
