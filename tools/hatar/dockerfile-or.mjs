// Dockerfile-őr (T-19, 2026-09-12): a két Dockerfile függőség-rétege kézzel sorolja a csomagok package.json-jait, hogy a `pnpm install`
// a forrás másolása előtt futhasson. Ha egy új csomag kimarad, a kép fordítása „Can't resolve …"-vel bukik — ma kétszer (a web és a
// bemutató doboz). Ez az őr összeveti: minden `packages/*`, amitől az alkalmazás (átmenetileg is) függ, szerepel-e a Dockerfile-jában.
//   node tools/hatar/dockerfile-or.mjs        — az `ellenoriz` lánc része
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const GYOKER = process.cwd();
const csomagok = new Map(); // "@rogton/x" → "packages/x"
for (const mappa of ["packages"]) {
  const { readdirSync } = await import("node:fs");
  for (const d of readdirSync(join(GYOKER, mappa))) {
    const pj = join(GYOKER, mappa, d, "package.json");
    if (existsSync(pj)) csomagok.set(JSON.parse(readFileSync(pj, "utf8")).name, `${mappa}/${d}`);
  }
}
/** Az alkalmazás összes workspace-függősége, átmenetileg (a csomagok egymásra épülnek). */
function fuggosegek(pj) {
  const lat = new Set(); const sor = [pj];
  while (sor.length) {
    const p = sor.pop(); const j = JSON.parse(readFileSync(p, "utf8"));
    for (const nev of Object.keys({ ...(j.dependencies ?? {}), ...(j.devDependencies ?? {}) })) {
      const ut = csomagok.get(nev);
      if (ut && !lat.has(ut)) { lat.add(ut); sor.push(join(GYOKER, ut, "package.json")); }
    }
  }
  return [...lat].sort();
}
const ALKALMAZASOK = [
  { nev: "web", pj: "apps/web/package.json", dockerfile: "Dockerfile" },
];
const hibak = [];
for (const a of ALKALMAZASOK) {
  const df = readFileSync(join(GYOKER, a.dockerfile), "utf8");
  for (const ut of fuggosegek(join(GYOKER, a.pj))) {
    if (!df.includes(`COPY ${ut}/package.json`)) hibak.push(`${a.dockerfile}: hiányzik „COPY ${ut}/package.json ${ut}/" (a(z) ${a.nev} függ tőle)`);
  }
}
if (hibak.length) { console.error("✖ Dockerfile-őr:\n  " + hibak.join("\n  ")); process.exit(1); }
console.log(`✔ Dockerfile-őr: a két Dockerfile függőség-rétege teljes (${csomagok.size} csomag ismert).`);
