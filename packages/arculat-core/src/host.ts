// A konnektor (MODULSZABÁLY 6.): amit az arculat-modul a befogadótól kér, és a saját szótára.
// R-16 K1. A modul a márkakészlet SZABÁLYAIT tartja (logó-elemzés és -besorolás; K3–K5-től a bevált színszettek, a szakma →
// hangulat tábla, a színkör, a betűlista). Nem ismer fájlt, képet, adatbázist, betűfájl-olvasót: a befogadó sima adatot ad át.
import type { LogoValtozat } from "@rogton/contracts";

/** A négy logóhely (a contracts szótára; a fájl-modulnak saját, betűre egyező szótára van — a befogadó köti össze). */
export type LogoHely = LogoValtozat;

/**
 * Betű-port (K5-től): van-e a betűben az adott karakter (Unicode kódpont). A befogadó adja (a webalkalmazásban a fontkit
 * `hasGlyphForCodePoint`-ja, apps/web/arculat/betu.ts) — a mag betűfájlt nem olvas. Hívója: `hianyzoEkezetek`, `betuElemzes` (betuk.ts).
 */
export type VanKarakter = (kodpont: number) => boolean;

/** Nyers képpontok: RGBA sorfolytonosan (a böngésző canvas `getImageData().data`-ja), legfeljebb 64 × 64-re kicsinyítve. */
export type Kepadat = { rgba: ArrayLike<number>; szelesseg: number; magassag: number };

/**
 * Hibakódok: a K1 szabályai nem adnak hibát (az olvashatatlan elemzés `null`, nem hiba — TERV 2-K1: „invalid → ignored").
 * A zárt lista a K5 betű-ellenőrzésével bővül.
 */
export const ARCULAT_HIBAKODOK = [] as const;
