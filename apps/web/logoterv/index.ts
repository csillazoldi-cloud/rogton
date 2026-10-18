import "server-only";
// R-17 B · fizetős logótervezés — a gépezet (design/R17-visszajelzes/gepezet.md B; Csilla 10-06).
//  - beállítás: `rendszer_beallitas` logoterv_ar (EUR vagy null) + logoterv_cimzett (e-mail vagy üres) — a rendszergazda végpontja írja;
//  - kérés: `logoterv_keres` (sorszintű védelemmel), az ár a beküldés pillanatáé; a minták a munkatér saját „referencia” fájljai;
//  - értesítés: e-mail CSAK, ha a levelezés be van állítva (smtp.ts) ÉS van címzett; különben `nincs_beallitva`, hiba nélkül.
//    Hub-mechanizmus a kódban nincs (gepezet B2 „hub feedback” — nem találtunk ilyet, nem találunk ki egyet; Csilla 10-06).
//  - a rendszergazda listája és az állapot a SECURITY DEFINER függvényeken át (0150), mint a költség-lista (0037).
import { and, eq, sql } from "drizzle-orm";
import { db, sema, szervezetKent } from "../adatbazis/kapcsolat";
import { fajlTar } from "../fajl/tar";
import { felirat, feliratok } from "../nyelv";
import { LogotervKuldes, cimzettErtelmez, arErtelmez, level, type LogotervValaszok } from "./szabaly";
import { smtpBeallitas, smtpKuld } from "./smtp";

export * from "./szabaly";

export type LogotervBeallitas = { ar: number | null; cimzett: string };
export type Ertesites = "nincs_beallitva" | "kuldes" | "elkuldve" | "hiba";
export type LogotervSor = {
  id: string; szervezet_id: string; szervezet_nev: string; fiok_nev: string; ar_eur: number | null; valaszok: LogotervValaszok;
  fajl_db: number; allapot: "uj" | "folyamatban" | "kesz"; ertesites: Ertesites; letrehozva: string;
};

/** A két beállítás. Hiányzó sor (régi adatbázis): ár 79, címzett üres — a 0150 kezdőértékei. */
export async function beallitas(): Promise<LogotervBeallitas> {
  const sorok = await db().select().from(sema.rendszerBeallitas);
  const m = new Map(sorok.map((s) => [s.kulcs, s.ertek]));
  const ar = arErtelmez(m.has("logoterv_ar") ? m.get("logoterv_ar") : 79);
  const cimzett = cimzettErtelmez(m.get("logoterv_cimzett") ?? "");
  return { ar: ar.ok ? ar.ar : null, cimzett: cimzett.ok ? cimzett.cimzett : "" };
}

/** A rendszergazda mentése. A JOGOT a végpont ellenőrzi. Hibás érték: melyik mező. */
export async function beallitasMent(be: { ar?: unknown; cimzett?: unknown }): Promise<{ ok: true; beallitas: LogotervBeallitas } | { ok: false; mezo: "ar" | "cimzett" }> {
  const most = await beallitas();
  const ar = "ar" in be ? arErtelmez(be.ar) : { ok: true as const, ar: most.ar };
  if (!ar.ok) return { ok: false, mezo: "ar" };
  const cimzett = "cimzett" in be ? cimzettErtelmez(be.cimzett) : { ok: true as const, cimzett: most.cimzett };
  if (!cimzett.ok) return { ok: false, mezo: "cimzett" };
  // a „nincs ár” JSON null (nem SQL NULL: az oszlop NOT NULL) — a drizzle a JS null-t SQL NULL-ként küldené
  const ment = (kulcs: string, ertek: unknown) => {
    const v = ertek === null ? sql`'null'::jsonb` : ertek;
    return db().insert(sema.rendszerBeallitas).values({ kulcs, ertek: v })
      .onConflictDoUpdate({ target: sema.rendszerBeallitas.kulcs, set: { ertek: v, frissitve: new Date() } });
  };
  await ment("logoterv_ar", ar.ar);
  await ment("logoterv_cimzett", cimzett.cimzett);
  return { ok: true, beallitas: { ar: ar.ar, cimzett: cimzett.cimzett } };
}

export type KuldesEredmeny = { ok: true; id: string; ertesites: Ertesites } | { ok: false; hiba: "ERVENYTELEN_ADAT" | "NINCS_AJANLAT" };

/**
 * Egy kérdőív beküldése. A munkatér és a fiók a kaputól jön (megbízható). Az ajánlat csak akkor érvényes, ha van ár (különben a gomb
 * sem látszik — a végpont ugyanígy dönt). A levél a beküldés UTÁN megy, a választ nem várja meg (`varj: true` csak a próbának).
 */
export async function kuld(
  k: { szervezetId: string; szervezetNev: string; fiokId: string; fiokNev: string },
  be: unknown,
  opciok: { varj?: boolean; env?: Record<string, string | undefined> } = {},
): Promise<KuldesEredmeny> {
  const e = LogotervKuldes.safeParse(be);
  if (!e.success) return { ok: false, hiba: "ERVENYTELEN_ADAT" };
  const b = await beallitas();
  if (b.ar === null) return { ok: false, hiba: "NINCS_AJANLAT" };
  // a minták: csak a munkatér SAJÁT referencia-fájljai (idegen azonosító → érvénytelen kérés, nem csendes eldobás)
  let fajlIdk: string[] = [];
  if (e.data.minta_idk.length > 0) {
    const sajat = new Set((await fajlTar.lista(k.szervezetId, "referencia")).map((f) => f.id));
    if (e.data.minta_idk.some((id) => !sajat.has(id))) return { ok: false, hiba: "ERVENYTELEN_ADAT" };
    fajlIdk = [...new Set(e.data.minta_idk)];
  }
  const { minta_idk: _m, ...valaszok } = e.data;
  void _m;
  const smtp = smtpBeallitas(opciok.env ?? process.env);
  const ertesites: Ertesites = smtp && b.cimzett ? "kuldes" : "nincs_beallitva";
  const id = await szervezetKent(k.szervezetId, async (tx) => {
    const [sor] = await tx.insert(sema.logotervKeres).values({
      szervezetId: k.szervezetId, fiokId: k.fiokId, fiokNev: k.fiokNev, arEur: b.ar === null ? null : b.ar.toFixed(2),
      valaszok, fajlIdk, ertesites,
    }).returning({ id: sema.logotervKeres.id });
    return sor!.id;
  });
  if (smtp && b.cimzett) {
    const fut = (async () => {
      let vege: Ertesites = "elkuldve";
      try {
        const f = await feliratok("hu");
        const l = level((kulcs, ertekek) => felirat(f, kulcs, ertekek), { munkater: k.szervezetNev, ki: k.fiokNev, ar: b.ar, valaszok, mintaDb: fajlIdk.length });
        await smtpKuld(smtp, { to: b.cimzett, targy: l.targy, szoveg: l.szoveg });
      } catch (h) {
        vege = "hiba";
        console.error("[logoterv] az e-mail nem ment el:", h instanceof Error ? h.message : "ismeretlen hiba");
      }
      await szervezetKent(k.szervezetId, (tx) => tx.update(sema.logotervKeres).set({ ertesites: vege })
        .where(and(eq(sema.logotervKeres.id, id), eq(sema.logotervKeres.szervezetId, k.szervezetId)))).catch(() => undefined);
      return vege;
    })();
    if (opciok.varj) return { ok: true, id, ertesites: await fut };
    void fut;
  }
  return { ok: true, id, ertesites };
}

/** A rendszergazda listája (minden munkatér, legújabb elöl, legfeljebb 500). A JOGOT a végpont ellenőrzi. */
export async function lista(): Promise<LogotervSor[]> {
  const e = await db().execute(sql`SELECT * FROM logoterv_keres_osszes()`);
  const sorok = (e as unknown as { rows: Record<string, unknown>[] }).rows ?? [];
  return sorok.map((r) => ({
    id: String(r["id"]),
    szervezet_id: String(r["szervezet_id"]),
    szervezet_nev: String(r["szervezet_nev"] ?? ""),
    fiok_nev: String(r["fiok_nev"] ?? ""),
    ar_eur: r["ar_eur"] === null || r["ar_eur"] === undefined ? null : Number(r["ar_eur"]),
    valaszok: r["valaszok"] as LogotervValaszok,
    fajl_db: Number(r["fajl_db"] ?? 0),
    allapot: String(r["allapot"]) as LogotervSor["allapot"],
    ertesites: String(r["ertesites"]) as Ertesites,
    letrehozva: new Date(String(r["letrehozva"])).toISOString(),
  }));
}

/** Az állapot (új · folyamatban · kész) — a rendszergazda listájáról. */
export async function allapotValt(id: string, allapot: string): Promise<boolean> {
  if (!["uj", "folyamatban", "kesz"].includes(allapot)) return false;
  const e = await db().execute(sql`SELECT logoterv_keres_allapot(${id}::uuid, ${allapot}) AS ok`);
  const sor = (e as unknown as { rows: { ok: boolean }[] }).rows[0];
  return sor?.ok === true;
}
