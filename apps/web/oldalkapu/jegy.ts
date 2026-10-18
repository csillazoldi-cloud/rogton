// G9 — a kapu jegyei (kapu_jegy tábla, 0185). A süti értéke egy véletlen, átlátszatlan jegy; az adatbázisban csak a SHA-256
// lenyomata van (mint a munkamenetnél), mellette a jelszó lenyomata. Ezért:
//   - minden eszköz visszavonható egyszerre: `TRUNCATE kapu_jegy` (uzem/README.md, Runbook);
//   - a KAPU_JELSZO cseréje minden régi sütit érvénytelenít (a jegy a régi jelszó lenyomatát hordja);
//   - a jelszó maga sehol sincs tárolva, naplózva sem.
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { db, sema } from "../adatbazis/kapcsolat";
import { JEGY_NAP } from "./szabaly";

/** A jelszóból származtatott kiszolgálói só (nem kell külön titok: a jelszó cseréjével a só is cserélődik). */
function so(jelszo: string): Buffer {
  return createHash("sha256").update(`rogton-kapu|so|v1|${jelszo}`).digest();
}

/** A jelszó lenyomata (HMAC-SHA256, kulcs = a származtatott só). Ezt hordja minden jegy. */
export function jelszoLenyomat(jelszo: string): string {
  return createHmac("sha256", so(jelszo)).update(`kapu|v1|${jelszo}`).digest("hex");
}

/** A beírt jelszó egyezik-e — állandó idejű összevetés a két lenyomaton (a hossz sem szivárog). */
export function jelszoEgyezik(probalt: string, jelszo: string): boolean {
  if (jelszo === "") return false;
  return timingSafeEqual(Buffer.from(jelszoLenyomat(probalt), "hex"), Buffer.from(jelszoLenyomat(jelszo), "hex"));
}

const jegyAzonosito = (jegy: string) => createHash("sha256").update(jegy).digest("hex");
const JEGY_ALAK = /^[A-Za-z0-9_-]{43}$/; // 32 véletlen bájt, base64url

/** A cím lenyomata (a jegy mellé, csak tájékoztatásul): nem visszafejthető, és jelszócserével más lesz. */
function cimLenyomat(cim: string, jelszo: string): string {
  return createHmac("sha256", so(jelszo)).update(`cim|${cim}`).digest("hex").slice(0, 16);
}

/** Érvényes jegyek rövid emléke (60 s), hogy ne minden kép- és adatkérés menjen az adatbázisba. A kulcsban a jelszó lenyomata is
 *  benne van, így jelszócsere után a régi bejegyzés nem talál. Visszavonás (TRUNCATE) legfeljebb 60 s múlva hat. */
const EMLEK_MS = 60_000;
const emlek = new Map<string, number>();

export function jegyEmlekUrit(): void {
  emlek.clear();
}

/** Új jegy a sikeres jelszó után. A lejárt jegyeket ilyenkor eltakarítja (rövid életű hozzáférési jelek, nem adat — mint a lejárt
 *  munkamenetek; a belépési napló marad). */
export async function jegyKiad(jelszo: string, cim: string, most: Date = new Date()): Promise<{ jegy: string; lejar: Date }> {
  const jegy = randomBytes(32).toString("base64url");
  const lejar = new Date(most.getTime() + JEGY_NAP * 24 * 60 * 60 * 1000);
  await db().delete(sema.kapuJegy).where(lt(sema.kapuJegy.lejar, most));
  await db().insert(sema.kapuJegy).values({
    id: jegyAzonosito(jegy),
    jelszoLenyomat: jelszoLenyomat(jelszo),
    letrehozva: most,
    lejar,
    utolsoHasznalat: most,
    ipHash: cimLenyomat(cim, jelszo),
  });
  return { jegy, lejar };
}

/** Érvényes-e a süti jegye a MOSTANI jelszóval. Hibás alak, ismeretlen, lejárt vagy más jelszóhoz kiadott jegy: nem. */
export async function jegyErvenyes(jegy: string | undefined, jelszo: string, most: Date = new Date()): Promise<boolean> {
  if (!jegy || !JEGY_ALAK.test(jegy) || jelszo === "") return false;
  const id = jegyAzonosito(jegy);
  const jl = jelszoLenyomat(jelszo);
  const kulcs = `${id}|${jl}`;
  const ig = emlek.get(kulcs);
  if (ig !== undefined && ig > most.getTime()) return true;
  const sorok = await db()
    .select({ utolso: sema.kapuJegy.utolsoHasznalat })
    .from(sema.kapuJegy)
    .where(and(eq(sema.kapuJegy.id, id), eq(sema.kapuJegy.jelszoLenyomat, jl), gt(sema.kapuJegy.lejar, most)))
    .limit(1);
  const sor = sorok[0];
  if (!sor) {
    emlek.delete(kulcs);
    return false;
  }
  if (emlek.size > 5000) emlek.clear();
  emlek.set(kulcs, most.getTime() + EMLEK_MS);
  // az utolsó használat óránként egyszer íródik (nem minden kérésre)
  if (most.getTime() - sor.utolso.getTime() > 60 * 60 * 1000) {
    await db().update(sema.kapuJegy).set({ utolsoHasznalat: most }).where(eq(sema.kapuJegy.id, id));
  }
  return true;
}

/** Hány érvényes jegy van (a Runbook „hány eszköz van bent” kérdéséhez és a próbákhoz). */
export async function ervenyesJegyekSzama(most: Date = new Date()): Promise<number> {
  const r = await db().select({ db: sql<number>`count(*)::int` }).from(sema.kapuJegy).where(gt(sema.kapuJegy.lejar, most));
  return r[0]?.db ?? 0;
}
