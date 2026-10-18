// c15 (Csilla döntése 2026-10-08 15:43–15:50, docs/decisions/2026-10-08-c15-iparagi-mintafoto.md): a „Kész munka” mintaképének
// fotója a cég szakmájához illik. A szakmát a példaszövegeket író MEGLÉVŐ AI-hívás (kep_peldak v3) választja ki ebből a zárt
// listából — új hívás, új költség nincs. A kategória a tárolt példák JSON-jában él (`kep_pelda.adat.kategoria`), nincs új oszlop.
// Tiszta modul: nem olvas adatbázist, nem hív képgyártót (a próbája: probak/c15-minta-kategoria.proba.ts).

import { KATEGORIAK, kategoria, szervezetTipus, type Kategoria } from "@km/contracts";

/** A zárt lista — UGYANAZ, mint apps/kepgyar/src/minta-foto.ts MINTA_KATEGORIAK (a web nem függ a képgyártó csomagjától;
 *  eltérésnél a képgyártó a semlegest adja, hiba nincs). c30 F1 (plan §1.2): the single source is now @km/contracts
 *  `KATEGORIAK`; these names stay as re-exports with the same behaviour. */
export const MINTA_KATEGORIAK = KATEGORIAK;
export type MintaKategoria = Kategoria;

/** c30 F11 (plan §1.2): the SAMPLE-PHOTO categories = the company categories + `rendezveny`, the festival's photo. `rendezveny` is not a
 *  company choice: the company chooser, the AI's pick (kep_peldak, javaslatok) and the compass examples keep using KATEGORIAK. The
 *  same list as apps/kepgyar/src/minta-foto.ts MINTA_KATEGORIAK. */
export const RENDEZVENY_KATEGORIA = "rendezveny" as const;
export const MINTA_FOTO_KATEGORIAK = [...KATEGORIAK, RENDEZVENY_KATEGORIA] as const;
export type MintaFotoKategoria = (typeof MINTA_FOTO_KATEGORIAK)[number] | "semleges";

/** Az AI (vagy a tár) értéke → kategória. Hiány, elírás, más kis-nagybetű, nem szöveg → "semleges". A szóközt levágjuk. */
export function mintaKategoria(x: unknown): MintaKategoria {
  return kategoria(x);
}

/** c30 F11 (plan §1.2, §2): the category the image maker gets for the „Kész munka” sample PHOTO. A festival always gets its event photo
 *  (`rendezveny`), whatever the AI picked for its examples; a company keeps its category exactly as before. Read at request time, so
 *  nothing stored changes and no example is rewritten (no AI call, no cost). */
export function fotoKategoria(szervezet_tipus: unknown, kat: MintaKategoria): MintaFotoKategoria {
  return szervezetTipus(szervezet_tipus) === "fesztival" ? RENDEZVENY_KATEGORIA : kat;
}

/** c30 F1 (plan §3 kep_peldak): the sample photo's category — the profile's confirmed category wins; otherwise the AI's pick. */
export function kepKategoria(megerositett: unknown, aiValasz: unknown): MintaKategoria {
  const m = mintaKategoria(megerositett);
  return m !== "semleges" ? m : mintaKategoria(aiValasz);
}

/** A tárolt `adat` szétválasztva: a példák (a helyzetek kulcsai) és a kategória. A c15 előtti sorokban nincs kategória → "semleges";
 *  a példák akkor is változatlanul jönnek (a minta a semleges fotóval készül). */
export function taroltPeldak<P>(adat: unknown): { peldak: P | null; kategoria: MintaKategoria } {
  if (!adat || typeof adat !== "object" || Array.isArray(adat)) return { peldak: null, kategoria: "semleges" };
  const { kategoria, ...peldak } = adat as Record<string, unknown>;
  return { peldak: peldak as P, kategoria: mintaKategoria(kategoria) };
}
