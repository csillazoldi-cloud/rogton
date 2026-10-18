import "server-only";
import { eq } from "drizzle-orm";
import { ALAP_CSOMAG_KOD, Csomag, type Modul } from "@rogton/contracts";
import { db, sema, szervezetKent } from "../adatbazis/kapcsolat";

// F-7a (D-F35): a csomag-gépezet váza — melyik munkatér melyik modult használhatja. A pilotban egy csomag van („pilot", benne a Hírfigyelő),
// ár és fizetés nélkül. A kapu (`modulEngedelyezve`) már most valódi: ami nincs a csomagban, azt a végpont 403-mal utasítja el.

export * from "./tipusok";

/** A csomag sora a szótárból; ismeretlen kód → az alap csomag. */
async function csomagBetolt(kod: string): Promise<Csomag> {
  const sor = (await db().select().from(sema.csomag).where(eq(sema.csomag.kod, kod)).limit(1))[0]
    ?? (await db().select().from(sema.csomag).where(eq(sema.csomag.kod, ALAP_CSOMAG_KOD)).limit(1))[0];
  if (!sor) return { kod: ALAP_CSOMAG_KOD, modulok: [], ar_havi: null, penznem: null, forras_max: null };
  return Csomag.parse({
    kod: sor.kod,
    modulok: sor.modulok,
    ar_havi: sor.arHavi === null ? null : Number(sor.arHavi),
    penznem: sor.penznem,
    forras_max: sor.forrasMax ?? null,
  });
}

/** A munkatér csomagja (a szervezet sorából; a kódot a sorszintű védelem alatt olvassuk). */
export async function szervezetCsomag(szervezetId: string): Promise<Csomag> {
  const sor = await szervezetKent(szervezetId, async (tx) =>
    (await tx.select({ kod: sema.szervezet.csomagKod }).from(sema.szervezet).where(eq(sema.szervezet.id, szervezetId)).limit(1))[0]);
  return csomagBetolt(sor?.kod ?? ALAP_CSOMAG_KOD);
}

/** Használhatja-e a munkatér a modult? Hiba esetén igen — a kapu nem dőlhet el egy átmeneti adatbázis-hibán (naplózzuk). */
export async function modulEngedelyezve(szervezetId: string, modul: Modul): Promise<boolean> {
  try {
    const cs = await szervezetCsomag(szervezetId);
    return cs.modulok.includes(modul);
  } catch (h) {
    console.error("[csomag] modulEngedelyezve:", h);
    return true;
  }
}
