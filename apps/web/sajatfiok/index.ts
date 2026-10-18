import "server-only";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import type { FiokNezet } from "@km/contracts";
import { db, sema, szervezetKent } from "../adatbazis/kapcsolat";
import { NAPLO_MEGORZES_NAP } from "../hitelesites/korlat";
import { olvasatlanSzam } from "../ertesites";
import type { BelepesSor, MunkaterSor, SajatFiokNezet } from "./tipusok";

export * from "./tipusok";

/** A Saját fiók lap adatforrása (R-3 v2): a fiók adatai, az utolsó belépések, a munkaterek és az olvasatlan értesítések. */
export async function sajatFiokNezet(
  fiok: FiokNezet,
  aktualisSzervezetId: string | null,
): Promise<SajatFiokNezet> {
  const utolsoSor = (
    await db()
      .select({ u: sema.fiok.utolsoBelepes })
      .from(sema.fiok)
      .where(eq(sema.fiok.id, fiok.id))
      .limit(1)
  )[0];
  const utolso_belepes = utolsoSor?.u ? utolsoSor.u.toISOString() : null;

  const hatar = new Date(Date.now() - NAPLO_MEGORZES_NAP * 24 * 60 * 60 * 1000);
  const belepesSorok = await db()
    .select({
      ido: sema.belepesiKiserlet.ido,
      cim: sema.belepesiKiserlet.cim,
      sikeres: sema.belepesiKiserlet.sikeres,
    })
    .from(sema.belepesiKiserlet)
    .where(
      and(
        eq(sema.belepesiKiserlet.fajta, "belepes"),
        eq(sema.belepesiKiserlet.email, fiok.email.toLowerCase()),
        gt(sema.belepesiKiserlet.ido, hatar),
      ),
    )
    .orderBy(desc(sema.belepesiKiserlet.ido))
    .limit(3);

  const belepesek: BelepesSor[] = belepesSorok.map((s) => ({
    ido: s.ido.toISOString(),
    cim: s.cim,
    sikeres: s.sikeres,
  }));

  const munkaterek: MunkaterSor[] = [];
  for (const sz of fiok.szervezetek) {
    let utolso_tulajdonos = false;
    if (sz.szerep === "tulajdonos") {
      try {
        const sor = (
          await szervezetKent(sz.id, (tx) =>
            tx
              .select({ n: sql<number>`count(*)::int` })
              .from(sema.tagsag)
              .where(and(eq(sema.tagsag.szervezetId, sz.id), eq(sema.tagsag.szerep, "tulajdonos"))),
          )
        )[0];
        utolso_tulajdonos = (sor?.n ?? 0) === 1;
      } catch (h) {
        console.error("[sajatfiok] tulajdonos szam:", h);
        utolso_tulajdonos = false;
      }
    }
    munkaterek.push({
      id: sz.id,
      nev: sz.nev,
      szerep: sz.szerep,
      aktualis: sz.id === aktualisSzervezetId,
      utolso_tulajdonos,
    });
  }

  const ertesites_olvasatlan = await olvasatlanSzam(fiok);

  return {
    fiok: {
      id: fiok.id,
      nev: fiok.nev,
      email: fiok.email,
      nyelv: fiok.nyelv,
      rendszergazda: fiok.rendszergazda,
    },
    utolso_belepes,
    belepesek,
    megorzes_nap: NAPLO_MEGORZES_NAP,
    munkaterek,
    ertesites_olvasatlan,
  };
}
