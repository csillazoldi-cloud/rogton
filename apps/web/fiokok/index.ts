import "server-only";
import { and, count, eq, ne, sql } from "drizzle-orm";
import type { HibaKod } from "@km/contracts";
import { db, sema } from "../adatbazis/kapcsolat";
import { ALAP_KERET_USD, HONAP } from "../ai";
import type { Eredet, FiokSor, FiokokNezet, MunkaterSor, Szerep, Tagsag } from "./tipusok";

export * from "./tipusok";

type Eredmeny<T> = { ok: true; ertek: T } | { ok: false; hiba: HibaKod };

// E-50: a rendszergazda Fiókok lapja. Két lista: fiókok és munkaterek.
//
// A LEKÉRDEZÉS SECURITY DEFINER függvényeken át megy (migráció 0042), mert a `tagsag`, `szervezet`,
// `hf_*` és `ai_hivas` táblákon sorszintű védelem van — a km_app szerep CSAK a saját szervezetét látja.
// A két függvény kizárólag ÖSSZESÍTÉST ad vissza (név, dátum, darabszám, költség); egyetlen cikk,
// prompt, AI-válasz, beállítás vagy jelszó-lenyomat sem megy át rajtuk.
//
// A MÓDOSÍTÁS viszont nem igényel külön függvényt: a `fiok` és a `munkamenet` táblán nincs sorszintű
// védelem (nem ügyféladat, hanem a rendszer sajátja), a km_app pedig írhatja őket.
//
// A JOGOT minden esetben a hívó (az API-útvonal) ellenőrzi — ugyanúgy, mint a Költség lapon.

const SZEREPEK: readonly string[] = ["tulajdonos", "szerkeszto", "nezo"];

function nyelvVagyNull(ertek: unknown): "hu" | "ro" | "en" | null {
  return ertek === "hu" || ertek === "ro" || ertek === "en" ? ertek : null;
}

function idoVagyNull(ertek: unknown): string | null {
  return ertek ? new Date(String(ertek)).toISOString() : null;
}

function tagsagok(nyers: unknown): Tagsag[] {
  if (!Array.isArray(nyers)) return [];
  const ki: Tagsag[] = [];
  for (const t of nyers) {
    if (typeof t !== "object" || t === null) continue;
    const r = t as Record<string, unknown>;
    const szerep = String(r["szerep"] ?? "");
    if (!SZEREPEK.includes(szerep)) continue;
    ki.push({ nev: String(r["nev"] ?? ""), szerep: szerep as Szerep });
  }
  return ki;
}

/** Érvényes hónap-jelölés (YYYY-MM); minden más a mostani hónapra esik vissza. */
export function honapVagyMost(ertek: string | null | undefined): string {
  return ertek && /^\d{4}-(0[1-9]|1[0-2])$/.test(ertek) ? ertek : HONAP();
}

async function fiokSorok(): Promise<FiokSor[]> {
  const e = await db().execute(sql`SELECT * FROM gazda_fiokok()`);
  const nyers = (e as unknown as { rows: Record<string, unknown>[] }).rows ?? [];
  return nyers.map((r) => ({
    id: String(r["id"]),
    email: String(r["email"]),
    nev: String(r["nev"]),
    nyelv: nyelvVagyNull(r["nyelv"]),
    letrehozva: new Date(String(r["letrehozva"])).toISOString(),
    rendszergazda: r["rendszergazda"] === true,
    felfuggesztve: idoVagyNull(r["felfuggesztve"]),
    eredet: (r["eredet"] === "gepi_teszt" ? "gepi_teszt" : "ember") as Eredet,
    utolso_belepes: idoVagyNull(r["utolso_belepes"]),
    elo_munkamenet: Number(r["elo_munkamenet"] ?? 0),
    munkaterek: tagsagok(r["munkaterek"]),
  }));
}

async function munkaterSorok(honap: string, alapKeret: number): Promise<MunkaterSor[]> {
  const e = await db().execute(sql`SELECT * FROM gazda_munkaterek(${honap})`);
  const nyers = (e as unknown as { rows: Record<string, unknown>[] }).rows ?? [];
  return nyers.map((r) => {
    const sajatKeret = r["keret_usd"] !== null && r["keret_usd"] !== undefined;
    return {
      id: String(r["id"]),
      nev: String(r["nev"]),
      letrehozva: new Date(String(r["letrehozva"])).toISOString(),
      profil_jovahagyva: idoVagyNull(r["profil_jovahagyva"]),
      tulajdonos_email: r["tulajdonos_email"] ? String(r["tulajdonos_email"]) : null,
      tulajdonos_nev: r["tulajdonos_nev"] ? String(r["tulajdonos_nev"]) : null,
      hirfigyelo: r["hirfigyelo"] === true,
      forrasok: Number(r["forrasok"] ?? 0),
      utolso_futas: idoVagyNull(r["utolso_futas"]),
      hivasok: Number(r["hivasok"] ?? 0),
      usd: Number(r["usd"] ?? 0),
      keret_usd: sajatKeret ? Number(r["keret_usd"]) : alapKeret,
      sajat_keret: sajatKeret,
    };
  });
}

/** A teljes lap adata. A JOGOT a hívó ellenőrzi. */
export async function nezet(sajatFiokId: string, honap: string): Promise<FiokokNezet> {
  const alap = ALAP_KERET_USD();
  const [fiokok, munkaterek] = await Promise.all([fiokSorok(), munkaterSorok(honap, alap)]);
  return { honap, alap_keret_usd: alap, fiokok, munkaterek, sajat_fiok_id: sajatFiokId };
}

// ---------------------------------------------------------------------------
// A négy veszélyes művelet. Mindegyik ELLENŐRZI, hogy a fiók létezik-e, és a jelölés elvételénél
// az önkizárást is — nem a felületre bízzuk, mert az API-t felület nélkül is meg lehet hívni.
// ---------------------------------------------------------------------------

async function fiokLetezik(fiokId: string): Promise<boolean> {
  const sorok = await db().select({ id: sema.fiok.id }).from(sema.fiok).where(eq(sema.fiok.id, fiokId)).limit(1);
  return sorok.length > 0;
}

/**
 * Felfüggesztés: a fiókra időbélyeg kerül, ÉS az élő munkamenetei megszűnnek.
 * A SAJÁT fiók nem függeszthető fel: az azonnali, visszavonhatatlan önkizárás lenne — a felfüggesztést
 * csak belépve lehet visszavonni, tehát utána csak adatbázisból lehetne visszaengedni magát.
 */
export async function felfuggeszt(fiokId: string, keroId: string): Promise<Eredmeny<{ fiokId: string }>> {
  if (fiokId === keroId) {
    console.warn("FIOK FELFUGGESZTES ELUTASITVA (sajat fiok):", fiokId);
    return { ok: false, hiba: "ONKIZARAS" };
  }
  if (!(await fiokLetezik(fiokId))) return { ok: false, hiba: "NINCS_ILYEN_FIOK" };
  await db().update(sema.fiok).set({ felfuggesztve: new Date() }).where(eq(sema.fiok.id, fiokId));
  // A jelölés önmagában nem elég: a már kiadott munkamenet-süti enélkül a lejáratáig működne.
  await db().delete(sema.munkamenet).where(eq(sema.munkamenet.fiokId, fiokId));
  console.warn("FIOK FELFUGGESZTVE:", fiokId);
  return { ok: true, ertek: { fiokId } };
}

/** Visszavonás: újra beléphet — de ÚJ belépést kell kezdeményeznie, a régiek nem élednek fel. */
export async function felfuggesztestVisszavon(fiokId: string): Promise<Eredmeny<{ fiokId: string }>> {
  if (!(await fiokLetezik(fiokId))) return { ok: false, hiba: "NINCS_ILYEN_FIOK" };
  await db().update(sema.fiok).set({ felfuggesztve: null }).where(eq(sema.fiok.id, fiokId));
  console.warn("FIOK FELFUGGESZTES VISSZAVONVA:", fiokId);
  return { ok: true, ertek: { fiokId } };
}

/** Rendszergazda-jelölés adása. */
export async function jelolestAd(fiokId: string): Promise<Eredmeny<{ fiokId: string }>> {
  if (!(await fiokLetezik(fiokId))) return { ok: false, hiba: "NINCS_ILYEN_FIOK" };
  await db().update(sema.fiok).set({ rendszergazda: true }).where(eq(sema.fiok.id, fiokId));
  console.warn("RENDSZERGAZDA JELOLES ADVA:", fiokId);
  return { ok: true, ertek: { fiokId } };
}

/**
 * Rendszergazda-jelölés elvétele. Ha ez volt az UTOLSÓ rendszergazda, a művelet elakad:
 * utána a lapokat senki nem érné el, és a jelölést csak adatbázisból lehetne visszaadni.
 * A felület ugyanezt piros figyelmeztetéssel jelzi, de a zár ITT van — az API felület nélkül is hívható.
 */
export async function jelolestElvesz(fiokId: string): Promise<Eredmeny<{ fiokId: string }>> {
  if (!(await fiokLetezik(fiokId))) return { ok: false, hiba: "NINCS_ILYEN_FIOK" };
  const [masik] = await db()
    .select({ db: count() })
    .from(sema.fiok)
    .where(and(eq(sema.fiok.rendszergazda, true), ne(sema.fiok.id, fiokId)));
  if (Number(masik?.db ?? 0) === 0) {
    console.warn("RENDSZERGAZDA JELOLES ELVETELE ELUTASITVA (utolso rendszergazda):", fiokId);
    return { ok: false, hiba: "ONKIZARAS" };
  }
  await db().update(sema.fiok).set({ rendszergazda: false }).where(eq(sema.fiok.id, fiokId));
  console.warn("RENDSZERGAZDA JELOLES ELVEVE:", fiokId);
  return { ok: true, ertek: { fiokId } };
}

/**
 * Fiók VÉGLEGES törlése (Vilmos döntése 2026-09-19). Négy zár, mind a kiszolgálón:
 *  1. a saját fiókját senki nem törölheti,
 *  2. a megerősítő e-mail-címnek egyeznie kell a fiókéval (elgépelés ellen),
 *  3. az utolsó rendszergazdát nem lehet törölni (utána senki nem érné el a lapokat),
 *  4. aki egy munkatér EGYETLEN tulajdonosa, nem törölhető — előbb át kell adni a munkateret.
 * Ami vele megy: a tagságai, a munkamenetei, az általa kiadott meghívók, a visszajelzései.
 * Ami marad, de elveszti a nevét: a munkák és jóváhagyások, amiket ő készített.
 */
export async function torol(fiokId: string, keroId: string, megerositoEmail: string): Promise<Eredmeny<{ fiokId: string }>> {
  if (fiokId === keroId) {
    console.warn("FIOK TORLES ELUTASITVA (sajat fiok):", fiokId);
    return { ok: false, hiba: "MAGAT_NEM" };
  }
  const [sor] = await db()
    .select({ id: sema.fiok.id, email: sema.fiok.email, rendszergazda: sema.fiok.rendszergazda })
    .from(sema.fiok)
    .where(eq(sema.fiok.id, fiokId))
    .limit(1);
  if (!sor) return { ok: false, hiba: "NINCS_ILYEN_FIOK" };

  if (sor.email.trim().toLowerCase() !== megerositoEmail.trim().toLowerCase()) {
    console.warn("FIOK TORLES ELUTASITVA (nem egyezo megerosites):", fiokId);
    return { ok: false, hiba: "ERVENYTELEN_ADAT" };
  }

  if (sor.rendszergazda) {
    const [masik] = await db()
      .select({ db: count() })
      .from(sema.fiok)
      .where(and(eq(sema.fiok.rendszergazda, true), ne(sema.fiok.id, fiokId)));
    if (Number(masik?.db ?? 0) === 0) {
      console.warn("FIOK TORLES ELUTASITVA (utolso rendszergazda):", fiokId);
      return { ok: false, hiba: "ONKIZARAS" };
    }
  }

  // Van-e olyan munkatér, ahol ő az EGYETLEN tulajdonos? Akkor a törlés gazdátlan munkateret hagyna.
  const arvak = await db().execute(sql`
    SELECT t.szervezet_id
      FROM tagsag t
     WHERE t.fiok_id = ${fiokId} AND t.szerep = 'tulajdonos'
       AND NOT EXISTS (
         SELECT 1 FROM tagsag m
          WHERE m.szervezet_id = t.szervezet_id AND m.szerep = 'tulajdonos' AND m.fiok_id <> ${fiokId}
       )
     LIMIT 1
  `);
  const sorok = (arvak as unknown as { rows?: unknown[] }).rows ?? (arvak as unknown as unknown[]);
  if (Array.isArray(sorok) && sorok.length > 0) {
    console.warn("FIOK TORLES ELUTASITVA (utolso tulajdonos):", fiokId);
    return { ok: false, hiba: "UTOLSO_TULAJDONOS" };
  }

  await db().delete(sema.fiok).where(eq(sema.fiok.id, fiokId));
  console.warn("FIOK VEGLEGESEN TOROLVE:", fiokId);
  return { ok: true, ertek: { fiokId } };
}
