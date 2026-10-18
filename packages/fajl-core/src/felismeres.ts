// Tartalom szerinti típusfelismerés és az ellenőrzés szabálya — tiszta függvények.
import {
  ALBUM_MAX_MERET_BAJT,
  BETU_MAX_MERET_BAJT,
  KEP_MAX_MERET_BAJT,
  CEL_TIPUSOK,
  FajlTipus,
  FelismertTipus,
  FajlHibaKod,
  MAX_MERET_BAJT,
  type FajlCel,
} from "./host";

export type Eredmeny<T> =
  | { ok: true; ertek: T }
  | { ok: false; hiba: FajlHibaKod };

const FEJ_MAX = 512;

function kezdodo(fej: Uint8Array, minta: number[]): boolean {
  if (fej.length < minta.length) return false;
  for (let i = 0; i < minta.length; i++) {
    if (fej[i] !== minta[i]) return false;
  }
  return true;
}

function ascii(fej: Uint8Array, kezdet: number, hossz: number): string {
  let s = "";
  for (let i = 0; i < hossz; i++) {
    const b = fej[kezdet + i];
    if (b === undefined) return s;
    s += String.fromCharCode(b);
  }
  return s;
}

function svgFejSzoveg(fej: Uint8Array): string {
  const szelet = fej.subarray(0, Math.min(fej.length, FEJ_MAX));
  let szoveg: string;
  try {
    szoveg = new TextDecoder("utf-8", { fatal: false }).decode(szelet);
  } catch {
    szoveg = "";
  }
  // BOM levágása
  if (szoveg.charCodeAt(0) === 0xfeff) {
    szoveg = szoveg.slice(1);
  }
  // vezető fehér köz levágása
  szoveg = szoveg.replace(/^\s+/, "");
  return szoveg;
}

export function tipusFelismer(fej: Uint8Array): FelismertTipus {
  if (kezdodo(fej, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "png";
  }
  if (kezdodo(fej, [0xff, 0xd8, 0xff])) {
    return "jpg";
  }
  if (
    fej.length >= 12 &&
    ascii(fej, 0, 4) === "RIFF" &&
    ascii(fej, 8, 4) === "WEBP"
  ) {
    return "webp";
  }
  if (kezdodo(fej, [0x25, 0x50, 0x44, 0x46, 0x2d])) {
    return "pdf";
  }
  if (kezdodo(fej, [0x47, 0x49, 0x46, 0x38])) {
    return "gif";
  }
  // R-16 K5 (TERV 1.5): betűfájlok a fejükről — 00 01 00 00 vagy "true" → ttf, "OTTO" → otf (CFF), "wOF2" → woff2;
  // a "wOFF" (woff 1.0) és a "ttcf" (gyűjtemény) felismert, de nem engedett.
  if (kezdodo(fej, [0x00, 0x01, 0x00, 0x00]) || ascii(fej, 0, 4) === "true") {
    return "ttf";
  }
  const betuFej = ascii(fej, 0, 4);
  if (betuFej === "OTTO") return "otf";
  if (betuFej === "wOF2") return "woff2";
  if (betuFej === "wOFF") return "woff";
  if (betuFej === "ttcf") return "ttc";
  const szoveg = svgFejSzoveg(fej);
  if (szoveg.startsWith("<?xml") || szoveg.startsWith("<svg")) {
    return "svg";
  }
  if (szoveg.toLowerCase().includes("<svg")) {
    return "svg";
  }
  return "ismeretlen";
}

/**
 * Az ellenőrzés szabálya. R-16 K5 (TERV 1.5): `korlat.cel` megadásával a cél engedett típusai számítanak (`CEL_TIPUSOK`) — betű
 * csak `betu` célra, és `betu` célra csak betű; cél nélkül (és minden más célra) a régi szabály: PNG, JPG, WebP, PDF.
 * A `betu` cél korlátja `BETU_MAX_MERET_BAJT` (gepezet 8), ha a hívó nem ad sajátot.
 */
/** 0.3.0: a cél korlátja — betű 10 MB, posztkép 10 MB, minden más (logó, kézikönyv, referencia, dokumentum) 100 MB.
 *  0.4.0 (c30 F9): albumfotó 2,5 MB. */
export function celMaxMeret(cel?: FajlCel): number {
  return cel === "betu" ? BETU_MAX_MERET_BAJT : cel === "kep" ? KEP_MAX_MERET_BAJT : cel === "album" ? ALBUM_MAX_MERET_BAJT : MAX_MERET_BAJT;
}

/** JPEG SOF-jelölők (alap, kiterjesztett, progresszív, veszteségmentes, aritmetikai) — ezekben áll a kép magassága és szélessége. */
const JPEG_SOF = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

/**
 * 0.4.0 (c30 F9, TERV §6 „Server”): a kép mérete a fejlécéből, a kép dekódolása NÉLKÜL (az alkalmazás dobozában nincs képkönyvtár, és
 * 512 MB a memóriája). JPEG: a szegmenseken lépked a SOF-ig (a nagy EXIF-szegmens is átugorható, ezért a TELJES bájtsort kéri);
 * WebP: a VP8 / VP8L / VP8X darab fejléce. Ha nem olvasható (csonka, hibás, más típus): null — a hívó ezt elutasítja.
 */
export function kepMeret(b: Uint8Array): { szel: number; mag: number } | null {
  if (kezdodo(b, [0xff, 0xd8])) {
    let i = 2;
    while (i + 3 < b.length) {
      if (b[i] !== 0xff) return null;
      let m = b[i + 1]!;
      // kitöltő 0xFF-ek a jelölő előtt
      while (m === 0xff && i + 2 < b.length) { i += 1; m = b[i + 1]!; }
      if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; } // hossz nélküli jelölők
      if (m === 0xd9 || m === 0xda) return null; // a kép vége vagy a képadat jött, SOF nélkül
      if (i + 3 >= b.length) return null;
      const hossz = (b[i + 2]! << 8) | b[i + 3]!;
      if (hossz < 2) return null;
      if (JPEG_SOF.has(m)) {
        if (i + 8 >= b.length) return null;
        const mag = (b[i + 5]! << 8) | b[i + 6]!;
        const szel = (b[i + 7]! << 8) | b[i + 8]!;
        return szel > 0 && mag > 0 ? { szel, mag } : null;
      }
      i += 2 + hossz;
    }
    return null;
  }
  if (b.length >= 30 && ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WEBP") {
    const darab = ascii(b, 12, 4);
    if (darab === "VP8 ") {
      // 3 bájt keret-címke, majd a 9d 01 2a kezdőkód, utána 14 bites szélesség és magasság (a felső 2 bit a nagyítás)
      if (b[23] !== 0x9d || b[24] !== 0x01 || b[25] !== 0x2a) return null;
      const szel = (b[26]! | (b[27]! << 8)) & 0x3fff;
      const mag = (b[28]! | (b[29]! << 8)) & 0x3fff;
      return szel > 0 && mag > 0 ? { szel, mag } : null;
    }
    if (darab === "VP8L") {
      if (b[20] !== 0x2f) return null;
      const bitek = b[21]! | (b[22]! << 8) | (b[23]! << 16) | (b[24]! << 24);
      const szel = (bitek & 0x3fff) + 1;
      const mag = ((bitek >>> 14) & 0x3fff) + 1;
      return { szel, mag };
    }
    if (darab === "VP8X") {
      const szel = (b[24]! | (b[25]! << 8) | (b[26]! << 16)) + 1;
      const mag = (b[27]! | (b[28]! << 8) | (b[29]! << 16)) + 1;
      return { szel, mag };
    }
    return null;
  }
  return null;
}

export function fajlEllenoriz(
  be: { meret: number; fej: Uint8Array },
  korlat?: { maxMeret?: number; cel?: FajlCel },
): Eredmeny<{ tipus: FajlTipus }> {
  if (be.meret <= 0) {
    return { ok: false, hiba: "URES" };
  }
  const max = korlat?.maxMeret ?? celMaxMeret(korlat?.cel);
  if (be.meret > max) {
    return { ok: false, hiba: "TUL_NAGY" };
  }
  const felismert = tipusFelismer(be.fej);
  if (felismert === "svg") {
    return { ok: false, hiba: "SVG_NEM_ENGEDETT" };
  }
  if (felismert === "gif" || felismert === "ismeretlen" || felismert === "woff" || felismert === "ttc") {
    return { ok: false, hiba: "TIPUS_NEM_ENGEDETT" };
  }
  const parsed = FajlTipus.safeParse(felismert);
  if (!parsed.success) {
    return { ok: false, hiba: "TIPUS_NEM_ENGEDETT" };
  }
  // R-16 K5: a cél és a típus párja (cél nélkül a régi, betű előtti szabály — a betű így sosem megy át cél nélkül)
  if (!CEL_TIPUSOK[korlat?.cel ?? "dokumentum"].includes(parsed.data)) {
    return { ok: false, hiba: "TIPUS_NEM_ENGEDETT" };
  }
  return { ok: true, ertek: { tipus: parsed.data } };
}
