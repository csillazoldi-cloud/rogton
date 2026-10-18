import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import {
  FeliratFelulirasok,
  NYELVEK,
  type FeliratKeszlet,
  type FeliratSzintAllapot,
  type FeliratVerzioFej,
  type Nyelv,
} from "@rogton/design-system";
import { db, sema, szervezetKent } from "../adatbazis/kapcsolat";

// A FELIRATOK TÁROLÁSA a befogadó alkalmazásban (ALAPTERV 3.: felületi szövegek — apps/web, stabil kulcsokkal; a szabályok a
// design-system-ben). Három réteg: a csomag ALAPJA (`felirat` tábla, a kódból, migrációkkal), a KÖZÖS felülírás
// (`kozos_felirat_verzio`, a rendszergazdáé) és a SZERVEZETI felülírás (`szervezet_felirat_verzio`, RLS alatt). A két felülírás
// ugyanazzal az állapotgéppel, mint a téma: legfeljebb egy tervezet, legfeljebb egy alkalmazott, a többi korábbi.

const GYORSITOTAR_IDO = 60_000;
type Gyorsitotar = {
  alap: { ido: number; adat: FeliratKeszlet } | undefined;
  kozos: { ido: number; adat: FeliratFelulirasok | null } | undefined;
  szervezet: Map<string, { ido: number; adat: FeliratFelulirasok | null }>;
};
// globalThis: a Next az útvonalakat külön csomagokba fordítja (E-14 tanulság).
const gy: Gyorsitotar = ((globalThis as { __kmFeliratok?: Gyorsitotar }).__kmFeliratok ??= { alap: undefined, kozos: undefined, szervezet: new Map() });

function felulirasokBol(adat: unknown): FeliratFelulirasok {
  const e = FeliratFelulirasok.safeParse(adat);
  if (!e.success) { console.error("Hibás felirat-felülírás:", e.error.issues); return {}; }
  return e.data;
}

function fej(sor: { verzio: number; allapot: "tervezet" | "alkalmazott" | "korabbi"; letrehozva: Date; alkalmazva: Date | null }): FeliratVerzioFej {
  return { verzio: sor.verzio, allapot: sor.allapot, letrehozva: sor.letrehozva.toISOString(), alkalmazva: sor.alkalmazva?.toISOString() ?? null };
}

/** A csomag alapja: a `felirat` tábla három nyelven (gyorsítótárból). */
export async function alapFeliratok(): Promise<FeliratKeszlet> {
  const most = Date.now();
  if (gy.alap && most - gy.alap.ido < GYORSITOTAR_IDO) return gy.alap.adat;
  const sorok = await db().select().from(sema.felirat);
  const adat: FeliratKeszlet = { hu: {}, ro: {}, en: {} };
  for (const s of sorok) if ((NYELVEK as readonly string[]).includes(s.nyelv)) adat[s.nyelv as Nyelv][s.kulcs] = s.szoveg;
  gy.alap = { ido: most, adat };
  return adat;
}

// ---------------------------------------------------------------------------
// Közös felülírás
// ---------------------------------------------------------------------------

export async function kozosAlkalmazott(): Promise<FeliratFelulirasok | null> {
  const most = Date.now();
  if (gy.kozos && most - gy.kozos.ido < GYORSITOTAR_IDO) return gy.kozos.adat;
  const sor = (await db().select().from(sema.kozosFeliratVerzio).where(eq(sema.kozosFeliratVerzio.allapot, "alkalmazott")).limit(1))[0];
  const adat = sor ? felulirasokBol(sor.felulirasok) : null;
  gy.kozos = { ido: most, adat };
  return adat;
}

export async function kozosVerziok(): Promise<{ alkalmazott: { verzio: number; felulirasok: FeliratFelulirasok } | null; tervezet: { verzio: number; felulirasok: FeliratFelulirasok } | null; verziok: FeliratVerzioFej[] }> {
  const sorok = await db().select().from(sema.kozosFeliratVerzio).orderBy(desc(sema.kozosFeliratVerzio.verzio));
  const alk = sorok.find((s) => s.allapot === "alkalmazott");
  const terv = sorok.find((s) => s.allapot === "tervezet");
  return {
    alkalmazott: alk ? { verzio: alk.verzio, felulirasok: felulirasokBol(alk.felulirasok) } : null,
    tervezet: terv ? { verzio: terv.verzio, felulirasok: felulirasokBol(terv.felulirasok) } : null,
    verziok: sorok.map(fej),
  };
}

export async function kozosTervezetMent(felulirasok: FeliratFelulirasok): Promise<number> {
  return db().transaction(async (tx) => {
    const terv = (await tx.select().from(sema.kozosFeliratVerzio).where(eq(sema.kozosFeliratVerzio.allapot, "tervezet")).limit(1))[0];
    if (terv) {
      await tx.update(sema.kozosFeliratVerzio).set({ felulirasok }).where(eq(sema.kozosFeliratVerzio.verzio, terv.verzio));
      return terv.verzio;
    }
    const r = (await tx.select({ m: sql<number>`coalesce(max(${sema.kozosFeliratVerzio.verzio}), 0)` }).from(sema.kozosFeliratVerzio))[0];
    const verzio = Number(r?.m ?? 0) + 1;
    await tx.insert(sema.kozosFeliratVerzio).values({ verzio, felulirasok, allapot: "tervezet" });
    return verzio;
  });
}

export async function kozosAlkalmaz(): Promise<number | null> {
  const verzio = await db().transaction(async (tx) => {
    const terv = (await tx.select().from(sema.kozosFeliratVerzio).where(eq(sema.kozosFeliratVerzio.allapot, "tervezet")).limit(1))[0];
    if (!terv) return null;
    await tx.update(sema.kozosFeliratVerzio).set({ allapot: "korabbi" }).where(eq(sema.kozosFeliratVerzio.allapot, "alkalmazott"));
    await tx.update(sema.kozosFeliratVerzio).set({ allapot: "alkalmazott", alkalmazva: new Date() }).where(eq(sema.kozosFeliratVerzio.verzio, terv.verzio));
    return terv.verzio;
  });
  if (verzio !== null) { gy.kozos = undefined; gy.szervezet.clear(); }
  return verzio;
}

export async function kozosTervezetElvet(): Promise<boolean> {
  const r = await db().update(sema.kozosFeliratVerzio).set({ allapot: "korabbi" }).where(eq(sema.kozosFeliratVerzio.allapot, "tervezet")).returning({ v: sema.kozosFeliratVerzio.verzio });
  return r.length > 0;
}

export async function kozosVisszaallit(verzio: number): Promise<number | null> {
  const sor = (await db().select().from(sema.kozosFeliratVerzio).where(eq(sema.kozosFeliratVerzio.verzio, verzio)).limit(1))[0];
  if (!sor) return null;
  return kozosTervezetMent(felulirasokBol(sor.felulirasok));
}

// ---------------------------------------------------------------------------
// Szervezeti felülírás — szervezetKent alatt
// ---------------------------------------------------------------------------

export async function szervezetAlkalmazott(szervezetId: string): Promise<FeliratFelulirasok | null> {
  const most = Date.now();
  const volt = gy.szervezet.get(szervezetId);
  if (volt && most - volt.ido < GYORSITOTAR_IDO) return volt.adat;
  const adat = await szervezetKent(szervezetId, async (tx) => {
    const sor = (await tx.select().from(sema.szervezetFeliratVerzio).where(and(eq(sema.szervezetFeliratVerzio.szervezetId, szervezetId), eq(sema.szervezetFeliratVerzio.allapot, "alkalmazott"))).limit(1))[0];
    return sor ? felulirasokBol(sor.felulirasok) : null;
  });
  gy.szervezet.set(szervezetId, { ido: most, adat });
  return adat;
}

export async function szervezetVerziok(szervezetId: string): Promise<{ alkalmazott: { verzio: number; felulirasok: FeliratFelulirasok } | null; tervezet: { verzio: number; felulirasok: FeliratFelulirasok } | null; verziok: FeliratVerzioFej[] }> {
  return szervezetKent(szervezetId, async (tx) => {
    const sorok = await tx.select().from(sema.szervezetFeliratVerzio).where(eq(sema.szervezetFeliratVerzio.szervezetId, szervezetId)).orderBy(desc(sema.szervezetFeliratVerzio.verzio));
    const alk = sorok.find((s) => s.allapot === "alkalmazott");
    const terv = sorok.find((s) => s.allapot === "tervezet");
    return {
      alkalmazott: alk ? { verzio: alk.verzio, felulirasok: felulirasokBol(alk.felulirasok) } : null,
      tervezet: terv ? { verzio: terv.verzio, felulirasok: felulirasokBol(terv.felulirasok) } : null,
      verziok: sorok.map(fej),
    };
  });
}

export async function szervezetTervezetMent(szervezetId: string, felulirasok: FeliratFelulirasok): Promise<number> {
  return szervezetKent(szervezetId, async (tx) => {
    const terv = (await tx.select().from(sema.szervezetFeliratVerzio).where(and(eq(sema.szervezetFeliratVerzio.szervezetId, szervezetId), eq(sema.szervezetFeliratVerzio.allapot, "tervezet"))).limit(1))[0];
    if (terv) {
      await tx.update(sema.szervezetFeliratVerzio).set({ felulirasok }).where(and(eq(sema.szervezetFeliratVerzio.szervezetId, szervezetId), eq(sema.szervezetFeliratVerzio.verzio, terv.verzio)));
      return terv.verzio;
    }
    const r = (await tx.select({ m: sql<number>`coalesce(max(${sema.szervezetFeliratVerzio.verzio}), 0)` }).from(sema.szervezetFeliratVerzio).where(eq(sema.szervezetFeliratVerzio.szervezetId, szervezetId)))[0];
    const verzio = Number(r?.m ?? 0) + 1;
    await tx.insert(sema.szervezetFeliratVerzio).values({ szervezetId, verzio, felulirasok, allapot: "tervezet" });
    return verzio;
  });
}

export async function szervezetAlkalmaz(szervezetId: string): Promise<number | null> {
  const verzio = await szervezetKent(szervezetId, async (tx) => {
    const terv = (await tx.select().from(sema.szervezetFeliratVerzio).where(and(eq(sema.szervezetFeliratVerzio.szervezetId, szervezetId), eq(sema.szervezetFeliratVerzio.allapot, "tervezet"))).limit(1))[0];
    if (!terv) return null;
    await tx.update(sema.szervezetFeliratVerzio).set({ allapot: "korabbi" }).where(and(eq(sema.szervezetFeliratVerzio.szervezetId, szervezetId), eq(sema.szervezetFeliratVerzio.allapot, "alkalmazott")));
    await tx.update(sema.szervezetFeliratVerzio).set({ allapot: "alkalmazott", alkalmazva: new Date() }).where(and(eq(sema.szervezetFeliratVerzio.szervezetId, szervezetId), eq(sema.szervezetFeliratVerzio.verzio, terv.verzio)));
    return terv.verzio;
  });
  if (verzio !== null) gy.szervezet.delete(szervezetId);
  return verzio;
}

export async function szervezetTervezetElvet(szervezetId: string): Promise<boolean> {
  return szervezetKent(szervezetId, async (tx) => {
    const r = await tx.update(sema.szervezetFeliratVerzio).set({ allapot: "korabbi" }).where(and(eq(sema.szervezetFeliratVerzio.szervezetId, szervezetId), eq(sema.szervezetFeliratVerzio.allapot, "tervezet"))).returning({ v: sema.szervezetFeliratVerzio.verzio });
    return r.length > 0;
  });
}

export async function szervezetVisszaallit(szervezetId: string, verzio: number): Promise<number | null> {
  const sor = await szervezetKent(szervezetId, async (tx) =>
    (await tx.select().from(sema.szervezetFeliratVerzio).where(and(eq(sema.szervezetFeliratVerzio.szervezetId, szervezetId), eq(sema.szervezetFeliratVerzio.verzio, verzio))).limit(1))[0],
  );
  if (!sor) return null;
  return szervezetTervezetMent(szervezetId, felulirasokBol(sor.felulirasok));
}

/** A felület állapota egy szinten (a szabály a design-system-é; itt csak összerakjuk). */
export type SzintVerziok = Awaited<ReturnType<typeof kozosVerziok>>;
export type { FeliratSzintAllapot };

export function feliratGyorsitotarUrit(): void {
  gy.alap = undefined; gy.kozos = undefined; gy.szervezet.clear();
}
