// R-16 K3 (TERV 1.2, §2-K3 „font keys + mood words”; a teljes lista a K5-é: §2-K5 `betuk.ts`) — a képgyártó öt betűje és a hangulatszavuk.
// A K3 a 12a–12c „Betűk” sorához hozza: melyik betű van a tervezetben, és milyen szóval mondjuk.
// R-16 K5 (TERV 1.5, §2-K5, gepezet 7–8): a saját betű kulcsa (`sajat:<fájl-azonosító>`) és az ékezet-vizsgálat (`hianyzoEkezetek`) —
// a mag betűfájlt NEM olvas: a befogadó a `VanKarakter` portot adja (a webalkalmazásban a fontkit `hasGlyphForCodePoint`-ja).
import { z } from "zod";
import type { VanKarakter } from "./host";
import type { BetuKulcs } from "./szettek";

/** A beépített betűk, a hangulatszavuk feliratkulcsa (a rajz 12e szavai) és a nevük (asztalon a halk sor a szó mellett, 12e). */
export const BEEPITETT: readonly { kulcs: BetuKulcs; szo: string; nev: string }[] = [
  { kulcs: "archivo", szo: "r16.arculat.betu.eros", nev: "Archivo" },
  { kulcs: "public-sans", szo: "r16.arculat.betu.tiszta", nev: "Public Sans" },
  { kulcs: "space-grotesk", szo: "r16.arculat.betu.modern", nev: "Space Grotesk" },
  { kulcs: "ibm-plex-sans", szo: "r16.arculat.betu.hivatalos", nev: "IBM Plex Sans" },
  { kulcs: "gelasio", szo: "r16.arculat.betu.klasszikus", nev: "Gelasio" },
];
/** A tartalék betű: a saját betűből hiányzó karaktert ezzel írja a kép (a böngésző karakterenként vált — TERV 1.5). */
export const TARTALEK_BETU = "Public Sans";
const KULCSOK = new Set<string>(BEEPITETT.map((b) => b.kulcs));

/**
 * A tervezet betű-mezőjéből (új érték: kulcs; régi: CSS-szöveg, pl. "'Archivo',sans-serif", "Georgia, serif") a beépített kulcs.
 * Ugyanaz a szabály, mint a vizual-core `betuKulcs`-a (a Georgia helyett a méretazonos Gelasio; a Cairo/Tajawal: V-2, nincs RTL →
 * Public Sans), hogy a lap ugyanazt a betűt mondja, amivel a kép készül. `sajat:<uuid>` a K5-től; addig a Public Sans áll helyette.
 */
export function betuKulcs(ertek: string | null | undefined): BetuKulcs {
  const s = (ertek ?? "").trim().toLowerCase();
  if (KULCSOK.has(s)) return s as BetuKulcs;
  if (s.includes("archivo")) return "archivo";
  if (s.includes("space grotesk")) return "space-grotesk";
  if (s.includes("ibm plex sans")) return "ibm-plex-sans";
  if (s.includes("georgia") || s.includes("gelasio")) return "gelasio";
  return "public-sans";
}

/** Beépített betűkulcs-e (pontosan, nem a régi CSS-szövegek közül). */
export function beepitettKulcs(ertek: string): ertek is BetuKulcs {
  return KULCSOK.has(ertek);
}

// ——— R-16 K5: a saját betű ———
const SAJAT_ELOTAG = "sajat:";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A saját betű kulcsa a fájl azonosítójából. */
export function sajatKulcs(fajlId: string): string {
  return SAJAT_ELOTAG + fajlId.toLowerCase();
}
/** `sajat:<uuid>` → a fájl azonosítója; minden más → null. */
export function sajatBetuId(ertek: string | null | undefined): string | null {
  const s = (ertek ?? "").trim();
  if (!s.startsWith(SAJAT_ELOTAG)) return null;
  const id = s.slice(SAJAT_ELOTAG.length);
  return UUID.test(id) ? id.toLowerCase() : null;
}

/**
 * Az ékezetek, amelyeket a munkatér nyelvei megkövetelnek (TERV 1.5): a magyar mindig (a felület és a képek nyelve), a román, ha a
 * munkatér nyelvei között van. Kis- és nagybetű; a román ș ț a VESSZŐS alak (U+0218–021B) — a cédille-s ş ţ nem számít helyette.
 */
export const EKEZETEK: Readonly<Record<"hu" | "ro", string>> = {
  hu: "áéíóöőúüűÁÉÍÓÖŐÚÜŰ",
  ro: "ăâîșțĂÂÎȘȚ",
};

/** Mely nyelvek ékezetei számítanak: hu mindig, ro ha a munkatér nyelve. */
function ekezetNyelvek(nyelvek: readonly string[]): ("hu" | "ro")[] {
  return nyelvek.includes("ro") ? ["hu", "ro"] : ["hu"];
}

/**
 * Az ékezet-vizsgálat: a munkatér nyelveinek ékezetei közül azok, amelyek a betűből hiányoznak (a sorrend: az `EKEZETEK`-é, ismétlés
 * nélkül). Üres tömb = minden megvan. A `van` a befogadó portja.
 */
export function hianyzoEkezetek(van: VanKarakter, nyelvek: readonly string[]): string[] {
  const ki: string[] = [];
  for (const ny of ekezetNyelvek(nyelvek)) for (const c of EKEZETEK[ny]) if (!van(c.codePointAt(0)!) && !ki.includes(c)) ki.push(c);
  return ki;
}

/**
 * A betű vizsgálatának TÁROLT eredménye (az arculat_fajl tábla elemzes oszlopa, a K1-é — új séma nélkül): a betű neve és a hiányzó ékezetek
 * MINDKÉT nyelvből. A lap a munkatér nyelveire szűri (`hianyzoNyelvre`), így ha a munkatér később románt is kap, nem kell újravizsgálni.
 * `fajta: "betu"` választja el a logó-elemzéstől (ugyanaz az oszlop).
 */
export const BetuElemzes = z.object({
  fajta: z.literal("betu"),
  nev: z.string().min(1).max(120),
  hianyzo: z.array(z.string().max(2)).max(40),
});
export type BetuElemzes = z.infer<typeof BetuElemzes>;

/** A tárolandó elemzés a befogadó vizsgálatából (név: a betű családneve, ha üres, a fájl neve kiterjesztés nélkül). */
export function betuElemzes(van: VanKarakter, csaladNev: string | null | undefined, fajlNev: string): BetuElemzes {
  const nev = (csaladNev ?? "").trim() || fajlNev.replace(/\.[a-z0-9]+$/i, "").trim() || "?";
  return { fajta: "betu", nev: nev.slice(0, 120), hianyzo: hianyzoEkezetek(van, ["hu", "ro"]) };
}

/** A tárolt hiányzó ékezetek a munkatér nyelveire szűrve (hu mindig, ro ha a munkatér nyelve). */
export function hianyzoNyelvre(e: Pick<BetuElemzes, "hianyzo">, nyelvek: readonly string[]): string[] {
  const kell = ekezetNyelvek(nyelvek).map((ny) => EKEZETEK[ny]).join("");
  return e.hianyzo.filter((c) => kell.includes(c));
}

/** A betű hangulatszavának feliratkulcsa. */
export function betuSzo(kulcs: BetuKulcs): string {
  return BEEPITETT.find((b) => b.kulcs === kulcs)?.szo ?? "r16.arculat.betu.tiszta";
}
