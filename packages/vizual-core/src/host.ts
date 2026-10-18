// A konnektor: amit a modul a befogadótól kér.
import type { LapMeres } from "./meres.ts";

/**
 * A mérő: a kész HTML-lapot kirajzolja (a képpel AZONOS böngészőben és beállítással),
 * lefuttatja rajta a MERO_SZKRIPT-et, és a meresOsszeallit()-tal kiegészített mérést adja vissza.
 */
export interface Mero {
  mer(html: string): Promise<LapMeres>;
}

/**
 * R-16 K6 (TERV §2-K6, gepezet 13): a betű-útvonal port — a névlogó (`nevlogo.ts`) ezen át kapja a szöveg körvonalát, így az SVG-ben
 * `<text>` nincs, a logó a betűfájl nélkül is ugyanúgy néz ki. A képgyártó valósítja meg (fontkit, `apps/kepgyar/src/betu-utvonal.ts`):
 * karakterenként az első betűfájl, amelyben a karakter megvan (latin → latin-ext → Public Sans) — a magba betűolvasó nem kerül
 * (a határőr `vizual-core-csak-contracts-es-zod` szabálya tiltja).
 *
 * A visszaadott útvonal képpontban (`meret` = a betű mérete), lefelé növő y-nal, az alapvonal az y = 0-n; a festék (ink) bal széle
 * az x = 0-n. `szelesseg` = a festék szélessége; `felso` / `also` = a festék az alapvonal fölött / alatt (mindkettő ≥ 0).
 * Üres (vagy csupa szóköz) szöveg: `d = ""`, minden méret 0.
 */
export interface BetuUtvonal {
  /** `betukoz`: a betűk közti többlet a betűméret hányadában (a rajz 12g: 1,5 / 21 ≈ 0,07) — hiányában 0. */
  utvonal(szoveg: string, meret: number, betukoz?: number): { d: string; szelesseg: number; felso: number; also: number };
}
