import "server-only";
import { esemenyKornyezet, feljegyezHatterben } from "../esemeny";
import type { HibaKod } from "@rogton/contracts";
import {
  FeliratTervezetKeres,
  NYELVEK,
  TemaVisszaallitasKeres,
  feliratCsomagEllenoriz,
  feliratFelulirasokSzamol,
  hatasosFeliratok,
  type FeliratFelulirasok,
  type FeliratHiba,
  type FeliratKeszlet,
  type FeliratSzintAllapot,
  type FeliratSzotar,
  type Nyelv,
} from "@rogton/design-system";
import * as tar from "./tar";
import { profilTar } from "../profil/tar";
import { tipusOf } from "../profil/tipus-szabaly";
import { tipusValtozat } from "./fesztival";

export { feliratGyorsitotarUrit } from "./tar";

export type FeliratEredmeny<T> =
  | { ok: true; ertek: T }
  | { ok: false; hiba: HibaKod; felirat_hibak?: FeliratHiba[]; figyelmen_kivul?: string[] };

/** A lap HATÁSOS feliratai egy nyelven: alap + közös + a szervezet alkalmazott felülírásai (szervezet nélkül: alap + közös). */
export async function lapFeliratai(nyelv: Nyelv, szervezetId: string | null): Promise<FeliratSzotar> {
  const [alap, kozos] = await Promise.all([tar.alapFeliratok(), tar.kozosAlkalmazott()]);
  let szervezet: FeliratFelulirasok | null = null;
  if (szervezetId) {
    try { szervezet = await tar.szervezetAlkalmazott(szervezetId); } catch (h) { console.error("Szervezeti feliratok hiba, a kozos megy:", h); }
  }
  // c30 F12: fesztiválnál a `.fesztival` változatok (szovegek/fesztival.ts); a profil olvashatatlansága nem állítja meg a lapot (cég marad)
  const fesztival = szervezetId ? await profilTar.betolt(szervezetId).then((p) => !!p && tipusOf(p) === "fesztival").catch(() => false) : false;
  return tipusValtozat(hatasosFeliratok(nyelv, alap, kozos, szervezet), fesztival, new Set(Object.keys(szervezet?.[nyelv] ?? {})));
}

/** Az összes ismert kulcs (a csomag alapja). */
async function ismertKulcsok(alap: FeliratKeszlet): Promise<Set<string>> {
  const k = new Set<string>();
  for (const ny of NYELVEK) for (const kulcs of Object.keys(alap[ny])) k.add(kulcs);
  return k;
}

/** A szint alatt lévő hatásos készlet nyelvenként (szervezetnél: alap+közös; közösnél: alap). */
async function alattaKeszlet(szint: "szervezet" | "kozos"): Promise<{ alap: FeliratKeszlet; alatta: FeliratKeszlet }> {
  const alap = await tar.alapFeliratok();
  const kozos = szint === "szervezet" ? await tar.kozosAlkalmazott() : null;
  const alatta = { hu: {}, ro: {}, en: {} } as FeliratKeszlet;
  for (const ny of NYELVEK) alatta[ny] = hatasosFeliratok(ny, alap, kozos, null);
  return { alap, alatta };
}

async function allapot(szint: "szervezet" | "kozos", szervezetId: string | null): Promise<FeliratSzintAllapot> {
  const { alap, alatta } = await alattaKeszlet(szint);
  const v = szint === "kozos" ? await tar.kozosVerziok() : await tar.szervezetVerziok(szervezetId!);
  return { alatta, alkalmazott: v.alkalmazott, tervezet: v.tervezet, verziok: v.verziok, kulcsok: [...(await ismertKulcsok(alap))].sort() };
}

/** A beküldött csomag ellenőrzése és a felülírások kiszámítása az alatta lévő szinthez képest. */
async function ellenorzottFelulirasok(szint: "szervezet" | "kozos", be: unknown): Promise<FeliratEredmeny<{ felulirasok: FeliratFelulirasok; figyelmen_kivul: string[] }>> {
  const { alap, alatta } = await alattaKeszlet(szint);
  const kulcsok = await ismertKulcsok(alap);
  const k = FeliratTervezetKeres.safeParse(be);
  const e = feliratCsomagEllenoriz(k.success ? k.data : be, kulcsok);
  if (!e.ok) return { ok: false, hiba: "ERVENYTELEN_ADAT", felirat_hibak: e.hibak, figyelmen_kivul: e.figyelmenKivul };
  const felulirasok = feliratFelulirasokSzamol(e.feliratok, (kulcs, ny) => alatta[ny][kulcs]);
  return { ok: true, ertek: { felulirasok, figyelmen_kivul: e.figyelmenKivul } };
}

// --- szervezeti szint ---
export function szervezetAllapot(szervezetId: string): Promise<FeliratSzintAllapot> { return allapot("szervezet", szervezetId); }
export async function szervezetTervezetMent(szervezetId: string, be: unknown): Promise<FeliratEredmeny<FeliratSzintAllapot & { figyelmen_kivul: string[] }>> {
  const e = await ellenorzottFelulirasok("szervezet", be);
  if (!e.ok) return e;
  await tar.szervezetTervezetMent(szervezetId, e.ertek.felulirasok);
  return { ok: true, ertek: { ...(await allapot("szervezet", szervezetId)), figyelmen_kivul: e.ertek.figyelmen_kivul } };
}
export async function szervezetAlkalmaz(szervezetId: string): Promise<FeliratEredmeny<FeliratSzintAllapot>> {
  if ((await tar.szervezetAlkalmaz(szervezetId)) === null) return { ok: false, hiba: "NINCS_TERVEZET" };
  await feljegyezHatterben(await esemenyKornyezet(), { szervezet_id: szervezetId, fajta: "feliratok_alkalmazva", fiok_id: null, adat: { szint: "szervezeti" } }); // F-5
  return { ok: true, ertek: await allapot("szervezet", szervezetId) };
}
export async function szervezetTervezetElvet(szervezetId: string): Promise<FeliratEredmeny<FeliratSzintAllapot>> {
  if (!(await tar.szervezetTervezetElvet(szervezetId))) return { ok: false, hiba: "NINCS_TERVEZET" };
  return { ok: true, ertek: await allapot("szervezet", szervezetId) };
}
export async function szervezetVisszaallit(szervezetId: string, be: unknown): Promise<FeliratEredmeny<FeliratSzintAllapot>> {
  const k = TemaVisszaallitasKeres.safeParse(be);
  if (!k.success) return { ok: false, hiba: "ERVENYTELEN_ADAT" };
  if ((await tar.szervezetVisszaallit(szervezetId, k.data.verzio)) === null) return { ok: false, hiba: "NINCS_ILYEN_VERZIO" };
  return { ok: true, ertek: await allapot("szervezet", szervezetId) };
}

// --- közös szint (a jogot az API-pont ellenőrzi: fiok.rendszergazda) ---
export function kozosAllapot(): Promise<FeliratSzintAllapot> { return allapot("kozos", null); }
export async function kozosTervezetMent(be: unknown): Promise<FeliratEredmeny<FeliratSzintAllapot & { figyelmen_kivul: string[] }>> {
  const e = await ellenorzottFelulirasok("kozos", be);
  if (!e.ok) return e;
  await tar.kozosTervezetMent(e.ertek.felulirasok);
  return { ok: true, ertek: { ...(await allapot("kozos", null)), figyelmen_kivul: e.ertek.figyelmen_kivul } };
}
export async function kozosAlkalmaz(): Promise<FeliratEredmeny<FeliratSzintAllapot>> {
  if ((await tar.kozosAlkalmaz()) === null) return { ok: false, hiba: "NINCS_TERVEZET" };
  return { ok: true, ertek: await allapot("kozos", null) };
}
export async function kozosTervezetElvet(): Promise<FeliratEredmeny<FeliratSzintAllapot>> {
  if (!(await tar.kozosTervezetElvet())) return { ok: false, hiba: "NINCS_TERVEZET" };
  return { ok: true, ertek: await allapot("kozos", null) };
}
export async function kozosVisszaallit(be: unknown): Promise<FeliratEredmeny<FeliratSzintAllapot>> {
  const k = TemaVisszaallitasKeres.safeParse(be);
  if (!k.success) return { ok: false, hiba: "ERVENYTELEN_ADAT" };
  if ((await tar.kozosVisszaallit(k.data.verzio)) === null) return { ok: false, hiba: "NINCS_ILYEN_VERZIO" };
  return { ok: true, ertek: await allapot("kozos", null) };
}
