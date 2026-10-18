import "server-only";
import { esemenyKornyezet, feljegyezHatterben } from "../esemeny";
import type { HibaKod } from "@km/contracts";
import { z } from "zod";
import {
  AlapTokenek,
  egyesit,
  semaKeres,
  semaFelismer,
  semaraValt,
  TemaTervezetKeres,
  TemaVisszaallitasKeres,
  felulirasokSzamol,
  temaEllenoriz,
  type KozosTemaAllapot,
  type SzervezetTemaAllapot,
  type TemaHiba,
} from "@km/design-system";
import * as tar from "./tar";

export { hatasosTema, temaGyorsitotarUrit } from "./tar";

/** Egy téma-művelet eredménye. A tema_hibak a v6 strukturált hibalistája (a felület fordítja), a figyelmen_kivul az ismeretlen kulcsok. */
export type TemaEredmeny<T> =
  | { ok: true; ertek: T }
  | { ok: false; hiba: HibaKod; tema_hibak?: TemaHiba[]; figyelmen_kivul?: string[] };

/**
 * A beküldött km-theme/2 csomag ellenőrzése (A-09: hibás csomag SEMMIT nem ír). Részleges készletet is elfogad —
 * a hiányzó tokenek a közös alapból jönnek. Visszaadja a teljes, érvényes készletet.
 */
async function ellenorzottTeljes(be: unknown, alap: AlapTokenek): Promise<TemaEredmeny<{ teljes: AlapTokenek; figyelmen_kivul: string[] }>> {
  const k = TemaTervezetKeres.safeParse(be);
  if (!k.success) {
    const e = temaEllenoriz(be); // a strukturált hibák ($schema / tokens) innen jönnek
    return { ok: false, hiba: "ERVENYTELEN_ADAT", tema_hibak: e.hibak, figyelmen_kivul: e.figyelmenKivul };
  }
  const e = temaEllenoriz(k.data);
  if (!e.ok) return { ok: false, hiba: "ERVENYTELEN_ADAT", tema_hibak: e.hibak, figyelmen_kivul: e.figyelmenKivul };
  const teljes = AlapTokenek.safeParse({ ...alap, ...e.tokenek });
  if (!teljes.success) return { ok: false, hiba: "ERVENYTELEN_ADAT", tema_hibak: [], figyelmen_kivul: e.figyelmenKivul };
  return { ok: true, ertek: { teljes: teljes.data, figyelmen_kivul: e.figyelmenKivul } };
}

// ---------------------------------------------------------------------------
// Szervezeti szint (a tulajdonos)
// ---------------------------------------------------------------------------

export function szervezetTemaAllapot(szervezetId: string): Promise<SzervezetTemaAllapot> {
  return tar.szervezetTemaAllapot(szervezetId);
}

/** Tervezet mentése: a felület a teljes szerkesztett készletet küldi; csak a közös alaptól eltérő tokenek tárolódnak. */
export async function szervezetTervezetMent(szervezetId: string, be: unknown): Promise<TemaEredmeny<SzervezetTemaAllapot & { figyelmen_kivul: string[] }>> {
  const alap = await tar.kozosAlkalmazott();
  const e = await ellenorzottTeljes(be, alap);
  if (!e.ok) return e;
  // 2026-09-21: a mentés megtartja a séma nevét, ha a séma tokenjei nem változtak (csak a fő szín / betűméret).
  await tar.szervezetTervezetMent(szervezetId, felulirasokSzamol(alap, e.ertek.teljes), semaFelismer(e.ertek.teljes));
  return { ok: true, ertek: { ...(await tar.szervezetTemaAllapot(szervezetId)), figyelmen_kivul: e.ertek.figyelmen_kivul } };
}

export async function szervezetAlkalmaz(szervezetId: string): Promise<TemaEredmeny<SzervezetTemaAllapot>> {
  const v = await tar.szervezetAlkalmaz(szervezetId);
  if (v === null) return { ok: false, hiba: "NINCS_TERVEZET" };
  await feljegyezHatterben(await esemenyKornyezet(), { szervezet_id: szervezetId, fajta: "tema_alkalmazva", fiok_id: null, adat: { szint: "szervezeti", verzio: v } }); // F-5
  return { ok: true, ertek: await tar.szervezetTemaAllapot(szervezetId) };
}

export async function szervezetTervezetElvet(szervezetId: string): Promise<TemaEredmeny<SzervezetTemaAllapot>> {
  const volt = await tar.szervezetTervezetElvet(szervezetId);
  if (!volt) return { ok: false, hiba: "NINCS_TERVEZET" };
  return { ok: true, ertek: await tar.szervezetTemaAllapot(szervezetId) };
}

export async function szervezetVisszaallit(szervezetId: string, be: unknown): Promise<TemaEredmeny<SzervezetTemaAllapot>> {
  const k = TemaVisszaallitasKeres.safeParse(be);
  if (!k.success) return { ok: false, hiba: "ERVENYTELEN_ADAT" };
  const v = await tar.szervezetVisszaallit(szervezetId, k.data.verzio);
  if (v === null) return { ok: false, hiba: "NINCS_ILYEN_VERZIO" };
  return { ok: true, ertek: await tar.szervezetTemaAllapot(szervezetId) };
}

// ---------------------------------------------------------------------------
// Közös alap (a rendszergazda) — a jog ellenőrzése az API-pont dolga (fiok.rendszergazda)
// ---------------------------------------------------------------------------

export function kozosAllapot(): Promise<KozosTemaAllapot> {
  return tar.kozosAllapot();
}

export async function kozosTervezetMent(be: unknown): Promise<TemaEredmeny<KozosTemaAllapot & { figyelmen_kivul: string[] }>> {
  const alap = await tar.kozosAlkalmazott();
  const e = await ellenorzottTeljes(be, alap);
  if (!e.ok) return e;
  await tar.kozosTervezetMent(e.ertek.teljes, semaFelismer(e.ertek.teljes));
  return { ok: true, ertek: { ...(await tar.kozosAllapot()), figyelmen_kivul: e.ertek.figyelmen_kivul } };
}

export async function kozosAlkalmaz(): Promise<TemaEredmeny<KozosTemaAllapot>> {
  const v = await tar.kozosAlkalmaz();
  if (v === null) return { ok: false, hiba: "NINCS_TERVEZET" };
  return { ok: true, ertek: await tar.kozosAllapot() };
}

export async function kozosTervezetElvet(): Promise<TemaEredmeny<KozosTemaAllapot>> {
  const volt = await tar.kozosTervezetElvet();
  if (!volt) return { ok: false, hiba: "NINCS_TERVEZET" };
  return { ok: true, ertek: await tar.kozosAllapot() };
}

export async function kozosVisszaallit(be: unknown): Promise<TemaEredmeny<KozosTemaAllapot>> {
  const k = TemaVisszaallitasKeres.safeParse(be);
  if (!k.success) return { ok: false, hiba: "ERVENYTELEN_ADAT" };
  const v = await tar.kozosVisszaallit(k.data.verzio);
  if (v === null) return { ok: false, hiba: "NINCS_ILYEN_VERZIO" };
  return { ok: true, ertek: await tar.kozosAllapot() };
}

const SemaKeres = z.object({ kod: z.string().min(1).max(40) });

/** R-10: sémaváltás a szervezet szintjén — tervezet a séma tokenjeiből, azonnal alkalmazva (új verzió). */
export async function szervezetSemaValt(szervezetId: string, be: unknown): Promise<TemaEredmeny<SzervezetTemaAllapot>> {
  const k = SemaKeres.safeParse(be);
  if (!k.success) return { ok: false, hiba: "ERVENYTELEN_ADAT" };
  const sema = semaKeres(k.data.kod);
  if (!sema) return { ok: false, hiba: "ISMERETLEN_SEMA" };
  // 2026-09-21 (Vilmos, D1): a tulajdonos saját fő színe és betűmérete megmarad (semaraValt).
  const most = await tar.szervezetTemaAllapot(szervezetId);
  await tar.szervezetTervezetMent(szervezetId, semaraValt(sema, most.hatasos, most.alkalmazott?.felulirasok ?? null), sema.kod);
  await tar.szervezetAlkalmaz(szervezetId);
  tar.temaGyorsitotarUrit();
  return { ok: true, ertek: await tar.szervezetTemaAllapot(szervezetId) };
}

/** R-10: sémaváltás a közös alapon (rendszergazda). */
export async function kozosSemaValt(be: unknown): Promise<TemaEredmeny<KozosTemaAllapot>> {
  const k = SemaKeres.safeParse(be);
  if (!k.success) return { ok: false, hiba: "ERVENYTELEN_ADAT" };
  const sema = semaKeres(k.data.kod);
  if (!sema) return { ok: false, hiba: "ISMERETLEN_SEMA" };
  await tar.kozosTervezetMent(egyesit(await tar.kozosAlkalmazott(), sema.tokenek), sema.kod);
  await tar.kozosAlkalmaz();
  tar.temaGyorsitotarUrit();
  return { ok: true, ertek: await tar.kozosAllapot() };
}
