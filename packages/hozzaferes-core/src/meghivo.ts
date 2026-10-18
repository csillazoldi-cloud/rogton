// A meghívó tárgya: állapot-számítás és lejárat.
import type { Meghivo, MeghivoAllapot } from "./host";

export const MEGHIVO_ERVENYESSEG_NAP = 7;

/** A meghívó számolt állapota: kiadott + lejárt → "lejart". */
export function meghivoAllapot(m: Meghivo, most: string): MeghivoAllapot {
  if (m.allapot === "elfogadott") return "elfogadott";
  if (m.allapot === "visszavont") return "visszavont";
  // allapot === "kiadott"
  if (most > m.lejar) return "lejart";
  return "kiadott";
}

/** A lejárat: letrehozva + 7 nap. Tiszta számítás a kapott ISO időből. */
export function lejarat(letrehozvaISO: string): string {
  const t = new Date(letrehozvaISO);
  t.setUTCDate(t.getUTCDate() + MEGHIVO_ERVENYESSEG_NAP);
  return t.toISOString();
}
