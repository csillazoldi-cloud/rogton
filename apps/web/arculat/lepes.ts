// R-16 K3 (TERV §2-K3 API, kerdesek 4) — a szakasz három lépése az arculati állapotgépen (tiszta; a mentés az `arculatMent`-é).
// Mind „ment ÉS jóváhagy” egy lépésben (TERV §4 10.), a @km/profile-core függvényeivel. Egy szabály itt kerül hozzá:
// PILLANATKÉPET NEM ÍRUNK FELÜL (TERV 1.7 R2/R6: a verziótörténet csak nő). A profile-core `arculatJovahagy` a `verzio` kulcsra ír;
// ha ahhoz már van pillanatkép (pl. „Visszavonás” után: az állapot tervezet, de a verzió ugyanaz), az új jóváhagyás a következő verzió lesz.
import type { ArculatLepes, ArculatLogok, ArculatTervezet } from "@km/contracts";
import { arculatJovahagy, arculatModosit, arculatVisszavon } from "@km/profile-core";
import type { JavaslatForras } from "@km/arculat-core";

export type Reszletek = Partial<Pick<ArculatTervezet, "kepvilag" | "kovetendo" | "kerulendo" | "lekerekites">>;

/** Jóváhagyás úgy, hogy meglévő pillanatkép soha ne íródjon felül (ha a verzió foglalt, a következő). */
function jovahagyVedett(a: ArculatLepes, most: Date, logok: ArculatLogok | undefined): ArculatLepes {
  const b = a.verziok[String(a.verzio)] !== undefined ? { ...a, verzio: Math.max(a.verzio, ...Object.keys(a.verziok).map(Number)) + 1 } : a;
  return arculatJovahagy(b, most, logok);
}

/**
 * „Így jó, logó nélkül” / „Igen, ez mi vagyunk”: a tényleges tervezet jóváhagyása. Tervezet nélkül az alapszettből készül (a 12a
 * ezt mutatta). Már jóváhagyott arculatnál nincs mit tenni (nem nyit új verziót).
 */
export function jovahagyTenyleges(a: ArculatLepes, alap: ArculatTervezet, most: Date, logok: ArculatLogok | undefined): ArculatLepes {
  if (a.allapot === "jovahagyott" && a.jovahagyott_verzio !== null && a.verziok[String(a.jovahagyott_verzio)]) return a;
  const alapos: ArculatLepes = a.tervezet ? a : { ...a, tervezet: alap };
  return jovahagyVedett(alapos, most, logok);
}

/** Részletek (képvilág, követendő, kerülendő, lekerekítés) mentése + jóváhagyás; tervezet nélkül az alapszettre épül. */
export function reszletekJovahagy(a: ArculatLepes, resz: Reszletek, alap: ArculatTervezet, most: Date, logok: ArculatLogok | undefined): ArculatLepes {
  const alapos: ArculatLepes = a.tervezet ? a : { ...a, tervezet: alap };
  return jovahagyVedett(arculatModosit(alapos, resz), most, logok);
}

/** 12c Részletek → „jóváhagyás visszavonása”: tervezet állapot, a pillanatképek maradnak. Csak jóváhagyottból. */
export function visszavon(a: ArculatLepes): ArculatLepes {
  return a.allapot === "jovahagyott" ? arculatVisszavon(a) : a;
}

// ——— R-16 K4 (TERV §2-K4, kerdesek 4): „Ez legyen” a 12d-n és a 12d2-n ———

/** A választott három szín és a forrásuk (a 12d kártyája vagy a 12d2 egyenkénti választása = „sajat”). */
export type SzinValasztas = { fo: string; masodik: string; hatter: string; forras: JavaslatForras; szett?: string | undefined };

/**
 * A színek mentése ÉS jóváhagyása egy lépésben. Tervezet nélkül az alapszettre épül (a betűk is onnan jönnek, amit a 12a mutatott).
 * A már jóváhagyott, ugyanezekkel a színekkel és forrással álló arculatnál nincs mit tenni: ugyanazt az objektumot adja vissza
 * (az `arculatMent` ekkor nem ír — nem nyílik üres új verzió). Minden más: új verzió, jóváhagyva; pillanatképet nem ír felül.
 */
export function szinekJovahagy(a: ArculatLepes, v: SzinValasztas, alap: ArculatTervezet, most: Date, logok: ArculatLogok | undefined): ArculatLepes {
  const resz: Partial<ArculatTervezet> = {
    elsodleges: v.fo.toLowerCase(),
    masodlagos: v.masodik.toLowerCase(),
    hatter: v.hatter.toLowerCase(),
    szin_forras: v.forras,
    szin_szett: v.forras === "szett" ? (v.szett ?? "") : "",
  };
  const jov = a.allapot === "jovahagyott" && a.jovahagyott_verzio !== null ? a.verziok[String(a.jovahagyott_verzio)] : undefined;
  if (jov && jov.elsodleges.toLowerCase() === resz.elsodleges && jov.masodlagos.toLowerCase() === resz.masodlagos && jov.hatter.toLowerCase() === resz.hatter
    && jov.szin_forras === resz.szin_forras && jov.szin_szett === resz.szin_szett) return a;
  const alapos: ArculatLepes = a.tervezet ? a : { ...a, tervezet: alap };
  return jovahagyVedett(arculatModosit(alapos, resz), most, logok);
}

// ——— R-16 K4 (a K3 jelentéséből): az onboarding háttérmunkájának őre ———

/** Érintetlen-e az arculat az onboarding jóváhagyása óta: nincs tervezet, nincs pillanatkép, nincs jóváhagyás, és a verzió is ugyanaz. */
export function erintetlenArculat(a: ArculatLepes, induloVerzio: number): boolean {
  return a.allapot === "nincs" && a.tervezet === null && a.jovahagyott_verzio === null && Object.keys(a.verziok).length === 0 && a.verzio === induloVerzio;
}

/**
 * Az onboarding után a háttérben készült AI-tervezet (`onboarding/jovahagyas.ts` `arculatotHatterben`) CSAK az érintetlen arculatba kerül.
 * Ha közben bárki jóváhagyott (12a „Így jó, logó nélkül”), színt választott (12d) vagy tervezetet írt, ugyanazt az objektumot adja vissza —
 * az `arculatMent` ekkor nem ír: a háttérmunka soha nem írja felül, amit az ember a képernyőn látott és jóváhagyott.
 */
export function hatterTervezetBefogad(a: ArculatLepes, tervezet: ArculatTervezet, induloVerzio: number): ArculatLepes {
  return erintetlenArculat(a, induloVerzio) ? { ...a, allapot: "tervezet", tervezet } : a;
}
