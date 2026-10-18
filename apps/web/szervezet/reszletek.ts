import "server-only";
import { eq } from "drizzle-orm";
import type { SzervezetReszletek } from "@rogton/contracts";
import { db, sema, szervezetKent } from "../adatbazis/kapcsolat";

/** A szervezet és tagjai a fiókoldalhoz (E-10). `szervezetKent` alatt: csak a saját szervezet látszik. */
export async function szervezetReszletek(szervezetId: string): Promise<SzervezetReszletek | null> {
  return szervezetKent(szervezetId, async (tx) => {
    const szervezetSorok = await tx
      .select({ id: sema.szervezet.id, nev: sema.szervezet.nev, letrehozva: sema.szervezet.letrehozva })
      .from(sema.szervezet)
      .where(eq(sema.szervezet.id, szervezetId))
      .limit(1);
    const szervezetSor = szervezetSorok[0];
    if (!szervezetSor) return null;

    const tagSorok = await tx
      .select({ fiok_id: sema.tagsag.fiokId, nev: sema.fiok.nev, szerep: sema.tagsag.szerep })
      .from(sema.tagsag)
      .innerJoin(sema.fiok, eq(sema.fiok.id, sema.tagsag.fiokId))
      .where(eq(sema.tagsag.szervezetId, szervezetId))
      .orderBy(sema.tagsag.letrehozva);

    return {
      id: szervezetSor.id,
      nev: szervezetSor.nev,
      letrehozva: szervezetSor.letrehozva.toISOString(),
      tagok: tagSorok.map((t) => ({ fiok_id: t.fiok_id, nev: t.nev, szerep: t.szerep })),
    };
  });
}

/** R-2 (D-F30/4): egy fiók neve az azonosítójából — a jóváhagyás melletti név akkor is megmarad, ha az embert eltávolították a munkatérből. */
export async function fiokNeve(fiokId: string | null | undefined): Promise<string> {
  if (!fiokId) return "";
  const sor = (await db().select({ nev: sema.fiok.nev }).from(sema.fiok).where(eq(sema.fiok.id, fiokId)).limit(1))[0];
  return sor?.nev ?? "";
}
