import { randomUUID, randomBytes, createHash } from "node:crypto";
import {
  type Kornyezet,
  type EsemenyKimenet,
  type HozzaferesEsemeny,
} from "@km/hozzaferes-core";
import { sqliteHozzaferes } from "./sqlite-hozzaferes.js";

/** A hozzáférés-modul `Kornyezet`-ének összeállítása SQLite tárral.
 *  `ora.most` ISO string, `azonosito.uj` UUID, jegy 32 bájt base64url, lenyomat SHA-256 hex.
 *  Az esemeny alapból konzolra ír `[hozzaferes]` előtaggal. */
export function hozzaferesKornyezet(
  utvonal: string,
  esemeny?: EsemenyKimenet
): Kornyezet & { zar(): void } {
  const { tagsag, meghivo, zar } = sqliteHozzaferes(utvonal);

  const alapEsemeny: EsemenyKimenet = (e: HozzaferesEsemeny) => {
    console.log(`[hozzaferes] ${e.fajta} ${e.szervezet_id}`);
  };

  return {
    tagsag,
    meghivo,
    ora: {
      most: () => new Date().toISOString(),
    },
    azonosito: {
      uj: () => randomUUID(),
      jegy: () => randomBytes(32).toString("base64url"),
      lenyomat: (jegy: string) => createHash("sha256").update(jegy).digest("hex"),
    },
    esemeny: esemeny ?? alapEsemeny,
    zar,
  };
}
