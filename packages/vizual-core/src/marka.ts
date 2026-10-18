// A márkaréteg (a fiók arculata) adatformája.
// A recept SOHA nem tartalmaz betűnevet, színkódot vagy pozíciót — ezek mind innen jönnek.
import { z } from "zod";

const Szin = z.string().regex(/^#[0-9a-fA-F]{6}$/, "hex szín (#rrggbb)");

/** Egy szövegstílus: melyik szerep betűje, milyen súllyal, méretben, színben. */
export const SzovegStilus = z.object({
  szerep: z.enum(["hang", "tajekoztatas", "technikai"]),
  suly: z.number().int().min(100).max(900),
  /** px, vagy egy méretlépcső neve (pl. "focim") — ilyenkor az illesztés választja a lépcsőt. */
  meret: z.union([z.number().positive(), z.string()]),
  /** px; null = a böngésző alapértéke (a forráslap így állt). Lépcsős méretnél a lépcső adja. */
  sorkoz: z.number().positive().nullable().default(null),
  betukoz_em: z.number().default(0),
  nagybetus: z.boolean().default(false),
  szin: z.string(),
});
export type SzovegStilus = z.infer<typeof SzovegStilus>;

/** Egy méretlépcső egy foka: betűméret és sorköz px-ben. */
export const Lepcsofok = z.object({ meret: z.number().positive(), sorkoz: z.number().positive() });

const Kitoltes = z.tuple([z.number(), z.number(), z.number(), z.number()]);

/** Egy mező megjelenése egy recept elrendezés-változatában. */
export const MezoMegjelenes = z.object({
  stilus: z.string().optional(),
  /** a másodlagos nyelv stílusa (ha eltér) */
  stilus_masodlagos: z.string().optional(),
  /** a másodlagos nyelv csak más színű (egysoros párnál) */
  masodlagos_szin: z.string().optional(),
  par: z.enum(["ketsoros", "egysoros"]).optional(),
  /** kétsoros párnál a két nyelv közti köz, px */
  par_koz: z.number().default(0),
  /** a mező előtti fix köz, px */
  elotte: z.number().default(0),
  /** a mező előtt rugalmas köz (a maradék hely) */
  rugalmas_elotte: z.boolean().default(false),
  /** ennél a receptnél a mező nem jelenik meg (csak arculati helyre) */
  rejtett: z.boolean().default(false),
  /** a mező utáni fix köz, px */
  utana: z.number().default(0),
  // típusfüggő beállítások
  jelveny: z
    .object({ stilus: z.string(), hatter: z.string(), vizszintes_kitoltes: z.number(), sarok: z.number() })
    .optional(),
  cimkeoszlop: z.number().optional(),
  cella_kitoltes: z.number().optional(),
  hajszal: z.string().optional(),
  hajszal_vastag: z.number().optional(),
  cimke_stilus: z.string().optional(),
  ertek_stilus: z.string().optional(),
  sav_magassag: z.number().optional(),
  sav_szin: z.string().optional(),
  sav_elotte: z.number().optional(),
  elem_koz: z.number().optional(),
  sor_koz: z.number().optional(),
  ikon_meret: z.number().optional(),
  ikon_vonal: z.number().optional(),
  /** a mező melyik másik mező sorába kerül (pl. a forrás az azonosító sor második sorába) */
  beolvad: z.string().optional(),
});
export type MezoMegjelenes = z.infer<typeof MezoMegjelenes>;

/** Blokk-szintű beállítás: a blokk mezői egy sorban vagy egymás alatt, sávként, stb. */
export const BlokkMegjelenes = z.object({
  irany: z.enum(["sor", "oszlop"]).default("oszlop"),
  igazitas: z.enum(["center", "baseline", "start"]).default("start"),
  koz: z.number().default(0),
  tordelheto: z.boolean().default(false),
  /** teljes szélességű sáv a margón kívül (az állapot színével) */
  sav: z.boolean().default(false),
  sav_kitoltes: Kitoltes.optional(),
  elotte: z.number().default(0),
  rugalmas_elotte: z.boolean().default(false),
  /** a blokk mezőinek megjelenési sorrendje, ha a sorban máshogy állnak (pl. ikon a címke előtt) */
  mezo_sorrend: z.array(z.string()).optional(),
  /** ezek a mezők a sor fölött, külön sorban állnak (pl. a forrássor az azonosító sor fölött) */
  kulon: z.array(z.string()).default([]),
  hajszal_felette: z.object({ szin: z.string(), vastag: z.number(), koz: z.number() }).optional(),
});
export type BlokkMegjelenes = z.infer<typeof BlokkMegjelenes>;

/** Egy recept elrendezés-változata ennél a fióknál. */
export const Elrendezes = z.object({
  hatter: z.string(),
  /** a lap belső margója: [fent, jobb, lent, bal] */
  margo: Kitoltes,
  /** ha a fej sáv a margón kívül áll, a sáv alatti rész margója */
  sav_alatti_margo: Kitoltes.optional(),
  blokkok: z.record(z.string(), BlokkMegjelenes).default({}),
  mezok: z.record(z.string(), MezoMegjelenes).default({}),
});
export type Elrendezes = z.infer<typeof Elrendezes>;

export const Betufajl = z.object({
  csalad: z.string(),
  suly: z.string(),
  stretch: z.string().nullable().default(null),
  stilus: z.string().default("normal"),
  fajl: z.string(),
  unicode_range: z.string().nullable().default(null),
});

export const Marka = z.object({
  nev: z.string(),
  verzio: z.number().int().positive(),
  betuk: z.object({
    hang: z.string(),
    tajekoztatas: z.string(),
    technikai: z.string(),
    /** a tájékoztatás keskeny változata (font-stretch %), null = nincs */
    tajekoztatas_keskeny: z.number().nullable().default(null),
  }),
  betufajlok: z.array(Betufajl).default([]),
  szinek: z.record(z.string(), Szin),
  lepcsok: z.record(z.string(), z.array(Lepcsofok).min(1)),
  minimum: z.number().positive(),
  stilusok: z.record(z.string(), SzovegStilus),
  emblema: z.object({
    meret: z.number().positive(),
    /** alap-szín kulcs → SVG (a fiók logója a megfelelő változatban) */
    valtozatok: z.record(z.string(), z.string()),
    felirat: z.string(),
  }),
  jelzes: z.object({ van: z.boolean(), szelesseg: z.number(), magassag: z.number(), szin: z.string() }),
  ikonok: z.record(z.string(), z.string()).default({}),
  allapotok: z.record(z.string(), z.object({ hatter: z.string(), szoveg: z.string() })),
  lokal: z.object({
    nyelvek: z.tuple([z.string(), z.string()]),
    par_elvalaszto: z.string(),
    lista_elvalaszto: z.string(),
    tartomany_jel: z.string(),
    kozelito_szo: z.string(),
    szazalek_jel: z.string(),
    datumformatum: z.string(),
    jarat_nev_sablon: z.object({ elsodleges: z.string(), masodlagos: z.string() }),
    jarat_hivatkozas_sablon: z.string(),
    frissites_sablon: z.object({ elsodleges: z.string(), masodlagos: z.string() }),
    reszlet_cimke: z.record(z.string(), z.object({ elsodleges: z.string(), masodlagos: z.string() })),
    meta_elvalaszto: z.string(),
  }),
  szovegek: z.object({
    forras_nyilatkozat: z.string(),
    forras_cimke: z.string(),
    sorozatkod: z.record(z.string(), z.string()),
  }),
  elrendezesek: z.record(z.string(), Elrendezes),
  /** a szabályrendszer márkaparaméterei (szabalyok.json „parameterek” nevei) */
  szabaly_parameterek: z.record(z.string(), z.unknown()).default({}),
});
export type Marka = z.infer<typeof Marka>;
