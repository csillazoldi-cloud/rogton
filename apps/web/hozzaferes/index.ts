import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { HozzaferesEsemeny, Kornyezet, Szerep } from "@km/hozzaferes-core";
import { meghivoTar, tagsagTar } from "./tar";
import { esemenyKornyezet, feljegyezHatterben } from "../esemeny";

// A `@km/hozzaferes-core` befogadója (F-3): a portok Postgres-megvalósítása + a környezet összeállítása.
// A `HostKontextus` a `kapu()` eredményéből épül (lásd a végpontokat): { fiok_id, szervezet_id, szerep }.

export function hozzaferesKornyezet(): Kornyezet {
  return {
    tagsag: tagsagTar,
    meghivo: meghivoTar,
    ora: { most: () => new Date().toISOString() },
    azonosito: {
      uj: randomUUID,
      jegy: () => randomBytes(32).toString("base64url"),
      lenyomat: (j) => createHash("sha256").update(j).digest("hex"),
    },
    esemeny: async (e: HozzaferesEsemeny) => {
      // F-5: az eseménynaplóba (a fajták neve azonos a két modulban — ez a befogadó fordítása). Titok nincs az adatban (a jegy nem része az eseménynek).
      const { fajta, szervezet_id, ...tobbi } = e;
      const t = tobbi as Record<string, string | undefined>;
      const fiok_id = t["fiok_id"] ?? t["kiadta"] ?? t["visszavonta"] ?? t["allitotta"] ?? t["eltavolitotta"] ?? null;
      await feljegyezHatterben(await esemenyKornyezet(), { szervezet_id, fajta, fiok_id, adat: tobbi as Record<string, string | number | boolean | null> });
    },
  };
}

// A `kapu()` szerepe és a modul `Szerep`-e ugyanazok a szavak — a fordítás egy típus-átvitel.
// Ez a befogadó fordítása: a `_kapu.ts` `Szerep`-jét a modul `Szerep`-jévé alakítjuk.
export function szerepFordit(szerep: string): Szerep {
  return szerep as Szerep;
}
