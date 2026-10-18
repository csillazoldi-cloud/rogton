// A feldolgozási kivonat: a begyűjtött cikk rögzített, ujjlenyomattal ellátott másolata.
import { z } from "zod";
import { kanonikusUrl } from "./forras";

export const KIVONAT_MAX_HOSSZ = 8000;
export const KIVONAT_MEGORZES_NAP = 30;

export const Kivonat = z.object({
  id: z.string().min(1),
  forras_id: z.string().min(1),
  cim: z.string().trim().min(1).max(300),
  url: z.string().url(),
  kanonikus_url: z.string().min(1),
  megjelenes: z.iso.datetime().nullable(),
  begyujtes: z.iso.datetime(),
  szoveg: z.string().max(KIVONAT_MAX_HOSSZ),
  csonkolt: z.boolean(),
  ujjlenyomat: z.string().min(1),
  nyelv: z.string().length(2).nullable(),
  lejar: z.iso.datetime(),
});
export type Kivonat = z.infer<typeof Kivonat>;

/** FNV-1a 64 bites ujjlenyomat BigInt-tel, hex 16 jegy. */
export function fnv1a(s: string): string {
  let h = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (let i = 0; i < s.length; i++) {
    h ^= BigInt(s.charCodeAt(i));
    h = (h * prime) & 0xffffffffffffffffn;
  }
  return h.toString(16).padStart(16, "0");
}

/** Tartalom-ujjlenyomat: a szöveg első 2000 karakterének normalizált (kisbetű, írásjel és többes szóköz nélküli) alakja,
 *  FNV-1a 64 bites hexben. A CÍM nem számít bele — ugyanaz a szöveg más címmel (átvett hír) ugyanazt az ujjlenyomatot adja;
 *  ha nincs szöveg (korlátozott forrás: csak címek), a normalizált cím az alap. */
export function ujjlenyomat(cim: string, szoveg: string): string {
  const norm = (t: string) => t.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim();
  const alap = norm(szoveg.slice(0, 2000));
  return fnv1a(alap || norm(cim));
}

/** Kivonat készítése: szöveg vágás szóhatáron, kanonikus URL és ujjlenyomat számítás, lejárat = most + 30 nap. */
export function kivonatKeszit(be: { id: string; forras_id: string; cim: string; url: string; megjelenes: string | null; szoveg: string; nyelv: string | null }, most: Date): Kivonat {
  let szoveg = be.szoveg;
  let csonkolt = false;
  if (szoveg.length > KIVONAT_MAX_HOSSZ) {
    szoveg = szoveg.slice(0, KIVONAT_MAX_HOSSZ);
    const utolsoSzo = szoveg.lastIndexOf(" ");
    if (utolsoSzo > 0) szoveg = szoveg.slice(0, utolsoSzo);
    csonkolt = true;
  }
  const lejar = new Date(most.getTime() + KIVONAT_MEGORZES_NAP * 24 * 60 * 60 * 1000);
  return {
    id: be.id,
    forras_id: be.forras_id,
    cim: be.cim.trim(),
    url: be.url,
    kanonikus_url: kanonikusUrl(be.url),
    megjelenes: be.megjelenes,
    begyujtes: most.toISOString(),
    szoveg,
    csonkolt,
    ujjlenyomat: ujjlenyomat(be.cim, be.szoveg),
    nyelv: be.nyelv,
    lejar: lejar.toISOString(),
  };
}

/** Lejárt-e a kivonat (a megőrzési idő után törölhető). */
export function kivonatLejart(k: Kivonat, most: Date): boolean {
  return new Date(k.lejar) <= most;
}
