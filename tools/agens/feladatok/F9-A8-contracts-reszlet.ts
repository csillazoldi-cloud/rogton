// packages/contracts/src/index.ts — RÉSZLET (a csomag szakasz és a hibakódok)
/** Hibakódok — a felület ezekhez rendel szöveget a saját nyelvén. */
export const HibaKod = z.enum([
  "ERVENYTELEN_ADAT", // a bemenet nem felel meg a sémának
  "EMAIL_FOGLALT", // ezzel az e-mail-címmel már van fiók
  "GYENGE_JELSZO", // rövidebb 10 karakternél
  "ROSSZ_BELEPES", // nincs ilyen e-mail, vagy rossz a jelszó (a kettőt szándékosan nem különböztetjük meg)
  "NINCS_BELEPVE", // nincs érvényes munkamenet
  "NINCS_JOG", // van belépés, de ehhez nincs joga
  "MODUL_NEM_ELERHETO", // F-7a: a modul nincs a munkatér csomagjában
  "BELSO_HIBA",
  // E-7: forrás és AI — a felület mindegyikhez saját szöveget és kézi továbbutat ad (A-03)
  "FORRAS_NEM_ELERHETO", // a megadott oldal nem tölthető le (nem elérhető / túl nagy / nem szöveg)
  "AI_NEM_ELERHETO", // a szolgáltató nem felel / időtúllépés / nincs kulcs
  "AI_KERET_KIMERULT", // a havi keret elfogyott
  "AI_ROSSZ_VALASZ", // a szolgáltató válasza nem felel meg a sémának (E-23)
  "AI_KIKAPCSOLVA", // F-5 (R-4): a szervezet kikapcsolta az AI-t — egyetlen hívás sem indul a nevében
// … (kihagyva) …
// ---------------------------------------------------------------------------
// F-7a (D-F35): csomag — melyik munkatér melyik modult használhatja. A pilotban egy csomag ("pilot", benne a Hírfigyelő), ár és fizetés nélkül.
// ---------------------------------------------------------------------------
/** A rendszer ismert moduljai — az első az egyetlen önálló modul (R-19). Új modul: ide, és a csomagok `modulok` mezőjébe. */
export const MODULOK = ["hirfigyelo"] as const;
export const Modul = z.enum(MODULOK);
export type Modul = z.infer<typeof Modul>;
export const ALAP_CSOMAG_KOD = "pilot";
export const Csomag = z.object({
  kod: z.string().min(1).max(40),
  modulok: z.array(Modul),
  /** havi ár — a pilotban null (nincs ár); a pénznemmel együtt értelmes */
  ar_havi: z.number().nonnegative().nullable(),
  penznem: z.string().length(3).nullable(),
});
export type Csomag = z.infer<typeof Csomag>;
