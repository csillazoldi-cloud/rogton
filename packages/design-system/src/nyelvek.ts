// A feliratok nyelvei (R-14) és a FELÜLET nyelvei. A Rögtön (G3, 2026-10-18): a felület CSAK magyar — a feliratok tárolása, a
// szerkesztő és a tartalomnyelvek (TARTALOMNYELVEK, @rogton/contracts) továbbra is három nyelvet ismernek, mert a ro/en kódok a
// szervezet tartalom- és AI-kimeneti nyelvei is (pl. kétnyelvű poszt). Ez az egész rendszer egyetlen szabálya, modul nem hoz létre sajátot.
import { z } from "zod";

/** A támogatott felületi nyelvek (R-14) — a választók sorrendje a v6 szerint; az eredeti/tartalék az ALAP_NYELV. */
export const NYELVEK = ["hu", "ro", "en"] as const;
export type Nyelv = (typeof NYELVEK)[number];
export const Nyelv = z.enum(NYELVEK);
/** Az alap- és tartaléknyelv (G3: magyar; korábban angol). */
export const ALAP_NYELV: Nyelv = "hu";
/** A FELÜLET választható nyelvei (G3: csak magyar). Ha egy elemű, nincs nyelvválasztó, és minden kérés ezen a nyelven kapja a lapot. */
export const FELULETI_NYELVEK: readonly Nyelv[] = ["hu"];
/** Egy kért / tárolt nyelvből a felület nyelve: ha nem felületi nyelv, az alapnyelv. */
export function feluletiNyelv(kert: string | null | undefined): Nyelv {
  return kert && (FELULETI_NYELVEK as readonly string[]).includes(kert) ? (kert as Nyelv) : ALAP_NYELV;
}
/** Van-e mit választani (több felületi nyelv)? Ha nincs, a választók nem jelennek meg. */
export const VAN_NYELVVALASZTAS = FELULETI_NYELVEK.length > 1;
export const NYELV_SUTI = "km_nyelv" as const;
