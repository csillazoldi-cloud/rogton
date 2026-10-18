import "server-only";
// R-13 (2026-09-22, Vilmos): a kreditrendszer a webalkalmazásban — nyilvántartás, terhelés, egyenleg, beállítás.
// A szabályok tisztán a `./szabaly`-ban (DeepSeek írta, próbákkal); itt csak a tárolás és a bekötés.
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, sema, szervezetKent } from "../adatbazis/kapcsolat";
import { ALAP_MUNKATER_HAVI, MUVELET_AR, haviKeretek, honapKulcs, indithato, maradt, megoszt, type Egyenleg } from "./szabaly";
import type { KreditekNezet, SajatKredit } from "./tipusok";

/** Ezredből kredit (három tizedesig) — a végpontok és a képernyők ugyanígy kerekítenek. */
const kr = (ezred: number): number => Math.round(ezred) / 1000;

export type TagKredit = { fiok_id: string; kulon: number | null; keret: number; felhasznalt: number }; // keret/felhasznalt: ezred
export type KreditAllapot = {
  honap: string;
  munkater: { havi: number; keret: number; felhasznalt: number; kiosztott: number }; // havi: kredit; a többi ezred
  tagok: TagKredit[];
};

/** A munkatér és minden tag egyenlege ebben a hónapban. */
export async function kreditAllapot(szervezetId: string, most: Date = new Date()): Promise<KreditAllapot> {
  const honap = honapKulcs(most);
  return szervezetKent(szervezetId, async (tx) => {
    const [sz] = await tx.select({ havi: sema.szervezet.kreditHavi }).from(sema.szervezet).where(eq(sema.szervezet.id, szervezetId)).limit(1);
    const havi = sz?.havi ?? ALAP_MUNKATER_HAVI;
    const tagsorok = await tx
      .select({ fiokId: sema.tagsag.fiokId, kulon: sema.tagsag.kreditHavi, letrehozva: sema.tagsag.letrehozva })
      .from(sema.tagsag)
      .where(eq(sema.tagsag.szervezetId, szervezetId))
      .orderBy(sema.tagsag.letrehozva);
    const hasznalat = await tx
      .select({ fiokId: sema.kreditMozgas.fiokId, ezred: sql<number>`coalesce(sum(${sema.kreditMozgas.ezred}), 0)::int` })
      .from(sema.kreditMozgas)
      .where(and(eq(sema.kreditMozgas.szervezetId, szervezetId), eq(sema.kreditMozgas.honap, honap)))
      .groupBy(sema.kreditMozgas.fiokId);
    const keretek = haviKeretek(havi, tagsorok.map((t) => ({ fiok_id: t.fiokId, kulon: t.kulon === null ? null : Number(t.kulon) })));
    const tagok: TagKredit[] = tagsorok.map((t) => ({
      fiok_id: t.fiokId,
      kulon: t.kulon === null ? null : Number(t.kulon),
      keret: keretek.get(t.fiokId) ?? 0,
      felhasznalt: Number(hasznalat.find((h) => h.fiokId === t.fiokId)?.ezred ?? 0),
    }));
    const osszesFelhasznalt = hasznalat.reduce((s, h) => s + Number(h.ezred), 0);
    return {
      honap,
      munkater: { havi, keret: havi * 1000, felhasznalt: osszesFelhasznalt, kiosztott: tagok.reduce((s, t) => s + t.keret, 0) },
      tagok,
    };
  });
}

/** Egy tag egyenlege (ezred) és a munkateré. */
export async function tagEgyenleg(szervezetId: string, fiokId: string): Promise<{ tag: Egyenleg; munkater: Egyenleg; honap: string }> {
  const a = await kreditAllapot(szervezetId);
  const t = a.tagok.find((x) => x.fiok_id === fiokId);
  return { tag: { keret: t?.keret ?? 0, felhasznalt: t?.felhasznalt ?? 0 }, munkater: { keret: a.munkater.keret, felhasznalt: a.munkater.felhasznalt }, honap: a.honap };
}

/** Indíthat-e AI-műveletet ez a tag (neki is és a munkatérnek is maradt). */
export async function kreditVan(szervezetId: string, fiokId: string): Promise<boolean> {
  const e = await tagEgyenleg(szervezetId, fiokId);
  return indithato(e.tag, e.munkater);
}

/** A munkatér azon tagjai, akiknek maradt kreditje (ha a munkatérnek magának nincs, senki). */
export async function kreditesTagok(szervezetId: string): Promise<Set<string>> {
  const a = await kreditAllapot(szervezetId);
  if (maradt({ keret: a.munkater.keret, felhasznalt: a.munkater.felhasznalt }) <= 0) return new Set();
  return new Set(a.tagok.filter((t) => maradt(t) > 0).map((t) => t.fiok_id));
}

/** Terhelés: `kredit` (alap 1) szétosztva a fiókok között (ezredre pontosan). Hiba esetén csak naplóz — a munka nem bukik el rajta. */
export async function kreditTerhel(szervezetId: string, fiokok: string[], feladat: string, kredit: number = MUVELET_AR): Promise<void> {
  if (fiokok.length === 0) return;
  try {
    const honap = honapKulcs(new Date());
    const reszek = megoszt(kredit, fiokok);
    const sorok = [...reszek.entries()].filter(([, ezred]) => ezred > 0).map(([fiokId, ezred]) => ({ szervezetId, fiokId, honap, ezred, feladat }));
    if (sorok.length === 0) return;
    await szervezetKent(szervezetId, async (tx) => {
      await tx.insert(sema.kreditMozgas).values(sorok);
    });
  } catch (hiba) {
    console.error("[kredit] terhelés sikertelen:", feladat, hiba);
  }
}

/** A tulajdonos: egy tag havi kreditje (szám), vagy vissza az egyenlő részre (null). */
export async function tagKreditAllit(szervezetId: string, fiokId: string, havi: number | null): Promise<boolean> {
  return szervezetKent(szervezetId, async (tx) => {
    const e = await tx
      .update(sema.tagsag)
      .set({ kreditHavi: havi === null ? null : Math.max(0, havi).toFixed(3) })
      .where(and(eq(sema.tagsag.szervezetId, szervezetId), eq(sema.tagsag.fiokId, fiokId)))
      .returning({ fiokId: sema.tagsag.fiokId });
    return e.length > 0;
  });
}

/** A rendszergazda: egy munkatér havi kreditje (null = az alap). A jogot az API ellenőrzi. */
export async function munkaterKreditAllit(szervezetId: string, havi: number | null): Promise<void> {
  await db().execute(sql`SELECT kredit_havi_allit(${szervezetId}::uuid, ${havi === null ? null : Math.max(0, Math.round(havi))}::integer)`);
}

/** A rendszergazda: minden munkatér havi kreditje és felhasználása. */
export async function kreditOsszes(most: Date = new Date()): Promise<{ szervezet_id: string; havi: number; felhasznalt: number }[]> {
  const e = await db().execute(sql`SELECT * FROM kredit_osszes(${honapKulcs(most)})`);
  const sorok = (e as unknown as { rows: { szervezet_id: string; kredit_havi: number | null; felhasznalt_ezred: string | number }[] }).rows;
  return sorok.map((r) => ({ szervezet_id: r.szervezet_id, havi: r.kredit_havi ?? ALAP_MUNKATER_HAVI, felhasznalt: Number(r.felhasznalt_ezred) }));
}

/** A saját felhasználás bontása feladatcsoportonként (hírek · posztszöveg · Iránytű · egyéb), ezredben. */
export async function sajatBontas(szervezetId: string, fiokId: string, most: Date = new Date()): Promise<Record<"hirek" | "poszt" | "iranytu" | "egyeb", number>> {
  const honap = honapKulcs(most);
  const sorok = await szervezetKent(szervezetId, async (tx) =>
    tx
      .select({ feladat: sema.kreditMozgas.feladat, ezred: sql<number>`coalesce(sum(${sema.kreditMozgas.ezred}), 0)::int` })
      .from(sema.kreditMozgas)
      .where(and(eq(sema.kreditMozgas.szervezetId, szervezetId), eq(sema.kreditMozgas.fiokId, fiokId), eq(sema.kreditMozgas.honap, honap)))
      .groupBy(sema.kreditMozgas.feladat),
  );
  const ki = { hirek: 0, poszt: 0, iranytu: 0, egyeb: 0 };
  for (const s of sorok) {
    const n = Number(s.ezred);
    if (s.feladat.startsWith("hf_")) ki.hirek += n;
    else if (s.feladat.startsWith("poszt_")) ki.poszt += n;
    else if (s.feladat.startsWith("iranytu_")) ki.iranytu += n;
    else ki.egyeb += n;
  }
  return ki;
}

/** R-13 képernyők: a saját kreditem ebben a hónapban (Saját fiók, Kezdőlap, Hírek, Posztszöveg) — ugyanaz, mint a `GET /api/kredit/sajat`,
 *  plusz `elfogyott` (a tag VAGY a munkatér kreditje elfogyott: ugyanaz a döntés, mint a `keretEllenoriz`-ben, kredit/szabaly `indithato`). */
export async function sajatKredit(szervezetId: string, fiokId: string, most: Date = new Date()): Promise<SajatKredit> {
  const a = await kreditAllapot(szervezetId, most);
  const t = a.tagok.find((x) => x.fiok_id === fiokId);
  const b = await sajatBontas(szervezetId, fiokId, most);
  const keret = t?.keret ?? 0;
  const felhasznalt = t?.felhasznalt ?? 0;
  const munkater = { keret: a.munkater.keret, felhasznalt: a.munkater.felhasznalt };
  return {
    honap: a.honap,
    havi: kr(keret),
    felhasznalt: kr(felhasznalt),
    maradt: kr(maradt({ keret, felhasznalt })),
    elfogyott: !indithato({ keret, felhasznalt }, munkater),
    kulon_megadott: t?.kulon !== null && t?.kulon !== undefined,
    munkater_elfogyott: a.munkater.felhasznalt >= a.munkater.keret,
    bontas: { hirek: kr(b.hirek), poszt: kr(b.poszt), iranytu: kr(b.iranytu), egyeb: kr(b.egyeb) },
  };
}

/** R-13 Kreditek nézet (/tagok/kreditek): a munkatér és minden tag — ugyanaz, mint a `GET /api/kredit/tagok` (csak a tulajdonos hívja). */
export async function kreditekNezet(szervezetId: string, sajatFiokId: string): Promise<KreditekNezet> {
  const a = await kreditAllapot(szervezetId);
  const idk = a.tagok.map((t) => t.fiok_id);
  const nevek = idk.length > 0 ? await db().select({ id: sema.fiok.id, nev: sema.fiok.nev }).from(sema.fiok).where(inArray(sema.fiok.id, idk)) : [];
  const szerepek = await szervezetKent(szervezetId, (tx) =>
    tx.select({ fiokId: sema.tagsag.fiokId, szerep: sema.tagsag.szerep }).from(sema.tagsag).where(eq(sema.tagsag.szervezetId, szervezetId)));
  return {
    honap: a.honap,
    munkater: { havi: a.munkater.havi, felhasznalt: kr(a.munkater.felhasznalt), kiosztott: kr(a.munkater.kiosztott), kiosztatlan: kr(Math.max(0, a.munkater.keret - a.munkater.kiosztott)) },
    tagok: a.tagok.map((t) => ({
      fiok_id: t.fiok_id,
      nev: nevek.find((n) => n.id === t.fiok_id)?.nev ?? "",
      szerep: (szerepek.find((s) => s.fiokId === t.fiok_id)?.szerep ?? "nezo") as KreditekNezet["tagok"][number]["szerep"],
      kulon: t.kulon,
      havi: kr(t.keret),
      felhasznalt: kr(t.felhasznalt),
      maradt: kr(maradt(t)),
    })),
    sajat_fiok_id: sajatFiokId,
  };
}
