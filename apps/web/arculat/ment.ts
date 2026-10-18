import "server-only";
// R-16 K3 (TERV §2-K3 ment.ts, 1.7 R1/R2, §4 10.) — a szakasz EGYETLEN írási útja: betöltés–módosítás–mentés EGY tranzakcióban.
//  - `SELECT … FOR UPDATE` a munkatér `szervezet_profil` sorára: két egyszerre érkező „Ez legyen” sorban fut, egyik sem írja felül
//    a másik közben született verzióját (a második már az első eredményét olvassa);
//  - a tárolt adatot a SzervezetProfil séma olvassa; ha nem olvasható, NEM írunk (R1: a hibás olvasásból soha nem lesz felülírás);
//  - írás előtt `SzervezetProfil.safeParse` — érvénytelen eredmény nem kerül az adatbázisba;
//  - csak UPDATE (profil nélkül nincs mit menteni; új profilt nem hozunk létre);
//  - NINCS `peldakatFrissit`: az arculat változása nem kér új példaszöveget (és koppintásonként nem hív AI-t).
// A kliens soha nem küldi a teljes arculatot — ezért itt 409 ELAVULT_ADAT nem keletkezhet (TERV §2-K3).
import { eq } from "drizzle-orm";
import { ArculatLogok, SzervezetProfil, type ArculatLepes } from "@rogton/contracts";
import { hasznaltLogok } from "@rogton/fajl-core";
import { sema, szervezetKent } from "../adatbazis/kapcsolat";
import { fajlTar } from "../fajl/tar";
import { alapTervezet } from "./alap";

/** `valtozatlan`: a módosító függvény ugyanazt az arculat-objektumot adta vissza → nem írtunk (R-16 K4: a háttérmunka őre, és a
 *  már jóváhagyott, változatlan „Ez legyen” sem nyit új verziót). */
export type MentEredmeny = { ok: true; arculat: ArculatLepes; valtozatlan?: true } | { ok: false; hiba: "NINCS_PROFIL" | "ERVENYTELEN_ADAT" };

/** A munkatér szakmája és nyelve — a módosító függvény ebből építi az alapszettet, ha nincs tervezet. */
export type MentKornyezet = { profil: SzervezetProfil; most: Date };

/**
 * `fn` a tárolt arculatból az újat adja (tiszta; `lepes.ts`). A profil többi része érintetlen; `frissitve` = most.
 * `varakozas` csak a próbának: a zár alatt ennyit vár a mentés előtt (a sorba állás mérhető legyen).
 */
export async function arculatMent(szervezetId: string, fn: (a: ArculatLepes, k: MentKornyezet) => ArculatLepes, varakozas = 0): Promise<MentEredmeny> {
  return szervezetKent(szervezetId, async (tx) => {
    const sor = (await tx.select({ adatok: sema.szervezetProfil.adatok }).from(sema.szervezetProfil)
      .where(eq(sema.szervezetProfil.szervezetId, szervezetId)).limit(1).for("update"))[0];
    if (!sor) return { ok: false, hiba: "NINCS_PROFIL" } as const;
    const regi = SzervezetProfil.safeParse(sor.adatok);
    if (!regi.success) { console.error("arculatMent: a tárolt profil nem olvasható — nem írunk:", regi.error.issues); return { ok: false, hiba: "ERVENYTELEN_ADAT" } as const; }
    const most = new Date();
    const ujArculat = fn(regi.data.arculat, { profil: regi.data, most });
    // R-16 K4: ha a módosító nem változtatott (ugyanazt az objektumot adta vissza), nincs írás — a zár a tranzakció végén elenged
    if (ujArculat === regi.data.arculat) return { ok: true, arculat: regi.data.arculat, valtozatlan: true } as const;
    const uj = SzervezetProfil.safeParse({ ...regi.data, arculat: ujArculat, frissitve: most.toISOString() });
    if (!uj.success) { console.error("arculatMent: az új arculat érvénytelen — nem írunk:", uj.error.issues); return { ok: false, hiba: "ERVENYTELEN_ADAT" } as const; }
    if (varakozas > 0) await new Promise((r) => setTimeout(r, varakozas));
    await tx.update(sema.szervezetProfil).set({ adatok: uj.data, frissitve: most }).where(eq(sema.szervezetProfil.szervezetId, szervezetId));
    return { ok: true, arculat: uj.data.arculat } as const;
  });
}

/** A jóváhagyás pillanatában használt logók (TERV 1.2: a pillanatkép `logok`-ja): helyenként a legfrissebb képre alkalmas fájl.
 *  Olvashatatlan fájllista → undefined: a tervezet meglévő `logok`-ja marad (nem írjuk üresre). */
export async function hasznaltLogokMost(szervezetId: string): Promise<ArculatLogok | undefined> {
  const fajlok = await fajlTar.lista(szervezetId, "logo").catch(() => null);
  return fajlok ? ArculatLogok.parse(hasznaltLogok(fajlok, null)) : undefined;
}

/** Az alapszett-tervezet a tárolt profilból (név + összefoglaló → hangulat; nyelv: a profil első nyelve). */
export function alapA(k: MentKornyezet) {
  return alapTervezet(k.profil.nev, k.profil.osszefoglalo, k.profil.nyelvek[0] ?? "hu");
}
