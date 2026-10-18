import "server-only";
// c30 F9, D7 (Csilla 2026-10-17): az albumfotó 30 napig él, mentés nélkül; utána a `_torolni/` alá KÖLTÖZIK (nem törlünk — a
// törlés Csilla kattintása). A háttérfuttató óránként hívja (hirfigyelo/futtato.ts, az órai takarítással együtt).
//
// Hogyan, munkatérközi adatbázis-függvény NÉLKÜL: a munkatereket a lemezről olvassuk (<ALBUM_MAPPA>/<szervezet_id>/ — csak uuid nevű
// mappa számít), és mindegyiknél a SAJÁT jogán (`szervezetKent`) nézzük meg a sorait. Így a sorszintű védelem nem kap kivételt.
//
// Sorrend fotónként: a fájl(ok) át a <ALBUM_MAPPA>/_torolni/<szervezet_id>/ alá → a sor `elemzes.kiveve` jelet kap. Ha a jelölés
// elmarad (leállás), a következő kör a hiányzó fájlt látja, és csak jelöl: ismételhető. A `kicsi` a párjával megy.
//
// „Használat” (D7: „30 nap nem használva, vagy 30 nappal a Kitettem után”): az F9-ben még egyetlen poszt sem hivatkozik albumfotóra
// (a poszt fotósora az F10-ben jön: `TipusAdat.album.fotok`), ezért most minden fotó a feltöltése után 30 nappal megy. Az F10 a
// `hasznalat` bemenetet tölti ki a posztokból (utolsó módosítás, „Kitettem”); a szabály (album/szabaly.ts `albumLejart`) már ezt várja.
import { mkdir, readdir, rename, access } from "node:fs/promises";
import { join } from "node:path";
import { KITERJESZTES, type FajlTipus } from "@rogton/fajl-core";
import { sql } from "drizzle-orm";
import { szervezetKent } from "../adatbazis/kapcsolat";
import { albumMappa } from "../fajl/tar";
import { albumElemzes, albumLejart } from "./szabaly";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type AlbumHasznalatJel = Map<string, { hasznalva?: string | null; kitettem?: string | null }>;

async function van(ut: string): Promise<boolean> {
  try { await access(ut); return true; } catch { return false; }
}

/** Egy kör. Visszaadja, hány fotó (sor) költözött, hány munkateret nézett meg, és hánynál volt hiba (az a következő órában újra jön). */
export async function albumKoltoztet(
  most: Date = new Date(),
  hasznalat: (szervezetId: string) => Promise<AlbumHasznalatJel> = async () => new Map(),
): Promise<{ koltozott: number; munkater: number; hibas: number }> {
  const alap = albumMappa();
  let nevek: string[];
  try {
    nevek = (await readdir(alap, { withFileTypes: true })).filter((d) => d.isDirectory() && UUID.test(d.name)).map((d) => d.name);
  } catch {
    return { koltozott: 0, munkater: 0, hibas: 0 }; // nincs még album mappa
  }
  let koltozott = 0;
  let hibas = 0;
  for (const szervezetId of nevek) {
    // egy munkatér hibája (jog, lemez) nem állítja meg a többit: naplósor, és a következő órában újra
    try {
      koltozott += await munkaterKoltoztet(alap, szervezetId, most, await hasznalat(szervezetId));
    } catch (h) {
      hibas += 1;
      console.error(`[album] költöztetés hiba (${szervezetId}):`, h);
    }
  }
  return { koltozott, munkater: nevek.length, hibas };
}

async function munkaterKoltoztet(alap: string, szervezetId: string, most: Date, jel: AlbumHasznalatJel): Promise<number> {
  const sorok = await szervezetKent(szervezetId, async (tx) => {
    const e = await tx.execute(sql`
      SELECT id, tipus, feltoltve, elemzes FROM arculat_fajl
      WHERE szervezet_id = ${szervezetId}::uuid AND cel = 'album' AND (elemzes->>'kiveve') IS NULL`);
    return ((e as { rows?: Record<string, unknown>[] }).rows ?? (e as unknown as Record<string, unknown>[])).map((r) => ({
      id: String(r.id), tipus: String(r.tipus) as FajlTipus,
      feltoltve: r.feltoltve instanceof Date ? r.feltoltve.toISOString() : new Date(String(r.feltoltve)).toISOString(),
      elemzes: albumElemzes(r.elemzes),
    }));
  });
  const nagyok = new Map(sorok.filter((s) => !s.elemzes?.kicsi).map((s) => [s.id, s]));
  const megy = new Set<string>();
  for (const s of nagyok.values()) {
    if (albumLejart({ feltoltve: s.feltoltve, ...jel.get(s.id) }, most)) megy.add(s.id);
  }
  for (const s of sorok) {
    if (!s.elemzes?.kicsi) continue;
    const par = s.elemzes.par ? nagyok.get(s.elemzes.par) : undefined;
    // a `kicsi` a párjával; ha a pár már nincs (kivett vagy hiányzik), a saját feltöltési ideje szerint
    if (par ? megy.has(par.id) : albumLejart({ feltoltve: s.feltoltve }, most)) megy.add(s.id);
  }
  if (megy.size === 0) return 0;
  return sorokKoltoztet(alap, szervezetId, sorok.filter((s) => megy.has(s.id)), most);
}

/** A sorok fájljai a `_torolni/<szervezet>/` alá, a sorok `kiveve` jelet kapnak. Ismételhető (hiányzó fájl: csak jelöl). */
async function sorokKoltoztet(alap: string, szervezetId: string, sorok: { id: string; tipus: FajlTipus }[], most: Date): Promise<number> {
  if (sorok.length === 0) return 0;
  const cel = join(/*turbopackIgnore: true*/ alap, "_torolni", szervezetId);
  await mkdir(cel, { recursive: true });
  const kiveve = most.toISOString();
  let koltozott = 0;
  for (const s of sorok) {
    const fajl = `${s.id}.${KITERJESZTES[s.tipus]}`;
    const honnan = join(/*turbopackIgnore: true*/ alap, szervezetId, fajl);
    if (await van(honnan)) await rename(honnan, join(/*turbopackIgnore: true*/ cel, fajl));
    await szervezetKent(szervezetId, (tx) => tx.execute(sql`
      UPDATE arculat_fajl SET elemzes = coalesce(elemzes, '{}'::jsonb) || jsonb_build_object('kiveve', ${kiveve}::text)
      WHERE szervezet_id = ${szervezetId}::uuid AND id = ${s.id}::uuid`));
    koltozott += 1;
  }
  return koltozott;
}

/**
 * c30 F10 (Csilla 10-17, döntés 1): a sorrend-lap „Kiveszem”-je — a fotó kikerül a posztból, és a tárból (a `kicsi` párjával) a
 * `_torolni/` alá költözik: helyet szabadít fel a kvótában, de nem törlődik (a telefonon is megmarad). Csak a munkatér saját, még nem
 * kivett albumfotója; különben false.
 */
export async function albumFotoKivesz(szervezetId: string, fajlId: string, most: Date = new Date()): Promise<boolean> {
  const sorok = await szervezetKent(szervezetId, async (tx) => {
    const e = await tx.execute(sql`
      SELECT id, tipus FROM arculat_fajl
      WHERE szervezet_id = ${szervezetId}::uuid AND cel = 'album' AND (elemzes->>'kiveve') IS NULL
        AND (id = ${fajlId}::uuid OR elemzes->>'par' = ${fajlId})`);
    return ((e as { rows?: Record<string, unknown>[] }).rows ?? (e as unknown as Record<string, unknown>[])).map((r) => ({ id: String(r.id), tipus: String(r.tipus) as FajlTipus }));
  });
  if (!sorok.some((s) => s.id === fajlId)) return false;
  await sorokKoltoztet(albumMappa(), szervezetId, sorok, most);
  return true;
}
