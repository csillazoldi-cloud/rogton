import "server-only";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import {
  PosztMunka,
  PosztMunkaLista,
  type PosztForras,
  type PosztMunka as PosztMunkaTipus,
  type PosztMunkaLista as PosztMunkaListaTipus,
} from "@rogton/contracts";
import { sema, szervezetKent } from "../adatbazis/kapcsolat";

// A Posztszöveg TÁROLÁSA a befogadó alkalmazásban (ALAPTERV 3.: adatgazda a host).
// Más modul ezt a táblát közvetlenül nem írja — csak ezen a kapun át.
// A szerződés pillanatképet ad: dátumok ISO-szövegként, mezőnevek alsóvonallal.

/** R-18 8. kör · Naptár: a puhán törölt munka (forras.torolve) a listákból kimarad — a sor megmarad, a „Visszavonás” visszahozza. */
const nemTorolt = sql`(${sema.posztMunka.forras} ->> 'torolve') is null`;

/** A munka legelőrébb tartó cellájának állapota — ez látszik a listában. */
function listaAllapot(szovegek: { allapot: string }[]): PosztMunkaListaTipus["allapot"] {
  const rang: Record<string, number> = { nincs: 0, javaslat: 1, szerkesztve: 2, vegleges: 3 };
  let legjobb: PosztMunkaListaTipus["allapot"] = "nincs";
  for (const sz of szovegek) {
    const a = sz.allapot as PosztMunkaListaTipus["allapot"];
    if ((rang[a] ?? 0) > (rang[legjobb] ?? 0)) legjobb = a;
  }
  return legjobb;
}

export const posztTar = {
  async betolt(szervezetId: string, id: string): Promise<PosztMunkaTipus | null> {
    return szervezetKent(szervezetId, async (tx) => {
      const sorok = await tx
        .select()
        .from(sema.posztMunka)
        .where(and(eq(sema.posztMunka.szervezetId, szervezetId), eq(sema.posztMunka.id, id)))
        .limit(1);
      const sor = sorok[0];
      if (!sor) return null;
      const e = PosztMunka.safeParse({
        id: sor.id,
        szervezet_id: sor.szervezetId,
        cim: sor.cim,
        forras: sor.forras,
        szovegek: sor.szovegek,
        osszhang: sor.osszhang,
        piros_veglegesites: sor.pirosVeglegesites,
        letrehozva: sor.letrehozva.toISOString(),
        frissitve: sor.frissitve.toISOString(),
      });
      if (!e.success) {
        console.error("Hibás poszt-munka tartalom:", e.error.issues);
        return null;
      }
      return e.data;
    });
  },

  /** R-15: a szervezet összes munkája teljes tartalommal, a legfrissebb elöl (a lista-lapok és a Kezdőlap ebből számol). */
  async mind(szervezetId: string, limit = 200): Promise<PosztMunkaTipus[]> {
    return szervezetKent(szervezetId, async (tx) => {
      const sorok = await tx
        .select()
        .from(sema.posztMunka)
        .where(and(eq(sema.posztMunka.szervezetId, szervezetId), nemTorolt))
        .orderBy(desc(sema.posztMunka.letrehozva))
        .limit(limit);
      const ki: PosztMunkaTipus[] = [];
      for (const sor of sorok) {
        const e = PosztMunka.safeParse({
          id: sor.id,
          szervezet_id: sor.szervezetId,
          cim: sor.cim,
          forras: sor.forras,
          szovegek: sor.szovegek,
          osszhang: sor.osszhang,
          piros_veglegesites: sor.pirosVeglegesites,
          letrehozva: sor.letrehozva.toISOString(),
          frissitve: sor.frissitve.toISOString(),
        });
        if (e.success) ki.push(e.data);
        else console.error("Hibás poszt-munka tartalom:", e.error.issues);
      }
      return ki;
    });
  },

  async lista(szervezetId: string, limit = 50): Promise<PosztMunkaListaTipus[]> {
    return szervezetKent(szervezetId, async (tx) => {
      const sorok = await tx
        .select({
          id: sema.posztMunka.id,
          cim: sema.posztMunka.cim,
          forras: sema.posztMunka.forras,
          szovegek: sema.posztMunka.szovegek,
          pirosVeglegesites: sema.posztMunka.pirosVeglegesites,
          frissitve: sema.posztMunka.frissitve,
        })
        .from(sema.posztMunka)
        .where(and(eq(sema.posztMunka.szervezetId, szervezetId), nemTorolt))
        .orderBy(desc(sema.posztMunka.frissitve))
        .limit(limit);
      const ki: PosztMunkaListaTipus[] = [];
      for (const sor of sorok) {
        const forras = (sor.forras ?? {}) as { tipus?: unknown; azonosito?: unknown };
        const szovegek = Array.isArray(sor.szovegek) ? (sor.szovegek as { allapot: string }[]) : [];
        const e = PosztMunkaLista.safeParse({
          id: sor.id,
          cim: sor.cim,
          forras_tipus: forras.tipus,
          forras_azonosito: typeof forras.azonosito === "string" ? forras.azonosito : "",
          allapot: listaAllapot(szovegek),
          piros_veglegesites: sor.pirosVeglegesites,
          frissitve: sor.frissitve.toISOString(),
        });
        if (!e.success) {
          console.error("Hibás poszt-munka lista-sor:", e.error.issues);
          continue;
        }
        ki.push(e.data);
      }
      return ki;
    });
  },

  async ment(szervezetId: string, munka: PosztMunkaTipus): Promise<PosztMunkaTipus> {
    const most = new Date();
    await szervezetKent(szervezetId, async (tx) => {
      await tx
        .update(sema.posztMunka)
        .set({
          cim: munka.cim,
          forras: munka.forras,
          szovegek: munka.szovegek,
          osszhang: munka.osszhang,
          pirosVeglegesites: munka.piros_veglegesites,
          frissitve: most,
        })
        .where(and(eq(sema.posztMunka.szervezetId, szervezetId), eq(sema.posztMunka.id, munka.id)));
    });
    return { ...munka, frissitve: most.toISOString() };
  },

  /**
   * R-18 3. kör · Naptár: a munkák naptár-oszlopai (0166) a tartalommal együtt (a kész-e és a rövid név a szövegekből jön), a legrégebbi elöl —
   * ebben a sorrendben kap napot a gép. Ugyanaz a szervezeti kapu (szervezetKent + a sor szervezet-szűrője), mint a többi olvasásnál.
   */
  async naptarSorok(szervezetId: string, limit = 400, torolttel = false): Promise<{
    munka: PosztMunkaTipus;
    tervezett_nap: string | null;
    javasolt_nap: string | null;
    kiteve: string | null;
  }[]> {
    return szervezetKent(szervezetId, async (tx) => {
      const sorok = await tx
        .select()
        .from(sema.posztMunka)
        .where(torolttel ? eq(sema.posztMunka.szervezetId, szervezetId) : and(eq(sema.posztMunka.szervezetId, szervezetId), nemTorolt))
        .orderBy(asc(sema.posztMunka.letrehozva))
        .limit(limit);
      const ki: { munka: PosztMunkaTipus; tervezett_nap: string | null; javasolt_nap: string | null; kiteve: string | null }[] = [];
      for (const sor of sorok) {
        const e = PosztMunka.safeParse({
          id: sor.id,
          szervezet_id: sor.szervezetId,
          cim: sor.cim,
          forras: sor.forras,
          szovegek: sor.szovegek,
          osszhang: sor.osszhang,
          piros_veglegesites: sor.pirosVeglegesites,
          letrehozva: sor.letrehozva.toISOString(),
          frissitve: sor.frissitve.toISOString(),
        });
        if (!e.success) continue;
        ki.push({ munka: e.data, tervezett_nap: sor.tervezettNap, javasolt_nap: sor.javasoltNap, kiteve: sor.kiteve ? sor.kiteve.toISOString() : null });
      }
      return ki;
    });
  },

  /** R-18 3. kör · Naptár: csak a naptár-oszlopok írása (a szöveg, a forrás és a `frissitve` nem változik). undefined = marad. Igaz, ha volt ilyen sor. */
  async naptarMent(
    szervezetId: string,
    id: string,
    m: { tervezett_nap?: string | null; javasolt_nap?: string | null; kiteve?: Date | null },
  ): Promise<boolean> {
    const set: { tervezettNap?: string | null; javasoltNap?: string | null; kiteve?: Date | null } = {};
    if (m.tervezett_nap !== undefined) set.tervezettNap = m.tervezett_nap;
    if (m.javasolt_nap !== undefined) set.javasoltNap = m.javasolt_nap;
    if (m.kiteve !== undefined) set.kiteve = m.kiteve;
    if (Object.keys(set).length === 0) return true;
    return szervezetKent(szervezetId, async (tx) => {
      const r = await tx
        .update(sema.posztMunka)
        .set(set)
        .where(and(eq(sema.posztMunka.szervezetId, szervezetId), eq(sema.posztMunka.id, id)))
        .returning({ id: sema.posztMunka.id });
      return r.length > 0;
    });
  },

  async letrehoz(
    szervezetId: string,
    fiokId: string | null,
    cim: string,
    forras: PosztForras,
  ): Promise<PosztMunkaTipus> {
    const most = new Date();
    const id = crypto.randomUUID();
    await szervezetKent(szervezetId, async (tx) => {
      await tx.insert(sema.posztMunka).values({
        id,
        szervezetId,
        cim,
        forras,
        szovegek: [],
        osszhang: null,
        pirosVeglegesites: false,
        letrehozva: most,
        frissitve: most,
        letrehozta: fiokId,
      });
    });
    return {
      id,
      szervezet_id: szervezetId,
      cim,
      forras,
      szovegek: [],
      osszhang: null,
      piros_veglegesites: false,
      letrehozva: most.toISOString(),
      frissitve: most.toISOString(),
    };
  },
};
