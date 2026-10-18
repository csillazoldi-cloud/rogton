import "server-only";
// R-16 K5 (TERV 1.5, §2-K5 betu.ts, §4 18., gepezet 8) — a feltöltött betűfájl vizsgálata a kiszolgálón, a fontkittel (2.0.4, MIT):
// megnyílik-e betűként, mi a családneve, és a munkatér nyelveinek ékezetei közül mi hiányzik belőle. A szabály (mely ékezetek) az
// @rogton/arculat-core-é (`betuElemzes`, a `VanKarakter` port) — itt csak a fájl olvasása. A fontkit csak ide kerül: a vizual-core-ba
// és az arculat-core-ba soha (TERV §3; a határőr szabályai tiltják).
// A fájl-core a fejlécből már eldöntötte, hogy ttf/otf/woff2-e; ez a második kapu: ami fejre betű, de a fontkit nem tudja megnyitni
// (csonka, hamisított fej, gyűjtemény), az sem kerül a lemezre (TIPUS_NEM_ENGEDETT → r16.arculat.betu.hiba_tipus).
import { create, type Font } from "fontkit";
import { betuElemzes, type BetuElemzes } from "@rogton/arculat-core";

/** A betű vizsgálata: null, ha a fájl nem nyitható meg egyetlen betűként. */
export function betuVizsgal(bajtok: Uint8Array, fajlNev: string): BetuElemzes | null {
  let f: Font;
  try {
    const nyitott = create(Buffer.from(bajtok.buffer, bajtok.byteOffset, bajtok.byteLength));
    if ("fonts" in nyitott) return null; // gyűjtemény (ttc/dfont): nem egy betű
    f = nyitott;
    // a cmap olvasása itt dől el: egy csonka fájl a fejét még megadja, de a karaktertáblánál elbukik
    f.hasGlyphForCodePoint(0x41);
  } catch {
    return null;
  }
  let nev: string | null = null;
  try { nev = f.familyName; } catch { nev = null; }
  try {
    return betuElemzes((kp) => f.hasGlyphForCodePoint(kp), nev, fajlNev);
  } catch {
    return null;
  }
}
