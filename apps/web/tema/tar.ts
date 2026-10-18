import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import {
  AlapTokenek,
  TemaDefinicio,
  TOKEN_KULCSOK,
  TemaFelulirasok,
  egyesit,
  semaFelismer,
  type KozosTemaAllapot,
  type SzervezetTemaAllapot,
  type TemaVerzioFej,
} from "@km/design-system";
import temaAlap from "@km/design-system/tema-alap.json";
import { db, sema, szervezetKent, type SzervezetDb } from "../adatbazis/kapcsolat";

// A téma TÁROLÁSA a befogadó alkalmazásban (ALAPTERV 3.: a téma gazdája az apps/web, verziózva; a szabályok a
// design-system-ben). Két szint (D-09): a KÖZÖS ALAP a `tema` táblában (teljes készlet), a SZERVEZETI FELÜLÍRÁS a
// `szervezet_tema` táblában (csak az eltérő tokenek), sorszintű védelem alatt. Mindkettő ugyanazzal az állapotgéppel:
// legfeljebb egy tervezet, pontosan/legfeljebb egy alkalmazott, a többi korábbi; alkalmazás = a tervezet lesz az
// alkalmazott, a korábbi alkalmazott korábbi lesz; visszaállítás = a korábbi verzióból ÚJ tervezet.

const GYORSITOTAR_IDO = 60_000;
// A gyorsítótár a globalThis-en él: a Next az útvonalakat külön csomagokba fordítja, és egy modulszintű változó
// útvonalanként külön példány lenne — az API-pont alkalmazása nem ürítené a lap fejének gyorsítótárát (E-14 tanulság).
type Gyorsitotar = { kozos: { ido: number; adat: AlapTokenek } | undefined; szervezet: Map<string, { ido: number; adat: TemaFelulirasok | null }> };
const gy: Gyorsitotar = ((globalThis as { __kmTema?: Gyorsitotar }).__kmTema ??= { kozos: undefined, szervezet: new Map() });

function alapDefinicio(): TemaDefinicio {
  return TemaDefinicio.parse(temaAlap);
}

/**
 * Tárolt témadefiníció beolvasása ÖNJAVÍTÓAN: ami hiányzik belőle (mert azóta új token került a
 * készletbe), azt a csomag alapjából pótoljuk; ami benne van, az marad. Enélkül egyetlen új token
 * bevezetése érvénytelenné tette volna a tárolt témát, és a testreszabás némán elveszett volna
 * (E-41-ben pontosan ez történt: a négy új méret-token után az adatbázisban lévő közös alap
 * nem ment át az ellenőrzésen, és a tartalék téma futott).
 */
function definicioBeolvas(nyers: unknown): TemaDefinicio {
  const alap = alapDefinicio();
  const tokenek = (nyers as { tokens?: Record<string, string> } | null)?.tokens ?? {};
  return TemaDefinicio.parse({ ...alap, ...(nyers as object), tokens: { ...alap.tokens, ...ismertKulcsok(tokenek) } });
}

/**
 * Csak a készlet MAI kulcsai maradnak (F-1, R-0): a hét régi térköz-token (--gap, --pad-card, …) 2026-09-12-től származtatott,
 * nem tárolt alaptoken — ha egy régebbi tárolt definícióban vagy felülírásban még szerepel, a szigorú séma elutasítaná,
 * és némán a tartalék téma futna (az E-41 hibája fordítva). Ezért az ismeretlen kulcsot beolvasáskor elengedjük.
 */
function ismertKulcsok<T extends Record<string, unknown>>(t: T): Partial<Record<keyof AlapTokenek, string>> {
  const ki: Record<string, string> = {};
  for (const k of TOKEN_KULCSOK) { const v = t[k]; if (typeof v === "string") ki[k] = v; }
  return ki as Partial<Record<keyof AlapTokenek, string>>;
}

function fej(sor: { verzio: number; allapot: "tervezet" | "alkalmazott" | "korabbi"; letrehozva: Date; alkalmazva: Date | null }): TemaVerzioFej {
  return { verzio: sor.verzio, allapot: sor.allapot, letrehozva: sor.letrehozva.toISOString(), alkalmazva: sor.alkalmazva?.toISOString() ?? null };
}

// ---------------------------------------------------------------------------
// Közös alap
// ---------------------------------------------------------------------------

/** A közös alap ALKALMAZOTT tokenjei (gyorsítótárból, 60 mp). Ha az adatbázisban nincs vagy hibás: a csomag alapja (tartalék, ugyanabból a forrásból). */
export async function kozosAlkalmazott(): Promise<AlapTokenek> {
  const most = Date.now();
  if (gy.kozos && most - gy.kozos.ido < GYORSITOTAR_IDO) return gy.kozos.adat;
  let tokenek: AlapTokenek;
  try {
    const sor = (await db().select().from(sema.tema).where(eq(sema.tema.allapot, "alkalmazott")).limit(1))[0];
    if (!sor) throw new Error("Nincs alkalmazott tema");
    tokenek = definicioBeolvas(sor.definicio).tokens;
  } catch (hiba) {
    console.error("Alkalmazott tema hiba, tartalek tema hasznalva:", hiba);
    tokenek = alapDefinicio().tokens;
  }
  gy.kozos = { ido: most, adat: tokenek };
  return tokenek;
}

/** A közös alap teljes állapota a rendszergazdának: alkalmazott, tervezet, verziólista. */
export async function kozosAllapot(): Promise<KozosTemaAllapot> {
  const sorok = await db().select().from(sema.tema).orderBy(desc(sema.tema.verzio));
  const alk = sorok.find((s) => s.allapot === "alkalmazott");
  const terv = sorok.find((s) => s.allapot === "tervezet");
  const alkTokenek = alk ? definicioBeolvas(alk.definicio).tokens : alapDefinicio().tokens;
  return {
    alkalmazott: { verzio: alk?.verzio ?? 0, tokenek: alkTokenek },
    tervezet: terv ? { verzio: terv.verzio, tokenek: definicioBeolvas(terv.definicio).tokens } : null,
    verziok: sorok.map(fej),
    sema_kod: alk?.semaKod ?? semaFelismer(alkTokenek), // R-10; 2026-09-21: felismerés a tokenekből
  };
}

async function kozosKovetkezoVerzio(tx: SzervezetDb | ReturnType<typeof db>): Promise<number> {
  const r = (await tx.select({ m: sql<number>`coalesce(max(${sema.tema.verzio}), 0)` }).from(sema.tema))[0];
  return Number(r?.m ?? 0) + 1;
}

/** A közös tervezet mentése: ha van tervezet, felülírja; ha nincs, új verzió tervezetként. Visszaadja a tervezet verzióját. */
export async function kozosTervezetMent(tokenek: AlapTokenek, semaKod: string | null = null): Promise<number> {
  return db().transaction(async (tx) => {
    const nev = (await tx.select({ nev: sema.tema.nev }).from(sema.tema).where(eq(sema.tema.allapot, "alkalmazott")).limit(1))[0]?.nev ?? alapDefinicio().name;
    const definicio: TemaDefinicio = { $schema: "km-theme/2", name: nev, tokens: tokenek };
    const terv = (await tx.select().from(sema.tema).where(eq(sema.tema.allapot, "tervezet")).limit(1))[0];
    if (terv) {
      await tx.update(sema.tema).set({ definicio, semaKod }).where(eq(sema.tema.id, terv.id));
      return terv.verzio;
    }
    const verzio = await kozosKovetkezoVerzio(tx);
    await tx.insert(sema.tema).values({ nev, verzio, definicio, allapot: "tervezet", semaKod });
    return verzio;
  });
}

/** A közös tervezet alkalmazása: a tervezet lesz az alkalmazott, a korábbi alkalmazott korábbi. null = nincs tervezet. */
export async function kozosAlkalmaz(): Promise<number | null> {
  const verzio = await db().transaction(async (tx) => {
    const terv = (await tx.select().from(sema.tema).where(eq(sema.tema.allapot, "tervezet")).limit(1))[0];
    if (!terv) return null;
    await tx.update(sema.tema).set({ allapot: "korabbi" }).where(eq(sema.tema.allapot, "alkalmazott"));
    await tx.update(sema.tema).set({ allapot: "alkalmazott", alkalmazva: new Date() }).where(eq(sema.tema.id, terv.id));
    return terv.verzio;
  });
  if (verzio !== null) gy.kozos = undefined;
  return verzio;
}

/** A közös tervezet elvetése (a sor korábbi lesz — nem törlünk). false = nem volt tervezet. */
export async function kozosTervezetElvet(): Promise<boolean> {
  const r = await db().update(sema.tema).set({ allapot: "korabbi" }).where(eq(sema.tema.allapot, "tervezet")).returning({ id: sema.tema.id });
  return r.length > 0;
}

/** Korábbi közös verzió visszaállítása: a tartalmából ÚJ tervezet (a meglévő tervezetet felülírja). null = nincs ilyen verzió. */
export async function kozosVisszaallit(verzio: number): Promise<number | null> {
  const sor = (await db().select().from(sema.tema).where(eq(sema.tema.verzio, verzio)).limit(1))[0];
  if (!sor) return null;
  return kozosTervezetMent(definicioBeolvas(sor.definicio).tokens);
}

// ---------------------------------------------------------------------------
// Szervezeti felülírás — mindig szervezetKent alatt (sorszintű védelem)
// ---------------------------------------------------------------------------

function felulirasokBol(adat: unknown): TemaFelulirasok {
  const e = TemaFelulirasok.safeParse(adat);
  if (!e.success) { console.error("Hibás felülírás-tartalom:", e.error.issues); return {}; }
  return e.data;
}

/** A szervezet ALKALMAZOTT felülírásai (gyorsítótárból, 60 mp), vagy null, ha nincs. */
export async function szervezetAlkalmazott(szervezetId: string): Promise<TemaFelulirasok | null> {
  const most = Date.now();
  const volt = gy.szervezet.get(szervezetId);
  if (volt && most - volt.ido < GYORSITOTAR_IDO) return volt.adat;
  const adat = await szervezetKent(szervezetId, async (tx) => {
    const sor = (await tx.select().from(sema.szervezetTema).where(and(eq(sema.szervezetTema.szervezetId, szervezetId), eq(sema.szervezetTema.allapot, "alkalmazott"))).limit(1))[0];
    return sor ? felulirasokBol(sor.felulirasok) : null;
  });
  gy.szervezet.set(szervezetId, { ido: most, adat });
  return adat;
}

/** A lapon érvényes HATÁSOS tokenkészlet: közös alap + a szervezet alkalmazott felülírásai (szervezet nélkül: a közös alap). */
export async function hatasosTema(szervezetId: string | null): Promise<AlapTokenek> {
  const alap = await kozosAlkalmazott();
  if (!szervezetId) return alap;
  try {
    return egyesit(alap, await szervezetAlkalmazott(szervezetId));
  } catch (hiba) {
    console.error("Szervezeti tema hiba, a kozos alap megy:", hiba);
    return alap;
  }
}

/** A szervezet szintjének teljes állapota a felületnek. */
export async function szervezetTemaAllapot(szervezetId: string): Promise<SzervezetTemaAllapot> {
  const alap = await kozosAlkalmazott();
  return szervezetKent(szervezetId, async (tx) => {
    const sorok = await tx.select().from(sema.szervezetTema).where(eq(sema.szervezetTema.szervezetId, szervezetId)).orderBy(desc(sema.szervezetTema.verzio));
    const alk = sorok.find((s) => s.allapot === "alkalmazott");
    const terv = sorok.find((s) => s.allapot === "tervezet");
    const alkFel = alk ? felulirasokBol(alk.felulirasok) : null;
    return {
      alap,
      alkalmazott: alk ? { verzio: alk.verzio, felulirasok: alkFel ?? {} } : null,
      tervezet: terv ? { verzio: terv.verzio, felulirasok: felulirasokBol(terv.felulirasok) } : null,
      verziok: sorok.map(fej),
      hatasos: egyesit(alap, alkFel),
      // R-10; 2026-09-21: a régi, séma-kód nélküli verzióknál (és ha nincs saját verzió) a tokenekből ismerjük fel.
      sema_kod: alk?.semaKod ?? semaFelismer(egyesit(alap, alkFel)),
    };
  });
}

/** A szervezet tervezetének mentése (felülír vagy új verzió). Visszaadja a tervezet verzióját. */
export async function szervezetTervezetMent(szervezetId: string, felulirasok: TemaFelulirasok, semaKod: string | null = null): Promise<number> {
  return szervezetKent(szervezetId, async (tx) => {
    const terv = (await tx.select().from(sema.szervezetTema).where(and(eq(sema.szervezetTema.szervezetId, szervezetId), eq(sema.szervezetTema.allapot, "tervezet"))).limit(1))[0];
    if (terv) {
      await tx.update(sema.szervezetTema).set({ felulirasok, semaKod }).where(and(eq(sema.szervezetTema.szervezetId, szervezetId), eq(sema.szervezetTema.verzio, terv.verzio)));
      return terv.verzio;
    }
    const r = (await tx.select({ m: sql<number>`coalesce(max(${sema.szervezetTema.verzio}), 0)` }).from(sema.szervezetTema).where(eq(sema.szervezetTema.szervezetId, szervezetId)))[0];
    const verzio = Number(r?.m ?? 0) + 1;
    await tx.insert(sema.szervezetTema).values({ szervezetId, verzio, felulirasok, allapot: "tervezet", semaKod });
    return verzio;
  });
}

/** A szervezet tervezetének alkalmazása. null = nincs tervezet. */
export async function szervezetAlkalmaz(szervezetId: string): Promise<number | null> {
  const verzio = await szervezetKent(szervezetId, async (tx) => {
    const terv = (await tx.select().from(sema.szervezetTema).where(and(eq(sema.szervezetTema.szervezetId, szervezetId), eq(sema.szervezetTema.allapot, "tervezet"))).limit(1))[0];
    if (!terv) return null;
    await tx.update(sema.szervezetTema).set({ allapot: "korabbi" }).where(and(eq(sema.szervezetTema.szervezetId, szervezetId), eq(sema.szervezetTema.allapot, "alkalmazott")));
    await tx.update(sema.szervezetTema).set({ allapot: "alkalmazott", alkalmazva: new Date() }).where(and(eq(sema.szervezetTema.szervezetId, szervezetId), eq(sema.szervezetTema.verzio, terv.verzio)));
    return terv.verzio;
  });
  if (verzio !== null) gy.szervezet.delete(szervezetId);
  return verzio;
}

/** A szervezet tervezetének elvetése (korábbi lesz). false = nem volt tervezet. */
export async function szervezetTervezetElvet(szervezetId: string): Promise<boolean> {
  return szervezetKent(szervezetId, async (tx) => {
    const r = await tx.update(sema.szervezetTema).set({ allapot: "korabbi" }).where(and(eq(sema.szervezetTema.szervezetId, szervezetId), eq(sema.szervezetTema.allapot, "tervezet"))).returning({ v: sema.szervezetTema.verzio });
    return r.length > 0;
  });
}

/** Korábbi szervezeti verzió visszaállítása ÚJ tervezetként. null = nincs ilyen verzió. */
export async function szervezetVisszaallit(szervezetId: string, verzio: number): Promise<number | null> {
  const sor = await szervezetKent(szervezetId, async (tx) =>
    (await tx.select().from(sema.szervezetTema).where(and(eq(sema.szervezetTema.szervezetId, szervezetId), eq(sema.szervezetTema.verzio, verzio))).limit(1))[0],
  );
  if (!sor) return null;
  return szervezetTervezetMent(szervezetId, felulirasokBol(sor.felulirasok));
}

/** Próbákhoz és a kirakáshoz: a gyorsítótár ürítése. */
export function temaGyorsitotarUrit(): void {
  gy.kozos = undefined;
  gy.szervezet.clear();
}
