import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import {
  cimKiegeszit,
  Beallitas,
  BeallitasVerzio,
  Esemeny,
  Forras,
  Futas,
  Kivonat,
  Minta,
  SzabalyJavaslat,
  Talalat,
  Visszajelzes,
  type HirfigyeloTar,
} from "@km/news-monitor-core";
import { db, sema, szervezetKent, type SzervezetDb } from "../adatbazis/kapcsolat";
import { esemenyKornyezet, feljegyezHatterben } from "../esemeny";

// A Hírfigyelő POSTGRES-tára: minden metódus szervezetKent alatt fut, így a sorszintű védelem
// az adatbázisban kényszeríti ki az elválasztást. A jsonb mezőket a mag zod-sémáival parse-oljuk.

function beallitasVerzioParse(adat: unknown): BeallitasVerzio {
  const e = BeallitasVerzio.safeParse(adat);
  if (!e.success) throw new Error("Hibás beallitas_verzio sor: " + JSON.stringify(e.error.issues));
  return e.data;
}

function forrasParse(adat: unknown): Forras {
  const e = Forras.safeParse(adat);
// … (kihagyva) …
    // F-8.1 k (0.3.0): a forrás eltávolítása — a sor törlése a szervezet nevében; a hozzá tartozó kivonatok és találatok maradnak (a hír megvolt).
    async forrasTorol(szervezetId, forrasId) {
      await szervezetKent(szervezetId, async (tx) => {
        await tx.delete(sema.hfForras).where(and(eq(sema.hfForras.szervezetId, szervezetId), eq(sema.hfForras.id, forrasId)));
      });
    },

    async futasok(szervezetId) {
      return szervezetKent(szervezetId, async (tx) => {
        const sorok = await tx.select().from(sema.hfFutas).where(eq(sema.hfFutas.szervezetId, szervezetId));
        return sorok.map(sorFutassa);
      });
    },

    async futasMent(szervezetId, f) {
      await szervezetKent(szervezetId, async (tx) => {
        const sor = (await tx.select().from(sema.hfFutas).where(and(eq(sema.hfFutas.szervezetId, szervezetId), eq(sema.hfFutas.id, f.id))).limit(1))[0];
        const ertek = {
          szervezetId,
          szabalyVerzio: f.szabaly_verzio,
          kezdet: new Date(f.kezdet),
          veg: f.veg ? new Date(f.veg) : null,
          allapot: f.allapot,
          ujTalalatok: f.uj_talalatok,
          hibasForrasok: f.hibas_forrasok,
          proba: f.proba,
        };
        if (sor) {
          await tx.update(sema.hfFutas).set(ertek).where(and(eq(sema.hfFutas.szervezetId, szervezetId), eq(sema.hfFutas.id, f.id)));
        } else {
          await tx.insert(sema.hfFutas).values({ id: f.id, ...ertek });
        }
      });
    },

    async kivonatMent(szervezetId, k) {
