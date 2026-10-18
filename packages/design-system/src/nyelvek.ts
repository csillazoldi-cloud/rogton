// A támogatott felületi nyelvek (R-14). D-11 (2026-09-07): az ANGOL az alap- és tartaléknyelv, a magyar és a román teljes
// támogatással — ez az egész rendszer egyetlen szabálya, modul nem hoz létre sajátot.
import { z } from "zod";

/** A támogatott felületi nyelvek (R-14) — a választók sorrendje a v6 szerint; az eredeti/tartalék az ALAP_NYELV. */
export const NYELVEK = ["hu", "ro", "en"] as const;
export type Nyelv = (typeof NYELVEK)[number];
export const Nyelv = z.enum(NYELVEK);
export const ALAP_NYELV: Nyelv = "en";
export const NYELV_SUTI = "km_nyelv" as const;
