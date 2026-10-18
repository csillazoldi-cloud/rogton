import "server-only";
import { randomUUID } from "node:crypto";
import type { FajlEsemeny, Kornyezet } from "@rogton/fajl-core";
import { esemenyKornyezet, feljegyezHatterben } from "../esemeny";
import { fajlTar } from "./tar";

// A `@rogton/fajl-core` befogadója (F-6): a portok megvalósítása + a környezet összeállítása.

export function fajlKornyezet(): Kornyezet {
  return {
    tar: fajlTar,
    ora: { most: () => new Date().toISOString() },
    azonosito: { uj: randomUUID },
    esemeny: async (e: FajlEsemeny) => {
      // T-13 (F-5/F-6): az eseménynaplóba — a fajta neve azonos a két modulban (ez a befogadó fordítása). A bájtok és a fájlnév nem részei az
      // eseménynek: csak az azonosító, a felismert típus, a cél és a méret megy a naplóba (ADATUT 4. sor).
      const { fajta, szervezet_id, feltoltotte, ...tobbi } = e;
      await feljegyezHatterben(await esemenyKornyezet(), { szervezet_id, fajta, fiok_id: feltoltotte, adat: tobbi as Record<string, string | number | boolean | null> });
    },
  };
}
