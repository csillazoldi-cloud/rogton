// VZ-2 próba: a hét helyzet mindhárom méretben, két arculattal → PNG-k és egy áttekintő lap (a rajz mellé).
//   node tools/vizual/helyzet-proba.ts <kimenet-mappa>
import { chromium } from "playwright-core";
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { HELYZETEK, MERETEK, HELYZET_MERO, helyzetIllesztes, HelyzetArculat, HelyzetTartalom, type Meret, type HelyzetMeres } from "../../packages/vizual-core/src/index.ts";

const itt = dirname(fileURLToPath(import.meta.url));
const KI = process.argv[2] ?? "helyzet-proba";
mkdirSync(KI, { recursive: true });
// a lap about:blank-ből töltődik (setContent), onnan a file:// betű nem tölthető — adat-URL-ként adjuk
const betuCim = (f: string) => "data:font/woff2;base64," + readFileSync(join(itt, "referencia/betuk-munkater", f)).toString("base64");
const CEGEK = {
  tibor: HelyzetArculat.parse({ nev: "KÖVESI TÉRKŐ", fo: "#2f5d50", hatter: "#f1ede4", betu: "archivo" }),
  piroska: HelyzetArculat.parse({ nev: "Piroska Pékség", fo: "#b4532a", hatter: "#fbf1e2", betu: "public-sans" }),
};
const SZ: Record<string, Record<string, object>> = {
  tibor: {
    kesz: { cim: "Kész a Fenyő utcai udvar", sor: "180 m² gránit kocka, 6 nap alatt." },
    akcio: { szam: "−15%", cim: "a szürke kockakőre", sor: "május 31-ig" },
    uj: { cim: "Új: fagyálló antik kocka", sor: "Már raktáron, Ákosfalván." },
    hir: { cim: "Szabad időpontok júniusra", sor: "Hívj, és megnézzük az udvarod.", mikor: "június 2–27." },
    tudtad: { cim: "Télen ne sózd a térkövet.", sor: "Homok vagy fűrészpor kíméli a felületet." },
    esemeny: { cim: "Nyílt nap a telepen", hol: "Ákosfalva, Fő út 12.", mikor: "október 12., szombat 9–14" },
    szam: { szam: "120", cim: "udvart raktunk le 2025-ben." },
  },
  piroska: {
    kesz: { cim: "Megújult a Fő téri boltunk", sor: "Hétfőtől újra nyitva, várunk!" },
    akcio: { szam: "−20%", cim: "minden kenyérre", sor: "este 6 után" },
    uj: { cim: "Friss kürtőskalács 7-től", sor: "Minden reggel, amíg a készlet tart." },
    hir: { cim: "Hétfőn zárva vagyunk", sor: "Kedden reggel 6-tól várunk.", mikor: "szeptember 29., hétfő" },
    tudtad: { cim: "A kovászos kenyér 3 napig friss.", sor: "Vászonzacskóban tárold, ne nejlonban." },
    esemeny: { cim: "Kóstoló a Fő téren", hol: "Szászrégen, Fő tér", mikor: "október 5., vasárnap 8–12" },
    szam: { szam: "18", cim: "éve sütünk Szászrégenben." },
  },
};
const b = await chromium.launch(process.env["CHROMIUM"] ? { executablePath: process.env["CHROMIUM"] } : {});
const lap = await b.newPage({ viewport: { width: 1080, height: 1920 } });
const mer = async (html: string) => {
  await lap.setContent(html, { waitUntil: "load" });
  await lap.evaluate(() => document.fonts.ready);
  return (await lap.evaluate(HELYZET_MERO)) as HelyzetMeres;
};
const sorok: string[] = [];
for (const h of HELYZETEK)
  for (const ceg of ["tibor", "piroska"] as const)
    for (const m of Object.keys(MERETEK) as Meret[]) {
      const t = HelyzetTartalom.parse(SZ[ceg]![h]);
      const e = await helyzetIllesztes(h, m, t, CEGEK[ceg], { betuCim, nyelv: "hu" }, mer);
      await lap.setViewportSize({ width: 1080, height: MERETEK[m].h });
      const f = `${h}-${ceg}-${m}.png`;
      await lap.screenshot({ path: join(KI, f), clip: { x: 0, y: 0, width: 1080, height: MERETEK[m].h } });
      sorok.push(`${f} fok=${e.fok} nemFer=${e.nemFer} tul=${e.meres.tul.join(",")}`);
    }
writeFileSync(join(KI, "eredmeny.txt"), sorok.join("\n"));
console.log(sorok.join("\n"));
await b.close();
