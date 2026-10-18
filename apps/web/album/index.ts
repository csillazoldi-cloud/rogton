import "server-only";
// c30 F9 — a fotóalbum tárolója (FESZTIVAL-ES-NYELVI-MOD-TERV §1.5, §6; döntés: docs/decisions/2026-10-17-c30-f9-album-tar.md).
// A fájl-modul (`@km/fajl-core`, 0.4.0) ellenőrzi a típust, a méretet és a képméretet; itt a munkatér korlátai (kvóta, sebesség,
// albumonkénti darab), a pár (`kicsi` → `nagy`) és a ZIP. A bájtok a `fajl/tar.ts`-en át az ALBUM_MAPPA alá kerülnek (D7: mentés nélkül).
import { ALBUM_KICSI_MAX_EL, KITERJESZTES, feltolt, type FajlHibaKod, type FajlMeta } from "@km/fajl-core";
import { sql } from "drizzle-orm";
import { szervezetKent } from "../adatbazis/kapcsolat";
import { fajlKornyezet } from "../fajl";
import { fajlTar } from "../fajl/tar";
import { ALBUM_SEBESSEG_PERC, albumBefer, albumElemzes, idoSzerint, type AlbumElemzes, type AlbumFoto, type AlbumHasznalat, zipNev } from "./szabaly";
import { zipFolyam, zipMeret } from "./zip";

export { albumFotoKivesz, albumKoltoztet } from "./koltoztet";
import type { AlbumHasznalatJel } from "./koltoztet";
export { ALBUM_FOTO_MAX, ALBUM_KVOTA_BAJT, ALBUM_MEGORZES_NAP, ALBUM_SEBESSEG_DB, ALBUM_SEBESSEG_PERC, AlbumKulcs } from "./szabaly";

type Sor = Record<string, unknown>;
function sorok(e: unknown): Sor[] {
  return ((e as { rows?: Sor[] }).rows ?? (e as Sor[])) as Sor[];
}

/** A munkatér albumának mostani számai (egy lekérdezés, a 0178-as `(szervezet_id, cel)` indexen). */
export async function albumHasznalat(szervezetId: string, album: string, most: Date): Promise<AlbumHasznalat> {
  const ablak = new Date(most.getTime() - ALBUM_SEBESSEG_PERC * 60_000);
  return szervezetKent(szervezetId, async (tx) => {
    const r = sorok(await tx.execute(sql`
      SELECT
        coalesce(sum(meret) FILTER (WHERE elemzes->>'kiveve' IS NULL), 0)::bigint AS bajt,
        count(*) FILTER (WHERE feltoltve > ${ablak.toISOString()}::timestamptz AND coalesce(elemzes->>'kicsi', 'false') <> 'true')::int AS utobbi,
        min(feltoltve) FILTER (WHERE feltoltve > ${ablak.toISOString()}::timestamptz AND coalesce(elemzes->>'kicsi', 'false') <> 'true') AS ablak_eleje,
        count(*) FILTER (WHERE elemzes->>'album' = ${album} AND elemzes->>'kiveve' IS NULL AND coalesce(elemzes->>'kicsi', 'false') <> 'true')::int AS albumban
      FROM arculat_fajl
      WHERE szervezet_id = ${szervezetId}::uuid AND cel = 'album'`))[0] ?? {};
    const eleje = r.ablak_eleje;
    return {
      bajt: Number(r.bajt ?? 0),
      utobbi: Number(r.utobbi ?? 0),
      albumban: Number(r.albumban ?? 0),
      ablakEleje: eleje instanceof Date ? eleje.toISOString() : typeof eleje === "string" ? new Date(eleje).toISOString() : null,
    };
  });
}

export type AlbumFeltoltHiba =
  | { ok: false; hiba: FajlHibaKod | "ALBUM_MEGTELT" | "ALBUM_TELE"; http: number }
  | { ok: false; hiba: "TUL_SOK_FELTOLTES"; http: 429; ujraPerc: number };

const FAJL_HTTP: Record<FajlHibaKod, number> = {
  NINCS_JOG: 403, SVG_NEM_ENGEDETT: 415, TIPUS_NEM_ENGEDETT: 415, TUL_NAGY: 413, URES: 400, NINCS_ILYEN_FAJL: 404, ERVENYTELEN_ADAT: 400,
};

/**
 * Egy fotó (a `nagy`, vagy — `par`-ral — a `kicsi` párja). Sorrend: a pár ellenőrzése → a munkatér korlátai → a fájl-modul
 * (típus, ≤ 2,5 MB, képméret; a `kicsi` ≤ 512 px) → a tár (ALBUM_MAPPA). Minden fotó külön kérés: ami megérkezett, megvan (TERV §6).
 */
export async function albumFotoFeltolt(
  ktx: { fiok_id: string; szervezet_id: string; szerep: "tulajdonos" | "szerkeszto" | "nezo" },
  be: { nev: string; album: string; par?: string | null; keszult?: string | null; bajtok: Uint8Array },
  most: Date = new Date(),
): Promise<{ ok: true; fajl: FajlMeta } | AlbumFeltoltHiba> {
  const kicsi = Boolean(be.par);
  if (be.par) {
    const p = await fajlTar.meta(ktx.szervezet_id, be.par).catch(() => null);
    const pe = p ? albumElemzes(p.elemzes) : null;
    // más munkatér fotója, nem album, maga is `kicsi`, már kivett, vagy másik album: nincs ilyen pár
    if (!p || p.cel !== "album" || !pe || pe.kicsi || pe.kiveve || pe.album !== be.album) return { ok: false, hiba: "NINCS_ILYEN_FAJL", http: 404 };
  }
  const h = await albumHasznalat(ktx.szervezet_id, be.album, most);
  const d = albumBefer(h, { meret: be.bajtok.length, kicsi }, most);
  if (!d.ok) return d;
  const elemzes: AlbumElemzes = {
    album: be.album,
    kicsi,
    ...(be.par ? { par: be.par } : {}),
    ...(be.keszult ? { keszult: be.keszult } : {}),
  };
  const e = await feltolt(fajlKornyezet(), ktx, {
    nev: be.nev, cel: "album", bajtok: be.bajtok, eredet: "feltoltes", elemzes,
    ...(kicsi ? { kepMaxEl: ALBUM_KICSI_MAX_EL } : {}),
  });
  if (!e.ok) return { ok: false, hiba: e.hiba, http: FAJL_HTTP[e.hiba] };
  return { ok: true, fajl: e.ertek };
}

/**
 * A ZIP (asztali gépen, TERV §6): a kért fotók a kért sorrendben, „01-…jpg” nevekkel. Csak a munkatér SAJÁT, ki nem vett albumfotói;
 * bármelyik nem ilyen (más munkatéré, nem album, kivett, nem létezik) → az egész kérés 404 (nem derül ki, melyik id létezik máshol).
 */
export async function albumZip(
  szervezetId: string,
  idk: string[],
): Promise<{ ok: true; folyam: ReadableStream<Uint8Array>; meret: number } | { ok: false; hiba: "NINCS_ILYEN_FAJL" }> {
  const metak: FajlMeta[] = [];
  for (const id of idk) {
    const m = await fajlTar.meta(szervezetId, id).catch(() => null);
    const e = m ? albumElemzes(m.elemzes) : null;
    if (!m || m.cel !== "album" || !e || e.kiveve) return { ok: false, hiba: "NINCS_ILYEN_FAJL" };
    metak.push(m);
  }
  const tetelek = metak.map((m, i) => {
    const e = albumElemzes(m.elemzes);
    return {
      nev: zipNev(i + 1, m.nev, KITERJESZTES[m.tipus]),
      ido: new Date(e?.keszult ?? m.feltoltve),
      meret: m.meret,
      bajtok: () => fajlTar.olvas(szervezetId, m.id),
    };
  });
  return { ok: true, folyam: zipFolyam(tetelek), meret: zipMeret(tetelek) };
}

/**
 * c30 F10: egy album (= egy poszt) fotói — a `nagy` sorok a `kicsi` párjuk id-jével, a készítés ideje szerint. A kivettek nem. A lap ebből
 * rajzolja a feltöltött fotókat (frissítés után is: ami megérkezett, megvan), a válogatás ebből dolgozik.
 */
export async function albumFotok(szervezetId: string, album: string): Promise<AlbumFoto[]> {
  const sorok = await szervezetKent(szervezetId, async (tx) => sorok_(await tx.execute(sql`
    SELECT id, nev, meret, feltoltve, elemzes FROM arculat_fajl
    WHERE szervezet_id = ${szervezetId}::uuid AND cel = 'album' AND elemzes->>'album' = ${album} AND (elemzes->>'kiveve') IS NULL`)));
  const nagyok: AlbumFoto[] = [];
  const kicsik = new Map<string, string>();
  for (const r of sorok) {
    const e = albumElemzes(r.elemzes);
    if (!e) continue;
    const feltoltve = r.feltoltve instanceof Date ? r.feltoltve.toISOString() : new Date(String(r.feltoltve)).toISOString();
    if (e.kicsi) { if (e.par) kicsik.set(e.par, String(r.id)); continue; }
    nagyok.push({ id: String(r.id), kicsi_id: null, nev: String(r.nev), keszult: e.keszult ? new Date(e.keszult).toISOString() : null, feltoltve, meret: Number(r.meret) });
  }
  return idoSzerint(nagyok.map((f) => ({ ...f, kicsi_id: kicsik.get(f.id) ?? null })));
}
function sorok_(e: unknown): Record<string, unknown>[] {
  return ((e as { rows?: Record<string, unknown>[] }).rows ?? (e as Record<string, unknown>[]));
}

/**
 * c30 F10 → D7: melyik fotót használja poszt, és mikor. A 30 napos költöztetés ezzel dolgozik: a poszt fotója a „Kitettem” után 30
 * nappal megy, egy ki nem tett poszté a poszt utolsó módosítása után 30 nappal (album/szabaly.ts `albumLejart`).
 */
export async function albumHasznalatPosztokbol(szervezetId: string): Promise<AlbumHasznalatJel> {
  const sorok = await szervezetKent(szervezetId, async (tx) => sorok_(await tx.execute(sql`
    SELECT frissitve, kiteve, forras->'album'->'fotok' AS fotok FROM poszt_munka
    WHERE szervezet_id = ${szervezetId}::uuid AND jsonb_typeof(forras->'album'->'fotok') = 'array'`)));
  const jel: AlbumHasznalatJel = new Map();
  const iso = (x: unknown) => (x instanceof Date ? x.toISOString() : x ? new Date(String(x)).toISOString() : null);
  for (const r of sorok) {
    const fotok = Array.isArray(r.fotok) ? (r.fotok as { fajl_id?: unknown }[]) : [];
    for (const f of fotok) {
      if (typeof f?.fajl_id !== "string") continue;
      const regi = jel.get(f.fajl_id);
      const uj = { hasznalva: iso(r.frissitve), kitettem: iso(r.kiteve) };
      // több posztban is lehet: a legkésőbbi számít (amíg egy ki nem tett poszt használja, nem megy)
      if (!regi) jel.set(f.fajl_id, uj);
      else jel.set(f.fajl_id, {
        hasznalva: [regi.hasznalva, uj.hasznalva].filter(Boolean).sort().pop() ?? null,
        kitettem: regi.kitettem && uj.kitettem ? [regi.kitettem, uj.kitettem].sort().pop()! : null,
      });
    }
  }
  return jel;
}
