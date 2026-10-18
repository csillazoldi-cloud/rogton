// A befogadó alkalmazás adatbázisa — ALAPTERV 3. pont: fiók, szervezet, tagság gazdája az apps/web.
// Minden ügyféladatot hordozó tábla első oszlopa a szervezet azonosítója, és az adatbázis maga
// kényszeríti ki az elválasztást (sorszintű védelem) — nem a program jóindulata.
import { sql } from "drizzle-orm";
import { pgTable, pgPolicy, uuid, text, timestamp, date, time, pgEnum, primaryKey, uniqueIndex, index, integer, jsonb, boolean, numeric, check } from "drizzle-orm/pg-core";

// NULLIF: egy lezárt tranzakció után a beállítás üres szöveg marad, nem NULL — az üres szövegből nem lesz uuid.
/** Az aktuális szervezet — szervezetKent(...) állítja be (set_config('app.szervezet_id')). */
const aktualisSzervezet = sql`nullif(current_setting('app.szervezet_id', true), '')::uuid`;
/** Az aktuális fiók — fiokKent(...) állítja be (set_config('app.fiok_id')). */
const aktualisFiok = sql`nullif(current_setting('app.fiok_id', true), '')::uuid`;

export const szerep = pgEnum("szerep", ["tulajdonos", "szerkeszto", "nezo"]);

/** Szervezet = az ügyfél: a fizetési és adatgazdai egység. */
export const szervezet = pgTable(
  "szervezet",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nev: text("nev").notNull(),
    letrehozva: timestamp("letrehozva", { withTimezone: true }).notNull().defaultNow(),
    // E-39: a szervezet havi AI-kerete USD-ben. NULL = az AI_HAVI_KERET_USD alapérték érvényes rá.
    aiKeretUsd: numeric("ai_keret_usd", { precision: 10, scale: 2 }),
    // F-5 (R-4): a szervezet AI-kapcsolója — hamis: egyetlen AI-hívás sem indul a szervezet nevében (AI_KIKAPCSOLVA), a háttérfutás is kihagyja.
    aiEngedelyezve: boolean("ai_engedelyezve").notNull().default(true),
    // F-2 (R-1 v3, D5): a munkatér pénzneme — EUR | USD | HUF | RON. Az összegek USD-ben mérve, a tárolt árfolyammal átszámítva (arfolyam tábla).
    penznem: text("penznem").notNull().default("EUR"),
    // F-7a (D-F35): a munkatér csomagja — F9-A9: a próbaidőszak csomagja a "radar" (volt: pilot)
    csomagKod: text("csomag_kod").notNull().default("radar"),
    /** R-13: a munkatér havi kreditje; NULL = az alap (ALAP_MUNKATER_HAVI) */
    kreditHavi: integer("kredit_havi"),
    /** VZ-2: a munkatér iparági képcsomagjai (pl. "kozlekedes" — a régi három közlekedési kép). Alapból egy sincs. */
    iparagiCsomagok: text("iparagi_csomagok").array().notNull().default(sql`'{}'::text[]`),
    /** VZ-3: a Képek legutóbb választott színváltozata (vilagos | szines | sotet | masodik | atmenet) */
    kepValtozat: text("kep_valtozat").notNull().default("vilagos"),
  },
  () => [
    pgPolicy("szervezet_sajat", {
      for: "all",
      to: "km_app",
      using: sql`id = ${aktualisSzervezet}`,
      withCheck: sql`id = ${aktualisSzervezet}`,
    }),
    // a saját tagságaimhoz tartozó szervezeteket (név) láthatom fiókként is
    pgPolicy("szervezet_tagkent", {
      for: "select",
      to: "km_app",
      using: sql`exists (select 1 from tagsag t where t.szervezet_id = szervezet.id and t.fiok_id = ${aktualisFiok})`,
    }),
  ],
).enableRLS();

/** Fiók = egy ember (e-mail + jelszó). Nem szervezethez kötött: egy fiók több szervezet tagja lehet. */
export const fiok = pgTable(
  "fiok",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(), // kisbetűsen tárolva, egyedi
    nev: text("nev").notNull(),
    jelszoHash: text("jelszo_hash").notNull(), // argon2id; üres = nem léphet be (teszt-fiók)
    // E-13: rendszergazda-jelölés — a KÖZÖS alap (téma, később feliratok) szerkesztője. Egyelőre egy ember (Vilmos);
    // a jelölést a RENDSZERGAZDA_EMAIL környezeti változó adja az első belépéskor, vagy SQL-lel állítható.
    rendszergazda: boolean("rendszergazda").notNull().default(false),
    // E-29c: a felület nyelve, amit ez a fiók választott (hu | ro | en). NULL = még nem váltott.
    // A HÁTTÉRBEN futó figyelés ebből tudja, milyen nyelven írja az AI az összefoglalót és az indoklást.
    nyelv: text("nyelv"),
    // E-50: felfüggesztés. NULL = aktív; időbélyeg = ekkor függesztették fel. A gépezet a belépési úton
    // van (hitelesites/index.ts): a belep() és az aktualisFiok() is elutasít, és a felfüggesztés törli a
    // fiók munkamenet-sorait — nem elég a jelölés, mert az élő munkamenet enélkül tovább él.
    felfuggesztve: timestamp("felfuggesztve", { withTimezone: true }),
    // F-2 (R-1 v3, D-F25): a fiók aktuális munkatere — tárolt választás; az aktualisFiok() ezt teszi a lista elejére. A hivatkozást a 0050 migráció adja.
    aktualisSzervezetId: uuid("aktualis_szervezet_id"),
    // E-50: mikor lépett be utoljára. KÜLÖN OSZLOP kell: a `munkamenet` csak az ÉLŐ munkameneteket tartja,
    // kilépéskor és lejáratkor törlődik a sor — belépési naplónak nem használható.
    utolsoBelepes: timestamp("utolso_belepes", { withTimezone: true }),
    // E-50: ember hozta létre, vagy gépi teszt. A Fiókok lap szűrője ezt olvassa; korábban csak az e-mail
    // címből lehetett találgatni, és a hat teszt-tartományból egy sem volt szabályba önthető. Vilmos döntése.
    eredet: text("eredet", { enum: ["ember", "gepi_teszt"] }).notNull().default("ember"),
    letrehozva: timestamp("letrehozva", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("fiok_email").on(t.email)],
);

/** Tagság = fiók ↔ szervezet, szereppel. Ügyféladat: szervezet szerint védett. */
export const tagsag = pgTable(
  "tagsag",
  {
    szervezetId: uuid("szervezet_id").notNull().references(() => szervezet.id, { onDelete: "cascade" }),
    fiokId: uuid("fiok_id").notNull().references(() => fiok.id, { onDelete: "cascade" }),
    szerep: szerep("szerep").notNull().default("nezo"),
    letrehozva: timestamp("letrehozva", { withTimezone: true }).notNull().defaultNow(),
    /** R-13: a tag havi kreditje (a tulajdonos adja); NULL = a ki nem osztott rész egyenlő része */
    kreditHavi: numeric("kredit_havi", { precision: 12, scale: 3 }),
  },
  (t) => [
    primaryKey({ columns: [t.szervezetId, t.fiokId] }),
    index("tagsag_fiok").on(t.fiokId),
    pgPolicy("tagsag_sajat_szervezet", {
      for: "all",
      to: "km_app",
      using: sql`szervezet_id = ${aktualisSzervezet}`,
      withCheck: sql`szervezet_id = ${aktualisSzervezet}`,
    }),
    // a saját tagságaimat fiókként is látom (melyik szervezetekhez tartozom)
    pgPolicy("tagsag_sajat_fiok", {
      for: "select",
      to: "km_app",
      using: sql`fiok_id = ${aktualisFiok}`,
    }),
  ],
).enableRLS();

/** Munkamenet = egy belépés. A sütiben véletlen token megy, itt csak a lenyomata (sha256) van. */
/**
 * F-3 (R-2): meghívó — egyszer használatos, hét napig érvényes jegy egy munkatérbe, a `@km/hozzaferes-core` szótára szerint.
 * A jegy MAGA sehol nem tárolódik, csak a lenyomata (a `jelszo_visszaallitas` mintájára). Az `allapot` kiadott | elfogadott |
 * visszavont — a „lejárt" SZÁMOLT (kiadott és most > lejar). Sorszintű védelem: a munkatér tagjai a saját munkaterük meghívóit
 * látják; a lenyomat szerinti keresés (elfogadásnál még nincs munkatér) a `meghivo_lenyomat_szerint()` SECURITY DEFINER függvényen át fut.
 */
export const meghivo = pgTable(
  "meghivo",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    szervezetId: uuid("szervezet_id").notNull().references(() => szervezet.id, { onDelete: "cascade" }),
    szerep: szerep("szerep").notNull(),
    email: text("email"),
    lenyomat: text("lenyomat").notNull(),
    letrehozta: uuid("letrehozta").notNull().references(() => fiok.id, { onDelete: "cascade" }), // a kiadóval mennek a meghívói (0046)
    letrehozva: timestamp("letrehozva", { withTimezone: true }).notNull().defaultNow(),
    lejar: timestamp("lejar", { withTimezone: true }).notNull(),
    allapot: text("allapot").notNull().default("kiadott"),
    elfogadta: uuid("elfogadta").references(() => fiok.id, { onDelete: "set null" }),
    elfogadva: timestamp("elfogadva", { withTimezone: true }),
    visszavonva: timestamp("visszavonva", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("meghivo_lenyomat").on(t.lenyomat),
    index("meghivo_szervezet").on(t.szervezetId),
    pgPolicy("meghivo_sajat_szervezet", {
      for: "all",
      to: "km_app",
      using: sql`szervezet_id = ${aktualisSzervezet}`,
      withCheck: sql`szervezet_id = ${aktualisSzervezet}`,
    }),
  ],
).enableRLS();

/** F-6 (R-6): az arculati fájlok META-adata; a bájtok a lemezen (FAJL_MAPPA/<szervezet_id>/<id>.<kit>). A típus a TARTALOMBÓL jön. */
export const arculatFajl = pgTable(
  "arculat_fajl",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    szervezetId: uuid("szervezet_id").notNull().references(() => szervezet.id, { onDelete: "cascade" }),
    nev: text("nev").notNull(),
    tipus: text("tipus").notNull(),
    meret: integer("meret").notNull(),
    cel: text("cel").notNull(),
    feltoltotte: uuid("feltoltotte").references(() => fiok.id, { onDelete: "set null" }),
    feltoltve: timestamp("feltoltve", { withTimezone: true }).notNull().defaultNow(),
    // R-16 K1 (0135, TERV 1.1): a logó helye (NULL egy logó-soron = vilagos; más célnál mindig NULL), ki tette a fájlt
    // („gep” = a gép készítette, K6), és a böngészőben számolt logó-elemzés (@km/arculat-core LogoElemzes).
    logoValtozat: text("logo_valtozat", { enum: ["vilagos", "sotet", "egyszinu", "negyzetes"] }),
    eredet: text("eredet", { enum: ["feltoltes", "honlap", "gep"] }).notNull().default("feltoltes"),
    elemzes: jsonb("elemzes"),
  },
  (t) => [
    index("arculat_fajl_szervezet").on(t.szervezetId),
    // c30 F9 (0178): az album kvótájához és sebességkorlátjához (munkatér + cél)
    index("arculat_fajl_szervezet_cel").on(t.szervezetId, t.cel),
    check("arculat_fajl_logo_valtozat", sql`${t.logoValtozat} IN ('vilagos', 'sotet', 'egyszinu', 'negyzetes')`),
    check("arculat_fajl_eredet", sql`${t.eredet} IN ('feltoltes', 'honlap', 'gep')`),
    pgPolicy("arculat_fajl_sajat_szervezet", { for: "all", to: "km_app", using: sql`szervezet_id = ${aktualisSzervezet}`, withCheck: sql`szervezet_id = ${aktualisSzervezet}` }),
  ],
).enableRLS();

/**
 * F-5 (R-4): az eseménynapló — a `@km/esemeny-core` szótára szerint. `szervezet_id` NULL = fiók- vagy rendszerszintű esemény
 * (belépés, jelszóváltás, mentés kimaradt). A km_app a saját szervezete sorait ÉS a szervezet nélküli sorokat éri el (a naplót
 * a `lista()` szervezetre szűri; a szervezet nélkülieket csak a rendszergazda végpontja adja ki).
 */
export const esemeny = pgTable(
  "esemeny",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    szervezetId: uuid("szervezet_id").references(() => szervezet.id, { onDelete: "cascade" }),
    fajta: text("fajta").notNull(),
    sulyossag: text("sulyossag").notNull(),
    fiokId: uuid("fiok_id").references(() => fiok.id, { onDelete: "set null" }),
    ido: timestamp("ido", { withTimezone: true }).notNull(),
    adat: jsonb("adat").notNull().default({}),
  },
  (t) => [
    index("esemeny_szervezet_ido").on(t.szervezetId, t.ido),
    pgPolicy("esemeny_sajat_vagy_rendszer", {
      for: "all",
      to: "km_app",
      using: sql`szervezet_id IS NULL OR szervezet_id = ${aktualisSzervezet}`,
      withCheck: sql`szervezet_id IS NULL OR szervezet_id = ${aktualisSzervezet}`,
    }),
  ],
).enableRLS();

/** F-5: az értesítés két szintje — `kozos` (szervezet_id NULL, a rendszergazda állítja) és `szervezeti` (a tulajdonos). Egy sor szintenként
 *  és szervezetenként (egyedi index a migrációban: (szint, coalesce(szervezet_id, nulla-uuid))). A km_app a közöset olvassa és írja is
 *  (a rendszergazda végpontja a kapun át), a szervezetit csak a sajátját. */
export const ertesitesBeallitas = pgTable(
  "ertesites_beallitas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    szint: text("szint").notNull(),
    szervezetId: uuid("szervezet_id").references(() => szervezet.id, { onDelete: "cascade" }),
    adat: jsonb("adat").notNull().default({}),
    frissitve: timestamp("frissitve", { withTimezone: true }).notNull().defaultNow(),
  },
  () => [
    pgPolicy("ertesites_beallitas_sajat_vagy_kozos", {
      for: "all",
      to: "km_app",
      using: sql`szervezet_id IS NULL OR szervezet_id = ${aktualisSzervezet}`,
      withCheck: sql`szervezet_id IS NULL OR szervezet_id = ${aktualisSzervezet}`,
    }),
  ],
).enableRLS();

export const munkamenet = pgTable(
  "munkamenet",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fiokId: uuid("fiok_id").notNull().references(() => fiok.id, { onDelete: "cascade" }),
    tokenLenyomat: text("token_lenyomat").notNull(),
    lejar: timestamp("lejar", { withTimezone: true }).notNull(),
    letrehozva: timestamp("letrehozva", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("munkamenet_token").on(t.tokenLenyomat), index("munkamenet_fiok").on(t.fiokId)],
);

// ---------------------------------------------------------------------------
// Megjelenés és feliratok (E-4) — a host adata, nem ügyféladat (nincs sorszintű védelem).
// ---------------------------------------------------------------------------

/** Egy témaverzió állapota (E-13, v6: tervezet → alkalmazás): legfeljebb egy tervezet és pontosan egy alkalmazott. */
export const temaAllapot = pgEnum("tema_allapot", ["tervezet", "alkalmazott", "korabbi"]);

/**
 * Téma = a KÖZÖS ALAP: teljes, verziózott tokenkészlet (km-theme/2). A rendszergazda állítja. R-08 szerinti verziózás:
 * az alkalmazás új verzió, a korábbi megmarad és visszaállítható (új tervezetként). (E-4: aktiv; E-13: allapot.)
 */
export const tema = pgTable(
  "tema",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nev: text("nev").notNull(),
    verzio: integer("verzio").notNull(),
    definicio: jsonb("definicio").notNull(), // TemaDefinicio (@km/design-system) — a séma ellenőrzi betöltéskor
    semaKod: text("sema_kod"), // R-10: a mentett séma kódja (ejkek | vilagos | sotet), nullable
    allapot: temaAllapot("allapot").notNull().default("tervezet"),
    letrehozva: timestamp("letrehozva", { withTimezone: true }).notNull().defaultNow(),
    alkalmazva: timestamp("alkalmazva", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("tema_nev_verzio").on(t.nev, t.verzio),
    uniqueIndex("tema_egy_alkalmazott").on(t.allapot).where(sql`allapot = 'alkalmazott'`),
    uniqueIndex("tema_egy_tervezet").on(t.allapot).where(sql`allapot = 'tervezet'`),
  ],
);

/**
 * Szervezeti téma-felülírás (D-09, E-13) — ügyféladat: a szervezet tulajdonosa állítja, sorszintű védelemmel.
 * Csak a közös alaptól ELTÉRŐ tokenek vannak benne (TemaFelulirasok); ami nincs itt, a közösből jön.
 * Verziózva ugyanúgy: legfeljebb egy tervezet, legfeljebb egy alkalmazott, a többi korábbi.
 */
export const szervezetTema = pgTable(
  "szervezet_tema",
  {
    szervezetId: uuid("szervezet_id").notNull().references(() => szervezet.id, { onDelete: "cascade" }),
    verzio: integer("verzio").notNull(),
    felulirasok: jsonb("felulirasok").notNull(), // TemaFelulirasok (@km/design-system)
    semaKod: text("sema_kod"), // R-10: a mentett séma kódja (ejkek | vilagos | sotet), nullable
    allapot: temaAllapot("allapot").notNull().default("tervezet"),
    letrehozva: timestamp("letrehozva", { withTimezone: true }).notNull().defaultNow(),
    alkalmazva: timestamp("alkalmazva", { withTimezone: true }),
  },
  (t) => [
    primaryKey({ columns: [t.szervezetId, t.verzio] }),
    uniqueIndex("szervezet_tema_egy_alkalmazott").on(t.szervezetId).where(sql`allapot = 'alkalmazott'`),
    uniqueIndex("szervezet_tema_egy_tervezet").on(t.szervezetId).where(sql`allapot = 'tervezet'`),
    pgPolicy("szervezet_tema_sajat", {
      for: "all",
      to: "km_app",
      using: sql`szervezet_id = ${aktualisSzervezet}`,
      withCheck: sql`szervezet_id = ${aktualisSzervezet}`,
    }),
  ],
).enableRLS();

/** Felirat = egy felületi szöveg, stabil kulccsal, nyelvenként (R-09, R-14). A magyar az eredeti. */
export const felirat = pgTable(
  "felirat",
  {
    kulcs: text("kulcs").notNull(),
    nyelv: text("nyelv").notNull(), // hu | ro | en
    szoveg: text("szoveg").notNull(),
    frissitve: timestamp("frissitve", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.kulcs, t.nyelv] })],
);

/**
 * A KÖZÖS feliratok felülírásai (E-16, D-09): a rendszergazda állítja; csak a csomag alapjától (a `felirat` tábla) eltérő
 * szövegek, nyelvenként. Verziózva ugyanúgy, mint a téma. A host adata, nincs sorszintű védelem.
 */
export const kozosFeliratVerzio = pgTable(
  "kozos_felirat_verzio",
  {
    verzio: integer("verzio").primaryKey(),
    felulirasok: jsonb("felulirasok").notNull(), // FeliratFelulirasok (@km/design-system)
    allapot: temaAllapot("allapot").notNull().default("tervezet"),
    letrehozva: timestamp("letrehozva", { withTimezone: true }).notNull().defaultNow(),
    alkalmazva: timestamp("alkalmazva", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("kozos_felirat_egy_alkalmazott").on(t.allapot).where(sql`allapot = 'alkalmazott'`),
    uniqueIndex("kozos_felirat_egy_tervezet").on(t.allapot).where(sql`allapot = 'tervezet'`),
  ],
);

/** A SZERVEZETI feliratok felülírásai (E-16, D-09) — ügyféladat, sorszintű védelemmel; csak az eltérő szövegek. */
export const szervezetFeliratVerzio = pgTable(
  "szervezet_felirat_verzio",
  {
    szervezetId: uuid("szervezet_id").notNull().references(() => szervezet.id, { onDelete: "cascade" }),
    verzio: integer("verzio").notNull(),
    felulirasok: jsonb("felulirasok").notNull(),
    allapot: temaAllapot("allapot").notNull().default("tervezet"),
    letrehozva: timestamp("letrehozva", { withTimezone: true }).notNull().defaultNow(),
    alkalmazva: timestamp("alkalmazva", { withTimezone: true }),
  },
  (t) => [
    primaryKey({ columns: [t.szervezetId, t.verzio] }),
    uniqueIndex("szervezet_felirat_egy_alkalmazott").on(t.szervezetId).where(sql`allapot = 'alkalmazott'`),
    uniqueIndex("szervezet_felirat_egy_tervezet").on(t.szervezetId).where(sql`allapot = 'tervezet'`),
    pgPolicy("szervezet_felirat_sajat", {
      for: "all",
      to: "km_app",
      using: sql`szervezet_id = ${aktualisSzervezet}`,
      withCheck: sql`szervezet_id = ${aktualisSzervezet}`,
    }),
  ],
).enableRLS();

// ---------------------------------------------------------------------------
// Onboarding-piszkozat (E-6) — ügyféladat: szervezethez kötve, sorszintű védelemmel.
// ---------------------------------------------------------------------------
export const onboardingPiszkozat = pgTable(
  "onboarding_piszkozat",
  {
    szervezetId: uuid("szervezet_id").primaryKey().references(() => szervezet.id, { onDelete: "cascade" }),
    adatok: jsonb("adatok").notNull(), // OnboardingPiszkozat (@km/contracts) — betöltéskor a séma ellenőrzi
    frissitve: timestamp("frissitve", { withTimezone: true }).notNull().defaultNow(),
  },
  () => [
    pgPolicy("piszkozat_sajat_szervezet", {
      for: "all",
      to: "km_app",
      using: sql`szervezet_id = ${aktualisSzervezet}`,
      withCheck: sql`szervezet_id = ${aktualisSzervezet}`,
    }),
  ],
).enableRLS();


// ---------------------------------------------------------------------------
// A szervezet jóváhagyott profilja (E-9, R-06): a piszkozat jóváhagyáskor ide kerül, a piszkozat törlődik.
// A rendszer minden eszköze ezt a közös profilt használja. Egy sor szervezetenként; a régi jóváhagyások
// története később (verziózás a központi profilban) — most az arculat verziói a jsonb-ben vannak.
// ---------------------------------------------------------------------------
export const szervezetProfil = pgTable(
  "szervezet_profil",
  {
    szervezetId: uuid("szervezet_id").primaryKey().references(() => szervezet.id, { onDelete: "cascade" }),
    adatok: jsonb("adatok").notNull(), // SzervezetProfil (@km/contracts) — betöltéskor a séma ellenőrzi
    jovahagyva: timestamp("jovahagyva", { withTimezone: true }).notNull().defaultNow(),
    jovahagyta: uuid("jovahagyta").references(() => fiok.id, { onDelete: "set null" }),
    frissitve: timestamp("frissitve", { withTimezone: true }).notNull().defaultNow(),
  },
  () => [
    pgPolicy("profil_sajat_szervezet", {
      for: "all",
      to: "km_app",
      using: sql`szervezet_id = ${aktualisSzervezet}`,
      withCheck: sql`szervezet_id = ${aktualisSzervezet}`,
    }),
  ],
).enableRLS();

// ---------------------------------------------------------------------------
// R-11/B1b: a szervezet iránytűje (D-F36) — a célok, a vízió, az értékek, az időszakok,
// a tolni/tiltott szavak és a kerülendő témák. A `tervezet` a szerkesztés alatti piszkozat,
// a `jovahagyott` a jóváhagyott pillanatkép; a `verziok` a jóváhagyott verziók előzménye.
// Ebből dolgozik az összhangjelzés: minden generált vagy javasolt tartalmat ehhez mér.
// Egy sor szervezetenként; a sorszintű védelem a profil mintájára működik.
// ---------------------------------------------------------------------------
export const szervezetIranytu = pgTable(
  "szervezet_iranytu",
  {
    szervezetId: uuid("szervezet_id").primaryKey().references(() => szervezet.id, { onDelete: "cascade" }),
    tervezet: jsonb("tervezet"), // IranytuSema (@km/contracts) — betöltéskor a séma ellenőrzi
    jovahagyott: jsonb("jovahagyott"), // IranytuSema (@km/contracts) — a jóváhagyott pillanatkép
    verziok: jsonb("verziok").notNull().default(sql`'[]'::jsonb`), // IranytuVerzioSema[] — a jóváhagyott verziók előzménye
    verzio: integer("verzio").notNull().default(0),
    jovahagyva: timestamp("jovahagyva", { withTimezone: true }),
    jovahagyta: uuid("jovahagyta").references(() => fiok.id, { onDelete: "set null" }),
    // A jóváhagyó NEVE a soron: a fiók később törölhető, a verziótörténet attól még olvasható marad.
    jovahagytaNev: text("jovahagyta_nev").notNull().default(""),
    frissitve: timestamp("frissitve", { withTimezone: true }).notNull().defaultNow(),
  },
  () => [
    pgPolicy("iranytu_sajat_szervezet", {
      for: "all",
      to: "km_app",
      using: sql`szervezet_id = ${aktualisSzervezet}`,
      withCheck: sql`szervezet_id = ${aktualisSzervezet}`,
    }),
  ],
).enableRLS();

// VZ-2 (2026-09-24): a Képek hét helyzetének példaszövege, a gép írta a cég profiljából. Egy sor szervezetenként;
// az `ujj` a forrás (profil + Iránytű „tolni”) ujjlenyomata — ha eltér, a szöveg elavult. Sorszintű védelem a szervezet_iranytu mintájára.
export const kepPelda = pgTable(
  "kep_pelda",
  {
    szervezetId: uuid("szervezet_id").primaryKey().references(() => szervezet.id, { onDelete: "cascade" }),
    nyelv: text("nyelv").notNull(),
    ujj: text("ujj").notNull(),
    adat: jsonb("adat").notNull(),
    frissitve: timestamp("frissitve", { withTimezone: true }).notNull().defaultNow(),
  },
  () => [
    pgPolicy("kep_pelda_sajat_szervezet", {
      for: "all",
      to: "km_app",
      using: sql`szervezet_id = ${aktualisSzervezet}`,
      withCheck: sql`szervezet_id = ${aktualisSzervezet}`,
    }),
  ],
).enableRLS();

// R-15 T8 (2026-09-26): a heti haladás számláló eseményei. Egy sor = egy „kep_letoltve” esemény; a hétfő 00:00-tól
// (Europe/Bucharest) számolunk. Sorszintű védelem a kep_pelda mintájára.
export const haladEsemeny = pgTable(
  "halad_esemeny",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    szervezetId: uuid("szervezet_id").notNull().references(() => szervezet.id, { onDelete: "cascade" }),
    fajta: text("fajta").notNull(),
    ido: timestamp("ido", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("halad_esemeny_szervezet_ido_idx").on(t.szervezetId, t.ido),
    pgPolicy("halad_esemeny_sajat_szervezet", {
      for: "all",
      to: "km_app",
      using: sql`szervezet_id = ${aktualisSzervezet}`,
      withCheck: sql`szervezet_id = ${aktualisSzervezet}`,
    }),
  ],
).enableRLS();

// R-11/A1: a Posztszöveg munka táblája. Egy munka = egy gondolat; a szövegek (felület × nyelv)
// és az összhangvizsgálat eredménye jsonb-ban. Sorszintű védelem a szervezet_iranytu mintájára.
export const posztMunka = pgTable(
  "poszt_munka",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    szervezetId: uuid("szervezet_id").notNull().references(() => szervezet.id, { onDelete: "cascade" }),
    cim: text("cim").notNull(),
    forras: jsonb("forras").notNull(),
    szovegek: jsonb("szovegek").notNull().default([]),
    osszhang: jsonb("osszhang"),
    pirosVeglegesites: boolean("piros_veglegesites").notNull().default(false),
    letrehozva: timestamp("letrehozva", { withTimezone: true }).notNull().defaultNow(),
    frissitve: timestamp("frissitve", { withTimezone: true }).notNull().defaultNow(),
    letrehozta: uuid("letrehozta").references(() => fiok.id, { onDelete: "set null" }),
    // R-18 3. kör · Naptár (0166): a kész poszt napja — ÉÉÉÉ-HH-NN szövegként (Bukarest szerinti nap), és mikor tette ki
    tervezettNap: date("tervezett_nap", { mode: "string" }),
    javasoltNap: date("javasolt_nap", { mode: "string" }),
    kiteve: timestamp("kiteve", { withTimezone: true }),
  },
  (t) => [
    index("poszt_munka_szervezet_frissitve_idx").on(t.szervezetId, t.frissitve),
    pgPolicy("poszt_munka_sajat_szervezet", {
      for: "all",
      to: "km_app",
      using: sql`szervezet_id = ${aktualisSzervezet}`,
      withCheck: sql`szervezet_id = ${aktualisSzervezet}`,
    }),
  ],
).enableRLS();



// ---------------------------------------------------------------------------
// AI-hívások mérése (E-7) — ALAPTERV 5.: minden hívás költsége mérve és tárolva.
// ---------------------------------------------------------------------------
/** Egy AI-hívás — ügyféladat (szervezethez kötve, védett). */
export const aiHivas = pgTable(
  "ai_hivas",
  {
    szervezetId: uuid("szervezet_id").notNull().references(() => szervezet.id, { onDelete: "cascade" }),
    id: uuid("id").primaryKey().defaultRandom(),
    feladat: text("feladat").notNull(),
    szolgaltato: text("szolgaltato").notNull(),
    modell: text("modell").notNull(),
    tokenekBe: integer("tokenek_be").notNull(),
    tokenekKi: integer("tokenek_ki").notNull(),
    becsultUsd: numeric("becsult_usd", { precision: 10, scale: 6 }).notNull(),
    idoMs: integer("ido_ms").notNull(),
    allapot: text("allapot").notNull(), // ok | hiba
    hibaKod: text("hiba_kod"),
    letrehozva: timestamp("letrehozva", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("ai_hivas_szervezet_ido").on(t.szervezetId, t.letrehozva),
    pgPolicy("ai_hivas_sajat_szervezet", { for: "all", to: "km_app", using: sql`szervezet_id = ${aktualisSzervezet}`, withCheck: sql`szervezet_id = ${aktualisSzervezet}` }),
  ],
).enableRLS();

/** Havi összköltség a rendszer szintjén (a keret ellenőrzéséhez) — a host adata, nincs védelem. */
export const aiKoltsegHonap = pgTable("ai_koltseg_honap", {
  honap: text("honap").primaryKey(), // "2026-09"
  becsultUsd: numeric("becsult_usd", { precision: 12, scale: 6 }).notNull().default("0"),
  hivasok: integer("hivasok").notNull().default(0),
  frissitve: timestamp("frissitve", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// A Hírfigyelő táblái (E-20) — minden ügyféladat szervezethez kötve, sorszintű védelemmel (a modul saját táblái, ALAPTERV 3.).
// ---------------------------------------------------------------------------


export const hfBeallitasVerzio = pgTable(
  "hf_beallitas_verzio",
  {
    szervezetId: uuid("szervezet_id").notNull().references(() => szervezet.id, { onDelete: "cascade" }),
    verzio: integer("verzio").notNull(),
    allapot: text("allapot", { enum: ["aktiv", "korabbi"] }).notNull(),
    eredet: text("eredet", { enum: ["kezi", "ai_elokeszites", "ai_javaslat", "visszaallitas"] }).notNull(),
    beallitas: jsonb("beallitas").notNull(),
    letrehozva: timestamp("letrehozva", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.szervezetId, t.verzio] }),
    uniqueIndex("hf_beallitas_egy_aktiv").on(t.szervezetId).where(sql`allapot = 'aktiv'`),
    pgPolicy("hf_beallitas_sajat", {
      for: "all",
      to: "km_app",
      using: sql`szervezet_id = ${aktualisSzervezet}`,
      withCheck: sql`szervezet_id = ${aktualisSzervezet}`,
    }),
  ],
).enableRLS();

export const hfTervezet = pgTable(
  "hf_tervezet",
  {
    szervezetId: uuid("szervezet_id").notNull().references(() => szervezet.id, { onDelete: "cascade" }),
    fiokId: uuid("fiok_id").notNull(),
    beallitas: jsonb("beallitas").notNull(),
    frissitve: timestamp("frissitve", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.szervezetId, t.fiokId] }),
    pgPolicy("hf_tervezet_sajat", {
      for: "all",
      to: "km_app",
      using: sql`szervezet_id = ${aktualisSzervezet}`,
      withCheck: sql`szervezet_id = ${aktualisSzervezet}`,
    }),
  ],
).enableRLS();

export const hfForras = pgTable(
  "hf_forras",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    szervezetId: uuid("szervezet_id").notNull().references(() => szervezet.id, { onDelete: "cascade" }),
    cim: text("cim").notNull(),
    tipus: text("tipus", { enum: ["rss", "weboldal"] }),
    eredet: text("eredet", { enum: ["kezi", "ai_javaslat"] }).notNull(),
    allapot: text("allapot", { enum: ["ellenorzes_alatt", "hasznalhato", "korlatozott", "hibas", "nem_tamogatott"] }).notNull(),
    ellenorzott: boolean("ellenorzott").notNull().default(false),
    utolsoSikeres: timestamp("utolso_sikeres", { withTimezone: true }),
    hibaOk: text("hiba_ok"),
  },
  (t) => [
    index("hf_forras_szervezet_idx").on(t.szervezetId),
    pgPolicy("hf_forras_sajat", {
      for: "all",
      to: "km_app",
      using: sql`szervezet_id = ${aktualisSzervezet}`,
      withCheck: sql`szervezet_id = ${aktualisSzervezet}`,
    }),
  ],
).enableRLS();

export const hfFutas = pgTable(
  "hf_futas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    szervezetId: uuid("szervezet_id").notNull().references(() => szervezet.id, { onDelete: "cascade" }),
    szabalyVerzio: integer("szabaly_verzio").notNull(),
    kezdet: timestamp("kezdet", { withTimezone: true }).notNull(),
    veg: timestamp("veg", { withTimezone: true }),
    allapot: text("allapot", { enum: ["indul", "fut", "kesz", "reszleges", "hiba", "ai_fuggoben"] }).notNull(),
    ujTalalatok: integer("uj_talalatok").notNull().default(0),
    hibasForrasok: jsonb("hibas_forrasok").notNull().default([]),
    proba: boolean("proba").notNull().default(false),
  },
  (t) => [
    index("hf_futas_szervezet_idx").on(t.szervezetId),
    pgPolicy("hf_futas_sajat", {
      for: "all",
      to: "km_app",
      using: sql`szervezet_id = ${aktualisSzervezet}`,
      withCheck: sql`szervezet_id = ${aktualisSzervezet}`,
    }),
  ],
).enableRLS();

export const hfKivonat = pgTable(
  "hf_kivonat",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    szervezetId: uuid("szervezet_id").notNull().references(() => szervezet.id, { onDelete: "cascade" }),
    forrasId: uuid("forras_id").notNull(),
    cim: text("cim").notNull(),
    url: text("url").notNull(),
    kanonikusUrl: text("kanonikus_url").notNull(),
    megjelenes: timestamp("megjelenes", { withTimezone: true }),
    begyujtes: timestamp("begyujtes", { withTimezone: true }).notNull(),
    szoveg: text("szoveg").notNull(),
    csonkolt: boolean("csonkolt").notNull().default(false),
    ujjlenyomat: text("ujjlenyomat").notNull(),
    nyelv: text("nyelv"),
    lejar: timestamp("lejar", { withTimezone: true }).notNull(),
  },
  (t) => [
    uniqueIndex("hf_kivonat_szervezet_kanonikus").on(t.szervezetId, t.kanonikusUrl),
    index("hf_kivonat_szervezet_idx").on(t.szervezetId),
    pgPolicy("hf_kivonat_sajat", {
      for: "all",
      to: "km_app",
      using: sql`szervezet_id = ${aktualisSzervezet}`,
      withCheck: sql`szervezet_id = ${aktualisSzervezet}`,
    }),
  ],
).enableRLS();

export const hfEsemeny = pgTable(
  "hf_esemeny",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    szervezetId: uuid("szervezet_id").notNull().references(() => szervezet.id, { onDelete: "cascade" }),
    foTalalatId: uuid("fo_talalat_id").notNull(),
    talalatIds: jsonb("talalat_ids").notNull(),
    letrehozva: timestamp("letrehozva", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("hf_esemeny_szervezet_idx").on(t.szervezetId),
    pgPolicy("hf_esemeny_sajat", {
      for: "all",
      to: "km_app",
      using: sql`szervezet_id = ${aktualisSzervezet}`,
      withCheck: sql`szervezet_id = ${aktualisSzervezet}`,
    }),
  ],
).enableRLS();

export const hfTalalat = pgTable(
  "hf_talalat",
  {
    id: uuid("id").primaryKey(),
    szervezetId: uuid("szervezet_id").notNull().references(() => szervezet.id, { onDelete: "cascade" }),
    esemenyId: uuid("esemeny_id").notNull(),
    kivonatId: uuid("kivonat_id").notNull(),
    ertekeles: jsonb("ertekeles"),
    ertekelesAllapot: text("ertekeles_allapot", { enum: ["fuggoben", "kesz", "keret_kimerult"] }).notNull(),
    megtekintes: text("megtekintes", { enum: ["uj", "megtekintett"] }).notNull().default("uj"),
    jeloles: text("jeloles", { enum: ["nincs", "mentett", "elrejtett"] }).notNull().default("nincs"),
    tartalomotlet: jsonb("tartalomotlet"), // E-23: csak kérésre készül
    letrehozva: timestamp("letrehozva", { withTimezone: true }).notNull().defaultNow(),
    futasId: uuid("futas_id").notNull(),
  },
  (t) => [
    index("hf_talalat_szervezet_idx").on(t.szervezetId),
    pgPolicy("hf_talalat_sajat", {
      for: "all",
      to: "km_app",
      using: sql`szervezet_id = ${aktualisSzervezet}`,
      withCheck: sql`szervezet_id = ${aktualisSzervezet}`,
    }),
  ],
).enableRLS();

export const hfVisszajelzes = pgTable(
  "hf_visszajelzes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    szervezetId: uuid("szervezet_id").notNull().references(() => szervezet.id, { onDelete: "cascade" }),
    talalatId: uuid("talalat_id").notNull(),
    fajta: text("fajta", { enum: ["fontos", "nem_relevans"] }).notNull(),
    okok: jsonb("okok").notNull(),
    sajatIndok: text("sajat_indok").notNull().default(""),
    letrehozva: timestamp("letrehozva", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("hf_visszajelzes_szervezet_idx").on(t.szervezetId),
    pgPolicy("hf_visszajelzes_sajat", {
      for: "all",
      to: "km_app",
      using: sql`szervezet_id = ${aktualisSzervezet}`,
      withCheck: sql`szervezet_id = ${aktualisSzervezet}`,
    }),
  ],
).enableRLS();

export const hfJavaslat = pgTable(
  "hf_javaslat",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    szervezetId: uuid("szervezet_id").notNull().references(() => szervezet.id, { onDelete: "cascade" }),
    szabalyVerzio: integer("szabaly_verzio").notNull(),
    javasolt: jsonb("javasolt").notNull(),
    miAlapjan: jsonb("mi_alapjan").notNull(),
    indoklas: text("indoklas").notNull(),
    varhatoHatas: text("varhato_hatas").notNull(),
    profilErintett: boolean("profil_erintett").notNull().default(false),
    allapot: text("allapot", { enum: ["fuggo", "kiprobalt", "elfogadva", "elvetve"] }).notNull(),
    mintaId: uuid("minta_id"),
    letrehozva: timestamp("letrehozva", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("hf_javaslat_szervezet_idx").on(t.szervezetId),
    pgPolicy("hf_javaslat_sajat", {
      for: "all",
      to: "km_app",
      using: sql`szervezet_id = ${aktualisSzervezet}`,
      withCheck: sql`szervezet_id = ${aktualisSzervezet}`,
    }),
  ],
).enableRLS();

export const hfMinta = pgTable(
  "hf_minta",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    szervezetId: uuid("szervezet_id").notNull().references(() => szervezet.id, { onDelete: "cascade" }),
    szabalyVerzio: integer("szabaly_verzio").notNull(),
    talalatIds: jsonb("talalat_ids").notNull(),
    letrehozva: timestamp("letrehozva", { withTimezone: true }).notNull().defaultNow(),
    lejar: timestamp("lejar", { withTimezone: true }).notNull(),
  },
  (t) => [
    index("hf_minta_szervezet_idx").on(t.szervezetId),
    pgPolicy("hf_minta_sajat", {
      for: "all",
      to: "km_app",
      using: sql`szervezet_id = ${aktualisSzervezet}`,
      withCheck: sql`szervezet_id = ${aktualisSzervezet}`,
    }),
  ],
).enableRLS();

// ---------------------------------------------------------------------------
// A Hírfigyelő várólistája (E-22) — HOST-szintű tábla (mint az ai_koltseg_honap):
// NINCS sorszintű védelem, a futtató minden szervezet sorát látja. A km_app szerep
// a saját szervezetén kívül a várólistát is kezeli (a futtató a rendszer nevében).
export const hfSor = pgTable(
  "hf_sor",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    szervezetId: uuid("szervezet_id")
      .notNull()
      .references(() => szervezet.id, { onDelete: "cascade" }),
    fajta: text("fajta", { enum: ["futas", "ertekeles_ujra", "napi", "kiprobal"] }).notNull(),
    adat: jsonb("adat").notNull().default({}),
    allapot: text("allapot", { enum: ["var", "fut", "kesz", "hiba"] }).notNull().default("var"),
    kiserlet: integer("kiserlet").notNull().default(0),
    letrehozva: timestamp("letrehozva", { withTimezone: true }).notNull().defaultNow(),
    kezdve: timestamp("kezdve", { withTimezone: true }),
    vege: timestamp("vege", { withTimezone: true }),
    hibaOk: text("hiba_ok"),
    eredmeny: jsonb("eredmeny"),
    haladas: jsonb("haladas"), // F9-A3
  },
  (t) => [
    index("hf_sor_allapot_letrehozva_idx").on(t.allapot, t.letrehozva),
  ],
);

// ---------------------------------------------------------------------------
// Belépési védelem (E-34) — HOST-szintű táblák, sorszintű védelem NÉLKÜL.
// D-17 (2026-09-08): a regisztráció nyitva marad, ezért a sebességkorlát A FŐ VÉDELEM.
// A kísérletnapló egyben HOZZÁFÉRÉSNAPLÓ is: ki, mikor, honnan próbált belépni.
// ---------------------------------------------------------------------------
export const belepesiKiserlet = pgTable(
  "belepesi_kiserlet",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // 0148: „visszajelzes” = a névtelen (belépés előtti) visszajelzés-beküldés számlálója (hitelesites/korlat.ts)
    fajta: text("fajta", { enum: ["belepes", "regisztracio", "jelszo_visszaallitas", "visszajelzes"] }).notNull(),
    /** A megcélzott e-mail kisbetűsen, ha volt a kérésben. A fiók létezését ez NEM árulja el. */
    email: text("email"),
    /** A kérő címe, ahogy a kiszolgáló látta; ismeretlen esetén "ismeretlen". */
    cim: text("cim").notNull(),
    sikeres: boolean("sikeres").notNull(),
    ido: timestamp("ido", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("belepesi_kiserlet_email_ido_idx").on(t.email, t.ido),
    index("belepesi_kiserlet_cim_ido_idx").on(t.cim, t.ido),
    index("belepesi_kiserlet_ido_idx").on(t.ido),
  ],
);

/** Egyszer használatos, lejáró jelszó-visszaállító jegy. A jegyet magát SEHOL nem tároljuk, csak a lenyomatát. */
export const jelszoVisszaallitas = pgTable(
  "jelszo_visszaallitas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fiokId: uuid("fiok_id")
      .notNull()
      .references(() => fiok.id, { onDelete: "cascade" }),
    jegyLenyomat: text("jegy_lenyomat").notNull(),
    lejar: timestamp("lejar", { withTimezone: true }).notNull(),
    felhasznalva: timestamp("felhasznalva", { withTimezone: true }),
    /** Melyik rendszergazda adta ki — a naplózhatóság miatt. */
    kiadta: uuid("kiadta"),
    letrehozva: timestamp("letrehozva", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("jelszo_visszaallitas_jegy").on(t.jegyLenyomat),
    index("jelszo_visszaallitas_fiok").on(t.fiokId),
  ],
);

/**
 * F-2 (R-1 v3, D-F22): a tárolt árfolyam — egy USD ennyi egység. KÖZÖS adat (nem szervezeti), ezért nincs sorszintű
 * védelem; a rendszergazda állítja, minden munkatér ugyanazt használja. Élő lekérés nincs. A kezdőértékeket a 0050 migráció adja.
 */
export const arfolyam = pgTable("arfolyam", {
  penznem: text("penznem").primaryKey(),
  egyUsd: numeric("egy_usd", { precision: 12, scale: 6 }).notNull(),
  frissitve: timestamp("frissitve", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// F-5b (R-4, D-F33): a fiók-szintű értesítés — kit hogyan érjenek el. Fiók-adat, nem ügyféladat: a fiók azonosítója a
// munkamenetből jön (a hívó adja), sorszintű védelem nincs (mint a munkamenetnél).
// ---------------------------------------------------------------------------
/** A fiók kapcsolói (`adat`: SajatBeallitas — a hat esemény és a felületi csatorna) és a „mind olvasott" vízjele. */
export const ertesitesFiok = pgTable("ertesites_fiok", {
  fiokId: uuid("fiok_id").primaryKey().references(() => fiok.id, { onDelete: "cascade" }),
  adat: jsonb("adat").notNull().default({}),
  /** ennél nem újabb esemény olvasottnak számít — a „Mind olvasottnak jelölöm" ezt állítja */
  olvasvaIg: timestamp("olvasva_ig", { withTimezone: true }),
  frissitve: timestamp("frissitve", { withTimezone: true }).notNull().defaultNow(),
});

/** Soronkénti olvasott-jelölés: a sor megnyitása írja. */
export const ertesitesOlvasott = pgTable(
  "ertesites_olvasott",
  {
    fiokId: uuid("fiok_id").notNull().references(() => fiok.id, { onDelete: "cascade" }),
    esemenyId: uuid("esemeny_id").notNull().references(() => esemeny.id, { onDelete: "cascade" }),
    ido: timestamp("ido", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.fiokId, t.esemenyId] })],
);

// ---------------------------------------------------------------------------
// F-7a (D-F35): csomagok — host-adat (nincs sorszintű védelem), a km_app csak olvassa. Ár és pénznem a pilotban NULL.
// ---------------------------------------------------------------------------
export const csomag = pgTable("csomag", {
  kod: text("kod").primaryKey(),
  modulok: text("modulok").array().notNull().default([]),
  arHavi: numeric("ar_havi", { precision: 10, scale: 2 }),
  penznem: text("penznem"),
  forrasMax: integer("forras_max"), // F9-A8: null = nincs korlát
  letrehozva: timestamp("letrehozva", { withTimezone: true }).notNull().defaultNow(),
});

// F9-A2: az összkép tárolva — futásonként egyszer készül (apps/web/hirfigyelo/osszkep.ts).
/** R-13 (2026-09-22): a kredit felhasználása — egy sor = egy terhelés egy tagon, ezredben; a hónap Bukarest szerint. */
export const kreditMozgas = pgTable(
  "kredit_mozgas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    szervezetId: uuid("szervezet_id").notNull().references(() => szervezet.id, { onDelete: "cascade" }),
    fiokId: uuid("fiok_id").references(() => fiok.id, { onDelete: "set null" }),
    honap: text("honap").notNull(),
    ezred: integer("ezred").notNull(),
    feladat: text("feladat").notNull(),
    letrehozva: timestamp("letrehozva", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("kredit_mozgas_szervezet_honap").on(t.szervezetId, t.honap),
    pgPolicy("kredit_mozgas_sajat", {
      for: "all",
      to: "km_app",
      using: sql`szervezet_id = ${aktualisSzervezet}`,
      withCheck: sql`szervezet_id = ${aktualisSzervezet}`,
    }),
  ],
).enableRLS();

/** R-13 (2026-09-22): a hírszűrés fiókonként — fokozat és előszűrés; ha nincs sor, az alap (nagyon szigorú + be). */
export const hfTagSzures = pgTable(
  "hf_tag_szures",
  {
    szervezetId: uuid("szervezet_id").notNull().references(() => szervezet.id, { onDelete: "cascade" }),
    fiokId: uuid("fiok_id").notNull().references(() => fiok.id, { onDelete: "cascade" }),
    fokozat: text("fokozat", { enum: ["nagyon_szigoru", "kozepes", "laza"] }).notNull().default("nagyon_szigoru"),
    eloszures: boolean("eloszures").notNull().default(true),
    modositva: timestamp("modositva", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ name: "hf_tag_szures_pk", columns: [t.szervezetId, t.fiokId] }),
    check("hf_tag_szures_fokozat", sql`${t.fokozat} IN ('nagyon_szigoru', 'kozepes', 'laza')`),
    pgPolicy("hf_tag_szures_sajat", {
      for: "all",
      to: "km_app",
      using: sql`szervezet_id = ${aktualisSzervezet}`,
      withCheck: sql`szervezet_id = ${aktualisSzervezet}`,
    }),
  ],
).enableRLS();

export const hfOsszkep = pgTable(
  "hf_osszkep",
  {
    szervezetId: uuid("szervezet_id").notNull().references(() => szervezet.id, { onDelete: "cascade" }),
    /** R-13: az összkép a szűrő-beállítás szerint (`szuroKulcs`: fokozat|előszűrés) — az azonos beállítású tagok ugyanazt látják */
    szuroKulcs: text("szuro_kulcs").notNull().default("nagyon_szigoru|be"),
    futasId: uuid("futas_id"),
    osszkep: jsonb("osszkep"),
    hibaIdeje: timestamp("hiba_ideje", { withTimezone: true }),
    frissitve: timestamp("frissitve", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ name: "hf_osszkep_pkey", columns: [t.szervezetId, t.szuroKulcs] }),
    pgPolicy("hf_osszkep_sajat", {
      for: "all",
      to: "km_app",
      using: sql`szervezet_id = ${aktualisSzervezet}`,
      withCheck: sql`szervezet_id = ${aktualisSzervezet}`,
    }),
  ],
).enableRLS();

// V1: a Visszajelzés modul táblái. A modul rendszerszintű: nincs sorszintű védelem (RLS),
// a rendszergazda minden szervezet visszajelzését látja; a tulajdonos a végponton szűrve a sajátját.
export const visszajelzes = pgTable(
  "visszajelzes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // 0148 (Kati 10-02): a belépés előtti lapokról jövő beküldés névtelen — nincs szervezet, és munkamenet nélkül fiók sem
    szervezetId: uuid("szervezet_id").references(() => szervezet.id, { onDelete: "cascade" }),
    fiokId: uuid("fiok_id"),
    fiokNev: text("fiok_nev").notNull(),
    nevtelen: boolean("nevtelen").notNull().default(false),
    lap: text("lap").notNull(),
    lapCim: text("lap_cim").notNull().default(""),
    elem: jsonb("elem"),
    kijeloltSzoveg: text("kijelolt_szoveg").notNull().default(""),
    szoveg: text("szoveg").notNull(),
    nyelv: text("nyelv").notNull(),
    kep: text("kep"),
    ablak: jsonb("ablak").notNull(),
    allapot: text("allapot").notNull().default("uj"),
    csomagId: uuid("csomag_id"),
    letrehozva: timestamp("letrehozva", { withTimezone: true }).notNull().defaultNow(),
    // 0154 (c7): mikor lett „kész” — a reggeli „Tegnap javítva” üzenet ebből válogat; nem „kész” → NULL
    keszIdo: timestamp("kesz_ido", { withTimezone: true }),
  },
  (t) => [
    index("visszajelzes_letrehozva_idx").on(t.letrehozva),
    index("visszajelzes_szervezet_id_idx").on(t.szervezetId),
  ],
);

export const javitoCsomag = pgTable(
  "javito_csomag",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nap: text("nap").notNull(),
    osszefoglalo: text("osszefoglalo").notNull(),
    tetelek: jsonb("tetelek").notNull(),
    visszajelzesDb: integer("visszajelzes_db").notNull(),
    letrehozva: timestamp("letrehozva", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("javito_csomag_nap_idx").on(t.nap)],
);

// ---------------------------------------------------------------------------
// R-17 B (0150): közös rendszer-beállítások (kulcs → JSON; mint az `arfolyam`, nincs sorszintű védelem — a rendszergazda végpontja írja)
// és a fizetős logótervezés kérései (szervezeti adat, sorszintű védelemmel; a rendszergazda a SECURITY DEFINER függvényen át listáz).
// ---------------------------------------------------------------------------
export const rendszerBeallitas = pgTable("rendszer_beallitas", {
  kulcs: text("kulcs").primaryKey(),
  ertek: jsonb("ertek").notNull(),
  frissitve: timestamp("frissitve", { withTimezone: true }).notNull().defaultNow(),
});

export const logotervKeres = pgTable(
  "logoterv_keres",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    szervezetId: uuid("szervezet_id").notNull().references(() => szervezet.id, { onDelete: "cascade" }),
    fiokId: uuid("fiok_id"),
    fiokNev: text("fiok_nev").notNull().default(""),
    arEur: numeric("ar_eur", { precision: 10, scale: 2 }),
    valaszok: jsonb("valaszok").notNull(),
    fajlIdk: jsonb("fajl_idk").notNull().default([]),
    allapot: text("allapot", { enum: ["uj", "folyamatban", "kesz"] }).notNull().default("uj"),
    ertesites: text("ertesites", { enum: ["nincs_beallitva", "kuldes", "elkuldve", "hiba"] }).notNull().default("nincs_beallitva"),
    letrehozva: timestamp("letrehozva", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("logoterv_keres_szervezet_idx").on(t.szervezetId),
    index("logoterv_keres_letrehozva_idx").on(t.letrehozva),
    pgPolicy("logoterv_keres_sajat_szervezet", {
      for: "all",
      to: "km_app",
      using: sql`szervezet_id = ${aktualisSzervezet}`,
      withCheck: sql`szervezet_id = ${aktualisSzervezet}`,
    }),
  ],
).enableRLS();

/** VZ-1 · Közlemények (0152): a közlemény utolsó letöltött száma munkaterenként és receptenként — a lap ennél eggyel többet javasol. */
export const kozlemenySorszam = pgTable(
  "kozlemeny_sorszam",
  {
    szervezetId: uuid("szervezet_id").notNull().references(() => szervezet.id, { onDelete: "cascade" }),
    sablon: text("sablon", { enum: ["zavar", "allitas", "adatsavok"] }).notNull(),
    utolso: integer("utolso").notNull(),
    frissitve: timestamp("frissitve", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ name: "kozlemeny_sorszam_pk", columns: [t.szervezetId, t.sablon] }),
    pgPolicy("kozlemeny_sorszam_sajat_szervezet", {
      for: "all",
      to: "km_app",
      using: sql`szervezet_id = ${aktualisSzervezet}`,
      withCheck: sql`szervezet_id = ${aktualisSzervezet}`,
    }),
  ],
).enableRLS();

/** VZ-1 · Közlemények (0152): a letöltött közlemény-képek szabály-jelzései — a rendszergazdáé, Tibor nem látja (kerdesek 4). */
export const kepJelzes = pgTable(
  "kep_jelzes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    szervezetId: uuid("szervezet_id").notNull().references(() => szervezet.id, { onDelete: "cascade" }),
    fiokId: uuid("fiok_id"),
    sablon: text("sablon").notNull(),
    sorszam: integer("sorszam"),
    szabaly: text("szabaly").notNull(),
    szigorusag: text("szigorusag", { enum: ["tiltas", "figyelmeztetes"] }).notNull(),
    arculati: boolean("arculati").notNull().default(false),
    mezo: text("mezo").notNull().default(""),
    reszlet: text("reszlet").notNull().default(""),
    letrehozva: timestamp("letrehozva", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("kep_jelzes_szervezet_idx").on(t.szervezetId),
    index("kep_jelzes_letrehozva_idx").on(t.letrehozva),
    pgPolicy("kep_jelzes_sajat_szervezet", {
      for: "all",
      to: "km_app",
      using: sql`szervezet_id = ${aktualisSzervezet}`,
      withCheck: sql`szervezet_id = ${aktualisSzervezet}`,
    }),
  ],
).enableRLS();

/** c30 F5 (0174; terv §1.4): a rendezvény programja — tételenként egy sor (nap, kezdés, vége, két nyelvű név / helyszín / leírás).
 *  Nincs DELETE jog: a törlés puha (`torolve`). A `modositva` és a `forras = sajat` sort az újraolvasás nem írja felül. */
export const programTetel = pgTable(
  "program_tetel",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    szervezetId: uuid("szervezet_id").notNull().references(() => szervezet.id, { onDelete: "cascade" }),
    nap: date("nap", { mode: "string" }),
    kezdes: time("kezdes"),
    vege: time("vege"),
    nev: jsonb("nev").$type<Record<string, string>>().notNull(),
    leiras: jsonb("leiras").$type<Record<string, string>>().notNull().default({}),
    helyszin: jsonb("helyszin").$type<Record<string, string>>().notNull().default({}),
    fellepo: text("fellepo").notNull().default(""),
    fajta: text("fajta").notNull().default("egyeb"),
    kepFajlId: uuid("kep_fajl_id").references(() => arculatFajl.id, { onDelete: "set null" }),
    jegy: text("jegy").notNull().default(""),
    bizonytalan: boolean("bizonytalan").notNull().default(false),
    aktiv: boolean("aktiv").notNull().default(true),
    forras: text("forras", { enum: ["gep", "sajat"] }).notNull().default("gep"),
    modositva: boolean("modositva").notNull().default(false),
    gepKulcs: text("gep_kulcs").notNull().default(""),
    torolve: timestamp("torolve", { withTimezone: true }),
    letrehozva: timestamp("letrehozva", { withTimezone: true }).notNull().defaultNow(),
    frissitve: timestamp("frissitve", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("program_tetel_szervezet_nap_idx").on(t.szervezetId, t.nap, t.kezdes),
    check("program_tetel_nev_ervenyes", sql`jsonb_typeof(${t.nev}) = 'object' AND ${t.nev} <> '{}'::jsonb`),
    check("program_tetel_fajta_ervenyes", sql`${t.fajta} IN ('koncert', 'eloadas', 'gyerek', 'jatek', 'workshop', 'kiallitas', 'gasztro', 'vasar', 'unnepseg', 'egyeb')`),
    check("program_tetel_forras_ervenyes", sql`${t.forras} IN ('gep', 'sajat')`),
    pgPolicy("program_tetel_sajat_szervezet", { for: "all", to: "km_app", using: sql`szervezet_id = ${aktualisSzervezet}`, withCheck: sql`szervezet_id = ${aktualisSzervezet}` }),
  ],
).enableRLS();
