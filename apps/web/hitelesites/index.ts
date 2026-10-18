import { randomBytes, createHash, randomUUID } from "node:crypto";
import { esemenyKornyezet, feljegyezHatterben } from "../esemeny";
import { hash, verify } from "@node-rs/argon2";
import { and, count, eq, gt } from "drizzle-orm";
import { z } from "zod";
import {
  BelepesKeres,
  FiokNezet,
  HibaKod,
  MUNKAMENET_ELETTARTAM_NAP,
  RegisztracioKeres,
  SzervezetLetrehozasKeres,
} from "@rogton/contracts";
import { db, fiokKent, sema, szervezetKent } from "../adatbazis/kapcsolat";

export type Eredmeny<T> = { ok: true; ertek: T } | { ok: false; hiba: HibaKod; mezok?: Record<string, string> };

function mezokHiba(hiba: z.ZodError): Record<string, string> {
  const mezok: Record<string, string> = {};
  for (const problema of hiba.issues) {
    const ut = problema.path.join(".");
    if (ut && !mezok[ut]) {
      mezok[ut] = problema.code; // a zod hibakódja (pl. invalid_format, too_small) — nem szöveg
    }
  }
  return mezok;
}

/** A pg hibakódja — a Drizzle a saját hibájába csomagolja (cause), ezért mindkét helyen nézzük. */
function pgHibaKod(hiba: unknown): string | undefined {
  for (const h of [hiba, hiba instanceof Error ? hiba.cause : undefined]) {
    if (typeof h === "object" && h !== null && "code" in h && typeof h.code === "string") return h.code;
  }
  return undefined;
}

export function hibaEredmeny(hiba: HibaKod, mezok?: Record<string, string>): Eredmeny<never> {
  return mezok ? { ok: false, hiba, mezok } : { ok: false, hiba };
}

/**
 * E-50: ember hozta létre a fiókot, vagy gépi teszt.
 *
 * Ez NEM találgatás az e-mail címből. A `.example`, `.local`, `.test` és `.invalid` végződést
 * szabvány tartja fenn (RFC 2606 és 6761): ilyen tartomány nem regisztrálható és nem kézbesíthető,
 * tehát ilyen címen valódi ember nem tud fiókot nyitni — csak a gépi próbák használják.
 * Minden más cím embernek számít. A régi, migráció előtti sorok egyszeri besorolást kaptak (0042).
 */
export function fiokEredete(email: string): "ember" | "gepi_teszt" {
  return /@[^@]+\.(example|local|test|invalid)$/i.test(email) ? "gepi_teszt" : "ember";
}

export async function regisztral(be: unknown): Promise<Eredmeny<{ fiokId: string }>> {
  // a rövid jelszó külön kódot kap, mielőtt a séma általános ERVENYTELEN_ADAT-tal elutasítaná
  if (typeof be === "object" && be !== null && "jelszo" in be && typeof be.jelszo === "string" && be.jelszo.length < 10) {
    return hibaEredmeny("GYENGE_JELSZO");
  }
  const elemzes = RegisztracioKeres.safeParse(be);
  if (!elemzes.success) {
    return hibaEredmeny("ERVENYTELEN_ADAT", mezokHiba(elemzes.error));
  }
  const { nev, email, jelszo } = elemzes.data;
  const jelszoHash = await hash(jelszo);
  const fiokId = randomUUID();
  try {
    await db().insert(sema.fiok).values({ id: fiokId, email, nev, jelszoHash, eredet: fiokEredete(email) });
  } catch (hiba) {
    if (pgHibaKod(hiba) === "23505") {
      return hibaEredmeny("EMAIL_FOGLALT");
    }
    console.error("Regisztracio sikertelen:", hiba);
    return hibaEredmeny("BELSO_HIBA");
  }
  return { ok: true, ertek: { fiokId } };
}

export async function belep(be: unknown): Promise<Eredmeny<{ token: string; lejar: Date; fiokId: string }>> {
  const elemzes = BelepesKeres.safeParse(be);
  if (!elemzes.success) {
    return hibaEredmeny("ERVENYTELEN_ADAT", mezokHiba(elemzes.error));
  }
  const { email, jelszo } = elemzes.data;
  const fiokSorok = await db().select().from(sema.fiok).where(eq(sema.fiok.email, email)).limit(1);
  const fiokSor = fiokSorok[0];
  if (!fiokSor || fiokSor.jelszoHash === "") {
    return hibaEredmeny("ROSSZ_BELEPES");
  }
  const jelszoJo = await verify(fiokSor.jelszoHash, jelszo).catch(() => false);
  if (!jelszoJo) {
    return hibaEredmeny("ROSSZ_BELEPES");
  }
  // E-50: felfüggesztett fiók nem léphet be. A JELSZÓ UTÁN nézzük, nem előtte: aki nem tudja a jelszót,
  // az ne tudhassa meg belőle, hogy létezik-e a cím és mi az állapota. Aki tudja, annak megmondjuk, miért
  // nem megy — különben csak annyit látna, hogy „rossz belépés", és a jelszavát kezdené cserélgetni.
  if (fiokSor.felfuggesztve !== null) {
    return hibaEredmeny("FIOK_FELFUGGESZTVE");
  }
  const token = randomBytes(32).toString("base64url");
  const tokenLenyomat = createHash("sha256").update(token).digest("hex");
  const lejar = new Date(Date.now() + MUNKAMENET_ELETTARTAM_NAP * 24 * 60 * 60 * 1000);
  await db().insert(sema.munkamenet).values({ fiokId: fiokSor.id, tokenLenyomat, lejar });
  // E-50: a belépés ideje a fiókra kerül. A munkamenet-tábla erre nem jó: kilépéskor és lejáratkor
  // törlődik a sor, tehát abból a „mikor járt itt utoljára" kérdésre nem lehet válaszolni.
  await db().update(sema.fiok).set({ utolsoBelepes: new Date() }).where(eq(sema.fiok.id, fiokSor.id));
  // E-13: az ELSŐ rendszergazda beállítása — a RENDSZERGAZDA_EMAIL környezeti változó címe belépéskor
  // megkapja a jelölést. Biztonsági felülvizsgálat 2026-09-10 (K-01): ez ÖNMAGÁBAN jogemelési út volt,
  // mert a regisztráció nyitva van és nincs e-mail-birtoklás igazolás — aki előbb regisztrálja azt a
  // címet, az kapja meg. Ezért a jelölés MOSTANTÓL csak akkor kerül fel, ha a rendszerben MÉG EGYETLEN
  // rendszergazda SINCS (indulási lépés). Ha már van, a változó hatástalan; további rendszergazdát a
  // rendszergazda ad, vagy SQL. Minden ilyen jelölés naplóba kerül.
  const rendszergazdaEmail = process.env["RENDSZERGAZDA_EMAIL"]?.trim().toLowerCase();
  if (rendszergazdaEmail && rendszergazdaEmail === fiokSor.email && !fiokSor.rendszergazda) {
    const [vanMar] = await db().select({ db: count() }).from(sema.fiok).where(eq(sema.fiok.rendszergazda, true));
    if (Number(vanMar?.db ?? 0) === 0) {
      await db().update(sema.fiok).set({ rendszergazda: true }).where(eq(sema.fiok.id, fiokSor.id));
      console.warn("RENDSZERGAZDA JELOLES: az elso rendszergazda beallitva a RENDSZERGAZDA_EMAIL alapjan, fiok:", fiokSor.id);
    } else {
      console.warn("RENDSZERGAZDA JELOLES ELUTASITVA: mar van rendszergazda, a RENDSZERGAZDA_EMAIL hatastalan. Kero fiok:", fiokSor.id);
    }
  }
  await feljegyezHatterben(await esemenyKornyezet(), { szervezet_id: null, fajta: "belepes", fiok_id: fiokSor.id, adat: {} }); // F-5
  return { ok: true, ertek: { token, lejar, fiokId: fiokSor.id } };
}

export async function kilep(token: string): Promise<void> {
  const tokenLenyomat = createHash("sha256").update(token).digest("hex");
  const torolt = await db().delete(sema.munkamenet).where(eq(sema.munkamenet.tokenLenyomat, tokenLenyomat)).returning({ fiokId: sema.munkamenet.fiokId });
  const fiokId = torolt[0]?.fiokId;
  if (fiokId) await feljegyezHatterben(await esemenyKornyezet(), { szervezet_id: null, fajta: "kilepes", fiok_id: fiokId, adat: {} }); // F-5
}

export async function aktualisFiok(token: string | undefined): Promise<FiokNezet | null> {
  if (!token) return null;
  const tokenLenyomat = createHash("sha256").update(token).digest("hex");
  const munkamenetSorok = await db()
    .select()
    .from(sema.munkamenet)
    .where(and(eq(sema.munkamenet.tokenLenyomat, tokenLenyomat), gt(sema.munkamenet.lejar, new Date())))
    .limit(1);
  const munkamenetSor = munkamenetSorok[0];
  if (!munkamenetSor) {
    await db().delete(sema.munkamenet).where(eq(sema.munkamenet.tokenLenyomat, tokenLenyomat));
    return null;
  }
  const fiokSorok = await db().select().from(sema.fiok).where(eq(sema.fiok.id, munkamenetSor.fiokId)).limit(1);
  const fiokSor = fiokSorok[0];
  if (!fiokSor) return null;
  // E-50: felfüggesztett fiók élő munkamenete sem érvényes. A felfüggesztés törli a munkamenet-sorokat,
  // de ez a második zár: ha bármi okból marad sor (párhuzamos belépés a felfüggesztés pillanatában),
  // a következő kérésnél itt hal meg — és a sort is takarítjuk, hogy ne éledjen újra.
  if (fiokSor.felfuggesztve !== null) {
    await db().delete(sema.munkamenet).where(eq(sema.munkamenet.fiokId, fiokSor.id));
    return null;
  }

  const szervezetek = await fiokKent(fiokSor.id, async (tx) => {
    const tagsagok = await tx
      .select({
        szervezetId: sema.tagsag.szervezetId,
        szerep: sema.tagsag.szerep,
        szervezetNev: sema.szervezet.nev,
      })
      .from(sema.tagsag)
      .innerJoin(sema.szervezet, eq(sema.szervezet.id, sema.tagsag.szervezetId))
      .where(eq(sema.tagsag.fiokId, fiokSor.id));
    return tagsagok;
  });

  // F-2 (D-F25): a fiók TÁROLT választása szerinti munkatér áll elöl (ha még tagja); a 26 hívóhely `aktualisSzervezet()`-je így változatlan.
  const valasztott = fiokSor.aktualisSzervezetId;
  if (valasztott) szervezetek.sort((a, b) => (a.szervezetId === valasztott ? -1 : b.szervezetId === valasztott ? 1 : 0));
  return {
    id: fiokSor.id,
    email: fiokSor.email,
    nev: fiokSor.nev,
    rendszergazda: fiokSor.rendszergazda,
    nyelv: (fiokSor.nyelv === "hu" || fiokSor.nyelv === "ro" || fiokSor.nyelv === "en") ? fiokSor.nyelv : null,
    szervezetek: szervezetek.map((t) => ({
      id: t.szervezetId,
      nev: t.szervezetNev,
      szerep: t.szerep,
    })),
  };
}

export async function szervezetLetrehoz(
  fiokId: string,
  be: unknown,
): Promise<Eredmeny<{ szervezetId: string }>> {
  const elemzes = SzervezetLetrehozasKeres.safeParse(be);
  if (!elemzes.success) {
    return hibaEredmeny("ERVENYTELEN_ADAT", mezokHiba(elemzes.error));
  }
  const { nev } = elemzes.data;
  const szervezetId = randomUUID();
  try {
    await szervezetKent(szervezetId, async (tx) => {
      await tx.insert(sema.szervezet).values({ id: szervezetId, nev });
      await tx.insert(sema.tagsag).values({ szervezetId, fiokId, szerep: "tulajdonos" });
    });
  } catch (hiba) {
    console.error("Szervezet letrehozas sikertelen:", hiba);
    return hibaEredmeny("BELSO_HIBA");
  }
  return { ok: true, ertek: { szervezetId } };
}

/** A bejelentkezett ember AKTUÁLIS szervezete: az első; a több szervezet közti választás külön lépés. */
export function aktualisSzervezet(fiok: FiokNezet): { id: string; nev: string } | null {
  const elso = fiok.szervezetek[0];
  return elso ? { id: elso.id, nev: elso.nev } : null;
}

/** E-29c: a fiók felületnyelvének mentése (a nyelvváltó hívja). A háttérfutás ebből tudja, milyen nyelven írjon az AI. */
export async function fiokNyelvMent(fiokId: string, nyelv: "hu" | "ro" | "en"): Promise<void> {
  await db().update(sema.fiok).set({ nyelv }).where(eq(sema.fiok.id, fiokId));
}

/** F-2 (D-F25): a fiók aktuális munkaterének választása. Csak a saját tagságai közt; `false` = nem tag (a végpont 403-at ad). */
export async function aktualisSzervezetValaszt(fiokId: string, szervezetId: string): Promise<boolean> {
  const tag = await fiokKent(fiokId, async (tx) => {
    const sorok = await tx.select({ id: sema.tagsag.szervezetId }).from(sema.tagsag).where(and(eq(sema.tagsag.fiokId, fiokId), eq(sema.tagsag.szervezetId, szervezetId))).limit(1);
    return sorok.length > 0;
  });
  if (!tag) return false;
  await db().update(sema.fiok).set({ aktualisSzervezetId: szervezetId }).where(eq(sema.fiok.id, fiokId));
  return true;
}
