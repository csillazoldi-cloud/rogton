// Találat, esemény, értékelés — a felhasználónak mutatott egységek.
import { z } from "zod";
import { EloTenyek } from "./elo-tenyek";

export const Fontossag = z.enum(["fontos", "erdekes", "hatter"]);
export type Fontossag = z.infer<typeof Fontossag>;

export const Temacimke = z.enum(["sajat_megjelenes", "szakmai", "tartalomotlet"]);
export type Temacimke = z.infer<typeof Temacimke>;

/**
 * A szűrő szabályának változata (a hf_relevancia prompt jelentése). 2026-09-22 (Vilmos): 8 = nagyon szigorú szűrő —
 * a helynév csak feltétel, az Iránytű is számít. 9 = ugyanez, de a modell három ellenőrző választ is ad (a szervezetről
 * szól-e, mi a fő téma, teljesül-e a helyfeltétel), és a kód ezek alapján dob ki (relevanciaSzigorit).
 * 10 = még három ellenőrző válasz (a helyfeltétel neve, a hír hatóköre, a helyet megnevező szó szerinti idézet — a kód
 * megnézi, hogy tényleg a cikkben áll), és a modell kis gondolkodással dolgozik.
 * 11 = előszűrő: szólista (AI nélkül keres a program) + címek átfutása; ami nem megy át, azt a gép el sem olvassa.
 * 12 = fiókonkénti fokozatok (R-13): a tárolt fontosság a LEGENGEDÉKENYEBB fokozaté, a tények mellette
 *      (rola_szol, fo_tema, erintett_tema, hely_ok, elo); a néző szerinti döntés `nezoSzerint`.
 * Ha ez nő, a régebbi értékelések a következő újraszűréskor újra mennek.
 */
export const SZURO_VERZIO = 12;

/** Egy értékelés a mai szűrővel készült-e (a régiek újraszűrésre várnak). */
export function szuroElavult(e: { szuro_verzio?: number | undefined } | null | undefined): boolean {
  return (e?.szuro_verzio ?? 0) < SZURO_VERZIO;
}

/** Kiszűrt (háttér) hír-e: ezt a felület nem mutatja, csak a számát. */
export function kiszurt(t: { ertekeles_allapot: string; ertekeles: { fontossag: string } | null }): boolean {
  return t.ertekeles_allapot === "kesz" && t.ertekeles?.fontossag === "hatter";
}

export const Ertekeles = z.object({
  fontossag: Fontossag,
  temacimke: Temacimke,
  miert: z.string().trim().min(1).max(300),
  indoklas: z.string().trim().max(800).default(""),
  osszefoglalo: z.string().trim().max(400).default(""),
  szabaly_verzio: z.number().int().positive(),
  ertekelve: z.iso.datetime(),
  csonkolt_alapjan: z.boolean(),
  /** F10-M1: a cikk címe a beállított tartalomnyelven (a modell fordítja; ha a cím már azon a nyelven van, ugyanaz) */
  cim_forditott: z.string().trim().max(200).optional(),
  /** F10-M1: mit jelent ez a hír a szervezetnek (pénz, vevők, kötelezettség) — „A cégednek" doboz; háttérhírnél üres */
  cegednek: z.string().trim().max(300).optional(),
  /** F10-M1: mit jelent a szervezet vevőinek/közönségének — „A vevőidnek" doboz; háttérhírnél üres */
  vevoidnek: z.string().trim().max(300).optional(),
  /** 2026-09-22: melyik szűrő-változattal készült (SZURO_VERZIO); hiányzik = a szigorú szűrő előtti */
  szuro_verzio: z.number().int().positive().optional(),
  /** 2026-09-22 (v9): a modell ellenőrző válaszai és a kód döntése — utólag látszik, miért esett ki egy hír */
  fo_tema: z.string().trim().max(200).optional(),
  helyszin: z.enum(["egyezik", "nem", "nincs_feltetel"]).optional(),
  hatokor: z.enum(["helyi", "megyei", "orszagos", "nemzetkozi"]).optional(),
  hely_idezet: z.string().trim().max(200).optional(),
  /** hely/tema: a teljes olvasás után a kód zára (v9–v11); szolista/cim: az előszűrő — ezt a gép senkinek nem olvasta el */
  kiszurve: z.enum(["hely", "tema", "szolista", "cim"]).optional(),
  /** v12 (R-13) tények a fiókonkénti döntéshez */
  rola_szol: z.boolean().optional(),
  erintett_tema: z.string().trim().max(200).optional(),
  /** a nagyon szigorú fokozat helyfeltétele (helyszín + hatókör + a cikkben megtalált idézet) — a kód számolja olvasáskor */
  hely_ok: z.boolean().optional(),
  /** az előszűrő tényei (szólista, cím) — a tagonkénti előszűrő ebből dönt */
  elo: EloTenyek.nullable().optional(),
});
export type Ertekeles = z.infer<typeof Ertekeles>;

export const ErtekelesAllapot = z.enum(["fuggoben", "kesz", "keret_kimerult"]);
export type ErtekelesAllapot = z.infer<typeof ErtekelesAllapot>;

export const Talalat = z.object({
  id: z.string().min(1),
  szervezet_id: z.string().min(1),
  esemeny_id: z.string().min(1),
  kivonat_id: z.string().min(1),
  ertekeles: Ertekeles.nullable(),
  ertekeles_allapot: ErtekelesAllapot,
  megtekintes: z.enum(["uj", "megtekintett"]),
  jeloles: z.enum(["nincs", "mentett", "elrejtett"]),
  letrehozva: z.iso.datetime(),
  futas_id: z.string().min(1),
  tartalomotlet: z.object({ szoveg: z.string().max(1200), nyelv: z.string().length(2), keszult: z.iso.datetime() }).nullable().default(null),
});
export type Talalat = z.infer<typeof Talalat>;

export const Esemeny = z.object({
  id: z.string().min(1),
  szervezet_id: z.string().min(1),
  fo_talalat_id: z.string().min(1),
  talalat_ids: z.array(z.string()).min(1),
  letrehozva: z.iso.datetime(),
});
export type Esemeny = z.infer<typeof Esemeny>;

/** Megtekintetté teszi a találatot. */
export function megtekint(t: Talalat): Talalat {
  return { ...t, megtekintes: "megtekintett" };
}

/** Jelölés (mentés/elrejtés/visszaállítás); a jelölés megtekintetté is tesz. */
export function jelol(t: Talalat, jeloles: Talalat["jeloles"]): Talalat {
  return { ...t, jeloles, megtekintes: "megtekintett" };
}

/** Szűrés: "uj" = megtekintes === "uj"; a nem elrejtett önmagában nem új. */
export function szuro(talalatok: Talalat[], mod: "uj" | "mentett" | "elrejtett" | "mind"): Talalat[] {
  switch (mod) {
    case "uj": return talalatok.filter((t) => t.megtekintes === "uj");
    case "mentett": return talalatok.filter((t) => t.jeloles === "mentett");
    case "elrejtett": return talalatok.filter((t) => t.jeloles === "elrejtett");
    case "mind": return talalatok;
  }
}

/** Ugyanaz a cikk egyszer — a tár ezt egyedi kulcsként tartja. */
export function cikkKulcs(szervezetId: string, kanonikusUrl: string): string {
  return `${szervezetId}|${kanonikusUrl}`;
}
