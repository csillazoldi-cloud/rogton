// R-16 K7 (TERV §2-K7 „kepgyar POST /svg-png … with a probe/smoke like K6's nevlogo-fust.ts”, gepezet 10): a honlap SVG logója → PNG,
// a VALÓDI képgyártón (HTTP) és a VALÓDI Chromiummal. A képgyártónak futnia kell (node apps/kepgyar/src/szerver.ts).
//  1. Egy színes, csak viewBox-os SVG → 200 image/png, 1200 széles, a magasság az arányból, a sarok átlátszó, a közepe a logó színe.
//  2. Szélesség kérve (400) → 400 széles; width/height px-ben, viewBox nélkül → az arány azokból.
//  3. Szkript az SVG-ben: NEM fut (a szkript pirosra festené a téglalapot — a képpont a festék eredeti színe marad).
//  4. Külső hivatkozás (kép + stíluslap egy helyi kiszolgálóra): a kiszolgálóhoz kérés NEM érkezik.
//  5. Rossz bemenet (nem SVG data URL, <svg> nélküli szöveg, hibás XML) → 400 ERVENYTELEN_TARTALOM.
// Futtatás:  KEPGYAR=http://127.0.0.1:8601 CHROMIUM=<chrome> node apps/kepgyar/probak/svg-png-fust.ts [kimeneti-mappa]
import { createServer } from "node:http";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright-core";

const KEPGYAR = process.env["KEPGYAR"] ?? "http://127.0.0.1:8601";
const ki = process.argv[2];
let hiba = 0;
const baj = (s: string) => { hiba++; console.log("HIBA:", s); };
const ok = (s: string) => console.log("rendben:", s);

// a „külső” kiszolgáló: ha bármi idáig ér, az hiba
let kulsoKeres = 0;
const kulso = createServer((q, v) => { kulsoKeres++; console.log("  külső kérés:", q.url); v.writeHead(200, { "content-type": "image/png" }); v.end(); });
await new Promise<void>((r) => kulso.listen(0, "127.0.0.1", () => r()));
const kPort = (kulso.address() as { port: number }).port;

const b64 = (s: string) => "data:image/svg+xml;base64," + Buffer.from(s, "utf8").toString("base64");
async function keres(adat: unknown, szelesseg?: number): Promise<{ statusz: number; tipus: string; test: Buffer }> {
  const v = await fetch(`${KEPGYAR}/svg-png`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(szelesseg ? { adat, szelesseg } : { adat }) });
  return { statusz: v.status, tipus: v.headers.get("content-type") ?? "", test: Buffer.from(await v.arrayBuffer()) };
}

// a PNG mérése a böngészőben: méret, a sarok alfája, a közép színe
const b = await chromium.launch(process.env["CHROMIUM"] ? { executablePath: process.env["CHROMIUM"] } : {});
const mero = await b.newPage();
const merd = (png: Buffer) =>
  mero.evaluate(async (src) => {
    const i = new Image(); i.src = src; await i.decode();
    const c = document.createElement("canvas"); c.width = i.naturalWidth; c.height = i.naturalHeight;
    const x = c.getContext("2d")!; x.drawImage(i, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data;
    const kozep = ((Math.floor(c.height / 2) * c.width) + Math.floor(c.width / 2)) * 4;
    return { w: c.width, h: c.height, sarok: d[3]!, kozep: [d[kozep]!, d[kozep + 1]!, d[kozep + 2]!, d[kozep + 3]!] };
  }, "data:image/png;base64," + png.toString("base64"));
if (ki) mkdirSync(ki, { recursive: true });
const ment = (nev: string, png: Buffer) => { if (ki) writeFileSync(join(ki, nev), png); };

// 1. színes, viewBox (4:1), ékezetes cím a <title>-ben
const logo = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 100"><title>Ördögh Ősz Árpád Kft.</title>`
  + `<rect x="100" y="20" width="200" height="60" rx="12" fill="#a4471f"/><circle cx="50" cy="50" r="30" fill="#e3a857"/></svg>`;
{
  const r = await keres(b64(logo));
  if (r.statusz !== 200 || !r.tipus.startsWith("image/png")) baj(`1. státusz ${r.statusz} ${r.tipus} ${r.test.toString().slice(0, 200)}`);
  else {
    const m = await merd(r.test);
    ment("svg-png-1200.png", r.test);
    if (m.w !== 1200 || m.h !== 300) baj(`1. méret ${m.w}×${m.h} ≠ 1200×300`);
    if (m.sarok !== 0) baj(`1. a sarok nem átlátszó (${m.sarok})`);
    if (Math.abs(m.kozep[0]! - 0xa4) > 3 || Math.abs(m.kozep[1]! - 0x47) > 3 || Math.abs(m.kozep[2]! - 0x1f) > 3 || m.kozep[3] !== 255) baj(`1. a közép színe ${m.kozep}`);
    else ok(`1. 1200×300, átlátszó sarok, közép #a4471f (${r.test.byteLength} bájt)`);
  }
}
// 2. kért szélesség; px width/height viewBox nélkül (%-kódolt data URL)
{
  const r = await keres(b64(logo), 400);
  const m = r.statusz === 200 ? await merd(r.test) : null;
  if (!m || m.w !== 400 || m.h !== 100) baj(`2a. ${r.statusz} ${m?.w}×${m?.h}`); else ok("2a. szelesseg 400 → 400×100");
  const px = `<svg xmlns="http://www.w3.org/2000/svg" width="300px" height="300px"><rect width="300" height="300" fill="#17745e"/></svg>`;
  const r2 = await keres("data:image/svg+xml;charset=utf-8," + encodeURIComponent(px));
  const m2 = r2.statusz === 200 ? await merd(r2.test) : null;
  if (!m2 || m2.w !== 1200 || m2.h !== 1200) baj(`2b. ${r2.statusz} ${m2?.w}×${m2?.h}`); else { ok("2b. %-kódolt, 300px × 300px → 1200×1200"); ment("svg-png-negyzet.png", r2.test); }
}
// 3–4. szkript + külső hivatkozások
{
  const gonosz = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 200 100">`
    + `<style>@import url("http://127.0.0.1:${kPort}/stilus.css");</style>`
    + `<rect id="r" width="200" height="100" fill="#1e3a8a"/>`
    + `<image href="http://127.0.0.1:${kPort}/kep.png" xlink:href="http://127.0.0.1:${kPort}/kep2.png" width="50" height="50"/>`
    + `<script>document.getElementById("r").setAttribute("fill","#ff0000");fetch("http://127.0.0.1:${kPort}/szkript");</script></svg>`;
  const r = await keres(b64(gonosz));
  if (r.statusz !== 200) baj(`3. státusz ${r.statusz} ${r.test.toString().slice(0, 200)}`);
  else {
    const m = await merd(r.test);
    ment("svg-png-szkript.png", r.test);
    if (m.kozep[0]! > 60 || m.kozep[2]! < 100) baj(`3. a szkript lefutott? közép ${m.kozep}`); else ok(`3. a szkript nem futott (közép ${m.kozep.slice(0, 3)} = #1e3a8a)`);
  }
  await new Promise((r) => setTimeout(r, 800));
  if (kulsoKeres !== 0) baj(`4. a külső kiszolgáló ${kulsoKeres} kérést kapott`); else ok("4. külső kiszolgáló: 0 kérés");
}
// 5. rossz bemenetek
for (const [nev, adat] of [["png data URL", "data:image/png;base64,iVBORw0KGgo="], ["nincs <svg>", b64("<html><body>nem logó</body></html>")], ["hibás XML", b64("<svg xmlns='http://www.w3.org/2000/svg'><rect></svg")], ["nem szöveg", 42]] as const) {
  const r = await keres(adat);
  if (r.statusz !== 400) baj(`5. ${nev}: ${r.statusz}`); else ok(`5. ${nev}: 400 ${r.test.toString().slice(0, 60)}`);
}

await b.close();
kulso.close();
console.log(hiba ? `\n${hiba} HIBA` : "\nsvg-png füstpróba: minden rendben");
process.exit(hiba ? 1 : 0);
