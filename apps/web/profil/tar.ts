import "server-only";
import { eq, sql } from "drizzle-orm";
import { profilMentesre, profilMezokEllenoriz, profilTureloOlvas, type ProfilTar } from "@km/profile-core";
import { sema, szervezetKent, type SzervezetDb } from "../adatbazis/kapcsolat";

// A profil TÁROLÁSA a befogadó alkalmazásban (ALAPTERV 3.: adatgazda a host; a szabályok a profile-core-ban).
// Más modul ezt a táblát közvetlenül nem írja — csak ezen a kapun át (R: „más modul tábláját szerződés nélkül írni tilos").
//
// c30 F0 (docs/terv/FESZTIVAL-ES-NYELVI-MOD-TERV.md §8 risks 1, 2, 4; docs/decisions/2026-10-17-c30-f0-profil-biztositek.md):
//  - `betolt` is tolerant: a bad or unknown non-core field never turns an existing profile into null (null used to mean
//    "not onboarded" → redirect to onboarding → re-approval overwrote the profile). Null ONLY for: no row (or not visible under
//    RLS), stored jsonb not an object, a core field missing/invalid (`PROFIL_MAG` in profile-core). Those cases are logged.
//  - `ment` keeps stored keys this version cannot represent (unknown, or unparseable): `profilMentesre`.
//  - `mezoMent` is the merge write for new code: `adatok = adatok || patch`, inside `szervezetKent` (RLS decides which row).
export const profilTar: ProfilTar = {
  async betolt(szervezetId) {
    return szervezetKent(szervezetId, async (tx) => {
      const sorok = await tx.select().from(sema.szervezetProfil).where(eq(sema.szervezetProfil.szervezetId, szervezetId)).limit(1);
      const sor = sorok[0];
      if (!sor) return null;
      const e = profilTureloOlvas(sor.adatok);
      if (!e.ok) { console.error(`[profil] ${szervezetId}: a tárolt profil nem olvasható (${e.ok_hiba}):`, e.mezok); return null; }
      if (e.kihagyott.length) console.warn(`[profil] ${szervezetId}: betöltve, kimaradt (olvashatatlan, az adatbázisban marad):`, e.kihagyott);
      return e.profil;
    });
  },
  async ment(szervezetId, profil) {
    const most = new Date();
    await szervezetKent(szervezetId, async (tx) => {
      // F0: a tárolt sor zárva olvasva — amit ez a változat nem ismer / nem tud olvasni, és az új profil nem hoz, az megmarad
      const tarolt = (await tx.select({ adatok: sema.szervezetProfil.adatok }).from(sema.szervezetProfil)
        .where(eq(sema.szervezetProfil.szervezetId, szervezetId)).limit(1).for("update"))[0];
      const { adatok, megorzott } = profilMentesre(tarolt?.adatok, profil);
      if (megorzott.length) console.warn(`[profil] ${szervezetId}: mentés, megőrzött ismeretlen/olvashatatlan mezők:`, megorzott);
      await tx.insert(sema.szervezetProfil)
        .values({ szervezetId, adatok, jovahagyva: new Date(profil.jovahagyva), jovahagyta: profil.jovahagyta, frissitve: most })
        .onConflictDoUpdate({ target: sema.szervezetProfil.szervezetId, set: { adatok, jovahagyva: new Date(profil.jovahagyva), jovahagyta: profil.jovahagyta, frissitve: most } });
    });
  },
  async mezoMent(szervezetId, patch) {
    const e = profilMezokEllenoriz(patch);
    if (!e.ok) return { ok: false, hiba: "ERVENYTELEN_ADAT", mezok: e.mezok };
    const sorok = await szervezetKent(szervezetId, (tx) => mezoMentTx(tx, szervezetId, e.patch));
    return { ok: true, sorok };
  },
};

/**
 * The merge write itself, on a transaction that already carries the tenant context (`szervezetKent`). Exported for the A-11
 * test, which runs it as km_app under ANOTHER org's context and must see 0 rows updated. The patch must come from
 * `profilMezokEllenoriz`. Returns the number of rows updated (0 = no profile row, or not visible under RLS). Only UPDATE:
 * a merge never creates a profile. The `frissitve` column is set; the jsonb `frissitve` only if the patch carries it.
 */
export async function mezoMentTx(tx: SzervezetDb, szervezetId: string, patch: Record<string, unknown>): Promise<number> {
  const sorok = await tx.update(sema.szervezetProfil)
    .set({ adatok: sql`${sema.szervezetProfil.adatok} || ${JSON.stringify(patch)}::jsonb`, frissitve: new Date() })
    .where(eq(sema.szervezetProfil.szervezetId, szervezetId))
    .returning({ id: sema.szervezetProfil.szervezetId });
  return sorok.length;
}

/** The stored profile jsonb exactly as it is (unknown and unparseable keys included), or null if there is no row / it is not an
 *  object. Only for re-approval (`onboarding/jovahagyas.ts`): "the previous profile first, then the draft over it". */
export async function profilNyersen(szervezetId: string): Promise<Record<string, unknown> | null> {
  return szervezetKent(szervezetId, async (tx) => {
    const sor = (await tx.select({ adatok: sema.szervezetProfil.adatok }).from(sema.szervezetProfil)
      .where(eq(sema.szervezetProfil.szervezetId, szervezetId)).limit(1))[0];
    const a = sor?.adatok;
    return typeof a === "object" && a !== null && !Array.isArray(a) ? (a as Record<string, unknown>) : null;
  });
}

