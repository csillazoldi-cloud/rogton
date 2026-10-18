// Jelszó-visszaállítás egyszer használatos, lejáró jeggyel (E-34).
//
// D-17 (2026-09-08): e-mail-küldés NINCS, ezért a jegyet a RENDSZERGAZDA adja ki annak, aki kéri.
// Ez tudatosan kényelmetlen: cserébe nem kell postafiókot üzemeltetni, és a jegy útja ellenőrizhető
// (ki adta ki, mikor). Ha később lesz e-mail-küldés, csak a KIADÁS módja változik — a jegy kezelése nem.
//
// A jegy kezelése ugyanaz, mint a munkameneté: 32 bájt véletlen, és az adatbázisban CSAK a
// SHA-256 lenyomata van. Aki az adatbázist látja, nem tud vele jelszót átállítani.
import { createHash, randomBytes } from "node:crypto";
import { hash } from "@node-rs/argon2";
import { and, eq, gt, isNull } from "drizzle-orm";
import type { HibaKod } from "@km/contracts";
import { db, sema } from "../adatbazis/kapcsolat";
import type { Eredmeny } from "./index";

/** A jegy érvényessége. Rövid: aki kéri, azonnal használja. */
export const JEGY_ELETTARTAM_PERC = 60;

function lenyomat(jegy: string): string {
  return createHash("sha256").update(jegy).digest("hex");
}

function hibaEredmeny(hiba: HibaKod): Eredmeny<never> {
  return { ok: false, hiba };
}

/**
 * Jegy kiadása egy e-mail-címhez. CSAK rendszergazda hívhatja (az útvonal őrzi).
 *
 * Ha nincs ilyen fiók, akkor is `ok`-ot ad vissza, `jegy: null` értékkel — így a válasz nem
 * használható fiókok létezésének feltérképezésére. (A rendszergazda a felületen látja, hogy
 * nem keletkezett jegy.)
 */
export async function jegyKiad(
  email: string,
  kiadta: string,
  most: Date = new Date(),
): Promise<Eredmeny<{ jegy: string | null; lejar: Date }>> {
  const tisztaEmail = email.trim().toLowerCase();
  const lejar = new Date(most.getTime() + JEGY_ELETTARTAM_PERC * 60 * 1000);

  const fiokSorok = await db().select().from(sema.fiok).where(eq(sema.fiok.email, tisztaEmail)).limit(1);
  const fiokSor = fiokSorok[0];
  if (!fiokSor) return { ok: true, ertek: { jegy: null, lejar } };

  const jegy = randomBytes(32).toString("base64url");
  await db().insert(sema.jelszoVisszaallitas).values({
    fiokId: fiokSor.id,
    jegyLenyomat: lenyomat(jegy),
    lejar,
    kiadta,
  });
  return { ok: true, ertek: { jegy, lejar } };
}

/** Érvényes-e a jegy? (A felület ezzel dönti el, mutassa-e az űrlapot.) */
export async function jegyErvenyes(jegy: string, most: Date = new Date()): Promise<boolean> {
  const sorok = await db()
    .select({ id: sema.jelszoVisszaallitas.id })
    .from(sema.jelszoVisszaallitas)
    .where(
      and(
        eq(sema.jelszoVisszaallitas.jegyLenyomat, lenyomat(jegy)),
        gt(sema.jelszoVisszaallitas.lejar, most),
        isNull(sema.jelszoVisszaallitas.felhasznalva),
      ),
    )
    .limit(1);
  return sorok.length > 0;
}

/**
 * A jelszó átállítása a jeggyel. A jegy EGYSZER használható.
 *
 * A sikeres átállítás után a fiók ÖSSZES munkamenete törlődik: ha valaki idegen ült bent
 * a fiókban, az átállítással kirepül. (Ez a visszaállítás értelme.)
 */
export async function jelszoAtallit(
  jegy: string,
  ujJelszo: string,
  most: Date = new Date(),
): Promise<Eredmeny<{ fiokId: string }>> {
  if (typeof ujJelszo !== "string" || ujJelszo.length < 10) return hibaEredmeny("GYENGE_JELSZO");
  if (ujJelszo.length > 200) return hibaEredmeny("ERVENYTELEN_ADAT");

  const sorok = await db()
    .select()
    .from(sema.jelszoVisszaallitas)
    .where(
      and(
        eq(sema.jelszoVisszaallitas.jegyLenyomat, lenyomat(jegy)),
        gt(sema.jelszoVisszaallitas.lejar, most),
        isNull(sema.jelszoVisszaallitas.felhasznalva),
      ),
    )
    .limit(1);
  const sor = sorok[0];
  if (!sor) return hibaEredmeny("ERVENYTELEN_JEGY");

  const jelszoHash = await hash(ujJelszo);

  // A jegyet ELŐBB zárjuk le, és CSAK akkor írjuk a jelszót, ha a lezárás tényleg most történt.
  // Így két egyszerre érkező kérésből is csak az egyik állíthat jelszót (a `felhasznalva IS NULL`
  // feltétel az UPDATE-ben van, nem külön olvasásban).
  const lezaras = await db()
    .update(sema.jelszoVisszaallitas)
    .set({ felhasznalva: most })
    .where(and(eq(sema.jelszoVisszaallitas.id, sor.id), isNull(sema.jelszoVisszaallitas.felhasznalva)))
    .returning({ id: sema.jelszoVisszaallitas.id });
  if (lezaras.length === 0) return hibaEredmeny("ERVENYTELEN_JEGY");

  await db().update(sema.fiok).set({ jelszoHash }).where(eq(sema.fiok.id, sor.fiokId));
  // Minden korábbi belépés érvényét veszti.
  await db().delete(sema.munkamenet).where(eq(sema.munkamenet.fiokId, sor.fiokId));

  return { ok: true, ertek: { fiokId: sor.fiokId } };
}
