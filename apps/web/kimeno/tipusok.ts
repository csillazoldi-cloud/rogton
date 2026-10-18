// F-7b (R-5): a Kimenő értesítések lap szerződése — a kiszolgáló ezt adja, a lap ezt rajzolja.
// A kimenő értesítés a munkatér KÜLSŐ csatornája (webes horog): fajtánként „kimenő" vagy „nincs"; két szint: közös alap (rendszergazda) és a munkatér felülírása (tulajdonos).
import type { Csatorna, EsemenyFajta, ErtesitesBeallitas } from "@km/esemeny-core";

/** A rajz öt csoportja, a rajz sorrendjében. A `belepesi_kiserletek` rendszerszintű: csak a rendszergazda lapján van ott. */
export const KIMENO_CSOPORTOK: readonly { kod: "fiok" | "tagok" | "futas" | "beallitas" | "rendszer"; fajtak: readonly EsemenyFajta[] }[] = [
  { kod: "fiok", fajtak: ["belepes", "kilepes", "jelszo_valtas", "kileptetes_mindenhol", "belepesi_kiserletek"] },
  { kod: "tagok", fajtak: ["meghivo_kiadva", "meghivo_visszavonva", "meghivo_elfogadva", "tag_felveve", "szerep_valtozott", "tag_eltavolitva", "tag_kilepett"] },
  { kod: "futas", fajtak: ["futas_indult", "futas_kesz", "futas_hiba", "futas_beragadt", "forras_hibas", "ai_nem_valaszol", "keret_kimerult"] },
  { kod: "beallitas", fajtak: ["tema_alkalmazva", "feliratok_alkalmazva", "profil_jovahagyva", "ai_kapcsolo_valtozott", "fajl_feltoltve"] },
  { kod: "rendszer", fajtak: ["mentes_kimaradt"] },
];
export const RENDSZERSZINTU_FAJTAK: readonly EsemenyFajta[] = ["belepesi_kiserletek"];

export type KimenoNezet = {
  /** tulajdonos: a munkatér felülírását állítja (03. artboard); rendszergazda: a közös alapot (04.) */
  nezet: "tulajdonos" | "rendszergazda";
  /** a kimenő csatorna be van-e kötve (a cím titok, a felületen soha) — rendszerszintű */
  bekotve: boolean;
  /** csak a felülírt fajták (a rajz „Közös alap" oszlopa; hiányzó kulcs = nincs) */
  kozos: ErtesitesBeallitas;
  /** csak a felülírt fajták (a rajz „Ebben a munkatérben" választója; hiányzó kulcs = örökli) */
  szervezeti: ErtesitesBeallitas;
  /** mind a 25 fajta (a rajz „Ami érvényes" oszlopa) */
  hatasos: Record<EsemenyFajta, Csatorna>;
  /** a csoportok a nézet szerint: a tulajdonosé a rendszerszintű fajták nélkül */
  csoportok: { kod: (typeof KIMENO_CSOPORTOK)[number]["kod"]; fajtak: EsemenyFajta[] }[];
};
