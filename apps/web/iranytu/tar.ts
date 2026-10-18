import "server-only";
import { eq } from "drizzle-orm";
import { IranytuSema, IranytuVerzioSema } from "@km/contracts";
import { sema, szervezetKent } from "../adatbazis/kapcsolat";

// Az iránytű TÁROLÁSA a befogadó alkalmazásban (ALAPTERV 3.: adatgazda a host).
// Más modul ezt a táblát közvetlenül nem írja — csak ezen a kapun át.
// A jóváhagyás ÚJ VERZIÓT hoz létre: az előző jóváhagyott pillanatkép a `verziok` tömb elejére kerül.

export type IranytuSor = {
  tervezet: IranytuSema | null;
  jovahagyott: IranytuSema | null;
  verziok: IranytuVerzioSema[];
  verzio: number;
  jovahagyva: Date | null;
  jovahagytaNev: string;
};

export const iranytuTar = {
  async betolt(szervezetId: string): Promise<IranytuSor | null> {
    return szervezetKent(szervezetId, async (tx) => {
      const sorok = await tx.select().from(sema.szervezetIranytu).where(eq(sema.szervezetIranytu.szervezetId, szervezetId)).limit(1);
      const sor = sorok[0];
      if (!sor) return null;
      let tervezet: IranytuSema | null = null;
      if (sor.tervezet !== null) {
        const e = IranytuSema.safeParse(sor.tervezet);
        if (!e.success) console.error("Hibás iránytű-tervezet:", e.error.issues);
        else tervezet = e.data;
      }
      let jovahagyott: IranytuSema | null = null;
      if (sor.jovahagyott !== null) {
        const e = IranytuSema.safeParse(sor.jovahagyott);
        if (!e.success) console.error("Hibás iránytű (jóváhagyott):", e.error.issues);
        else jovahagyott = e.data;
      }
      const v = IranytuVerzioSema.array().safeParse(sor.verziok);
      if (!v.success) console.error("Hibás iránytű-verziók:", v.error.issues);
      return {
        tervezet,
        jovahagyott,
        verziok: v.success ? v.data : [],
        verzio: sor.verzio,
        jovahagyva: sor.jovahagyva,
        jovahagytaNev: sor.jovahagytaNev,
      };
    });
  },

  async tervezetMent(szervezetId: string, tervezet: IranytuSema): Promise<void> {
    const most = new Date();
    await szervezetKent(szervezetId, async (tx) => {
      await tx.insert(sema.szervezetIranytu)
        .values({ szervezetId, tervezet, frissitve: most })
        .onConflictDoUpdate({ target: sema.szervezetIranytu.szervezetId, set: { tervezet, frissitve: most } });
    });
  },

  /** Jóváhagyás: az eddigi jóváhagyott a verziók közé kerül, a tervezet kiürül. */
  async jovahagy(szervezetId: string, adatok: IranytuSema, fiokId: string, fiokNev: string): Promise<void> {
    const most = new Date();
    await szervezetKent(szervezetId, async (tx) => {
      const sorok = await tx.select().from(sema.szervezetIranytu).where(eq(sema.szervezetIranytu.szervezetId, szervezetId)).limit(1);
      const sor = sorok[0];
      const regiVerziok = sor ? IranytuVerzioSema.array().safeParse(sor.verziok) : null;
      const verziok: IranytuVerzioSema[] = regiVerziok && regiVerziok.success ? regiVerziok.data : [];
      let ujVerziok = verziok;
      if (sor && sor.jovahagyott !== null) {
        const regi = IranytuSema.safeParse(sor.jovahagyott);
        if (regi.success) {
          ujVerziok = [{
            verzio: sor.verzio,
            adatok: regi.data,
            jovahagyva: (sor.jovahagyva ?? most).toISOString(),
            jovahagyta_nev: sor.jovahagytaNev,
          }, ...verziok];
        }
      }
      const ujVerzio = (sor?.verzio ?? 0) + 1;
      const ertekek = {
        tervezet: null,
        jovahagyott: adatok,
        verziok: ujVerziok,
        verzio: ujVerzio,
        jovahagyva: most,
        jovahagyta: fiokId,
        jovahagytaNev: fiokNev,
        frissitve: most,
      };
      await tx.insert(sema.szervezetIranytu)
        .values({ szervezetId, ...ertekek })
        .onConflictDoUpdate({ target: sema.szervezetIranytu.szervezetId, set: ertekek });
    });
  },

  async verziokLista(szervezetId: string): Promise<IranytuVerzioSema[]> {
    const sor = await this.betolt(szervezetId);
    return sor ? sor.verziok : [];
  },
};
