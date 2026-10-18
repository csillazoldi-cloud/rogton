import "server-only";
import { and, asc, count, eq, inArray, isNull, sql } from "drizzle-orm";
import { PROGRAM_MAX_TETEL, type ProgramTetel, type ProgramTetelMezok } from "@km/contracts";
import { sema, szervezetKent } from "../adatbazis/kapcsolat";
import { programKulcs, ujraOlvasTerv, type TisztaTetel } from "./szabaly";

// c30 F5 (0174): a program tárolója. Minden művelet a szervezet nevében fut (szervezetKent → sorszintű védelem, A-11); a km_app-nak
// nincs DELETE joga, a törlés puha (`torolve`). A személy keze nyoma (modositva / forras = sajat) újraolvasáskor érintetlen marad.

const T = sema.programTetel;
type Sor = typeof T.$inferSelect;

const ora = (t: string | null) => (t ? t.slice(0, 5) : null);
function tetelbe(r: Sor): ProgramTetel {
  return {
    id: r.id, nap: r.nap, kezdes: ora(r.kezdes), vege: ora(r.vege), nev: r.nev, leiras: r.leiras, helyszin: r.helyszin, fellepo: r.fellepo,
    fajta: r.fajta as ProgramTetel["fajta"], jegy: r.jegy, bizonytalan: r.bizonytalan, aktiv: r.aktiv, forras: r.forras, modositva: r.modositva,
    kep_fajl_id: r.kepFajlId,
  };
}
const ertekek = (t: TisztaTetel) => ({
  nap: t.nap, kezdes: t.kezdes, vege: t.vege, nev: t.nev, leiras: t.leiras, helyszin: t.helyszin, fellepo: t.fellepo, fajta: t.fajta, jegy: t.jegy,
  bizonytalan: t.bizonytalan, aktiv: t.aktiv,
});

export class ProgramTarHiba extends Error {
  constructor(readonly kod: "TUL_SOK" | "NINCS_ILYEN") {
    super(kod);
  }
}

export type OlvasMerleg = { beszurt: number; frissitett: number; torolt: number; megtartott: number };

export const programTar = {
  /** A nem törölt tételek: nap szerint (a rendezvény egészére szólók a végén), azon belül az egész napos elöl, majd kezdés szerint. */
  async lista(szervezetId: string): Promise<ProgramTetel[]> {
    const sorok = await szervezetKent(szervezetId, (tx) =>
      tx.select().from(T).where(and(eq(T.szervezetId, szervezetId), isNull(T.torolve)))
        .orderBy(sql`${T.nap} ASC NULLS LAST`, sql`${T.kezdes} ASC NULLS FIRST`, asc(T.letrehozva)));
    return sorok.map(tetelbe);
  },

  /** Az újraolvasás egy tranzakcióban: a régi sorok zárolva (FOR UPDATE), a terv (szabaly.ts ujraOlvasTerv) végrehajtva. */
  async ujraOlvasAlkalmaz(szervezetId: string, uj: TisztaTetel[]): Promise<OlvasMerleg> {
    return szervezetKent(szervezetId, async (tx) => {
      const regi = await tx.select({ id: T.id, forras: T.forras, modositva: T.modositva, gepKulcs: T.gepKulcs, nap: T.nap, kezdes: T.kezdes, nev: T.nev })
        .from(T).where(and(eq(T.szervezetId, szervezetId), isNull(T.torolve))).for("update");
      const terv = ujraOlvasTerv(regi.map((r) => ({ ...r, kezdes: ora(r.kezdes) })), uj);
      const most = new Date();
      for (const f of terv.frissit) {
        // csak a gép érintetlen sora (a feltétel a tranzakción belül is őrzi: modositva = false, forras = gep)
        await tx.update(T).set({ ...ertekek(f.tetel), gepKulcs: programKulcs(f.tetel), frissitve: most })
          .where(and(eq(T.id, f.id), eq(T.szervezetId, szervezetId), eq(T.modositva, false), eq(T.forras, "gep")));
      }
      if (terv.torol.length) {
        await tx.update(T).set({ torolve: most, frissitve: most })
          .where(and(inArray(T.id, terv.torol), eq(T.szervezetId, szervezetId), eq(T.modositva, false), eq(T.forras, "gep")));
      }
      if (terv.beszur.length) {
        await tx.insert(T).values(terv.beszur.map((t) => ({ ...ertekek(t), szervezetId, forras: "gep" as const, gepKulcs: programKulcs(t) })));
      }
      return { beszurt: terv.beszur.length, frissitett: terv.frissit.length, torolt: terv.torol.length, megtartott: terv.megtart.length };
    });
  },

  /** Saját (kézzel felvett) tétel — `forras = sajat`, az újraolvasás soha nem nyúl hozzá. */
  async uj(szervezetId: string, t: TisztaTetel): Promise<ProgramTetel> {
    return szervezetKent(szervezetId, async (tx) => {
      const [db] = await tx.select({ n: count() }).from(T).where(and(eq(T.szervezetId, szervezetId), isNull(T.torolve)));
      if ((db?.n ?? 0) >= PROGRAM_MAX_TETEL) throw new ProgramTarHiba("TUL_SOK");
      const [sor] = await tx.insert(T).values({ ...ertekek(t), szervezetId, forras: "sajat" }).returning();
      return tetelbe(sor!);
    });
  },

  /** Egy tétel átírása (a pipa levétele is): a sor `modositva` lesz — az újraolvasás többé nem írja felül. */
  async modosit(szervezetId: string, id: string, m: ProgramTetelMezok): Promise<ProgramTetel> {
    return szervezetKent(szervezetId, async (tx) => {
      const { kep_fajl_id, ...mezok } = m;
      // c30 F6 (rajz D4 „Fotó hozzá”): csak a saját szervezet fájlja (a sorszintű védelem alatt keresve — a külső kulcs ezt nem nézi)
      if (kep_fajl_id) {
        const [f] = await tx.select({ id: sema.arculatFajl.id }).from(sema.arculatFajl).where(and(eq(sema.arculatFajl.id, kep_fajl_id), eq(sema.arculatFajl.szervezetId, szervezetId))).limit(1);
        if (!f) throw new ProgramTarHiba("NINCS_ILYEN");
      }
      const [sor] = await tx.update(T).set({ ...mezok, ...(kep_fajl_id !== undefined ? { kepFajlId: kep_fajl_id } : {}), modositva: true, frissitve: new Date() })
        .where(and(eq(T.id, id), eq(T.szervezetId, szervezetId), isNull(T.torolve))).returning();
      if (!sor) throw new ProgramTarHiba("NINCS_ILYEN");
      return tetelbe(sor);
    });
  },

  /** Puha törlés: a sor megmarad (`torolve`), csak a listák rejtik el. */
  async torol(szervezetId: string, id: string): Promise<void> {
    await szervezetKent(szervezetId, async (tx) => {
      const sorok = await tx.update(T).set({ torolve: new Date(), frissitve: new Date() })
        .where(and(eq(T.id, id), eq(T.szervezetId, szervezetId), isNull(T.torolve))).returning({ id: T.id });
      if (!sorok.length) throw new ProgramTarHiba("NINCS_ILYEN");
    });
  },
};
