import { randomUUID } from "node:crypto";
import {
  type Kornyezet,
  type EsemenyKimenet,
  type FajlEsemeny,
} from "@km/fajl-core";
import { sqliteFajl } from "./sqlite-fajl.js";

/** A fájl-modul `Kornyezet`-ének összeállítása SQLite tárral.
 *  `ora.most` ISO string, `azonosito.uj` UUID.
 *  Az esemeny alapból konzolra ír `[fajl]` előtaggal. */
export function fajlKornyezet(utvonal: string): Kornyezet & { zar(): void } {
  const { tar, zar } = sqliteFajl(utvonal);

  const alapEsemeny: EsemenyKimenet = (e: FajlEsemeny) => {
    console.log(`[fajl] ${e.fajta} ${e.szervezet_id} ${e.fajl_id}`);
  };

  return {
    tar,
    ora: {
      most: () => new Date().toISOString(),
    },
    azonosito: {
      uj: () => randomUUID(),
    },
    esemeny: alapEsemeny,
    zar,
  };
}
