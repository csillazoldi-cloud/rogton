// R-16 K6 (TERV §2-K6, 1.6; gepezet 13) — a képgyártó névlogó-gépe: a kérésből (név, stílus, három szín, cím-betű, saját betű bájtja)
// a négy változat SVG-je (vizual-core `nevlogoSvg`, a fontkit-portunkkal) és PNG-je. A PNG a Chromiumban készül az SVG-ből `<img>`-ként
// (nincs szkript, nincs hálózat), átlátszó háttérrel (`omitBackground`), 1200 px szélesen; a négyzetes 1024 × 1024.
// A képgyártó semmit nem tárol: a web menti el a fájlokat (apps/web/arculat/nevlogo.ts).
import { NEVLOGO_VALTOZATOK, nevlogoSvg, type NevlogoKeres, type NevlogoValtozat } from "@rogton/vizual-core";
import { betuLanc, betuUtvonal } from "./betu-utvonal.ts";

export const NEVLOGO_PNG_SZELES = 1200;
export const NEGYZETES_PNG = 1024;

export type NevlogoKimenet = {
  svg: string;
  /** PNG, base64 */
  png: string;
  szelesseg: number;
  magassag: number;
  tinta: string;
  szinek: string[];
};

/** Az SVG → PNG kirajzoló (a szerver a saját Chromium-lapjával adja; a füstpróba a sajátjával). */
export type PngRajzolo = (svg: string, szelesseg: number, magassag: number) => Promise<Buffer>;

/** A kirajzoló lap HTML-je: egy `<img>` az SVG adat-URL-jével, átlátszó lapon. */
export function pngLap(svg: string, w: number, h: number): string {
  const src = "data:image/svg+xml;base64," + Buffer.from(svg, "utf8").toString("base64");
  return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:transparent;}img{display:block;width:${w}px;height:${h}px;}</style></head><body><img alt="" src="${src}"></body></html>`;
}

/** A négy változat. `mappa`: a munkatér-betűk mappája (tools/vizual/referencia/betuk-munkater). */
export async function nevlogoValtozatok(k: NevlogoKeres, mappa: string, png: PngRajzolo): Promise<Record<NevlogoValtozat, NevlogoKimenet>> {
  const port = betuUtvonal(betuLanc(mappa, k.betu, k.sajat_betu ?? null));
  const ki = {} as Record<NevlogoValtozat, NevlogoKimenet>;
  for (const valtozat of NEVLOGO_VALTOZATOK) {
    const e = nevlogoSvg({ nev: k.nev, stilus: k.stilus, szinek: k.szinek, valtozat }, port);
    const w = valtozat === "negyzetes" ? NEGYZETES_PNG : NEVLOGO_PNG_SZELES;
    const h = valtozat === "negyzetes" ? NEGYZETES_PNG : Math.max(1, Math.round((w * e.magassag) / e.szelesseg));
    const kep = await png(e.svg, w, h);
    ki[valtozat] = { svg: e.svg, png: kep.toString("base64"), szelesseg: e.szelesseg, magassag: e.magassag, tinta: e.tinta, szinek: e.szinek };
  }
  return ki;
}
