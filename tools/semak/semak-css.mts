// A három séma teljes :root tokenkészlete EGY fájlban, a Design számára (2026-09-21, SEMA-MAGYARAZAT.md).
// A forrás a kód: a közös alap (tema-alap.json) + a séma 25 tokenje, a szarmaztat() ugyanúgy, ahogy a lap feje kapja.
// Futtatás a tárhely gyökeréből:  npx tsx tools/semak/semak-css.mts > design/semak/semak.css
// Kézzel NE szerkeszd a kimenetet — a sémák értéke a packages/design-system/src/semak.ts-ben él.
import { SEMAK, egyesit, teljesTokenek, TemaDefinicio } from "../../packages/design-system/src/index.ts";
import alap from "../../packages/design-system/src/tema-alap.json" with { type: "json" };

const alapTokenek = TemaDefinicio.parse(alap).tokens;
const sorok: string[] = [
  "/* GENERÁLT FÁJL — kézzel ne szerkeszd. Forrás: packages/design-system/src/semak.ts + tema-alap.json + szarmaztat().",
  "   Újragenerálás: npx tsx tools/semak/semak-css.mts > design/semak/semak.css",
  "   Használat a rajzon: <html data-sema=\"vilagos\"> — a három blokk ugyanazokat a tokenneveket adja. */",
];
for (const s of SEMAK) {
  const t = teljesTokenek(egyesit(alapTokenek, s.tokenek));
  const sel = s.kod === "ejkek" ? `:root, [data-sema="${s.kod}"]` : `[data-sema="${s.kod}"]`;
  sorok.push("", `/* ${s.nev.hu} — ${s.leiras.hu} */`, `${sel} {`);
  for (const [k, v] of Object.entries(t)) sorok.push(`  ${k}: ${v};`);
  sorok.push("}");
}
console.log(sorok.join("\n"));
