// A döntő: szabad-e a művelet — indokkal. Tiszta függvény, tár nélkül.
import {
  SZEREP_ERO,
  type HozzaferesHibaKod,
  type HostKontextus,
  type Muvelet,
  type Szerep,
  type Tag,
} from "./host";

export const MUVELET_SZEREP: Record<Muvelet, Szerep[]> = {
  tagok_nez: ["nezo", "szerkeszto", "tulajdonos"],
  tag_meghiv: ["szerkeszto", "tulajdonos"],
  meghivo_visszavon: ["szerkeszto", "tulajdonos"],
  meghivo_elfogad: ["nezo", "szerkeszto", "tulajdonos"],
  szerep_allit: ["tulajdonos"],
  tag_eltavolit: ["tulajdonos"],
  kilep: ["nezo", "szerkeszto", "tulajdonos"],
};

export type Dontes =
  | { szabad: true }
  | { szabad: false; indok: HozzaferesHibaKod };

export type DontCel = {
  fiok_id?: string;
  szerep?: Szerep;
  tagok?: Tag[];
};

export function dont(
  ktx: HostKontextus,
  muvelet: Muvelet,
  cel?: DontCel,
): Dontes {
  // (1) A MUVELET_SZEREP tábla.
  const engedett = MUVELET_SZEREP[muvelet];
  if (!engedett.includes(ktx.szerep)) {
    return { szabad: false, indok: "NINCS_JOG" };
  }

  // (2) MAGAT_NEM — szerep_allit / tag_eltavolit a saját fiókra.
  if (
    (muvelet === "szerep_allit" || muvelet === "tag_eltavolit") &&
    cel?.fiok_id !== undefined &&
    cel.fiok_id === ktx.fiok_id
  ) {
    return { szabad: false, indok: "MAGAT_NEM" };
  }

  // (3) NAGYOBB_SZEREP — tag_meghiv / szerep_allit.
  if (
    (muvelet === "tag_meghiv" || muvelet === "szerep_allit") &&
    cel?.szerep !== undefined &&
    SZEREP_ERO[cel.szerep] > SZEREP_ERO[ktx.szerep]
  ) {
    return { szabad: false, indok: "NAGYOBB_SZEREP" };
  }

  // (4) UTOLSO_TULAJDONOS.
  if (cel?.tagok !== undefined) {
    const tulajdonosok = cel.tagok.filter((t) => t.szerep === "tulajdonos");
    const egyetlenTulajdonos: Tag | null =
      tulajdonosok.length === 1 ? (tulajdonosok[0] ?? null) : null;

    if (egyetlenTulajdonos !== null) {
      const celTulajdonos =
        cel.fiok_id !== undefined && cel.fiok_id === egyetlenTulajdonos.fiok_id;

      if (muvelet === "szerep_allit" && celTulajdonos) {
        // lefokozás: az új szerep nem tulajdonos
        if (cel.szerep !== undefined && cel.szerep !== "tulajdonos") {
          return { szabad: false, indok: "UTOLSO_TULAJDONOS" };
        }
      }
      if (muvelet === "tag_eltavolit" && celTulajdonos) {
        return { szabad: false, indok: "UTOLSO_TULAJDONOS" };
      }
      if (muvelet === "kilep" && ktx.fiok_id === egyetlenTulajdonos.fiok_id) {
        return { szabad: false, indok: "UTOLSO_TULAJDONOS" };
      }
    }
  }

  // (5) NINCS_ILYEN_TAG — szerep_allit / tag_eltavolit nem létező tagra.
  if (
    (muvelet === "szerep_allit" || muvelet === "tag_eltavolit") &&
    cel?.tagok !== undefined &&
    cel.fiok_id !== undefined
  ) {
    const van = cel.tagok.some((t) => t.fiok_id === cel.fiok_id);
    if (!van) {
      return { szabad: false, indok: "NINCS_ILYEN_TAG" };
    }
  }

  return { szabad: true };
}
