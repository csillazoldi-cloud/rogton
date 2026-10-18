import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { FutasHaladas } from "@rogton/news-monitor-core";
import { db, sema } from "../adatbazis/kapcsolat";
import { esemenyKornyezet, feljegyezHatterben } from "../esemeny";

// A Hírfigyelő várólistája (E-22) — HOST-szintű műveletek: a db()-vel dolgozunk,
// NEM szervezetKent, mert a futtató minden szervezet sorát látja (nincs sorszintű védelem).

export type SorFajta = "futas" | "ertekeles_ujra" | "napi" | "kiprobal"; // kiprobal: a javaslat kipróbálása ugyanazon a mintán (E-26 — valódi AI-val hosszú)
export type SorAllapot = "var" | "fut" | "kesz" | "hiba";

export type SorTetel = {
  id: string;
  szervezetId: string;
  fajta: SorFajta;
  adat: Record<string, unknown>;
  allapot: SorAllapot;
  kiserlet: number;
  letrehozva: Date;
  kezdve: Date | null;
  vege: Date | null;
  hibaOk: string | null;
  eredmeny: Record<string, unknown> | null;
  haladas: FutasHaladas | null;
};

function sorTetelParse(sor: typeof sema.hfSor.$inferSelect): SorTetel {
  return {
    id: sor.id,
    szervezetId: sor.szervezetId,
    fajta: sor.fajta as SorFajta,
    adat: (sor.adat ?? {}) as Record<string, unknown>,
    allapot: sor.allapot as SorAllapot,
    kiserlet: sor.kiserlet,
    letrehozva: sor.letrehozva,
    kezdve: sor.kezdve,
    vege: sor.vege,
    hibaOk: sor.hibaOk,
    eredmeny: (sor.eredmeny ?? null) as Record<string, unknown> | null,
    haladas: (sor.haladas ?? null) as FutasHaladas | null,
  };
}

/** Sorba teszi a szervezet feladatát; ha már van var/fut tétele, FUT_MAR. */
export async function sorbaTesz(
  szervezetId: string,
  fajta: SorFajta,
  adat: Record<string, unknown>,
): Promise<{ ok: true; sor: SorTetel } | { ok: false; hiba: "FUT_MAR" }> {
  const d = db();
  const aktiv = await d
    .select({ id: sema.hfSor.id })
    .from(sema.hfSor)
    .where(and(eq(sema.hfSor.szervezetId, szervezetId), inArray(sema.hfSor.allapot, ["var", "fut"])))
    .limit(1);
  if (aktiv.length > 0) return { ok: false, hiba: "FUT_MAR" };
  const beszurt = await d
    .insert(sema.hfSor)
    .values({ szervezetId, fajta, adat, allapot: "var" })
    .returning();
  const sor = beszurt[0];
  if (!sor) return { ok: false, hiba: "FUT_MAR" };
  return { ok: true, sor: sorTetelParse(sor) };
}

/** Egy tétel azonosító alapján. */
export async function sorTetel(id: string): Promise<SorTetel | null> {
  const sor = (await db().select().from(sema.hfSor).where(eq(sema.hfSor.id, id)).limit(1))[0];
  return sor ? sorTetelParse(sor) : null;
}

/** A szervezet legutóbbi 20 tétele. */
export async function szervezetSora(szervezetId: string): Promise<SorTetel[]> {
  const sorok = await db()
    .select()
    .from(sema.hfSor)
    .where(eq(sema.hfSor.szervezetId, szervezetId))
    .orderBy(sql`${sema.hfSor.letrehozva} desc`)
    .limit(20);
  return sorok.map(sorTetelParse);
}

/** A szervezet var/fut tétele (a sáv „Figyelés fut a háttérben…” ebből tudja). */
export async function szervezetAktivSora(szervezetId: string): Promise<SorTetel | null> {
  const sor = (
    await db()
      .select()
      .from(sema.hfSor)
      .where(and(eq(sema.hfSor.szervezetId, szervezetId), inArray(sema.hfSor.allapot, ["var", "fut"])))
      .orderBy(sql`${sema.hfSor.letrehozva} asc`)
      .limit(1)
  )[0];
  return sor ? sorTetelParse(sor) : null;
}

/**
 * A következő tétel kivétele: EGY tétel, csak akkor, ha NINCS fut állapotú tétel sehol
 * (egyszerre egy munka az egész rendszerben). A kiválasztás FOR UPDATE SKIP LOCKED-del történik.
 */
export async function kovetkezoKivesz(): Promise<SorTetel | null> {
  const d = db();
  const futDb = await d
    .select({ count: sql<number>`count(*)::int` })
    .from(sema.hfSor)
    .where(eq(sema.hfSor.allapot, "fut"));
  const futSzam = futDb[0]?.count ?? 0;
  if (futSzam > 0) return null;

  const sorok = await d.execute(sql`
    UPDATE hf_sor
    SET allapot = 'fut', kezdve = now(), kiserlet = kiserlet + 1
    WHERE id = (
      SELECT id FROM hf_sor
      WHERE allapot = 'var'
      ORDER BY letrehozva
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id
  `);
  // a nyers sor kisbetűs-aláhúzásos oszlopneveket ad (szervezet_id) — a tételt a drizzle-n át olvassuk vissza
  const id = (sorok.rows[0] as { id?: string } | undefined)?.id;
  if (!id) return null;
  return sorTetel(id);
}

/** Sikeres lezárás: allapot kesz, eredmeny, vege. */
export async function lezar(id: string, eredmeny: Record<string, unknown>): Promise<void> {
  await db()
    .update(sema.hfSor)
    .set({ allapot: "kesz", eredmeny, vege: new Date() })
    .where(eq(sema.hfSor.id, id));
}

/** Hibás lezárás: allapot hiba, hiba_ok, vege. */
export async function hibara(id: string, ok: string): Promise<void> {
  await db()
    .update(sema.hfSor)
    .set({ allapot: "hiba", hibaOk: ok, vege: new Date() })
    .where(eq(sema.hfSor.id, id));
}

/** F9-A3: a futás haladásának mentése a sor tételére (a képernyő ezt mutatja). */
export async function haladasIr(id: string, h: FutasHaladas): Promise<void> {
  await db().update(sema.hfSor).set({ haladas: h }).where(eq(sema.hfSor.id, id));
}

/**
 * A beragadt tételek elengedése: a 15 percnél régebb óta fut tételek → hiba ("idotullepes").
 * A hozzá tartozó hf_futas fut sorát is hiba-ra állítja (veg = now()), hogy egy elszállt
 * folyamat ne fogja meg a sort örökre.
 */
export async function beragadtakElenged(most: Date): Promise<void> {
  const d = db();
  const hatar = new Date(most.getTime() - 15 * 60 * 1000);
  const beragadtak = await d
    .select()
    .from(sema.hfSor)
    .where(and(eq(sema.hfSor.allapot, "fut"), sql`${sema.hfSor.kezdve} < ${hatar}`));
  for (const sor of beragadtak) {
    await d
      .update(sema.hfSor)
      .set({ allapot: "hiba", hibaOk: "idotullepes", vege: most })
      .where(eq(sema.hfSor.id, sor.id));
    // F-5b (D-F33): a beragadt futás esemény is — a munkatér tagjai értesülnek (R-4 „Beragadt egy futás")
    const beragadtFutasId = (sor.eredmeny as { futas_id?: string } | null)?.futas_id;
    await feljegyezHatterben(await esemenyKornyezet(), { szervezet_id: sor.szervezetId, fajta: "futas_beragadt", fiok_id: null, adat: { ...(beragadtFutasId ? { futas_id: beragadtFutasId } : {}), perc: 15 } });
    // A hozzá tartozó hf_futas fut sorát is hiba-ra (a futas_id az eredmenyben lehet, de a fajta alapján is megkereshető)
    const futasId = (sor.eredmeny as { futas_id?: string } | null)?.futas_id;
    if (futasId) {
      await d
        .update(sema.hfFutas)
        .set({ allapot: "hiba", veg: most })
        .where(and(eq(sema.hfFutas.id, futasId), eq(sema.hfFutas.szervezetId, sor.szervezetId)));
    }
  }
}

/**
 * T-21 (2026-09-12): INDULÁSKOR minden „fut" tétel elengedése — egy alkalmazáspéldány fut egy adatbázison, tehát ami az induláskor
 * „fut", azt a régi (a kirakásnál leállított) folyamat hagyta ott; várni rá 15 percet fölösleges, és addig a sor áll.
 * A hozzá tartozó hf_futas is hiba-ra, hogy a kezdőlap ne mutassa „fut a háttérben"-nek. Visszatérés: hány tételt engedett el.
 */
export async function indulaskorElenged(most: Date): Promise<number> {
  const d = db();
  const beragadtak = await d.select().from(sema.hfSor).where(eq(sema.hfSor.allapot, "fut"));
  for (const sor of beragadtak) {
    await d.update(sema.hfSor).set({ allapot: "hiba", hibaOk: "megszakadt_ujrainditas", vege: most }).where(eq(sema.hfSor.id, sor.id));
    const futasId = (sor.eredmeny as { futas_id?: string } | null)?.futas_id;
    if (futasId) {
      await d.update(sema.hfFutas).set({ allapot: "hiba", veg: most }).where(and(eq(sema.hfFutas.id, futasId), eq(sema.hfFutas.szervezetId, sor.szervezetId)));
    }
  }
  return beragadtak.length;
}
