// Kiférés-próba (F-3 alapja): tíz egyre hosszabb főcímpár a Zavar recepten.
// Mindegyiket KÉTSZER készíti el, két külön indított böngészőben (ugyanazzal a kirajzolóval),
// és összeveti: a két kép képpontra egyezik-e, és a sortörések ugyanazok-e.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { PNG } from "pngjs";
import { Marka, Recept, Tartalom, illeszt, MERO_SZKRIPT, meresOsszeallit, type IllesztesEredmeny } from "@km/vizual-core";

const itt = dirname(fileURLToPath(import.meta.url));
const ref = join(itt, "referencia");
const ki = join(itt, "kimenet", "kifer");
mkdirSync(ki, { recursive: true });
const CHROME = process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const marka = Marka.parse(JSON.parse(readFileSync(join(ref, "marka-transportlocal.json"), "utf8")));
const recept = Recept.parse(JSON.parse(readFileSync(join(itt, "../../packages/vizual-receptek/receptek/recept-zavar.json"), "utf8")));
const alap = JSON.parse(readFileSync(join(ref, "tartalom-zavar.json"), "utf8"));
const szovegek = JSON.parse(readFileSync(join(ref, "probaszovegek.json"), "utf8")) as { n: number; ro: string; hu: string; rovid: { ro: string; hu: string } | null }[];
const betuCim = (f: string) => "file://" + join(ref, "betuk", f);

async function kor(jel: string) {
  const b = await chromium.launch({ executablePath: CHROME });
  const lap = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  const ered: { n: number; e: IllesztesEredmeny; kep: string }[] = [];
  for (const sz of szovegek) {
    const t = structuredClone(alap);
    t.mezok.focim = { elsodleges: sz.ro, masodlagos: sz.hu };
    t.rovid = sz.rovid ? { focim: { elsodleges: sz.rovid.ro, masodlagos: sz.rovid.hu } } : {};
    const tartalom = Tartalom.parse(t);
    const ut = join(ki, `${jel}-${sz.n}.html`);
    const mero = {
      async mer(html: string) {
        writeFileSync(ut, html);
        await lap.goto("file://" + ut);
        await lap.evaluate(() => document.fonts.ready);
        return meresOsszeallit((await lap.evaluate(MERO_SZKRIPT)) as Parameters<typeof meresOsszeallit>[0], marka.betuk);
      },
    };
    const e = await illeszt(marka, recept, tartalom, mero, { betuCim });
    const kep = join(ki, `${jel}-${sz.n}.png`);
    await lap.screenshot({ path: kep, clip: { x: 0, y: 0, width: 1080, height: 1350 } });
    ered.push({ n: sz.n, e, kep });
  }
  await b.close();
  return ered;
}

const A = await kor("a");
const B = await kor("b");
const sorok: string[] = [];
let mindEgyezik = true;
for (let i = 0; i < A.length; i++) {
  const a = A[i]!, b = B[i]!;
  const pa = PNG.sync.read(readFileSync(a.kep)), pb = PNG.sync.read(readFileSync(b.kep));
  let elter = 0;
  for (let j = 0; j < pa.data.length; j++) if (pa.data[j] !== pb.data[j]) elter++;
  const tor = (e: IllesztesEredmeny) =>
    e.meres.elemek.filter((x) => x.mezo === "focim").map((x) => `${x.nyelv}:${x.sorok} sor/${x.meret_px}px`).join(", ");
  const egyezik = elter === 0 && tor(a.e) === tor(b.e);
  if (!egyezik) mindEgyezik = false;
  const lep = a.e.lepesek.filter((l) => !l.startsWith("[")).join("; ") || "—";
  sorok.push(`| ${a.n} | ${tor(a.e)} | ${lep} | ${a.e.osszeallitas.kepalairas.join(" / ") || "—"} | ${a.e.problemak.map((p) => p.reszlet).join("; ") || "elfér"} | ${egyezik ? "EGYEZIK" : `ELTÉR (${elter} bájt)`} |`);
}
const md = `| # | főcím (mérve) | illesztés | képaláírásba | maradt | két külön kirajzolás |\n|---|---|---|---|---|---|\n${sorok.join("\n")}\n`;
writeFileSync(join(ki, "eredmeny.md"), md);
console.log(md);
console.log(mindEgyezik ? "MIND A TÍZ EGYEZIK" : "VAN ELTÉRÉS");
