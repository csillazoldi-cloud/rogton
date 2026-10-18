// A konnektor: a modul saját szótára és minden port, amit a befogadó ad.
import { z } from "zod";

// R-16 K5 (TERV 1.5, gepezet 8): + a három betűtípus (ttf · otf · woff2) — csak `cel = "betu"` alatt fogadjuk (CEL_TIPUSOK).
// R-16 K6 (TERV 1.6, gepezet 13): + `svg` — CSAK a gép írhatja (a névlogó hordozható mestere, `FajlTar.ment` közvetlenül). Feltöltésben
// továbbra is tilos: a `fajlEllenoriz` az SVG-tartalmat a típus-listától függetlenül `SVG_NEM_ENGEDETT`-tel utasítja el, és egyetlen cél
// `CEL_TIPUSOK`-ában sincs benne; a képre sem kerül (`KEP_LOGO_TIPUSOK` png · jpg · webp).
export const FajlTipus = z.enum(["png", "jpg", "webp", "pdf", "ttf", "otf", "woff2", "svg"]);
export type FajlTipus = z.infer<typeof FajlTipus>;

export const FelismertTipus = z.enum([
  "png",
  "jpg",
  "webp",
  "pdf",
  "svg",
  "gif",
  // R-16 K5: a betűfájlok; a woff (1.0) és a ttc (betűgyűjtemény) felismert, de nem engedett (TIPUS_NEM_ENGEDETT)
  "ttf",
  "otf",
  "woff2",
  "woff",
  "ttc",
  "ismeretlen",
]);
export type FelismertTipus = z.infer<typeof FelismertTipus>;

// R-15 (gepezet 17–19, 2026-09-27): "kep" = a posztokhoz tartozó képek (Kész képeim) — nem arculati anyag
// R-16 K5 (TERV 1.5, gepezet 8): "betu" = a munkatér saját betűfájljai (12e) — a képekre kerülnek, nem „Fájlok”
// c30 F9 (0.4.0, FESZTIVAL-ES-NYELVI-MOD-TERV §1.5, §6): "album" = a helyszíni fotóalbum munkapéldányai (a telefon már kicsinyítette:
// `nagy` ≤ 2048 px, `kicsi` ≤ 512 px). Csak jpg/webp, ≤ 2,5 MB, a képméret a fejlécből ellenőrizve. A befogadó KÜLÖN mappában tartja
// (nem a mentett fájlok között: D7 — 30 nap, mentés nélkül).
export const FajlCel = z.enum(["logo", "kezikonyv", "referencia", "dokumentum", "kep", "betu", "album"]);
export type FajlCel = z.infer<typeof FajlCel>;

/** R-16 K5 (TERV 1.5): a betűtípusok — csak ezek a `betu` célé, és ezek csak a `betu` célé. */
export const BETU_TIPUSOK: readonly FajlTipus[] = ["ttf", "otf", "woff2"];
/** c30 F9 (0.4.0): a fotóalbum csak a telefon újrakódolt képét kapja — jpg vagy webp (PNG, PDF nem). */
export const ALBUM_TIPUSOK: readonly FajlTipus[] = ["jpg", "webp"];
/** A többi cél típusai (a K5 előtti szabály változatlan: bármelyik cél bármelyik képet vagy PDF-et kaphatja). */
const KEP_ES_PDF: readonly FajlTipus[] = ["png", "jpg", "webp", "pdf"];
/** Célonként az engedett típusok (R-16 K5, TERV 1.5). */
export const CEL_TIPUSOK: Record<FajlCel, readonly FajlTipus[]> = {
  logo: KEP_ES_PDF,
  kezikonyv: KEP_ES_PDF,
  referencia: KEP_ES_PDF,
  dokumentum: KEP_ES_PDF,
  kep: KEP_ES_PDF,
  betu: BETU_TIPUSOK,
  album: ALBUM_TIPUSOK,
};

// R-16 K1 (TERV 1.1, gepezet 2): a logó négy helye és a fájl eredete — a modul SAJÁT szótára (MODULSZABÁLY 6.), a befogadó fordít rá.
// A contracts `LogoValtozat`-jával betűre egyezik, de a mag nem függ tőle: így a fájl-modul külön is kiemelhető.
export const LogoValtozat = z.enum(["vilagos", "sotet", "egyszinu", "negyzetes"]);
export type LogoValtozat = z.infer<typeof LogoValtozat>;
/** Ki tette a fájlt: feltöltés · a cég honlapjáról letöltve (K7) · a gép készítette (névlogó, K6). */
export const FajlEredet = z.enum(["feltoltes", "honlap", "gep"]);
export type FajlEredet = z.infer<typeof FajlEredet>;

export const FajlHibaKod = z.enum([
  "NINCS_JOG",
  "SVG_NEM_ENGEDETT",
  "TIPUS_NEM_ENGEDETT",
  "TUL_NAGY",
  "URES",
  "NINCS_ILYEN_FAJL",
  "ERVENYTELEN_ADAT",
]);
export type FajlHibaKod = z.infer<typeof FajlHibaKod>;

/** 0.3.0 (Csilla 2026-10-10): az arculati / szervezeti fájlok (logó, kézikönyv, referencia, dokumentum — PDF is) korlátja 100 MB
 *  (volt 10 MB). A befogadó a nagy fájlt NEM tarthatja memóriában: `feltoltFajlbol` + `FajlTar.mentFajlbol` (lemezről lemezre). */
export const MAX_MERET_BAJT = 100 * 1024 * 1024; // 100 MB
/** 0.3.0: a posztképek (`kep` cél) korlátja marad 10 MB — azokat a befogadó memóriában dolgozza fel. */
export const KEP_MAX_MERET_BAJT = 10 * 1024 * 1024;
/** R-16 K5 (gepezet 8): egy saját betűfájl legfeljebb 10 MB (ugyanannyi, mint az általános korlát — külön néven, hogy ha az egyik
 *  változik, a másik ne mozduljon vele; a képgyártó kérése ehhez méretezett: TERV §4 19.). */
export const BETU_MAX_MERET_BAJT = 10 * 1024 * 1024;
/** c30 F9 (0.4.0, TERV §6 „Server”): egy albumfotó legfeljebb 2,5 MB (a telefon q≈0,82 JPEG-je 2048 px-en ~0,3–0,9 MB). Memóriában
 *  dolgozzuk fel (a képméret a teljes fejlécből jön), ezért kicsi a korlát. */
export const ALBUM_MAX_MERET_BAJT = Math.round(2.5 * 1024 * 1024);
/** c30 F9: az albumfotó hosszabbik oldala legfeljebb ennyi képpont (`nagy`); a `kicsi` párja legfeljebb `ALBUM_KICSI_MAX_EL`. */
export const ALBUM_MAX_EL = 2048;
export const ALBUM_KICSI_MAX_EL = 512;

export const KITERJESZTES: Record<FajlTipus, string> = {
  png: "png",
  jpg: "jpg",
  webp: "webp",
  pdf: "pdf",
  ttf: "ttf",
  otf: "otf",
  woff2: "woff2",
  svg: "svg",
};

export const MIME: Record<FajlTipus, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  pdf: "application/pdf",
  ttf: "font/ttf",
  otf: "font/otf",
  woff2: "font/woff2",
  svg: "image/svg+xml",
};

export type FajlMeta = {
  id: string;
  szervezet_id: string;
  nev: string;
  tipus: FajlTipus;
  meret: number;
  cel: FajlCel;
  feltoltotte: string;
  feltoltve: string; // ISO
  // R-16 K1 (0.2.0, minor): mind opcionális, így a régi befogadó (és a második host régi adata) változatlanul megfelel.
  /** Logó helye (csak `cel = "logo"`); null/hiányzó egy logó-soron = `vilagos` (a régi sorok). */
  logo_valtozat?: LogoValtozat | null;
  /** Ki tette a fájlt; hiányzó = `feltoltes`. */
  eredet?: FajlEredet;
  /** A böngészőben számolt logó-elemzés, ill. (R-16 K5) a betű ékezet-vizsgálata — a mag NEM értelmezi, csak továbbadja
   *  (a szabálya az arculat-core-é). */
  elemzes?: unknown;
};

export type FajlEsemeny = {
  fajta: "fajl_feltoltve";
  szervezet_id: string;
  fajl_id: string;
  tipus: FajlTipus;
  cel: FajlCel;
  meret: number;
  feltoltotte: string;
};

export type HostKontextus = {
  fiok_id: string;
  szervezet_id: string;
  szerep: "tulajdonos" | "szerkeszto" | "nezo";
};

export interface FajlTar {
  ment(meta: FajlMeta, bajtok: Uint8Array): Promise<void>;
  /** 0.3.0 (opcionális): a már lemezen lévő, ideiglenes fájl átvétele a végleges helyére (a nagy feltöltéshez — `feltoltFajlbol`).
   *  A befogadó dönti el, hogyan (átnevezés, másolás); a hívás után az ideiglenes fájl a tár tulajdona. */
  mentFajlbol?(meta: FajlMeta, ideiglenesUt: string): Promise<void>;
  meta(szervezet_id: string, id: string): Promise<FajlMeta | null>;
  olvas(szervezet_id: string, id: string): Promise<Uint8Array | null>;
  /** 0.3.0 (opcionális): a fájl tartalma folyamként (a nagy fájl letöltéséhez — `fajlFolyam`), hogy ne kerüljön egészben a memóriába. */
  olvasFolyam?(szervezet_id: string, id: string): Promise<ReadableStream<Uint8Array> | null>;
  lista(szervezet_id: string, cel?: FajlCel): Promise<FajlMeta[]>;
}

export interface Ora {
  most(): string;
}

export interface Azonosito {
  uj(): string;
}

export type EsemenyKimenet = (e: FajlEsemeny) => void | Promise<void>;

export type Kornyezet = {
  tar: FajlTar;
  ora: Ora;
  azonosito: Azonosito;
  esemeny: EsemenyKimenet;
};
