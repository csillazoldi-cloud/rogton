// Futás és állapotgép — a begyűjtés egy futása.
import { z } from "zod";
import type { Idozites } from "./beallitas";

export const FutasAllapot = z.enum(["indul", "fut", "kesz", "reszleges", "hiba", "ai_fuggoben"]);
export type FutasAllapot = z.infer<typeof FutasAllapot>;

export const Futas = z.object({
  id: z.string().min(1),
  szervezet_id: z.string().min(1),
  szabaly_verzio: z.number().int().positive(),
  kezdet: z.iso.datetime(),
  veg: z.iso.datetime().nullable(),
  allapot: FutasAllapot,
  uj_talalatok: z.number().int().nonnegative(),
  hibas_forrasok: z.array(z.object({ forras_id: z.string(), ok: z.string().max(300) })),
  proba: z.boolean(),
});
export type Futas = z.infer<typeof Futas>;

/** Dupla indítás tiltva: csak ha nincs indul/fut állapotú futás. */
export function indithato(aktivFutas: Futas | null): boolean {
  return aktivFutas === null || (aktivFutas.allapot !== "indul" && aktivFutas.allapot !== "fut");
}

/** Állapotátmenet: indul→fut, forrás-hiba gyűjtés, AI-hiba jelzés, végén a végállapot. */
export function futasAtmenet(
  f: Futas,
  e: { fajta: "kezd" } | { fajta: "forras_hiba"; forras_id: string; ok: string } | { fajta: "ai_hiba" } | { fajta: "vege"; uj_talalatok: number; osszesForras: number; felbeszakadt?: boolean },
  most: Date,
): Futas {
  switch (e.fajta) {
    case "kezd":
      return { ...f, allapot: "fut" };
    case "forras_hiba":
      return { ...f, hibas_forrasok: [...f.hibas_forrasok, { forras_id: e.forras_id, ok: e.ok }] };
    case "ai_hiba":
      return { ...f, allapot: "ai_fuggoben" };
    case "vege": {
      let allapot: FutasAllapot = "kesz";
      if (f.hibas_forrasok.length === e.osszesForras) allapot = "hiba";
      else if (f.hibas_forrasok.length > 0) allapot = "reszleges";
      else if (f.allapot === "ai_fuggoben") allapot = "ai_fuggoben";
      // A biztonsági fék (pár-korlát vagy határidő) miatt nem kérdeztünk meg mindent: a futás RÉSZLEGES, nem „kész”.
      else if (e.felbeszakadt === true) allapot = "reszleges";
      return { ...f, allapot, veg: most.toISOString(), uj_talalatok: e.uj_talalatok };
    }
  }
}

/** A legutóbbi sikeres futás (kesz vagy reszleges), a legkésőbbi veg alapján. */
export function utolsoSikeres(futasok: Futas[]): Futas | null {
  const sikeres = futasok.filter((f) => f.allapot === "kesz" || f.allapot === "reszleges");
  if (sikeres.length === 0) return null;
  return sikeres.sort((a, b) => new Date(b.veg ?? 0).getTime() - new Date(a.veg ?? 0).getTime())[0] ?? null;
}

/** A következő futás ideje: kezi → null; napi → a következő ora:perc az időzónában. */
export function kovetkezoFutas(idozites: Idozites, most: Date): Date | null {
  if (idozites.mod === "kezi") return null;
  const zona = idozites.idozona || "Europe/Budapest";
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  /** A zóna „helyi” óra-perc-nap részei egy pillanatra. */
  const reszek = (d: Date) => {
    const r = fmt.formatToParts(d); const g = (t: string) => Number(r.find((x) => x.type === t)?.value ?? "0");
    return { ev: g("year"), ho: g("month"), nap: g("day"), ora: g("hour"), perc: g("minute"), mp: g("second") };
  };
  /** A zóna eltolása (ms) egy pillanatban: helyi fali idő UTC-ként értelmezve mínusz a valódi pillanat. */
  const eltolas = (d: Date) => { const p = reszek(d); return Date.UTC(p.ev, p.ho - 1, p.nap, p.ora, p.perc, p.mp) - d.getTime(); };
  const ma = reszek(most);
  for (let napEltolas = 0; napEltolas < 3; napEltolas++) {
    const fali = Date.UTC(ma.ev, ma.ho - 1, ma.nap + napEltolas, idozites.ora, idozites.perc, 0);
    let cel = new Date(fali - eltolas(most));
    cel = new Date(fali - eltolas(cel)); // az eltolást a célnapra újraszámolva (óraátállítás)
    if (cel.getTime() > most.getTime()) return cel;
  }
  return null;
}

/**
 * Esedékesség: napi esetén igaz, ha a mai (a zónában) ora:perc már elmúlt ÉS az utolsó napi
 * futás nem ma (a zónában) volt; kezi → mindig hamis. Tiszta függvény, Intl-lel.
 */
export function esedekes(idozites: Idozites, utolsoKezdet: Date | null, most: Date): boolean {
  if (idozites.mod === "kezi") return false;
  const zona = idozites.idozona || "Europe/Budapest";
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  const reszek = (d: Date) => {
    const r = fmt.formatToParts(d); const g = (t: string) => Number(r.find((x) => x.type === t)?.value ?? "0");
    return { ev: g("year"), ho: g("month"), nap: g("day"), ora: g("hour"), perc: g("minute") };
  };
  const ma = reszek(most);
  const mostPerc = ma.ora * 60 + ma.perc;
  const celPerc = idozites.ora * 60 + idozites.perc;
  if (mostPerc < celPerc) return false; // a mai időpont még nem jött el

  if (!utolsoKezdet) return true; // még soha nem futott napi → esedékes
  const utolso = reszek(utolsoKezdet);
  if (utolso.ev === ma.ev && utolso.ho === ma.ho && utolso.nap === ma.nap) return false; // ma már futott
  return true;
}

/** F9-A7 (Vilmos döntése 2026-09-14): a 48 óránál régebbi cikkeket nem vizsgáljuk. */
export const HF_CIKK_MAX_KOR_ORA = 48;

/** A cikk kora a futás mostjához képest: "friss" (≤ 48 óra vagy a jövőben), "regi" (régebbi), "datum_nelkul" (nincs vagy értelmezhetetlen dátum). */
export function cikkFrissesseg(megjelenes: string | null, most: Date, maxOra: number = HF_CIKK_MAX_KOR_ORA): "friss" | "regi" | "datum_nelkul" {
  if (megjelenes === null) return "datum_nelkul";
  const ido = new Date(megjelenes).getTime();
  if (Number.isNaN(ido)) return "datum_nelkul";
  const korOra = (most.getTime() - ido) / (1000 * 60 * 60);
  if (korOra > maxOra) return "regi";
  return "friss";
}
