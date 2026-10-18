import "server-only";
import { sql } from "drizzle-orm";
import { szolgaltatoHol } from "@rogton/ai-adapters";
import { db, szervezetKent } from "../adatbazis/kapcsolat";
import { ALAP_KERET_USD, HONAP } from "../ai";
import { PENZNEMEK, type Penznem } from "../kezdolap/tipusok";
import type { GazdaNezet, GazdaSor, Hol, SajatNezet } from "./tipusok";

export * from "./tipusok";

// E-39: AI-használat és költség SZERVEZETENKÉNT.
// Két nézet: a rendszergazdáé (minden szervezet) és a szervezeté (a sajátja).
// A rendszergazda-nézet SECURITY DEFINER függvényen át jön (migráció 0037), mert a sorszintű
// védelem miatt a km_app szerep csak a saját szervezetét látja. A függvény CSAK összesítést ad:
// darabszám, idő, költség — egyetlen cikk, prompt vagy AI-válasz sem megy át rajta.


/** Érvényes hónap-jelölés (YYYY-MM); minden más a mostani hónapra esik vissza. */
export function honapVagyMost(ertek: string | null | undefined): string {
  return ertek && /^\d{4}-(0[1-9]|1[0-2])$/.test(ertek) ? ertek : HONAP();
}

function holBontasbol(szolgaltatok: Record<string, number>): { hol: Hol; helyi: number; felho: number } {
  let helyi = 0, felho = 0;
  for (const [nev, db] of Object.entries(szolgaltatok ?? {})) {
    if (szolgaltatoHol(nev) === "helyi") helyi += Number(db); else felho += Number(db);
  }
  const hol: Hol = helyi && felho ? "vegyes" : helyi ? "helyi" : felho ? "felho" : "nincs";
  return { hol, helyi, felho };
}

/** A rendszergazda nézete: minden szervezet a megadott hónapban. A JOGOT a hívó (API) ellenőrzi. */
export async function gazdaNezet(honap: string): Promise<GazdaNezet> {
  const alap = ALAP_KERET_USD();
  const e = await db().execute(sql`SELECT * FROM ai_koltseg_osszes(${honap})`);
  const nyers = (e as unknown as { rows: Record<string, unknown>[] }).rows ?? [];
  const sorok: GazdaSor[] = nyers.map((r) => {
    const b = holBontasbol((r["szolgaltatok"] ?? {}) as Record<string, number>);
    const sajatKeret = r["keret_usd"] !== null && r["keret_usd"] !== undefined;
    return {
      szervezet_id: String(r["szervezet_id"]),
      nev: String(r["nev"]),
      hivasok: Number(r["hivasok"] ?? 0),
      helyi_hivasok: b.helyi,
      ido_ms: Number(r["ido_ms"] ?? 0),
      usd: Number(r["usd"] ?? 0),
      keret_usd: sajatKeret ? Number(r["keret_usd"]) : alap,
      sajat_keret: sajatKeret,
      utolso: r["utolso"] ? new Date(String(r["utolso"])).toISOString() : null,
      hol: b.hol,
    };
  });
  return {
    honap,
    alap_keret_usd: alap,
    sorok,
    osszes: {
      hivasok: sorok.reduce((a, s) => a + s.hivasok, 0),
      helyi_hivasok: sorok.reduce((a, s) => a + s.helyi_hivasok, 0),
      ido_ms: sorok.reduce((a, s) => a + s.ido_ms, 0),
      usd: sorok.reduce((a, s) => a + s.usd, 0),
      szervezetek: sorok.length,
    },
  };
}

/** A szervezet saját nézete — a sorszintű védelem kapuján át, tehát csak a saját sorait látja. */
export async function sajatNezet(szervezetId: string, honap: string): Promise<SajatNezet> {
  const alap = ALAP_KERET_USD();
  // A pénznemet és az árfolyamot a tranzakció ELŐTT olvassuk a sima db()-vel (mint a kezdolap arfolyamok()-ja),
  // mert a szervezetKent kapuja miatt az arfolyam tábla nem feltétlenül olvasható a szervezet nevében.
  const pSor = await db().execute(sql`SELECT penznem FROM szervezet WHERE id = ${szervezetId}`);
  const pNyers = ((pSor as unknown as { rows: { penznem: string | null }[] }).rows[0]?.penznem) ?? null;
  const penznem: Penznem = pNyers && (PENZNEMEK as readonly string[]).includes(pNyers) ? (pNyers as Penznem) : "EUR";
  const aSor = await db().execute(sql`SELECT egy_usd FROM arfolyam WHERE penznem = ${penznem}`);
  const aNyers = (aSor as unknown as { rows: { egy_usd: string | number | null }[] }).rows[0]?.egy_usd;
  const arfolyam_egy_usd = aNyers !== null && aNyers !== undefined && Number.isFinite(Number(aNyers)) ? Number(aNyers) : 1;

  return szervezetKent(szervezetId, async (tx) => {
    const k = await tx.execute(sql`
      SELECT coalesce((SELECT sz.ai_keret_usd FROM szervezet sz WHERE sz.id = ${szervezetId}), ${alap})::float8 AS keret
    `);
    const keret = Number(((k as unknown as { rows: { keret: number }[] }).rows[0]?.keret) ?? alap);
    const f = await tx.execute(sql`
      SELECT feladat, szolgaltato, count(*)::int AS hivasok, coalesce(sum(ido_ms),0)::int AS ido_ms, coalesce(sum(becsult_usd),0)::float8 AS usd
      FROM ai_hivas WHERE szervezet_id = ${szervezetId} AND to_char(letrehozva, 'YYYY-MM') = ${honap}
      GROUP BY feladat, szolgaltato
    `);
    const nyers = (f as unknown as { rows: { feladat: string; szolgaltato: string; hivasok: number; ido_ms: number; usd: number }[] }).rows ?? [];
    const szerint = new Map<string, { feladat: string; hivasok: number; ido_ms: number; usd: number }>();
    let helyi = 0, felho = 0;
    for (const r of nyers) {
      const eddig = szerint.get(r.feladat) ?? { feladat: r.feladat, hivasok: 0, ido_ms: 0, usd: 0 };
      eddig.hivasok += Number(r.hivasok); eddig.ido_ms += Number(r.ido_ms); eddig.usd += Number(r.usd);
      szerint.set(r.feladat, eddig);
      if (szolgaltatoHol(r.szolgaltato) === "helyi") helyi += Number(r.hivasok); else felho += Number(r.hivasok);
    }
    const feladatok = [...szerint.values()].sort((a, b) => b.hivasok - a.hivasok);
    return {
      honap, keret_usd: keret,
      usd: feladatok.reduce((a, s) => a + s.usd, 0),
      hivasok: helyi + felho,
      helyi_hivasok: helyi, felho_hivasok: felho,
      ido_ms: feladatok.reduce((a, s) => a + s.ido_ms, 0),
      feladatok,
      penznem,
      arfolyam_egy_usd,
    };
  });
}

/** A keret beállítása (rendszergazda). `null` = visszaáll az alapértékre. A JOGOT a hívó ellenőrzi. */
export async function keretetAllit(szervezetId: string, keretUsd: number | null): Promise<void> {
  if (keretUsd !== null && (!Number.isFinite(keretUsd) || keretUsd < 0 || keretUsd > 100000)) {
    throw new Error("ERVENYTELEN_KERET");
  }
  await db().execute(sql`SELECT ai_keret_allit(${szervezetId}::uuid, ${keretUsd})`);
}
