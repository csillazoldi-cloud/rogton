import "server-only";
import { and, desc, eq, isNull, like } from "drizzle-orm";
import type { Esemeny, EsemenyTar, ErtesitesBeallitas, ErtesitesTar } from "@rogton/esemeny-core";
import { db, sema, szervezetKent } from "../adatbazis/kapcsolat";

// A `@rogton/esemeny-core` portjainak Postgres-megvalósítása (F-5, R-4).
// Az `esemeny` tábla km_app-szabálya a saját szervezet sorait ÉS a szervezet nélküli (fiók-/rendszer-) sorokat engedi;
// a `lista()` szervezetre szűr, a `rendszerLista()` a szervezet nélkülieket adja — azt csak a rendszergazda végpontja hívja (kapu).

function esemenySorbol(sor: { id: string; szervezetId: string | null; fajta: string; sulyossag: string; fiokId: string | null; ido: Date; adat: unknown }): Esemeny {
  return {
    id: sor.id,
    szervezet_id: sor.szervezetId,
    fajta: sor.fajta as Esemeny["fajta"],
    sulyossag: sor.sulyossag as Esemeny["sulyossag"],
    fiok_id: sor.fiokId,
    ido: sor.ido.toISOString(),
    adat: (typeof sor.adat === "object" && sor.adat !== null ? sor.adat : {}) as Esemeny["adat"],
  };
}

function beallitasSorbol(adat: unknown): ErtesitesBeallitas {
  return (typeof adat === "object" && adat !== null ? adat : {}) as ErtesitesBeallitas;
}

export const esemenyTar: EsemenyTar = {
  async ir(e) {
    const sor = { id: e.id, szervezetId: e.szervezet_id, fajta: e.fajta, sulyossag: e.sulyossag, fiokId: e.fiok_id, ido: new Date(e.ido), adat: e.adat };
    if (e.szervezet_id) await szervezetKent(e.szervezet_id, async (tx) => { await tx.insert(sema.esemeny).values(sor); });
    else await db().insert(sema.esemeny).values(sor);
  },
  async lista(szervezet_id, szuro) {
    return szervezetKent(szervezet_id, async (tx) => {
      const feltetel = szuro?.fajta
        ? and(eq(sema.esemeny.szervezetId, szervezet_id), eq(sema.esemeny.fajta, szuro.fajta))
        : eq(sema.esemeny.szervezetId, szervezet_id);
      const sorok = await tx.select().from(sema.esemeny).where(feltetel).orderBy(desc(sema.esemeny.ido)).limit(Math.min(szuro?.limit ?? 100, 500));
      return sorok.map(esemenySorbol);
    });
  },
  async rendszerLista(szuro) {
    const sorok = await db().select().from(sema.esemeny).where(isNull(sema.esemeny.szervezetId)).orderBy(desc(sema.esemeny.ido)).limit(Math.min(szuro?.limit ?? 100, 500));
    return sorok.map(esemenySorbol);
  },
};

export const ertesitesTar: ErtesitesTar = {
  async kozos() {
    const sor = (await db().select({ adat: sema.ertesitesBeallitas.adat }).from(sema.ertesitesBeallitas)
      .where(and(eq(sema.ertesitesBeallitas.szint, "kozos"), isNull(sema.ertesitesBeallitas.szervezetId))).limit(1))[0];
    return sor ? beallitasSorbol(sor.adat) : {};
  },
  async kozosMent(b) {
    // egy sor a közös szintnek: frissítés, ha van; különben beszúrás (az egyediséget a migráció függvény-indexe őrzi)
    const frissitve = await db().update(sema.ertesitesBeallitas).set({ adat: b, frissitve: new Date() })
      .where(and(eq(sema.ertesitesBeallitas.szint, "kozos"), isNull(sema.ertesitesBeallitas.szervezetId))).returning({ id: sema.ertesitesBeallitas.id });
    if (frissitve.length === 0) await db().insert(sema.ertesitesBeallitas).values({ szint: "kozos", szervezetId: null, adat: b });
  },
  async szervezeti(szervezet_id) {
    return szervezetKent(szervezet_id, async (tx) => {
      const sor = (await tx.select({ adat: sema.ertesitesBeallitas.adat }).from(sema.ertesitesBeallitas)
        .where(and(eq(sema.ertesitesBeallitas.szint, "szervezeti"), eq(sema.ertesitesBeallitas.szervezetId, szervezet_id))).limit(1))[0];
      return sor ? beallitasSorbol(sor.adat) : {};
    });
  },
  async szervezetiMent(szervezet_id, b) {
    await szervezetKent(szervezet_id, async (tx) => {
      const frissitve = await tx.update(sema.ertesitesBeallitas).set({ adat: b, frissitve: new Date() })
        .where(and(eq(sema.ertesitesBeallitas.szint, "szervezeti"), eq(sema.ertesitesBeallitas.szervezetId, szervezet_id))).returning({ id: sema.ertesitesBeallitas.id });
      if (frissitve.length === 0) await tx.insert(sema.ertesitesBeallitas).values({ szint: "szervezeti", szervezetId: szervezet_id, adat: b });
    });
  },
};

/** Az esemény-feliratok (`esemeny.*`) az alapnyelven, közvetlenül a `felirat` táblából — a kimenő üzenet szövegéhez. */
export async function alapFeliratok(nyelv: string): Promise<Record<string, string>> {
  const sorok = await db().select({ kulcs: sema.felirat.kulcs, szoveg: sema.felirat.szoveg }).from(sema.felirat)
    .where(and(eq(sema.felirat.nyelv, nyelv), like(sema.felirat.kulcs, "esemeny.%")));
  return Object.fromEntries(sorok.map((s) => [s.kulcs, s.szoveg]));
}
