// G5 (Rögtön, 2026-10-18): az alkalmazás ikonkészlete a » jelből (a gyorsmedia-favicon geometriája: két ferde háromszög,
// skewX(-12), neonzöld #D0FF2C tintán #0A0A0A). Egy fej nélküli Chromium rajzolja PNG-be; a favicon.ico a 16 és 32 px-es PNG-ből
// készül (PNG-t tartalmazó ICO). Futtatás a tárhely gyökeréből:
//   node tools/kepernyokep/ikonok.mjs                 (a Playwright saját Chromiuma)
//   CHROMIUM=/út/a/chrome node tools/kepernyokep/ikonok.mjs
// Kimenet: apps/web/public/r18/ikon/*.png és apps/web/public/favicon.ico (felülírja őket).
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const GYOKER = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const KI = join(GYOKER, "apps/web/public/r18/ikon");
const TINTA = "#0A0A0A", NEON = "#D0FF2C";
const JEL = (szin) => `<g transform="skewX(-12) translate(6,0)"><polygon points="28,30 28,70 62,50" fill="${szin}"/><polygon points="49,30 49,70 83,50" fill="${szin}"/></g>`;
/** kerek: lekerekített csempe (fül, PWA); teljes: kitöltött négyzet (iOS és a maszkolható ikon maga kerekít); arany: a jel mérete */
function svg({ hatter, jel, kerek, arany = 1 }) {
  const t = (1 - arany) * 50;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">` +
    `<rect x="0" y="0" width="100" height="100" ${kerek ? 'rx="22"' : ""} fill="${hatter}"/>` +
    `<g transform="translate(${t},${t}) scale(${arany})">${JEL(jel)}</g></svg>`;
}
const KESZLET = [
  ["ikon-sotet-32.png", 32, { hatter: TINTA, jel: NEON, kerek: true }],
  ["ikon-sotet-192.png", 192, { hatter: TINTA, jel: NEON, kerek: true }],
  ["ikon-sotet-512.png", 512, { hatter: TINTA, jel: NEON, kerek: true }],
  ["ikon-vilagos-32.png", 32, { hatter: NEON, jel: TINTA, kerek: true }],
  ["ikon-vilagos-192.png", 192, { hatter: NEON, jel: TINTA, kerek: true }],
  ["ikon-vilagos-512.png", 512, { hatter: NEON, jel: TINTA, kerek: true }],
  ["apple-touch-icon.png", 180, { hatter: TINTA, jel: NEON, kerek: false, arany: 0.9 }],
  // a maszkolható ikon biztonsági zónája a közép 80 %-a: a jel 0,8-szoros
  ["ikon-maszkolhato-512.png", 512, { hatter: TINTA, jel: NEON, kerek: false, arany: 0.8 }],
  ["_favicon-16.png", 16, { hatter: TINTA, jel: NEON, kerek: true }],
  ["_favicon-32.png", 32, { hatter: TINTA, jel: NEON, kerek: true }],
];

mkdirSync(KI, { recursive: true });
const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const lap = await b.newPage();
const png = {};
for (const [nev, meret, beall] of KESZLET) {
  await lap.setViewportSize({ width: meret, height: meret });
  await lap.setContent(`<html><body style="margin:0;background:transparent">${svg(beall).replace('width="100" height="100"', `width="${meret}" height="${meret}"`)}</body></html>`);
  const kep = await lap.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: meret, height: meret } });
  png[nev] = kep;
  if (!nev.startsWith("_")) writeFileSync(join(KI, nev), kep);
  console.log(`${nev} ${meret}×${meret} ${kep.length} bájt`);
}
await b.close();

// favicon.ico: ICONDIR + 2 ICONDIRENTRY + a két PNG (a böngészők a PNG-s ICO-t ismerik)
const kepek = [[16, png["_favicon-16.png"]], [32, png["_favicon-32.png"]]];
const fej = Buffer.alloc(6 + 16 * kepek.length);
fej.writeUInt16LE(0, 0); fej.writeUInt16LE(1, 2); fej.writeUInt16LE(kepek.length, 4);
let eltolas = fej.length;
kepek.forEach(([m, k], i) => {
  const o = 6 + 16 * i;
  fej.writeUInt8(m, o); fej.writeUInt8(m, o + 1); fej.writeUInt8(0, o + 2); fej.writeUInt8(0, o + 3);
  fej.writeUInt16LE(1, o + 4); fej.writeUInt16LE(32, o + 6); fej.writeUInt32LE(k.length, o + 8); fej.writeUInt32LE(eltolas, o + 12);
  eltolas += k.length;
});
writeFileSync(join(GYOKER, "apps/web/public/favicon.ico"), Buffer.concat([fej, ...kepek.map(([, k]) => k)]));
console.log("favicon.ico (16 + 32 px)");
