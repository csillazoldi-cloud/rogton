
/** A 2. lépés („Kommunikáció") mezői — a v6 OB-02 szerint: célközönség, cél, tartalomnyelvek, hangnem. */
export const KommunikacioLepes = z.object({
  javaslatok_kerve: z.boolean().default(false), // az AI-javaslatok egyszer, belépéskor jönnek (v6 seedStep2)
  celkozonseg: z.string().trim().max(1000).default(""),
  celkozonseg_forras: MezoForras.default(""),
  celkozonseg_modositva: z.boolean().default(false),
  celkozonseg_kesobb: z.boolean().default(false), // „Ezt később pontosítom"
  cel: z.string().trim().max(1000).default(""),
  cel_forras: MezoForras.default(""),
  cel_modositva: z.boolean().default(false),
  cel_kesobb: z.boolean().default(false),
  nyelvek: z.array(Tartalomnyelv).max(18).default([]),
  nyelvek_forras: MezoForras.default(""),
  nyelvek_javasolt: z.array(Tartalomnyelv).max(18).default([]), // a forrás alapján javasolt, még el nem fogadott
  hangnem_leiras: z.string().trim().max(300).default(""),
  hangnem_minta: z.string().trim().max(1500).default(""),
  hangnem_nyelv: z.string().max(5).default(""), // a minta nyelve (tartalomnyelv)
  hangnem_forras: MezoForras.default(""),
  hangnem_modositva: z.boolean().default(false),
  hangnem_kesobb: z.boolean().default(false),
});
export type KommunikacioLepes = z.infer<typeof KommunikacioLepes>;


/** Az arculati tervezet (v6 OB-03-B, brandprofil-minta.json): az ügyfél márkájának szabályai a készülő tartalmakhoz.
 *  A rendszer felületét nem változtatja; jóváhagyása külön történik az alapadatokétól. */
export const HexSzin = z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const ArculatTervezet = z.object({
  elsodleges: HexSzin,
  masodlagos: HexSzin,
  hatter: HexSzin,
  betu_cim: z.string().max(80).default(""), // üres = ideiglenes, semleges megjelenítés (v6 brandTemp)
  betu_szoveg: z.string().max(80).default(""),
  betu_iranymutatas: z.string().max(200).default(""), // az AI iránymutatása, amíg nincs tényleges betű
  kepvilag: z.string().trim().max(500).default(""),
  kovetendo: z.string().trim().max(300).default(""),
  kerulendo: z.string().trim().max(300).default(""),
  lekerekites: z.number().int().min(0).max(24).default(8),
  nyelv: z.string().max(5).default("hu"), // a mintakártya nyelve
  eredet: z.enum(["forras", "ai"]).default("ai"), // a megadott források alapján / meglévő arculat híján
  modositva: z.boolean().default(false),
  // F-6 (R-6): a logó fájlja (arculat_fajl.id). A jóváhagyott pillanatkép a SAJÁT értékét őrzi — a tervezet új logója csak jóváhagyással él.
  logo_fajl_id: z.uuid().nullable().default(null),
});
export type ArculatTervezet = z.infer<typeof ArculatTervezet>;

/** Arculati állapotgép (egymást kizáró): nincs → tervezet → (kesobb | jovahagyott). Jóváhagyott szerkesztése új
 *  tervezetet nyit (verzio+1), a korábbi jóváhagyott pillanatkép megmarad — csendes felülírás nincs. */
export const ArculatAllapot = z.enum(["nincs", "tervezet", "kesobb", "jovahagyott"]);
export type ArculatAllapot = z.infer<typeof ArculatAllapot>;
export const ArculatPillanatkep = ArculatTervezet.extend({ jovahagyva: z.iso.datetime(), verzio: z.number().int().min(1) });
export const ArculatLepes = z.object({
  allapot: ArculatAllapot.default("nincs"),
  tervezet: ArculatTervezet.nullable().default(null),
  verzio: z.number().int().min(1).default(1),
  jovahagyott_verzio: z.number().int().min(1).nullable().default(null),
  verziok: z.record(z.string(), ArculatPillanatkep).default({}),
});
export type ArculatLepes = z.infer<typeof ArculatLepes>;

/** A teljes piszkozat: verziószámmal, hogy a 2. és 3. lépés mezői később bővíthessék törés nélkül. */
export const OnboardingPiszkozat = z.object({
  verzio: z.literal(1).default(1),
  lepes: z.number().int().min(1).max(3).default(1),
  bemutatkozas: BemutatkozasLepes.prefault({}),
  kommunikacio: KommunikacioLepes.prefault({}),
  arculat: ArculatLepes.prefault({}),
});
export type OnboardingPiszkozat = z.infer<typeof OnboardingPiszkozat>;

/** A piszkozat-válasz: a tartalom és a mentés ideje (a felület ebből mutatja a „Piszkozat mentve" állapotot). */
export const PiszkozatValasz = z.object({ piszkozat: OnboardingPiszkozat, frissitve: z.iso.datetime().nullable() });
export type PiszkozatValasz = z.infer<typeof PiszkozatValasz>;

/** Üres piszkozat — az első megnyitáskor ezt kapja a felület. */
123:export const BemutatkozasLepes = z.object({
124-  nev: z.string().trim().max(120).default(""),
125-  forras_tipus: ForrasTipus.default("weboldal"),
126-  weboldal: z.string().trim().max(500).default(""),
127-  leiras: z.string().trim().max(4000).default(""),
128-  dokumentum_nev: z.string().trim().max(200).default(""), // a feltöltés a tárolási pontnál (6.) jön; itt csak a neve
129-  arculat_forrasok: z.object({
130-    logo: z.boolean().default(false),
131-    kezikonyv: z.boolean().default(false),
132-    referenciak: z.boolean().default(false),
133-    weboldal_is: z.boolean().default(true),
134-  }).prefault({}),
135-  osszefoglalo: z.string().trim().max(4000).default(""), // az AI-javaslat (E-7) vagy a kézi szöveg — javítható
136-  osszefoglalo_forras: z.enum(["", "weboldal", "ai", "sajat"]).default(""), // honnan jött (v6: source / ai / user)
137-  osszefoglalo_modositva: z.boolean().default(false), // a javaslatot kézzel módosította
packages/contracts/src/index.ts:148:export const Tartalomnyelv = z.enum(TARTALOMNYELVEK);
packages/contracts/src/index.ts-149-export type Tartalomnyelv = z.infer<typeof Tartalomnyelv>;
packages/contracts/src/index.ts-150-
packages/contracts/src/index.ts-151-/** A 2. lépés („Kommunikáció") mezői — a v6 OB-02 szerint: célközönség, cél, tartalomnyelvek, hangnem. */
