// R-16 K6 (TERV §2-K6 Self-test „kepgyar smoke”, gepezet 13): a névlogó a VALÓDI betűfájlokkal és a VALÓDI Chromiummal.
//  1. A három próbanév minden karaktere valódi glif (az azonosító ≠ 0, azaz nem .notdef) — mind az öt beépített betűvel és egy teljes
//     saját TTF-fel (Caladea, OFL, apps/web/probak/betuk); kiírja, melyik fájl adta az ékezeteket (Ő Ș ț ă Ț → latin-ext).
//  2. Chromiummal: a három név × három stílus × négy változat PNG-je — a szélesség 1200 (négyzetes 1024 × 1024), a sarok átlátszó
//     (omitBackground), és van rajta festék. A PNG-k és egy áttekintő lap a megadott mappába kerülnek.
// Futtatás (a tároló gyökeréből):  CHROMIUM=<chrome> node apps/kepgyar/probak/nevlogo-fust.ts [kimeneti-mappa]
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { BETUK, NEVLOGO_STILUSOK, nevlogoSzoveg, type NevlogoKeres } from "@rogton/vizual-core";
import { betuLanc, karakterek } from "../src/betu-utvonal.ts";
import { nevlogoValtozatok, pngLap } from "../src/nevlogo.ts";

const itt = dirname(fileURLToPath(import.meta.url));
const GYOKER = join(itt, "../../..");
const MAPPA = join(GYOKER, "tools/vizual/referencia/betuk-munkater");
const NEVEK = ["Ördögh Ősz Árpád Kft.", "Știință și Țară SRL", "Marosvásárhelyi Építőipari és Térkövező Kft."];
const MELEG = { fo: "#a4471f", masodik: "#e3a857", hatter: "#fbf3e8" };
const ki = process.argv[2];
let hiba = 0;
const baj = (s: string) => { hiba++; console.log("HIBA:", s); };

// ——— 1. glifek ———
const caladea = "data:font/ttf;base64," + readFileSync(join(GYOKER, "apps/web/probak/betuk/Caladea-Regular.ttf")).toString("base64");
const lancok: [string, ReturnType<typeof betuLanc>][] = [
  ...Object.keys(BETUK).map((k) => [k, betuLanc(MAPPA, k)] as [string, ReturnType<typeof betuLanc>]),
  ["sajat:caladea", betuLanc(MAPPA, "sajat:00000000-0000-4000-8000-000000000000", { adat: caladea })],
];
for (const [nev, lanc] of lancok) {
  for (const szoveg of NEVEK.flatMap((n) => [n, nevlogoSzoveg(n)])) {
    const k = karakterek(lanc, szoveg);
    const rossz = k.filter((x) => x.glif === 0);
    if (rossz.length) baj(`${nev}: .notdef — ${rossz.map((x) => x.kar).join(" ")} („${szoveg}”)`);
  }
  const ekezet = karakterek(lanc, "ŐőŰűȘșȚțĂăÂâÎî");
  console.log(`glifek ${nev.padEnd(15)} mind valódi · ékezetek: ${[...new Set(ekezet.map((x) => `${x.kar}←${x.fajl}`))].join(" ")}`);
}

// ——— 2. Chromium: PNG-k ———
const b = await chromium.launch(process.env["CHROMIUM"] ? { executablePath: process.env["CHROMIUM"] } : {});
const lap = await b.newPage();
const png = async (svg: string, w: number, h: number) => {
  await lap.setViewportSize({ width: w, height: h });
  await lap.setContent(pngLap(svg, w, h), { waitUntil: "load" });
  await lap.evaluate(() => document.images[0]?.decode());
  return lap.screenshot({ clip: { x: 0, y: 0, width: w, height: h }, type: "png", omitBackground: true });
};
const mero = await b.newPage();
/** a PNG a böngészőben: méret, a bal felső sarok alfája, a festékes (alfa > 0) képpontok aránya */
const merd = (adat: string) =>
  mero.evaluate(async (src) => {
    const i = new Image();
    i.src = src;
    await i.decode();
    const c = document.createElement("canvas");
    c.width = i.naturalWidth; c.height = i.naturalHeight;
    const x = c.getContext("2d")!;
    x.drawImage(i, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data;
    let festek = 0;
    for (let j = 3; j < d.length; j += 4) if (d[j]! > 0) festek++;
    return { w: c.width, h: c.height, sarok: d[3]!, festek: festek / (c.width * c.height) };
  }, adat);

if (ki) mkdirSync(ki, { recursive: true });
const sorok: string[] = [];
for (const nev of NEVEK) {
  for (const stilus of NEVLOGO_STILUSOK) {
    const k: NevlogoKeres = { nev, stilus, szinek: MELEG, betu: "gelasio" };
    const t0 = Date.now();
    const v = await nevlogoValtozatok(k, MAPPA, png);
    const ido = Date.now() - t0;
    const cellak: string[] = [];
    for (const [valtozat, e] of Object.entries(v)) {
      const m = await merd("data:image/png;base64," + e.png);
      const cel = valtozat === "negyzetes" ? 1024 : 1200;
      if (m.w !== cel) baj(`${nev}/${stilus}/${valtozat}: szélesség ${m.w} ≠ ${cel}`);
      if (valtozat === "negyzetes" && m.h !== 1024) baj(`${nev}/${stilus}/negyzetes: magasság ${m.h}`);
      if (m.sarok !== 0) baj(`${nev}/${stilus}/${valtozat}: a sarok nem átlátszó (${m.sarok})`);
      if (m.festek < 0.03) baj(`${nev}/${stilus}/${valtozat}: alig van festék (${m.festek})`);
      if (/<text|<script/i.test(e.svg)) baj(`${nev}/${stilus}/${valtozat}: <text>/<script> az SVG-ben`);
      const fajl = `${nev.slice(0, 6).normalize("NFD").replace(/[^A-Za-z]/g, "").toLowerCase()}-${stilus}-${valtozat}`;
      if (ki) { writeFileSync(join(ki, fajl + ".png"), Buffer.from(e.png, "base64")); writeFileSync(join(ki, fajl + ".svg"), e.svg); }
      const hatter = valtozat === "sotet" ? MELEG.fo : valtozat === "egyszinu" ? "#ffffff" : MELEG.hatter;
      cellak.push(`<td style="background:${hatter};padding:12px"><img src="data:image/png;base64,${e.png}" style="height:${valtozat === "negyzetes" ? 64 : 48}px;max-width:360px;object-fit:contain"></td>`);
      console.log(`png   ${nev.slice(0, 22).padEnd(22)} ${stilus.padEnd(7)} ${valtozat.padEnd(9)} ${m.w}×${m.h} sarok-alfa ${m.sarok} festék ${(m.festek * 100).toFixed(1)} % · svg ${e.svg.length} b`);
    }
    console.log(`      (${nev.slice(0, 22)} ${stilus}: négy változat ${ido} ms)`);
    sorok.push(`<tr><th style="font:12px sans-serif;text-align:left;padding:8px">${stilus}</th>${cellak.join("")}</tr>`);
  }
}
if (ki) {
  const html = `<!doctype html><meta charset="utf-8"><body style="margin:16px;background:#e9e9e6"><table style="border-collapse:separate;border-spacing:6px">${sorok.join("")}</table></body>`;
  const p = await b.newPage({ viewport: { width: 1500, height: 900 } });
  await p.setContent(html, { waitUntil: "load" });
  await p.screenshot({ path: join(ki, "attekintes.png"), fullPage: true });
}
await b.close();
console.log(hiba ? `\n${hiba} HIBA` : "\nfüstpróba: minden rendben");
process.exit(hiba ? 1 : 0);
