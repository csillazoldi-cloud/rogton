import "server-only";
import { and, desc, eq, inArray, isNull, lte } from "drizzle-orm";
import { z } from "zod";
import type { FiokNezet } from "@rogton/contracts";
import { db, sema, szervezetKent } from "../adatbazis/kapcsolat";
import { hirfigyeloSzolgaltato } from "../ai";
import { szolgaltatoHol } from "@rogton/ai-adapters";
import { fiokNeve } from "../szervezet/reszletek";
import {
  ALAP_SAJAT_BEALLITAS,
  ERTESITES_FAJTAK,
  FAJTA_CEL,
  RENDSZERGAZDA_FAJTA,
} from "./tipusok";
import type {
  AdatpolitikaNezet,
  BeallitasokNezet,
  ErtesitesLista,
  ErtesitesSor,
  SajatBeallitas,
  SajatFajta,
} from "./tipusok";

export * from "./tipusok";

const SAJAT_FAJTAK: readonly SajatFajta[] = [...ERTESITES_FAJTAK, RENDSZERGAZDA_FAJTA];

const sajatBeallitasSema = z.object({
  esemenyek: z.object({
    futas_kesz: z.boolean(),
    forras_hibas: z.boolean(),
    keret_kimerult: z.boolean(),
    ai_nem_valaszol: z.boolean(),
    futas_beragadt: z.boolean(),
    belepesi_kiserletek: z.boolean(),
  }),
  feluleten: z.boolean(),
});

function alapraTerit(adat: unknown): SajatBeallitas {
  const nyers = (adat ?? {}) as Partial<SajatBeallitas>;
  const esemenyek = { ...ALAP_SAJAT_BEALLITAS.esemenyek };
  if (nyers.esemenyek && typeof nyers.esemenyek === "object") {
    for (const f of SAJAT_FAJTAK) {
      const v = (nyers.esemenyek as Record<string, unknown>)[f];
      if (typeof v === "boolean") esemenyek[f] = v;
    }
  }
  const feluleten = typeof nyers.feluleten === "boolean" ? nyers.feluleten : ALAP_SAJAT_BEALLITAS.feluleten;
  return { esemenyek, feluleten };
}

export async function sajatBeallitas(fiokId: string): Promise<SajatBeallitas> {
  const sor = (
    await db()
      .select({ adat: sema.ertesitesFiok.adat })
      .from(sema.ertesitesFiok)
      .where(eq(sema.ertesitesFiok.fiokId, fiokId))
      .limit(1)
  )[0];
  if (!sor) return alapraTerit(null);
  return alapraTerit(sor.adat);
}

export async function sajatBeallitasMent(fiokId: string, be: unknown): Promise<SajatBeallitas | null> {
  const p = sajatBeallitasSema.safeParse(be);
  if (!p.success) return null;
  const mentett: SajatBeallitas = { esemenyek: p.data.esemenyek, feluleten: p.data.feluleten };
  const meglevo = (
    await db()
      .select({ fiokId: sema.ertesitesFiok.fiokId })
      .from(sema.ertesitesFiok)
      .where(eq(sema.ertesitesFiok.fiokId, fiokId))
      .limit(1)
  )[0];
  if (meglevo) {
    await db()
      .update(sema.ertesitesFiok)
      .set({ adat: mentett, frissitve: new Date() })
      .where(eq(sema.ertesitesFiok.fiokId, fiokId));
  } else {
    await db()
      .insert(sema.ertesitesFiok)
      .values({ fiokId, adat: mentett, frissitve: new Date() });
  }
  return mentett;
}

type EsemenySor = {
  id: string;
  fajta: string;
  ido: Date;
  szervezetId: string | null;
  adat: unknown;
};

function ertekek(fajta: string, adat: unknown): Record<string, string | number> {
  const a = (adat ?? {}) as Record<string, unknown>;
  if (fajta === "futas_kesz") return { n: Number(a.uj_talalatok ?? 0) };
  if (fajta === "forras_hibas") return { forras: String(a.forras ?? "") };
  if (fajta === "ai_nem_valaszol") return { n: Number(a.n ?? 0) };
  return {};
}

export async function ertesitesLista(fiok: FiokNezet, limit = 50): Promise<ErtesitesLista> {
  const be = await sajatBeallitas(fiok.id);
  const bekapcsolt = ERTESITES_FAJTAK.filter((f) => be.esemenyek[f]);

  const gyujtott: EsemenySor[] = [];

  if (bekapcsolt.length > 0) {
    for (const sz of fiok.szervezetek) {
      try {
        const sorok = await szervezetKent(sz.id, (tx) =>
          tx
            .select({
              id: sema.esemeny.id,
              fajta: sema.esemeny.fajta,
              ido: sema.esemeny.ido,
              szervezetId: sema.esemeny.szervezetId,
              adat: sema.esemeny.adat,
            })
            .from(sema.esemeny)
            .where(and(eq(sema.esemeny.szervezetId, sz.id), inArray(sema.esemeny.fajta, bekapcsolt)))
            .orderBy(desc(sema.esemeny.ido))
            .limit(limit),
        );
        gyujtott.push(...sorok);
      } catch (h) {
        console.error("[ertesites] szervezeti esemenyek:", h);
      }
    }
  }

  if (fiok.rendszergazda && be.esemenyek.belepesi_kiserletek) {
    try {
      const sorok = await db()
        .select({
          id: sema.esemeny.id,
          fajta: sema.esemeny.fajta,
          ido: sema.esemeny.ido,
          szervezetId: sema.esemeny.szervezetId,
          adat: sema.esemeny.adat,
        })
        .from(sema.esemeny)
        .where(and(isNull(sema.esemeny.szervezetId), eq(sema.esemeny.fajta, RENDSZERGAZDA_FAJTA)))
        .orderBy(desc(sema.esemeny.ido))
        .limit(limit);
      gyujtott.push(...sorok);
    } catch (h) {
      console.error("[ertesites] rendszerszintu esemenyek:", h);
    }
  }

  gyujtott.sort((a, b) => b.ido.getTime() - a.ido.getTime());
  const vagott = gyujtott.slice(0, limit);

  const fiokSor = (
    await db()
      .select({ olvasvaIg: sema.ertesitesFiok.olvasvaIg })
      .from(sema.ertesitesFiok)
      .where(eq(sema.ertesitesFiok.fiokId, fiok.id))
      .limit(1)
  )[0];
  const olvasvaIg = fiokSor?.olvasvaIg ?? null;

  const esemenyIds = vagott.map((e) => e.id);
  const olvasottIds = new Set<string>();
  if (esemenyIds.length > 0) {
    const olvasottSorok = await db()
      .select({ esemenyId: sema.ertesitesOlvasott.esemenyId })
      .from(sema.ertesitesOlvasott)
      .where(and(eq(sema.ertesitesOlvasott.fiokId, fiok.id), inArray(sema.ertesitesOlvasott.esemenyId, esemenyIds)));
    for (const o of olvasottSorok) olvasottIds.add(o.esemenyId);
  }

  const munkaterNev = new Map<string, string>();
  for (const sz of fiok.szervezetek) munkaterNev.set(sz.id, sz.nev);

  const sorok: ErtesitesSor[] = vagott.map((e) => {
    const olvasott =
      olvasottIds.has(e.id) || (olvasvaIg !== null && e.ido.getTime() <= olvasvaIg.getTime());
    const fajta = e.fajta as SajatFajta;
    const munkater =
      e.szervezetId !== null
        ? { id: e.szervezetId, nev: munkaterNev.get(e.szervezetId) ?? "" }
        : null;
    return {
      id: e.id,
      fajta,
      ido: e.ido.toISOString(),
      olvasott,
      munkater,
      cel: FAJTA_CEL[fajta],
      ertekek: ertekek(e.fajta, e.adat),
    };
  });

  const olvasatlan = sorok.filter((s) => !s.olvasott).length;
  return { sorok, olvasatlan, osszes: sorok.length };
}

export async function olvasatlanSzam(fiok: FiokNezet): Promise<number> {
  try {
    const be = await sajatBeallitas(fiok.id);
    if (be.feluleten === false) return 0;
    const lista = await ertesitesLista(fiok);
    return lista.olvasatlan;
  } catch (h) {
    console.error("[ertesites] olvasatlanSzam hiba:", h);
    return 0;
  }
}

export async function olvasottJelol(fiokId: string, esemenyId: string): Promise<void> {
  await db()
    .insert(sema.ertesitesOlvasott)
    .values({ fiokId, esemenyId, ido: new Date() })
    .onConflictDoNothing();
}

export async function mindOlvasott(fiokId: string): Promise<void> {
  const meglevo = (
    await db()
      .select({ fiokId: sema.ertesitesFiok.fiokId })
      .from(sema.ertesitesFiok)
      .where(eq(sema.ertesitesFiok.fiokId, fiokId))
      .limit(1)
  )[0];
  const most = new Date();
  if (meglevo) {
    await db()
      .update(sema.ertesitesFiok)
      .set({ olvasvaIg: most, frissitve: most })
      .where(eq(sema.ertesitesFiok.fiokId, fiokId));
  } else {
    await db()
      .insert(sema.ertesitesFiok)
      .values({ fiokId, adat: ALAP_SAJAT_BEALLITAS, olvasvaIg: most, frissitve: most });
  }
}

export async function esemenyMunkatere(
  fiok: FiokNezet,
  esemenyId: string,
): Promise<{ szervezet_id: string | null; fajta: SajatFajta } | null> {
  for (const sz of fiok.szervezetek) {
    try {
      const sor = (
        await szervezetKent(sz.id, (tx) =>
          tx
            .select({ fajta: sema.esemeny.fajta })
            .from(sema.esemeny)
            .where(and(eq(sema.esemeny.id, esemenyId), eq(sema.esemeny.szervezetId, sz.id)))
            .limit(1),
        )
      )[0];
      if (sor) return { szervezet_id: sz.id, fajta: sor.fajta as SajatFajta };
    } catch (h) {
      console.error("[ertesites] esemenyMunkatere szervezet:", h);
    }
  }
  if (fiok.rendszergazda) {
    try {
      const sor = (
        await db()
          .select({ fajta: sema.esemeny.fajta })
          .from(sema.esemeny)
          .where(and(eq(sema.esemeny.id, esemenyId), isNull(sema.esemeny.szervezetId)))
          .limit(1)
      )[0];
      if (sor) return { szervezet_id: null, fajta: sor.fajta as SajatFajta };
    } catch (h) {
      console.error("[ertesites] esemenyMunkatere rendszer:", h);
    }
  }
  return null;
}

export async function beallitasokNezet(
  fiok: FiokNezet,
  szerep: "tulajdonos" | "szerkeszto" | "nezo",
  szervezetId: string,
): Promise<BeallitasokNezet> {
  // F-7b (R-5, 05. artboard): a munkatér AI-kapcsolója és az utolsó kikapcsolás (az eseménynaplóból, a fiók nevével)
  let ai_engedelyezve = true;
  let ai_kikapcsolva: AdatpolitikaNezet["ai_kikapcsolva"] = null;
  try {
    const sor = await szervezetKent(szervezetId, async (tx) =>
      (await tx.select({ be: sema.szervezet.aiEngedelyezve }).from(sema.szervezet).where(eq(sema.szervezet.id, szervezetId)).limit(1))[0]);
    ai_engedelyezve = sor?.be ?? true;
    if (!ai_engedelyezve) {
      const ev = await szervezetKent(szervezetId, async (tx) =>
        (await tx.select({ ido: sema.esemeny.ido, fiokId: sema.esemeny.fiokId, adat: sema.esemeny.adat }).from(sema.esemeny)
          .where(and(eq(sema.esemeny.szervezetId, szervezetId), eq(sema.esemeny.fajta, "ai_kapcsolo_valtozott")))
          .orderBy(desc(sema.esemeny.ido)).limit(1))[0]);
      if (ev && (ev.adat as { engedelyezve?: boolean } | null)?.engedelyezve === false) {
        ai_kikapcsolva = { ido: ev.ido.toISOString(), ki: await fiokNeve(ev.fiokId) };
      }
    }
  } catch (h) {
    console.error("[ertesites] ai kapcsolo:", h);
  }
  const lista = await ertesitesLista(fiok);
  const beallitas = await sajatBeallitas(fiok.id);

  const sz = hirfigyeloSzolgaltato().leirolap;
  const hol = szolgaltatoHol(sz.azonosito);
  const orszag_kulcs =
    hol === "felho"
      ? "adatpolitika.orszag_usa"
      : sz.azonosito === "teszt"
        ? "adatpolitika.orszag_nincs"
        : "adatpolitika.orszag_hazon_belul";

  const adatpolitika: AdatpolitikaNezet = {
    szolgaltato: { nev: sz.nev, hol, orszag_kulcs },
    meres_datum: "2026-09-13",
    felho_kapcsolo_latszik: szerep === "tulajdonos",
    ai_engedelyezve,
    ai_kikapcsolva,
  };

  return {
    lista,
    beallitas,
    rendszergazda: fiok.rendszergazda,
    adatpolitika,
  };
}
