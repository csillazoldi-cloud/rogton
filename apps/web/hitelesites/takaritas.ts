// Óránkénti takarítás (E-34): a lejárt munkamenetek és a régi belépési kísérletek eldobása.
//
// MIÉRT KELL: a lejárt munkamenet-sor magától csak akkor tűnt el, ha valaki még egyszer
// próbálkozott azzal a tokennel — vagyis a legtöbb sor örökre a táblában maradt.
// Biztonsági kockázat nincs benne (a lejárt sor nem enged be), de a tábla feleslegesen hízott.
import { lt, sql } from "drizzle-orm";
import { db, sema } from "../adatbazis/kapcsolat";
import { NAPLO_MEGORZES_NAP, naploTakarit } from "./korlat";

/** Lejárt munkamenet-sorok törlése. Visszaadja, hány sort dobott el. */
export async function munkamenetekTakarit(most: Date = new Date()): Promise<number> {
  const eredmeny = await db().delete(sema.munkamenet).where(lt(sema.munkamenet.lejar, most));
  return eredmeny.rowCount ?? 0;
}

/** A felhasznált vagy lejárt visszaállító jegyek törlése (a lejárat után egy nappal). */
export async function jegyekTakarit(most: Date = new Date()): Promise<number> {
  const hatar = new Date(most.getTime() - 24 * 60 * 60 * 1000);
  const eredmeny = await db().delete(sema.jelszoVisszaallitas).where(lt(sema.jelszoVisszaallitas.lejar, hatar));
  return eredmeny.rowCount ?? 0;
}

/** Mindhárom takarítás egyben. A háttérfuttató hívja, óránként egyszer. */
export async function oraiTakaritas(most: Date = new Date()): Promise<{ munkamenet: number; jegy: number; naplo: number; esemeny: number }> {
  return {
    munkamenet: await munkamenetekTakarit(most),
    jegy: await jegyekTakarit(most),
    naplo: await naploTakarit(most),
    esemeny: await esemenyekTakarit(),
  };
}

/** F-5c (T-24, D-F35): az értesítések és az eseménynapló megőrzése — annyi nap, mint a belépési naplóé (30). A törlést a `esemeny_takarit(nap)`
 *  SECURITY DEFINER függvény végzi (0059), mert a sorszintű védelem a km_app-nak csak a saját szervezet sorait engedné. A soronkénti olvasott-jelölés vele megy. */
export const ESEMENY_MEGORZES_NAP = NAPLO_MEGORZES_NAP;
export async function esemenyekTakarit(): Promise<number> {
  const e = await db().execute(sql`SELECT esemeny_takarit(${ESEMENY_MEGORZES_NAP}::int) AS n`);
  const sorok = (e as unknown as { rows?: { n: number | string }[] }).rows ?? (e as unknown as { n: number | string }[]);
  const n = Array.isArray(sorok) ? sorok[0]?.n : undefined;
  return Number(n ?? 0);
}
