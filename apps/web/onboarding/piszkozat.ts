import "server-only";
import { eq } from "drizzle-orm";
import { OnboardingPiszkozat, type PiszkozatValasz, URES_PISZKOZAT, type HibaKod } from "@km/contracts";
import { sema, szervezetKent } from "../adatbazis/kapcsolat";

export type Eredmeny<T> = { ok: true; ertek: T } | { ok: false; hiba: HibaKod; mezok?: Record<string, string> };

/** A szervezet piszkozata — csak `szervezetKent` alatt látszik (sorszintű védelem). */
export async function piszkozatBetolt(szervezetId: string): Promise<PiszkozatValasz> {
  return szervezetKent(szervezetId, async (tx) => {
    const sorok = await tx.select().from(sema.onboardingPiszkozat).where(eq(sema.onboardingPiszkozat.szervezetId, szervezetId)).limit(1);
    const sor = sorok[0];
    if (!sor) return { piszkozat: URES_PISZKOZAT, frissitve: null };
    const ertek = OnboardingPiszkozat.safeParse(sor.adatok);
    if (!ertek.success) {
      console.error("Hibás piszkozat-tartalom, üres piszkozat megy helyette:", ertek.error.issues);
      return { piszkozat: URES_PISZKOZAT, frissitve: null };
    }
    return { piszkozat: ertek.data, frissitve: sor.frissitve.toISOString() };
  });
}

/** A teljes piszkozat mentése (beszúrás vagy frissítés), `szervezetKent` alatt. */
export async function piszkozatMent(szervezetId: string, be: unknown): Promise<Eredmeny<PiszkozatValasz>> {
  const ertek = OnboardingPiszkozat.safeParse(be);
  if (!ertek.success) {
    const mezok: Record<string, string> = {};
    for (const p of ertek.error.issues) { const ut = p.path.join("."); if (ut && !mezok[ut]) mezok[ut] = p.code; }
    return { ok: false, hiba: "ERVENYTELEN_ADAT", mezok };
  }
  const most = new Date();
  return szervezetKent(szervezetId, async (tx) => {
    const sorok = await tx
      .insert(sema.onboardingPiszkozat)
      .values({ szervezetId, adatok: ertek.data, frissitve: most })
      .onConflictDoUpdate({ target: sema.onboardingPiszkozat.szervezetId, set: { adatok: ertek.data, frissitve: most } })
      .returning({ frissitve: sema.onboardingPiszkozat.frissitve });
    const frissitve = sorok[0]?.frissitve ?? most;
    return { ok: true, ertek: { piszkozat: ertek.data, frissitve: frissitve.toISOString() } };
  });
}
