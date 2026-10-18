import "server-only";
import { and, eq, sql } from "drizzle-orm";
import type { Meghivo, MeghivoTar, Tag, TagsagTar } from "@km/hozzaferes-core";
import { db, sema, szervezetKent } from "../adatbazis/kapcsolat";

// A `@km/hozzaferes-core` portjainak Postgres-megvalósítása (F-3).
// A `tagsag` és a `meghivo` táblát a `szervezetKent` alatt érjük el (sorszintű védelem).
// KIVÉTEL: a `lenyomatSzerint` a SECURITY DEFINER függvényt hívja — ott még nincs szervezet.

function tagSor(sor: { fiokId: string; szerep: string; csatlakozott: Date }): Tag {
  return { fiok_id: sor.fiokId, szerep: sor.szerep as Tag["szerep"], csatlakozott: sor.csatlakozott.toISOString() };
}

function meghivoSor(sor: {
  id: string;
  szervezetId: string;
  szerep: string;
  email: string | null;
  lenyomat: string;
  letrehozta: string;
  letrehozva: Date;
  lejar: Date;
  allapot: string;
  elfogadta: string | null;
  elfogadva: Date | null;
  visszavonva: Date | null;
}): Meghivo {
  return {
    id: sor.id,
    szervezet_id: sor.szervezetId,
    szerep: sor.szerep as Meghivo["szerep"],
    email: sor.email,
    lenyomat: sor.lenyomat,
    letrehozta: sor.letrehozta,
    letrehozva: sor.letrehozva.toISOString(),
    lejar: sor.lejar.toISOString(),
    allapot: sor.allapot as Meghivo["allapot"],
    elfogadta: sor.elfogadta,
    elfogadva: sor.elfogadva?.toISOString() ?? null,
    visszavonva: sor.visszavonva?.toISOString() ?? null,
  };
}

export const tagsagTar: TagsagTar = {
  async tagok(szervezet_id) {
    return szervezetKent(szervezet_id, async (tx) => {
      const sorok = await tx
        .select({
          fiokId: sema.tagsag.fiokId,
          szerep: sema.tagsag.szerep,
          csatlakozott: sema.tagsag.letrehozva, // a tagság `letrehozva` oszlopa = a csatlakozás ideje
        })
        .from(sema.tagsag)
        .where(eq(sema.tagsag.szervezetId, szervezet_id));
      return sorok.map(tagSor);
    });
  },

  async felvesz(szervezet_id, fiok_id, szerep, mikor) {
    await szervezetKent(szervezet_id, async (tx) => {
      await tx.insert(sema.tagsag).values({
        szervezetId: szervezet_id,
        fiokId: fiok_id,
        szerep,
        letrehozva: new Date(mikor),
      });
    });
  },

  async szerepAllit(szervezet_id, fiok_id, szerep) {
    await szervezetKent(szervezet_id, async (tx) => {
      await tx
        .update(sema.tagsag)
        .set({ szerep })
        .where(and(eq(sema.tagsag.szervezetId, szervezet_id), eq(sema.tagsag.fiokId, fiok_id)));
    });
  },

  async eltavolit(szervezet_id, fiok_id) {
    await szervezetKent(szervezet_id, async (tx) => {
      await tx
        .delete(sema.tagsag)
        .where(and(eq(sema.tagsag.szervezetId, szervezet_id), eq(sema.tagsag.fiokId, fiok_id)));
    });
  },
};

export const meghivoTar: MeghivoTar = {
  async ment(m) {
    await szervezetKent(m.szervezet_id, async (tx) => {
      await tx.insert(sema.meghivo).values({
        id: m.id,
        szervezetId: m.szervezet_id,
        szerep: m.szerep,
        email: m.email,
        lenyomat: m.lenyomat,
        letrehozta: m.letrehozta,
        letrehozva: new Date(m.letrehozva),
        lejar: new Date(m.lejar),
        allapot: m.allapot,
        elfogadta: m.elfogadta,
        elfogadva: m.elfogadva ? new Date(m.elfogadva) : null,
        visszavonva: m.visszavonva ? new Date(m.visszavonva) : null,
      });
    });
  },

  async frissit(m) {
    await szervezetKent(m.szervezet_id, async (tx) => {
      await tx
        .update(sema.meghivo)
        .set({
          allapot: m.allapot,
          elfogadta: m.elfogadta,
          elfogadva: m.elfogadva ? new Date(m.elfogadva) : null,
          visszavonva: m.visszavonva ? new Date(m.visszavonva) : null,
        })
        .where(eq(sema.meghivo.id, m.id));
    });
  },

  async azonositoSzerint(szervezet_id, id) {
    return szervezetKent(szervezet_id, async (tx) => {
      const sor = (
        await tx
          .select()
          .from(sema.meghivo)
          .where(and(eq(sema.meghivo.szervezetId, szervezet_id), eq(sema.meghivo.id, id)))
          .limit(1)
      )[0];
      return sor ? meghivoSor(sor) : null;
    });
  },

  // Munkatértől független: a SECURITY DEFINER függvényen át (elfogadásnál még nincs szervezet).
  async lenyomatSzerint(lenyomat) {
    // a node-postgres illesztő eredménye { rows } alakú, nem tömb (2026-09-12: az első próbakör ezen bukott — 404 minden jegyre)
    const eredmeny = await db().execute(sql`select * from meghivo_lenyomat_szerint(${lenyomat})`);
    const sor = ((eredmeny as unknown as { rows?: Array<Record<string, unknown>> }).rows ?? (eredmeny as unknown as Array<Record<string, unknown>>))[0];
    if (!sor) return null;
    return meghivoSor({
      id: sor.id as string,
      szervezetId: sor.szervezet_id as string,
      szerep: sor.szerep as string,
      email: (sor.email as string | null) ?? null,
      lenyomat: sor.lenyomat as string,
      letrehozta: sor.letrehozta as string,
      letrehozva: new Date(sor.letrehozva as string),
      lejar: new Date(sor.lejar as string),
      allapot: sor.allapot as string,
      elfogadta: (sor.elfogadta as string | null) ?? null,
      elfogadva: sor.elfogadva ? new Date(sor.elfogadva as string) : null,
      visszavonva: sor.visszavonva ? new Date(sor.visszavonva as string) : null,
    });
  },

  async lista(szervezet_id) {
    return szervezetKent(szervezet_id, async (tx) => {
      const sorok = await tx
        .select()
        .from(sema.meghivo)
        .where(eq(sema.meghivo.szervezetId, szervezet_id));
      return sorok.map(meghivoSor);
    });
  },
};
