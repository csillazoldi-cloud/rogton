// A recept: milyen mezők, milyen szerepben, milyen sorrendben, milyen szabályokkal.
// Megjelenést nem tartalmaz — azt a márkaréteg adja.
import { z } from "zod";

export const ReceptMezo = z
  .object({
    azonosito: z.string(),
    cimke: z.string().default(""),
    blokk: z.string(),
    sorrend: z.number(),
    tipus: z.enum([
      "rovid_szoveg",
      "hosszu_szoveg",
      "szam",
      "datum",
      "ido",
      "jarat_azonosito",
      "foto",
      "lista",
      "tablazat",
      "allapotjelzo",
      "arculati_hely",
    ]),
    szerep: z.unknown().optional(),
    kotelezo: z.unknown().optional(),
    nyelvpar: z.unknown().optional(),
    karakterkorlat: z.unknown().optional(),
    illesztes: z
      .object({
        lepcsok: z.array(z.string()).optional(),
        keskenyites: z.unknown().optional(),
        rovid_valtozat_megadhato: z.boolean().optional(),
        kikoltoztetheto_kepalairasba: z.unknown().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
  })
  .passthrough();
export type ReceptMezo = z.infer<typeof ReceptMezo>;

export const Recept = z
  .object({
    recept: z.object({ azonosito: z.string(), nev: z.string() }).passthrough(),
    blokkok: z.array(z.object({ azonosito: z.string(), sorrend: z.number(), tartalom: z.array(z.string()) }).passthrough()),
    mezok: z.array(ReceptMezo).min(1),
  })
  .passthrough();
export type Recept = z.infer<typeof Recept>;

/** Kötelező-e a mező a megadott tartalom mellett. A feltételes mezőknél a feltételt a hívó adja. */
export function kotelezoE(m: ReceptMezo): "igen" | "nem" | "felteteles" {
  const k = m.kotelezo;
  if (k === true) return "igen";
  if (k === false || k == null) return "nem";
  if (typeof k === "string") return "felteteles";
  if (typeof k === "object") {
    const o = k as Record<string, unknown>;
    if (o["felteteles"] === true) return "felteteles";
    if (o["ertek"] === true) return "igen";
    return "nem";
  }
  return "nem";
}

/** Legfeljebb hány sor nyelvenként (a recept karakterkorlát-leírásából), vagy null. */
export function maxSor(m: ReceptMezo): number | null {
  const kk = m.karakterkorlat as { max_sor?: unknown } | undefined;
  const ms = kk?.max_sor;
  if (typeof ms === "number") return ms;
  if (ms && typeof ms === "object") {
    const n = (ms as Record<string, unknown>)["nyelvenkent"];
    if (typeof n === "number") return n;
  }
  return null;
}

/** A mező a képaláírásba költöztethető-e. */
export function kikoltoztetheto(m: ReceptMezo): boolean {
  const k = m.illesztes?.kikoltoztetheto_kepalairasba;
  if (k === true) return true;
  if (k && typeof k === "object") return (k as Record<string, unknown>)["ertek"] === true;
  return false;
}

/** A mezők olvasási sorrendben: blokk-sorrend, azon belül mező-sorrend. */
export function mezoSorrend(r: Recept): ReceptMezo[] {
  const bs = new Map(r.blokkok.map((b) => [b.azonosito, b.sorrend]));
  return [...r.mezok].sort(
    (a, b) => (bs.get(a.blokk) ?? 99) - (bs.get(b.blokk) ?? 99) || a.sorrend - b.sorrend,
  );
}
