import { randomUUID } from "node:crypto";
import {
  type Kornyezet,
  type KimenoCsatorna,
  type Feliratozo,
} from "@km/esemeny-core";
import { sqliteEsemeny } from "./sqlite-esemeny.js";

/** Az eseménynapló-modul `Kornyezet`-ének összeállítása SQLite tárral.
 *  `ora.most` ISO string, `azonosito.uj` UUID.
 *  A csatorna alapból `{ kuld: async () => ({ ok: false, hiba: "NINCS_CSATORNA" }) }`.
 *  A felirat alapból a kulcsot adja vissza. */
export function esemenyKornyezet(
  utvonal: string,
  opciok?: { csatorna?: KimenoCsatorna; felirat?: Feliratozo }
): Kornyezet & { zar(): void } {
  const { tar, ertesites, zar } = sqliteEsemeny(utvonal);

  const alapCsatorna: KimenoCsatorna = {
    kuld: async () => ({ ok: false, hiba: "NINCS_CSATORNA" }),
  };

  const alapFelirat: Feliratozo = (kulcs: string) => kulcs;

  return {
    tar,
    ertesites,
    ora: {
      most: () => new Date().toISOString(),
    },
    azonosito: {
      uj: () => randomUUID(),
    },
    csatorna: opciok?.csatorna ?? alapCsatorna,
    felirat: opciok?.felirat ?? alapFelirat,
    zar,
  };
}
