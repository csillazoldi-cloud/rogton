// Próba-kirajzoló: recept + márka + tartalom → PNG, és összevetés a mintaképpel.
// Használat: node kepgyar.ts [--rogzitett] [--ki <mappa>] zavar allitas adatsavok
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { PNG } from "pngjs";
import { Marka, Recept, Tartalom, osszeallit, uresValasztas, illeszt, MERO_SZKRIPT, meresOsszeallit, ellenoriz, szabalyCsalad, ELLENORZOK, NEM_DONTHETO, type Szabaly, type LapMeres } from "@rogton/vizual-core";

const itt = dirname(fileURLToPath(import.meta.url));
const ref = join(itt, "referencia");
const args = process.argv.slice(2);
const rogzitett = args.includes("--rogzitett");
const kiI = args.indexOf("--ki");
const ki = kiI >= 0 ? args[kiI + 1]! : join(itt, "kimenet");
const receptek = args.filter((a, i) => !a.startsWith("--") && (kiI < 0 || i !== kiI + 1));
mkdirSync(ki, { recursive: true });

// A forráslapokon álló főcímméret — csak a --rogzitett próbához (a kompozíció bizonyítása).
const FORRAS_FOCIM: Record<string, { meret: number; sorkoz: number }> = {
  zavar: { meret: 72, sorkoz: 80 },
  allitas: { meret: 92, sorkoz: 100 },
  adatsavok: { meret: 72, sorkoz: 80 },
};
const MINTA: Record<string, string> = { zavar: "Zavar", allitas: "Main", adatsavok: "AdatSavok" };

const marka = Marka.parse(JSON.parse(readFileSync(join(ref, "marka-transportlocal.json"), "utf8")));
const szabalyok = (JSON.parse(readFileSync(join(itt, "../../packages/vizual-receptek/szabalyok.json"), "utf8")) as { szabalyok: Szabaly[] }).szabalyok;
const bongeszo = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const lap = await bongeszo.newPage({ viewport: { width: 1080, height: 1350 } });

for (const r of receptek) {
  const recept = Recept.parse(JSON.parse(readFileSync(join(itt, "../../packages/vizual-receptek/receptek", `recept-${r}.json`), "utf8")));
  const tartalom = Tartalom.parse(JSON.parse(readFileSync(join(ref, `tartalom-${r}.json`), "utf8")));
  const szerepek: Record<string, LapMeres["elemek"][number]["szerep"]> = {};
  for (const m of recept.mezok) {
    if (typeof m.szerep === "string") szerepek[m.azonosito] = m.szerep as "hang";
    else if (m.szerep && typeof m.szerep === "object") for (const [k, v] of Object.entries(m.szerep)) szerepek[`${m.azonosito}/${k}`] = v as "hang";
  }
  const betuCim = (f: string) => "file://" + join(ref, "betuk", f);
  const htmlUt = join(ki, `${r}.html`);
  const mero = {
    async mer(html: string) {
      writeFileSync(htmlUt, html);
      await lap.goto("file://" + htmlUt);
      await lap.evaluate(() => document.fonts.ready);
      return meresOsszeallit((await lap.evaluate(MERO_SZKRIPT)) as Parameters<typeof meresOsszeallit>[0], marka.betuk);
    },
  };
  let meres: LapMeres;
  if (rogzitett) {
    const v = uresValasztas();
    v.rogzitett = { focim: FORRAS_FOCIM[r]! };
    const o = osszeallit(marka, recept, tartalom, v, { betuCim });
    if (o.hibak.length) console.log(r, "HIBÁK:", JSON.stringify(o.hibak));
    meres = await mero.mer(o.html);
  } else {
    const e = await illeszt(marka, recept, tartalom, mero, { betuCim });
    if (e.osszeallitas.hibak.length) console.log(r, "HIBÁK:", JSON.stringify(e.osszeallitas.hibak));
    console.log(`${r}: illesztés — ${e.lepesek.length ? e.lepesek.join("; ") : "nem kellett"}${e.problemak.length ? " · MARADT: " + e.problemak.map((x) => x.mezo + " " + x.reszlet).join("; ") : ""}`);
    if (e.osszeallitas.kepalairas.length) console.log(`${r}: képaláírásba: ${e.osszeallitas.kepalairas.join(" | ")}`);
    meres = e.meres;
  }
  const kep = join(ki, `${r}${rogzitett ? "-rogzitett" : ""}.png`);
  await lap.screenshot({ path: kep, clip: { x: 0, y: 0, width: 1080, height: 1350 } });
  writeFileSync(join(ki, `${r}${rogzitett ? "-rogzitett" : ""}-meres.json`), JSON.stringify(meres, null, 1));
  const e = ellenoriz(szabalyok, { meres, formatum: "feed45", parameter: (n) => marka.szabaly_parameterek[n], kitoltott: Object.keys(tartalom.mezok), receptCsalad: szabalyCsalad(String((recept.recept as Record<string, unknown>)["csalad"] ?? "")) }, ELLENORZOK, NEM_DONTHETO);
  writeFileSync(join(ki, `${r}${rogzitett ? "-rogzitett" : ""}-ellenorzes.json`), JSON.stringify(e, null, 1));
  console.log(`${r}: túllépés ${meres.tullepes_px} px · tiltás ${e.talalatok.filter((t) => t.szigorusag === "tiltas").length} · figyelmeztetés ${e.talalatok.filter((t) => t.szigorusag === "figyelmeztetes").length} · képen kívüli/el nem dönthető ${e.kivul.length} · ellenőrző nélkül ${e.nincs_ellenorzo.length}`);
  const a = PNG.sync.read(readFileSync(kep));
  const b = PNG.sync.read(readFileSync(join(ref, "minta", `${MINTA[r]}.png`)));
  let elter = 0;
  const diff = new PNG({ width: a.width, height: a.height });
  for (let i = 0; i < a.data.length; i += 4) {
    const d = Math.abs(a.data[i]! - b.data[i]!) + Math.abs(a.data[i + 1]! - b.data[i + 1]!) + Math.abs(a.data[i + 2]! - b.data[i + 2]!);
    const x = d > 30;
    if (x) elter++;
    diff.data[i] = x ? 255 : a.data[i]! >> 2;
    diff.data[i + 1] = x ? 0 : a.data[i + 1]! >> 2;
    diff.data[i + 2] = x ? 0 : a.data[i + 2]! >> 2;
    diff.data[i + 3] = 255;
  }
  writeFileSync(join(ki, `${r}${rogzitett ? "-rogzitett" : ""}-elteres.png`), PNG.sync.write(diff));
  console.log(`${r}: eltérő képpont ${elter} / ${a.width * a.height} (${((100 * elter) / (a.width * a.height)).toFixed(3)} %)`);
}
await bongeszo.close();
