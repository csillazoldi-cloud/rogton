// R-16 K7 (TERV §2-K7, §4 22., §5 gepezet 10): a honlapon talált SVG logó → PNG. Sok cég SVG-ben adja a logóját, a fajl-core viszont
// SVG-t nem fogad (a feltöltésben tilos — egy SVG szkriptet és külső hivatkozást hordozhat). Ezért a képgyártó rasztert csinál belőle:
// a Chromium az SVG-t `<img>`-ként rajzolja — így az SVG-ben lévő szkript NEM fut, és külső erőforrást (kép, betű, stíluslap) NEM tölt be
// (a böngésző képként kezelt SVG-re ezt nem engedi). Második zár: a rajzoló lap külön, hálózat nélküli (offline) környezetben él.
// Tiszta rész (bemenet-ellenőrzés, méret, a lap HTML-je) itt; a böngésző a szerver.ts-ben.

/** Legfeljebb ekkora SVG jöhet (a web 2 MB-ig tölt le, fajl-core KEP_LOGO_MAX_BAJT). */
export const SVG_MAX_BAJT = 2_000_000;
/** Az alapszélesség: mint a névlogó PNG-je (K6), a képre bőven elég. */
export const SVG_PNG_ALAP_SZELES = 1200;
export const SVG_PNG_MIN = 16;
export const SVG_PNG_MAX = 2400;

export type SvgPngKeres = { svg: string; szelesseg: number; magassag: number };
export type SvgPngHiba = { hiba: "ERVENYTELEN_TARTALOM"; reszlet: string };

/** A data URL-ből az SVG szövege (base64 vagy %-kódolt), a kért szélesség és az arányból számolt magasság. */
export function svgPngKeres(nyers: unknown): SvgPngKeres | SvgPngHiba {
  const b = (nyers ?? {}) as { adat?: unknown; szelesseg?: unknown };
  const hiba = (reszlet: string): SvgPngHiba => ({ hiba: "ERVENYTELEN_TARTALOM", reszlet });
  if (typeof b.adat !== "string") return hiba("adat: data URL kell");
  const m = b.adat.match(/^data:image\/svg\+xml(;[^,]*)?,/i);
  if (!m) return hiba("adat: csak data:image/svg+xml");
  const torzs = b.adat.slice(m[0].length);
  let svg: string;
  try {
    svg = /;base64/i.test(m[1] ?? "") ? Buffer.from(torzs, "base64").toString("utf8") : decodeURIComponent(torzs);
  } catch {
    return hiba("adat: nem olvasható");
  }
  if (Buffer.byteLength(svg, "utf8") > SVG_MAX_BAJT) return hiba("adat: túl nagy");
  if (!/<svg[\s>]/i.test(svg)) return hiba("adat: nincs benne <svg>");
  const kert = b.szelesseg === undefined ? SVG_PNG_ALAP_SZELES : Number(b.szelesseg);
  if (!Number.isFinite(kert)) return hiba("szelesseg: szám kell");
  const arany = svgArany(svg);
  let szelesseg = Math.round(Math.min(SVG_PNG_MAX, Math.max(SVG_PNG_MIN, kert)));
  let magassag = Math.round(szelesseg / arany);
  // nagyon magas logó: a magasság is a korláton belül marad (a szélesség csökken)
  if (magassag > SVG_PNG_MAX) { magassag = SVG_PNG_MAX; szelesseg = Math.max(SVG_PNG_MIN, Math.round(SVG_PNG_MAX * arany)); }
  magassag = Math.max(SVG_PNG_MIN, magassag);
  return { svg, szelesseg, magassag };
}

/** Az SVG oldalaránya (szélesség / magasság): a viewBoxból, különben a számmal megadott width/height-ből; ismeretlen → 2 (fekvő logó). */
export function svgArany(svg: string): number {
  const gyoker = svg.match(/<svg\b[^>]*>/i)?.[0] ?? "";
  const vb = gyoker.match(/viewBox\s*=\s*["']\s*([-\d.eE]+)[\s,]+([-\d.eE]+)[\s,]+([\d.eE]+)[\s,]+([\d.eE]+)\s*["']/);
  if (vb) {
    const w = Number(vb[3]), h = Number(vb[4]);
    if (w > 0 && h > 0) return korlatos(w / h);
  }
  const szam = (nev: string) => { const x = gyoker.match(new RegExp(`\\b${nev}\\s*=\\s*["']\\s*([\\d.]+)\\s*(px)?\\s*["']`)); return x ? Number(x[1]) : NaN; };
  const w = szam("width"), h = szam("height");
  if (w > 0 && h > 0) return korlatos(w / h);
  return 2;
}
const korlatos = (a: number) => Math.min(20, Math.max(0.05, a));

/** A rajzoló lap: az SVG `<img>`-ként (NEM beágyazva — beágyazott SVG-ben a szkript futna), átlátszó háttéren, a kért méretre illesztve. */
export function svgPngLap(svg: string, w: number, h: number): string {
  const src = "data:image/svg+xml;base64," + Buffer.from(svg, "utf8").toString("base64");
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'"><style>html,body{margin:0;padding:0;background:transparent;}img{display:block;width:${w}px;height:${h}px;object-fit:contain;}</style></head><body><img alt="" src="${src}"></body></html>`;
}
