import "server-only";
// R-13 (2026-09-22, Vilmos): a hírszűrés fiókonként — fokozat (nagyon szigorú · közepes · laza) és előszűrés (be/ki).
// Ha egy tagnak nincs sora, az alap (nagyon szigorú + be) — a mai viselkedés.
import { eq } from "drizzle-orm";
import { ALAP_SZURES, TagSzures, type SzuresFokozat } from "@km/news-monitor-core";
import { sema, szervezetKent } from "../adatbazis/kapcsolat";

/** A munkatér MINDEN tagjának szűrő-beállítása (a gép ezek uniója szerint olvas). */
export async function tagSzuresek(szervezetId: string): Promise<TagSzures[]> {
  return szervezetKent(szervezetId, async (tx) => {
    const tagok = await tx.select({ fiokId: sema.tagsag.fiokId }).from(sema.tagsag).where(eq(sema.tagsag.szervezetId, szervezetId));
    const sorok = await tx.select().from(sema.hfTagSzures).where(eq(sema.hfTagSzures.szervezetId, szervezetId));
    return tagok.map((t) => {
      const s = sorok.find((x) => x.fiokId === t.fiokId);
      return { fiok_id: t.fiokId, fokozat: (s?.fokozat ?? ALAP_SZURES.fokozat) as SzuresFokozat, eloszures: s?.eloszures ?? ALAP_SZURES.eloszures };
    });
  });
}

/** Egy tag beállítása (ha nincs sora, az alap). */
export async function tagSzures(szervezetId: string, fiokId: string): Promise<TagSzures> {
  const mind = await tagSzuresek(szervezetId);
  return mind.find((t) => t.fiok_id === fiokId) ?? { fiok_id: fiokId, ...ALAP_SZURES };
}

/** A saját beállítás mentése. */
export async function tagSzuresMent(szervezetId: string, fiokId: string, be: { fokozat: SzuresFokozat; eloszures: boolean }): Promise<TagSzures> {
  await szervezetKent(szervezetId, async (tx) => {
    await tx
      .insert(sema.hfTagSzures)
      .values({ szervezetId, fiokId, fokozat: be.fokozat, eloszures: be.eloszures, modositva: new Date() })
      .onConflictDoUpdate({
        target: [sema.hfTagSzures.szervezetId, sema.hfTagSzures.fiokId],
        set: { fokozat: be.fokozat, eloszures: be.eloszures, modositva: new Date() },
      });
  });
  return { fiok_id: fiokId, ...be };
}
