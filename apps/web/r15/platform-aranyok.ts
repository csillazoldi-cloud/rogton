// A közösségi felületek KÉPARÁNYAI az „Így fog kinézni” előnézethez (Kati 10-11: „a kép helye túl kicsi, nem a mai Facebook-poszt”).
// Egy helyen, hogy a platformok változásakor csak ezt kelljen átírni. Szélesség / magasság.
// Utoljára ellenőrizve: 2026-10-11 (a Meta, az Instagram és a LinkedIn súgója szerint):
//   Facebook hírfolyam: álló legfeljebb 4:5, négyzet 1:1, fekvő (link-kép) 1.91:1 — a fotónak az álló 4:5 a leggyakoribb, ezt mutatjuk alapból.
//   Instagram hírfolyam: 4:5 … 1.91:1 (álló 4:5 az alap).
//   LinkedIn hírfolyam: 4:5 … 1.91:1; ajánlott a négyzet 1:1 (1200 × 1200) — ez az alap.
//   Blog / honlap: a cikk nyitóképe fekvő 1.91:1 (mint a link-előnézet).
// A valódi kép a saját arányában jelenik meg, a felület határai közé szorítva (álló felett 4:5-re, fekvő alatt 1.91:1-re vágva) — mint a feedben.

export type ElonezetFelulet = "fb" | "ig" | "li" | "blog";

export const KEPARANY: Record<ElonezetFelulet, { alap: number; min: number; max: number }> = {
  fb: { alap: 4 / 5, min: 4 / 5, max: 1.91 },
  ig: { alap: 4 / 5, min: 4 / 5, max: 1.91 },
  li: { alap: 1, min: 4 / 5, max: 1.91 }, // R-18 6. kör: a rajz LinkedIn-ajánlása négyzet (1200 × 1200)
  blog: { alap: 1.91, min: 1.91, max: 1.91 },
};

/** A kép aránya az előnézetben: a kép saját aránya a felület határai közé szorítva; ismeretlen méretnél a felület alap-aránya. */
export function elonezetArany(felulet: ElonezetFelulet, szel?: number, mag?: number): number {
  const a = KEPARANY[felulet];
  if (!szel || !mag || szel <= 0 || mag <= 0) return a.alap;
  return Math.min(a.max, Math.max(a.min, szel / mag));
}

/** R-18 6. kör (Kati B): az előnézet alatti „Ideális kép …” sor — a feltöltendő kép ajánlott mérete felületenként (a rajz értékei, 2026-10-11). */
export const KEP_MERET: Record<ElonezetFelulet, { szel: number; mag: number; forma: "allo" | "negyzet" | "fekvo"; arany: string }> = {
  fb: { szel: 1080, mag: 1350, forma: "allo", arany: "4:5" },
  ig: { szel: 1080, mag: 1350, forma: "allo", arany: "4:5" },
  li: { szel: 1200, mag: 1200, forma: "negyzet", arany: "1:1" },
  blog: { szel: 1200, mag: 630, forma: "fekvo", arany: "1,91:1" },
};
