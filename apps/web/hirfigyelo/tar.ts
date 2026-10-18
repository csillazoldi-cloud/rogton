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
} from "@rogton/news-monitor-core";
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
  if (!e.success) throw new Error("Hibás forras sor: " + JSON.stringify(e.error.issues));
  return e.data;
}

function futasParse(adat: unknown): Futas {
  const e = Futas.safeParse(adat);
  if (!e.success) throw new Error("Hibás futas sor: " + JSON.stringify(e.error.issues));
  return e.data;
}

function kivonatParse(adat: unknown): Kivonat {
  const e = Kivonat.safeParse(adat);
  if (!e.success) throw new Error("Hibás kivonat sor: " + JSON.stringify(e.error.issues));
  return e.data;
}

function talalatParse(adat: unknown): Talalat {
  const e = Talalat.safeParse(adat);
  if (!e.success) throw new Error("Hibás talalat sor: " + JSON.stringify(e.error.issues));
  return e.data;
}

function esemenyParse(adat: unknown): Esemeny {
  const e = Esemeny.safeParse(adat);
  if (!e.success) throw new Error("Hibás esemeny sor: " + JSON.stringify(e.error.issues));
  return e.data;
}

function visszajelzesParse(adat: unknown): Visszajelzes {
  const e = Visszajelzes.safeParse(adat);
  if (!e.success) throw new Error("Hibás visszajelzes sor: " + JSON.stringify(e.error.issues));
  return e.data;
}

function javaslatParse(adat: unknown): SzabalyJavaslat {
  const e = SzabalyJavaslat.safeParse(adat);
  if (!e.success) throw new Error("Hibás javaslat sor: " + JSON.stringify(e.error.issues));
  return e.data;
}

function mintaParse(adat: unknown): Minta {
  const e = Minta.safeParse(adat);
  if (!e.success) throw new Error("Hibás minta sor: " + JSON.stringify(e.error.issues));
  return e.data;
}

/** A tár-sorok átalakítása a mag típusaira. */
function sorBeallitasVerziova(sor: typeof sema.hfBeallitasVerzio.$inferSelect): BeallitasVerzio {
  return beallitasVerzioParse({
    verzio: sor.verzio,
    allapot: sor.allapot,
    letrehozva: sor.letrehozva.toISOString(),
    eredet: sor.eredet,
    beallitas: sor.beallitas,
  });
}

/**
 * Adatbázissor → Forrás. EGY rossz sor nem döntheti le a képernyőt.
 *
 * 2026-09-10: a hírfigyelő áttekintő lapja teljesen elszállt, mert egyetlen régi sorban
 * protokoll nélküli cím állt („zi-de-zi.ro") — az E-42 előtt a rendszer így mentette el, amit
 * a felhasználó beírt. A séma `url()`-t vár, a parse kivételt dobott, és a lap SEMMIT nem mutatott.
 *
 * Mostantól két lépcső: előbb megpróbáljuk kiegészíteni a címet (ugyanazzal a függvénnyel, amit a
 * bevitel is használ), és csak ha úgy sem értelmezhető, hagyjuk ki a sort — naplóval, nem kivétellel.
 */
function sorForrassa(sor: typeof sema.hfForras.$inferSelect): Forras | null {
  const nyers = {
    id: sor.id,
    cim: sor.cim,
    tipus: sor.tipus,
    eredet: sor.eredet,
    allapot: sor.allapot,
    ellenorzott: sor.ellenorzott,
    utolso_sikeres: sor.utolsoSikeres?.toISOString() ?? null,
    hiba_ok: sor.hibaOk,
  };
  const elso = Forras.safeParse(nyers);
  if (elso.success) return elso.data;

  const kiegeszitett = cimKiegeszit(sor.cim);
  if (kiegeszitett) {
    const masodik = Forras.safeParse({ ...nyers, cim: kiegeszitett });
    if (masodik.success) return masodik.data;
  }
  console.warn("Kihagyott forras sor (nem ertelmezheto cim):", sor.id, JSON.stringify(sor.cim));
  return null;
}

function sorFutassa(sor: typeof sema.hfFutas.$inferSelect): Futas {
  return futasParse({
    id: sor.id,
    szervezet_id: sor.szervezetId,
    szabaly_verzio: sor.szabalyVerzio,
    kezdet: sor.kezdet.toISOString(),
    veg: sor.veg?.toISOString() ?? null,
    allapot: sor.allapot,
    uj_talalatok: sor.ujTalalatok,
    hibas_forrasok: sor.hibasForrasok,
    proba: sor.proba,
  });
}

function sorKivonatta(sor: typeof sema.hfKivonat.$inferSelect): Kivonat {
  return kivonatParse({
    id: sor.id,
    forras_id: sor.forrasId,
    cim: sor.cim,
    url: sor.url,
    kanonikus_url: sor.kanonikusUrl,
    megjelenes: sor.megjelenes?.toISOString() ?? null,
    begyujtes: sor.begyujtes.toISOString(),
    szoveg: sor.szoveg,
    csonkolt: sor.csonkolt,
    ujjlenyomat: sor.ujjlenyomat,
    nyelv: sor.nyelv,
    lejar: sor.lejar.toISOString(),
  });
}

function sorTalalatta(sor: typeof sema.hfTalalat.$inferSelect): Talalat {
  return talalatParse({
    id: sor.id,
    szervezet_id: sor.szervezetId,
    esemeny_id: sor.esemenyId,
    kivonat_id: sor.kivonatId,
    ertekeles: sor.ertekeles,
    ertekeles_allapot: sor.ertekelesAllapot,
    megtekintes: sor.megtekintes,
    jeloles: sor.jeloles,
    tartalomotlet: sor.tartalomotlet ?? null,
    letrehozva: sor.letrehozva.toISOString(),
    futas_id: sor.futasId,
  });
}

function sorEsemennye(sor: typeof sema.hfEsemeny.$inferSelect): Esemeny {
  return esemenyParse({
    id: sor.id,
    szervezet_id: sor.szervezetId,
    fo_talalat_id: sor.foTalalatId,
    talalat_ids: sor.talalatIds,
    letrehozva: sor.letrehozva.toISOString(),
  });
}

function sorVisszajelzesse(sor: typeof sema.hfVisszajelzes.$inferSelect): Visszajelzes {
  return visszajelzesParse({
    id: sor.id,
    talalat_id: sor.talalatId,
    fajta: sor.fajta,
    okok: sor.okok,
    sajat_indok: sor.sajatIndok,
    letrehozva: sor.letrehozva.toISOString(),
  });
}

function sorJavaslatta(sor: typeof sema.hfJavaslat.$inferSelect): SzabalyJavaslat {
  return javaslatParse({
    id: sor.id,
    szabaly_verzio: sor.szabalyVerzio,
    javasolt: sor.javasolt,
    mi_alapjan: sor.miAlapjan,
    indoklas: sor.indoklas,
    varhato_hatas: sor.varhatoHatas,
    profil_erintett: sor.profilErintett,
    allapot: sor.allapot,
    minta_id: sor.mintaId,
    letrehozva: sor.letrehozva.toISOString(),
  });
}

function sorMintava(sor: typeof sema.hfMinta.$inferSelect): Minta {
  return mintaParse({
    id: sor.id,
    szervezet_id: sor.szervezetId,
    szabaly_verzio: sor.szabalyVerzio,
    talalat_ids: sor.talalatIds,
    letrehozva: sor.letrehozva.toISOString(),
    lejar: sor.lejar.toISOString(),
  });
}

export function postgresTar(): HirfigyeloTar {
  return {
    async verziok(szervezetId) {
      return szervezetKent(szervezetId, async (tx) => {
        const sorok = await tx.select().from(sema.hfBeallitasVerzio).where(eq(sema.hfBeallitasVerzio.szervezetId, szervezetId));
        return sorok.map(sorBeallitasVerziova);
      });
    },

    async verziokMent(szervezetId, verziok) {
      await szervezetKent(szervezetId, async (tx) => {
        // egyszerű megközelítés: törlés + beszúrás (a verziók kis száma miatt)
        await tx.delete(sema.hfBeallitasVerzio).where(eq(sema.hfBeallitasVerzio.szervezetId, szervezetId));
        if (verziok.length > 0) {
          await tx.insert(sema.hfBeallitasVerzio).values(
            verziok.map((v) => ({
              szervezetId,
              verzio: v.verzio,
              allapot: v.allapot,
              eredet: v.eredet,
              beallitas: v.beallitas,
              letrehozva: new Date(v.letrehozva),
            })),
          );
        }
      });
    },

    async tervezet(szervezetId, fiokId) {
      return szervezetKent(szervezetId, async (tx) => {
        const sor = (await tx.select().from(sema.hfTervezet).where(and(eq(sema.hfTervezet.szervezetId, szervezetId), eq(sema.hfTervezet.fiokId, fiokId))).limit(1))[0];
        if (!sor) return null;
        const e = Beallitas.safeParse(sor.beallitas);
        if (!e.success) throw new Error("Hibás tervezet: " + JSON.stringify(e.error.issues));
        return e.data;
      });
    },

    async tervezetMent(szervezetId, fiokId, b) {
      await szervezetKent(szervezetId, async (tx) => {
        if (b === null) {
          await tx.delete(sema.hfTervezet).where(and(eq(sema.hfTervezet.szervezetId, szervezetId), eq(sema.hfTervezet.fiokId, fiokId)));
          return;
        }
        const sor = (await tx.select().from(sema.hfTervezet).where(and(eq(sema.hfTervezet.szervezetId, szervezetId), eq(sema.hfTervezet.fiokId, fiokId))).limit(1))[0];
        if (sor) {
          await tx.update(sema.hfTervezet).set({ beallitas: b, frissitve: new Date() }).where(and(eq(sema.hfTervezet.szervezetId, szervezetId), eq(sema.hfTervezet.fiokId, fiokId)));
        } else {
          await tx.insert(sema.hfTervezet).values({ szervezetId, fiokId, beallitas: b });
        }
      });
    },

    async forrasok(szervezetId) {
      return szervezetKent(szervezetId, async (tx) => {
        const sorok = await tx.select().from(sema.hfForras).where(eq(sema.hfForras.szervezetId, szervezetId));
        return sorok.map(sorForrassa).filter((f): f is Forras => f !== null);
      });
    },

    async forrasMent(szervezetId, f) {
      await szervezetKent(szervezetId, async (tx) => {
        const sor = (await tx.select().from(sema.hfForras).where(and(eq(sema.hfForras.szervezetId, szervezetId), eq(sema.hfForras.id, f.id))).limit(1))[0];
        const ertek = {
          szervezetId,
          cim: f.cim,
          tipus: f.tipus,
          eredet: f.eredet,
          allapot: f.allapot,
          ellenorzott: f.ellenorzott,
          utolsoSikeres: f.utolso_sikeres ? new Date(f.utolso_sikeres) : null,
          hibaOk: f.hiba_ok,
        };
        if (sor) {
          await tx.update(sema.hfForras).set(ertek).where(and(eq(sema.hfForras.szervezetId, szervezetId), eq(sema.hfForras.id, f.id)));
        } else {
          await tx.insert(sema.hfForras).values({ id: f.id, ...ertek });
        }
        // F-5b (D-F33): a forrás állapota hibásra VÁLTOTT (nem volt az) → esemény; a cím adat, a hiba oka a zárt szótárból
        if (f.allapot === "hibas" && sor?.allapot !== "hibas") {
          await feljegyezHatterben(await esemenyKornyezet(), { szervezet_id: szervezetId, fajta: "forras_hibas", fiok_id: null, adat: { forras: f.cim, forras_id: f.id, ok: f.hiba_ok ?? null } });
        }
      });
    },

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
      return szervezetKent(szervezetId, async (tx) => {
        const r = await tx
          .insert(sema.hfKivonat)
          .values({
            id: k.id,
            szervezetId,
            forrasId: k.forras_id,
            cim: k.cim,
            url: k.url,
            kanonikusUrl: k.kanonikus_url,
            megjelenes: k.megjelenes ? new Date(k.megjelenes) : null,
            begyujtes: new Date(k.begyujtes),
            szoveg: k.szoveg,
            csonkolt: k.csonkolt,
            ujjlenyomat: k.ujjlenyomat,
            nyelv: k.nyelv,
            lejar: new Date(k.lejar),
          })
          .onConflictDoNothing({ target: [sema.hfKivonat.szervezetId, sema.hfKivonat.kanonikusUrl] })
          .returning({ id: sema.hfKivonat.id });
        return r.length > 0 ? "uj" : "letezik";
      });
    },

    async kivonatok(szervezetId, ids) {
      if (ids.length === 0) return [];
      return szervezetKent(szervezetId, async (tx) => {
        const sorok = await tx.select().from(sema.hfKivonat).where(and(eq(sema.hfKivonat.szervezetId, szervezetId), inArray(sema.hfKivonat.id, ids)));
        return sorok.map(sorKivonatta);
      });
    },

    async talalatok(szervezetId) {
      return szervezetKent(szervezetId, async (tx) => {
        const sorok = await tx.select().from(sema.hfTalalat).where(eq(sema.hfTalalat.szervezetId, szervezetId));
        return sorok.map(sorTalalatta);
      });
    },

    async talalatMent(szervezetId, t) {
      await szervezetKent(szervezetId, async (tx) => {
        const sor = (await tx.select().from(sema.hfTalalat).where(and(eq(sema.hfTalalat.szervezetId, szervezetId), eq(sema.hfTalalat.id, t.id))).limit(1))[0];
        const ertek = {
          szervezetId,
          esemenyId: t.esemeny_id,
          kivonatId: t.kivonat_id,
          ertekeles: t.ertekeles,
          ertekelesAllapot: t.ertekeles_allapot,
          megtekintes: t.megtekintes,
          jeloles: t.jeloles,
          tartalomotlet: t.tartalomotlet,
          letrehozva: new Date(t.letrehozva),
          futasId: t.futas_id,
        };
        if (sor) {
          await tx.update(sema.hfTalalat).set(ertek).where(and(eq(sema.hfTalalat.szervezetId, szervezetId), eq(sema.hfTalalat.id, t.id)));
        } else {
          await tx.insert(sema.hfTalalat).values({ id: t.id, ...ertek });
        }
      });
    },

    async esemenyek(szervezetId) {
      return szervezetKent(szervezetId, async (tx) => {
        const sorok = await tx.select().from(sema.hfEsemeny).where(eq(sema.hfEsemeny.szervezetId, szervezetId));
        return sorok.map(sorEsemennye);
      });
    },

    async esemenyMent(szervezetId, e) {
      await szervezetKent(szervezetId, async (tx) => {
        const sor = (await tx.select().from(sema.hfEsemeny).where(and(eq(sema.hfEsemeny.szervezetId, szervezetId), eq(sema.hfEsemeny.id, e.id))).limit(1))[0];
        const ertek = {
          szervezetId,
          foTalalatId: e.fo_talalat_id,
          talalatIds: e.talalat_ids,
          letrehozva: new Date(e.letrehozva),
        };
        if (sor) {
          await tx.update(sema.hfEsemeny).set(ertek).where(and(eq(sema.hfEsemeny.szervezetId, szervezetId), eq(sema.hfEsemeny.id, e.id)));
        } else {
          await tx.insert(sema.hfEsemeny).values({ id: e.id, ...ertek });
        }
      });
    },

    async visszajelzesek(szervezetId) {
      return szervezetKent(szervezetId, async (tx) => {
        const sorok = await tx.select().from(sema.hfVisszajelzes).where(eq(sema.hfVisszajelzes.szervezetId, szervezetId));
        return sorok.map(sorVisszajelzesse);
      });
    },

    async visszajelzesMent(szervezetId, v) {
      await szervezetKent(szervezetId, async (tx) => {
        const sor = (await tx.select().from(sema.hfVisszajelzes).where(and(eq(sema.hfVisszajelzes.szervezetId, szervezetId), eq(sema.hfVisszajelzes.id, v.id))).limit(1))[0];
        const ertek = {
          szervezetId,
          talalatId: v.talalat_id,
          fajta: v.fajta,
          okok: v.okok,
          sajatIndok: v.sajat_indok,
          letrehozva: new Date(v.letrehozva),
        };
        if (sor) {
          await tx.update(sema.hfVisszajelzes).set(ertek).where(and(eq(sema.hfVisszajelzes.szervezetId, szervezetId), eq(sema.hfVisszajelzes.id, v.id)));
        } else {
          await tx.insert(sema.hfVisszajelzes).values({ id: v.id, ...ertek });
        }
      });
    },

    async javaslatok(szervezetId) {
      return szervezetKent(szervezetId, async (tx) => {
        const sorok = await tx.select().from(sema.hfJavaslat).where(eq(sema.hfJavaslat.szervezetId, szervezetId));
        return sorok.map(sorJavaslatta);
      });
    },

    async javaslatMent(szervezetId, j) {
      await szervezetKent(szervezetId, async (tx) => {
        const sor = (await tx.select().from(sema.hfJavaslat).where(and(eq(sema.hfJavaslat.szervezetId, szervezetId), eq(sema.hfJavaslat.id, j.id))).limit(1))[0];
        const ertek = {
          szervezetId,
          szabalyVerzio: j.szabaly_verzio,
          javasolt: j.javasolt,
          miAlapjan: j.mi_alapjan,
          indoklas: j.indoklas,
          varhatoHatas: j.varhato_hatas,
          profilErintett: j.profil_erintett,
          allapot: j.allapot,
          mintaId: j.minta_id,
          letrehozva: new Date(j.letrehozva),
        };
        if (sor) {
          await tx.update(sema.hfJavaslat).set(ertek).where(and(eq(sema.hfJavaslat.szervezetId, szervezetId), eq(sema.hfJavaslat.id, j.id)));
        } else {
          await tx.insert(sema.hfJavaslat).values({ id: j.id, ...ertek });
        }
      });
    },

    async mintak(szervezetId) {
      return szervezetKent(szervezetId, async (tx) => {
        const sorok = await tx.select().from(sema.hfMinta).where(eq(sema.hfMinta.szervezetId, szervezetId));
        return sorok.map(sorMintava);
      });
    },

    async mintaMent(szervezetId, m) {
      await szervezetKent(szervezetId, async (tx) => {
        const sor = (await tx.select().from(sema.hfMinta).where(and(eq(sema.hfMinta.szervezetId, szervezetId), eq(sema.hfMinta.id, m.id))).limit(1))[0];
        const ertek = {
          szervezetId,
          szabalyVerzio: m.szabaly_verzio,
          talalatIds: m.talalat_ids,
          letrehozva: new Date(m.letrehozva),
          lejar: new Date(m.lejar),
        };
        if (sor) {
          await tx.update(sema.hfMinta).set(ertek).where(and(eq(sema.hfMinta.szervezetId, szervezetId), eq(sema.hfMinta.id, m.id)));
        } else {
          await tx.insert(sema.hfMinta).values({ id: m.id, ...ertek });
        }
      });
    },

    async lejartKivonatokTorol(szervezetId, most) {
      return szervezetKent(szervezetId, async (tx) => {
        const r = await tx
          .delete(sema.hfKivonat)
          .where(and(eq(sema.hfKivonat.szervezetId, szervezetId), sql`${sema.hfKivonat.lejar} < ${most}`))
          .returning({ id: sema.hfKivonat.id });
        return r.length;
      });
    },
  };
}
