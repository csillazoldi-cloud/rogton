import { createHash } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { HibaKod, JelszoValtasKeres, NevModositasKeres } from "@rogton/contracts";
import { db, fiokKent, sema } from "../adatbazis/kapcsolat";
import { hibaEredmeny, type Eredmeny } from "./index";
import { esemenyKornyezet, feljegyezHatterben } from "../esemeny";

function mezokHiba(hiba: z.ZodError): Record<string, string> {
  const mezok: Record<string, string> = {};
  for (const problema of hiba.issues) {
    const ut = problema.path.join(".");
    if (ut && !mezok[ut]) {
      mezok[ut] = problema.code;
    }
  }
  return mezok;
}

function tokenLenyomat(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Jelszóváltás a jelenlegi jelszó megadásával. Siker esetén a fiók MINDEN MÁS munkamenete
 * törlődik (a mostani token lenyomata marad) — egy tranzakcióban.
 */
export async function jelszotValt(
  fiokId: string,
  be: unknown,
  aktualisToken: string,
): Promise<Eredmeny<{ masEszkozokKileptetve: number }>> {
  // a rövid új jelszó külön kódot kap, mielőtt a séma általános ERVENYTELEN_ADAT-tal elutasítaná
  if (typeof be === "object" && be !== null && "uj" in be && typeof be.uj === "string" && be.uj.length < 10) {
    return hibaEredmeny("GYENGE_JELSZO");
  }
  const elemzes = JelszoValtasKeres.safeParse(be);
  if (!elemzes.success) {
    return hibaEredmeny("ERVENYTELEN_ADAT", mezokHiba(elemzes.error));
  }
  const { jelenlegi, uj } = elemzes.data;

  const fiokSorok = await db().select().from(sema.fiok).where(eq(sema.fiok.id, fiokId)).limit(1);
  const fiokSor = fiokSorok[0];
  if (!fiokSor || fiokSor.jelszoHash === "") {
    return hibaEredmeny("ROSSZ_JELENLEGI_JELSZO");
  }
  const jelenlegiJo = await verify(fiokSor.jelszoHash, jelenlegi).catch(() => false);
  if (!jelenlegiJo) {
    return hibaEredmeny("ROSSZ_JELENLEGI_JELSZO");
  }

  const ujHash = await hash(uj);
  const mostaniLenyomat = tokenLenyomat(aktualisToken);

  let torolt = 0;
  try {
    await fiokKent(fiokId, async (tx) => {
      await tx.update(sema.fiok).set({ jelszoHash: ujHash }).where(eq(sema.fiok.id, fiokId));
      const toroltSorok = await tx
        .delete(sema.munkamenet)
        .where(and(eq(sema.munkamenet.fiokId, fiokId), ne(sema.munkamenet.tokenLenyomat, mostaniLenyomat)))
        .returning({ id: sema.munkamenet.id });
      torolt = toroltSorok.length;
    });
  } catch (hiba) {
    console.error("Jelszovaltoztatas sikertelen:", hiba);
    return hibaEredmeny("BELSO_HIBA");
  }
  await feljegyezHatterben(await esemenyKornyezet(), { szervezet_id: null, fajta: "jelszo_valtas", fiok_id: fiokId, adat: { mas_eszkozok_kileptetve: torolt } }); // F-5
  return { ok: true, ertek: { masEszkozokKileptetve: torolt } };
}

/** A fiók nevének módosítása. */
export async function nevetModosit(
  fiokId: string,
  be: unknown,
): Promise<Eredmeny<{ nev: string }>> {
  const elemzes = NevModositasKeres.safeParse(be);
  if (!elemzes.success) {
    return hibaEredmeny("ERVENYTELEN_ADAT", mezokHiba(elemzes.error));
  }
  const { nev } = elemzes.data;
  try {
    await db().update(sema.fiok).set({ nev }).where(eq(sema.fiok.id, fiokId));
  } catch (hiba) {
    console.error("Nev modositas sikertelen:", hiba);
    return hibaEredmeny("BELSO_HIBA");
  }
  return { ok: true, ertek: { nev } };
}

/** A fiók minden munkamenete törlődik, kivéve a mostanit. */
export async function masEszkozoketKileptet(
  fiokId: string,
  aktualisToken: string,
): Promise<{ torolt: number }> {
  const mostaniLenyomat = tokenLenyomat(aktualisToken);
  const toroltSorok = await db()
    .delete(sema.munkamenet)
    .where(and(eq(sema.munkamenet.fiokId, fiokId), ne(sema.munkamenet.tokenLenyomat, mostaniLenyomat)))
    .returning({ id: sema.munkamenet.id });
  await feljegyezHatterben(await esemenyKornyezet(), { szervezet_id: null, fajta: "kileptetes_mindenhol", fiok_id: fiokId, adat: { torolt: toroltSorok.length } }); // F-5
  return { torolt: toroltSorok.length };
}
