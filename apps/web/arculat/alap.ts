// R-16 K3 (TERV §2-K3 alap.ts, §4 14.) — az ALAPSZETT: ha a munkatérnek még nincs arculati tervezete, a gép a szakmájából
// (a cég neve + összefoglalója → @rogton/arculat-core `alapSzett`) egy bevált összeállítással kezd. Ezt látja a 12a („A színeket és a
// betűket addig mi választottuk.”), és EZZEL készül minden kép a Képek lapon is — „a kép sosem szürke” (gepezet 12a, Vilmos 09-28).
// Tiszta (nincs adatbázis, nincs hálózat): a `vizual/helyzet.ts` is ezt hívja, ezért ez a fájl `vizual/*`-ot NEM importálhat (TERV §3).
import type { ArculatTervezet } from "@rogton/contracts";
import { uresTervezet } from "@rogton/profile-core";
import { alapSzett, type Szett } from "@rogton/arculat-core";

/** A szakma szövege: név + összefoglaló (a profilnak nincs szakma-mezője — TERV §5). */
export function szakmaSzoveg(nev: string | null | undefined, osszefoglalo: string | null | undefined): string {
  return `${nev ?? ""} ${osszefoglalo ?? ""}`.trim();
}

/** Az alapszett a munkatér szakmájából. */
export function munkaterAlapSzett(nev: string | null | undefined, osszefoglalo: string | null | undefined): Szett {
  return alapSzett(szakmaSzoveg(nev, osszefoglalo));
}

/** Tervezet az alapszettből — a „Így jó, logó nélkül” / „Igen, ez mi vagyunk” ezt hagyja jóvá, ha még nincs tervezet. */
export function alapTervezet(nev: string | null | undefined, osszefoglalo: string | null | undefined, nyelv = "hu"): ArculatTervezet {
  const sz = munkaterAlapSzett(nev, osszefoglalo);
  return {
    ...uresTervezet(),
    elsodleges: sz.fo,
    masodlagos: sz.masodik,
    hatter: sz.hatter,
    betu_cim: sz.cim,
    betu_szoveg: sz.szoveg,
    nyelv,
    eredet: "ai",
    szin_forras: "szett",
    szin_szett: sz.id,
  };
}
