import { count, eq } from "drizzle-orm";
import { db, sema, szervezetKent } from "../../../../adatbazis/kapcsolat";
import { aktualisFiok } from "../../../../hitelesites";
import { munkamenetTokenKeresbol } from "../../../../hitelesites/suti";

// Belső ellenőrző válasz (E-2, A-11): a két teszt szervezet adata létezik, és NEM látja egymást.
// Nem képernyő — géppel és szemmel olvasható válasz. Csak a tesztkörnyezetben van értelme.
export const dynamic = "force-dynamic";

const TESZT_A = "11111111-1111-4111-8111-111111111111";
const TESZT_B = "22222222-2222-4222-8222-222222222222";

async function szervezetNezete(szervezetId: string) {
  return szervezetKent(szervezetId, async (tx) => {
    const szervezetek = await tx.select({ id: sema.szervezet.id, nev: sema.szervezet.nev }).from(sema.szervezet);
    const tagok = await tx
      .select({ nev: sema.fiok.nev, email: sema.fiok.email, szerep: sema.tagsag.szerep })
      .from(sema.tagsag)
      .innerJoin(sema.fiok, eq(sema.fiok.id, sema.tagsag.fiokId));
    return { lathato_szervezetek: szervezetek, lathato_tagok: tagok };
  });
}

export async function GET(keres: Request) {
  // Biztonsági felülvizsgálat 2026-09-10 (K-07): ez a válasz TAGNEVEKET ÉS E-MAIL-CÍMEKET tartalmaz,
  // tehát semmiképp nem lehet nyilvános. Csak rendszergazda.
  const fiok = await aktualisFiok(munkamenetTokenKeresbol(keres));
  if (!fiok?.rendszergazda) {
    return Response.json({ hiba: "NINCS_JOG" }, { status: 403, headers: { "cache-control": "no-store" } });
  }
  try {
    // 1. szervezet nélkül: a védelemnek mindent el kell rejtenie
    const [nelkul] = await db().select({ db: count() }).from(sema.tagsag);
    const szervezetNelkulLathato = nelkul?.db ?? -1;
    // 2. A és B nevében külön-külön
    const a = await szervezetNezete(TESZT_A);
    const b = await szervezetNezete(TESZT_B);

    const rendben =
      szervezetNelkulLathato === 0 &&
      a.lathato_szervezetek.length === 1 && a.lathato_szervezetek[0]?.id === TESZT_A &&
      b.lathato_szervezetek.length === 1 && b.lathato_szervezetek[0]?.id === TESZT_B &&
      a.lathato_tagok.length === 2 &&
      b.lathato_tagok.length === 1 &&
      a.lathato_tagok.every((f) => f.email.endsWith("@teszt-a.example")) &&
      b.lathato_tagok.every((f) => f.email.endsWith("@teszt-b.example"));

    return Response.json(
      {
        ellenorzes: "A-11 — a két szervezet adata nem keveredik",
        eredmeny: rendben ? "RENDBEN" : "HIBA",
        szervezet_nelkul_lathato_tagsag: szervezetNelkulLathato,
        teszt_a: a,
        teszt_b: b,
        ido: new Date().toISOString(),
      },
      { status: rendben ? 200 : 500, headers: { "cache-control": "no-store" } },
    );
  } catch (hiba) {
    return Response.json(
      { ellenorzes: "A-11", eredmeny: "HIBA", uzenet: hiba instanceof Error ? hiba.message : String(hiba) },
      { status: 500, headers: { "cache-control": "no-store" } },
    );
  }
}
