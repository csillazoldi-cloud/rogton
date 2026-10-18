// R-16 K5: a fájl végén a betűk felismerése és a cél–típus szabály.
// a) hat fejléc felismerése + ismeretlen; b) SVG BOM-mal és bevezető fehér közzel is "svg".
import { describe, expect, it } from "vitest";
import { BETU_MAX_MERET_BAJT, KITERJESZTES, MIME, fajlEllenoriz, tipusFelismer } from "../src/index.js";
import {
  gifFej,
  ismeretlenFej,
  jpgFej,
  pdfFej,
  pngFej,
  svgSzoveg,
  webpFej,
} from "./segedek";

describe("tipusFelismer", () => {
  it("PNG", () => {
    expect(tipusFelismer(pngFej())).toBe("png");
  });
  it("JPG", () => {
    expect(tipusFelismer(jpgFej())).toBe("jpg");
  });
  it("WebP", () => {
    expect(tipusFelismer(webpFej())).toBe("webp");
  });
  it("PDF", () => {
    expect(tipusFelismer(pdfFej())).toBe("pdf");
  });
  it("GIF", () => {
    expect(tipusFelismer(gifFej())).toBe("gif");
  });
  it("SVG", () => {
    expect(tipusFelismer(svgSzoveg())).toBe("svg");
  });
  it("ismeretlen", () => {
    expect(tipusFelismer(ismeretlenFej())).toBe("ismeretlen");
  });

  it("SVG BOM-mal", () => {
    const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
    const svg = svgSzoveg();
    const ossz = new Uint8Array(bom.length + svg.length);
    ossz.set(bom, 0);
    ossz.set(svg, bom.length);
    expect(tipusFelismer(ossz)).toBe("svg");
  });

  it("SVG bevezető fehér közzel", () => {
    expect(tipusFelismer(svgSzoveg("\n   \t"))).toBe("svg");
  });

  it("SVG <?xml kezdettel", () => {
    const s = '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"></svg>';
    expect(tipusFelismer(new TextEncoder().encode(s))).toBe("svg");
  });
});

// R-16 K5 (TERV 1.5, §2-K5 Self-test): a betűfájlok a fejükről; a woff (1.0) és a ttc felismert, de a szabály elutasítja (lásd lent).
const fej = (...b: number[]) => { const u = new Uint8Array(64); u.set(b, 0); return u; };
const ascii4 = (s: string) => [...s].map((c) => c.charCodeAt(0));
describe("tipusFelismer — betűk (R-16 K5)", () => {
  it("TrueType: 00 01 00 00 és a régi Apple 'true'", () => {
    expect(tipusFelismer(fej(0x00, 0x01, 0x00, 0x00))).toBe("ttf");
    expect(tipusFelismer(fej(...ascii4("true")))).toBe("ttf");
  });
  it("OpenType (CFF): 'OTTO'", () => {
    expect(tipusFelismer(fej(...ascii4("OTTO")))).toBe("otf");
  });
  it("WOFF2: 'wOF2'; WOFF 1.0 és gyűjtemény: felismert, külön néven", () => {
    expect(tipusFelismer(fej(...ascii4("wOF2")))).toBe("woff2");
    expect(tipusFelismer(fej(...ascii4("wOFF")))).toBe("woff");
    expect(tipusFelismer(fej(...ascii4("ttcf")))).toBe("ttc");
  });
});

describe("fajlEllenoriz — cél és típus párja (R-16 K5)", () => {
  const ttf = fej(0x00, 0x01, 0x00, 0x00), otf = fej(...ascii4("OTTO")), woff2 = fej(...ascii4("wOF2"));
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  it("betű a betu célra: ttf · otf · woff2 átmegy", () => {
    expect(fajlEllenoriz({ meret: 100, fej: ttf }, { cel: "betu" })).toEqual({ ok: true, ertek: { tipus: "ttf" } });
    expect(fajlEllenoriz({ meret: 100, fej: otf }, { cel: "betu" })).toEqual({ ok: true, ertek: { tipus: "otf" } });
    expect(fajlEllenoriz({ meret: 100, fej: woff2 }, { cel: "betu" })).toEqual({ ok: true, ertek: { tipus: "woff2" } });
  });
  it("woff 1.0 és ttc a betu célra sem megy át", () => {
    expect(fajlEllenoriz({ meret: 100, fej: fej(...ascii4("wOFF")) }, { cel: "betu" })).toEqual({ ok: false, hiba: "TIPUS_NEM_ENGEDETT" });
    expect(fajlEllenoriz({ meret: 100, fej: fej(...ascii4("ttcf")) }, { cel: "betu" })).toEqual({ ok: false, hiba: "TIPUS_NEM_ENGEDETT" });
  });
  it("betű logónak (és cél nélkül) nem megy át; kép betűnek nem megy át", () => {
    expect(fajlEllenoriz({ meret: 100, fej: ttf }, { cel: "logo" })).toEqual({ ok: false, hiba: "TIPUS_NEM_ENGEDETT" });
    expect(fajlEllenoriz({ meret: 100, fej: woff2 })).toEqual({ ok: false, hiba: "TIPUS_NEM_ENGEDETT" });
    expect(fajlEllenoriz({ meret: 100, fej: png }, { cel: "betu" })).toEqual({ ok: false, hiba: "TIPUS_NEM_ENGEDETT" });
    // a régi célok változatlanok
    expect(fajlEllenoriz({ meret: 100, fej: png }, { cel: "logo" })).toEqual({ ok: true, ertek: { tipus: "png" } });
  });
  it("a betű korlátja 10 MB (gepezet 8): pontosan 10 MB átmegy, egy bájttal több nem", () => {
    expect(BETU_MAX_MERET_BAJT).toBe(10 * 1024 * 1024);
    expect(fajlEllenoriz({ meret: BETU_MAX_MERET_BAJT, fej: ttf }, { cel: "betu" }).ok).toBe(true);
    expect(fajlEllenoriz({ meret: BETU_MAX_MERET_BAJT + 1, fej: ttf }, { cel: "betu" })).toEqual({ ok: false, hiba: "TUL_NAGY" });
  });
  it("a kiszolgálás MIME-je és kiterjesztése", () => {
    expect([MIME.ttf, MIME.otf, MIME.woff2]).toEqual(["font/ttf", "font/otf", "font/woff2"]);
    expect([KITERJESZTES.ttf, KITERJESZTES.otf, KITERJESZTES.woff2]).toEqual(["ttf", "otf", "woff2"]);
  });
});
