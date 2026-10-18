// @km/contracts — sémák, azonosítók, hibakódok, események.
// Ez a csomag NEM használhat React-et, Next-et, adatbázist. A határőr ellenőrzi.
import { z } from "zod";

/** A rendszer verziója, amit minden alkalmazás kifelé mutat. */
export const RENDSZER_VERZIO = "0.1.0" as const;

/** Az „élsz még?" válasz szerződése — a befogadó alkalmazás adja, a modulok olvassák. */
export const EgeszsegValasz = z.object({
  allapot: z.literal("ok"),
  verzio: z.string(),
  ido: z.iso.datetime(),
});
export type EgeszsegValasz = z.infer<typeof EgeszsegValasz>;

// ---------------------------------------------------------------------------
// Fiók és belépés (E-3). A kiszolgáló HIBAKÓDOT ad, a szöveget a felület — ALAPTERV 7. pont.
// ---------------------------------------------------------------------------

/** Hibakódok — a felület ezekhez rendel szöveget a saját nyelvén. */
export const HibaKod = z.enum([
  "ERVENYTELEN_ADAT", // a bemenet nem felel meg a sémának
  "ISMERETLEN_SEMA", // R-10: nincs ilyen színséma (ejkek · vilagos · sotet)
  "EMAIL_FOGLALT", // ezzel az e-mail-címmel már van fiók
  "GYENGE_JELSZO", // rövidebb 10 karakternél
  "ROSSZ_BELEPES", // nincs ilyen e-mail, vagy rossz a jelszó (a kettőt szándékosan nem különböztetjük meg)
  "NINCS_BELEPVE", // nincs érvényes munkamenet
  "NINCS_JOG", // van belépés, de ehhez nincs joga
  "MODUL_NEM_ELERHETO", // F-7a: a modul nincs a munkatér csomagjában
  "FORRAS_KORLAT", // F9-A8: a csomag forrás-korlátja betelt (a próbaidőszakban 5)
  "BELSO_HIBA",
  // E-7: forrás és AI — a felület mindegyikhez saját szöveget és kézi továbbutat ad (A-03)
  "FORRAS_NEM_ELERHETO", // a megadott oldal nem tölthető le (nem elérhető / túl nagy / nem szöveg)
  "AI_NEM_ELERHETO", // a szolgáltató nem felel / időtúllépés / nincs kulcs
  "AI_KERET_KIMERULT", // a havi keret elfogyott
  "AI_ROSSZ_VALASZ", // a szolgáltató válasza nem felel meg a sémának (E-23)
  "AI_KIKAPCSOLVA", // F-5 (R-4): a szervezet kikapcsolta az AI-t — egyetlen hívás sem indul a nevében
  // E-20: hírfigyelő (a mag hibakódjai az API-n át)
  "NINCS_BEALLITAS", // nincs aktív figyelési beállítás a szervezethez
  "FUT_MAR", // már fut egy figyelés ennél a szervezetnél
  "NINCS_ILYEN_JAVASLAT", // nincs ilyen azonosítójú szabályjavaslat
  "MINTA_LEJART", // a próbafutás mintája lejárt — új próbafuttatás kell
  "NINCS_ILYEN_FORRAS", // nincs ilyen azonosítójú forrás
  "NINCS_ILYEN_SOR", // nincs ilyen várólista-tétel (E-22)
  "NINCS_ILYEN_FUTAS",
  "NINCS_ILYEN_VISSZAJELZES", // V1: nincs ilyen visszajelzés vagy javítócsomag-tétel // nincs ilyen azonosítójú futás (E-22)
  "NINCS_ILYEN_TALALAT", // nincs ilyen azonosítójú találat (E-23)
  // E-9: jóváhagyás
  "HIANYOS_PROFIL", // nincs név vagy tevékenység-összefoglaló — a jóváhagyás nem indul (v6 approveBlocked)
  "NINCS_PISZKOZAT", // nincs mit jóváhagyni (már jóváhagyva, vagy el sem kezdték)
  // E-13: téma
  "NINCS_TERVEZET", // nincs mit alkalmazni / elvetni
  "NINCS_ILYEN_VERZIO", // a visszaállítandó verzió nem létezik
  // F-3: tagság és meghívó — a `@km/hozzaferes-core` hibakódjai az API nyelvén (a befogadó fordítása: ugyanazok a szavak)
  "NAGYOBB_SZEREP", "UTOLSO_TULAJDONOS", "MAGAT_NEM", "MAR_TAG", "NINCS_ILYEN_TAG", "NINCS_ILYEN_MEGHIVO",
  "MEGHIVO_LEJART", "MEGHIVO_FELHASZNALVA", "MEGHIVO_VISSZAVONVA",
  "ROSSZ_JELENLEGI_JELSZO", // F-4: jelszóváltásnál a jelenlegi jelszó nem stimmel
  // F-6: fájlfeltöltés — a `@km/fajl-core` kódjai az API nyelvén
  "SVG_NEM_ENGEDETT", "TIPUS_NEM_ENGEDETT", "TUL_NAGY", "URES", "NINCS_ILYEN_FAJL",
  "TUL_SOK_KISERLET", // E-34: sebességkorlát — túl sok sikertelen próbálkozás, várni kell
  "ERVENYTELEN_JEGY", // E-34: a jelszó-visszaállító jegy hibás, lejárt vagy már felhasználták
  // E-50: fiókok (rendszergazda)
  "FIOK_FELFUGGESZTVE", // a fiók fel van függesztve — nem léphet be, és az élő munkamenete sem érvényes
  "NINCS_ILYEN_FIOK", // nincs ilyen azonosítójú fiók
  "ONKIZARAS", // az utolsó rendszergazda a saját jelölését venné el — utána csak adatbázisból lenne visszaadható
  // B-01: egységes jogellenőrzés (apps/web/app/api/_kapu.ts)
  "NINCS_SZERVEZET", // belépett, de még egyetlen szervezetnek sem tagja — nem tiltás, hanem hiányzó lépés
  // R-16 K1 (TERV 1.7 R2): a beküldött arculat régebbi, mint a tárolt (egy másik lapon közben jóváhagyták) — újratöltés kell
  "ELAVULT_ADAT",
  // R-17 B (0150): a logótervezési ajánlat nincs meghirdetve (a rendszergazda levette az árat) — a kérdőív nem küldhető
  "NINCS_AJANLAT",
  // c30 F9 (0178): a fotóalbum korlátai — a munkatér 500 MB-os albumtára megtelt · egy albumban már 40 fotó van ·
  // 10 percen belül már 60 fotó jött (a `mezok.ujra_perc` mondja, mennyit kell várni)
  "ALBUM_MEGTELT", "ALBUM_TELE", "TUL_SOK_FELTOLTES",
]);
export type HibaKod = z.infer<typeof HibaKod>;

export const Email = z.string().trim().toLowerCase().email().max(254);
export const Jelszo = z.string().min(10).max(200);
export const Nev = z.string().trim().min(1).max(120);

export const RegisztracioKeres = z.object({ nev: Nev, email: Email, jelszo: Jelszo });
export type RegisztracioKeres = z.infer<typeof RegisztracioKeres>;

export const BelepesKeres = z.object({ email: Email, jelszo: Jelszo });
export type BelepesKeres = z.infer<typeof BelepesKeres>;

/** F-4: saját fiók — jelszóváltás a jelenlegi jelszóval, névmódosítás. E-mail-módosítás NINCS (a fiók kulcsa). */
export const JelszoValtasKeres = z.object({ jelenlegi: z.string().min(1).max(200), uj: Jelszo });
export type JelszoValtasKeres = z.infer<typeof JelszoValtasKeres>;
export const NevModositasKeres = z.object({ nev: Nev });
export type NevModositasKeres = z.infer<typeof NevModositasKeres>;

export const SzervezetLetrehozasKeres = z.object({ nev: Nev });
export type SzervezetLetrehozasKeres = z.infer<typeof SzervezetLetrehozasKeres>;

export const Szerep = z.enum(["tulajdonos", "szerkeszto", "nezo"]);
export type Szerep = z.infer<typeof Szerep>;

/** Amit a felület a belépett emberről tud: a fiók és a szervezetei. */
export const FiokNezet = z.object({
  id: z.uuid(),
  email: Email,
  nev: Nev,
  szervezetek: z.array(z.object({ id: z.uuid(), nev: Nev, szerep: Szerep })),
  /** E-13: a közös alap (téma, feliratok) szerkesztője. */
  rendszergazda: z.boolean(),
  /** E-29c: a fiók által választott felületnyelv (hu | ro | en); null = még nem választott.
   *  A háttérben futó hírfigyelés ebből tudja, milyen nyelven írjon az AI. */
  nyelv: z.enum(["hu", "ro", "en"]).nullable().default(null),
});
export type FiokNezet = z.infer<typeof FiokNezet>;

/** Egységes hibaválasz minden API-ponton. */
export const HibaValasz = z.object({ hiba: HibaKod, mezok: z.record(z.string(), z.string()).optional() });
export type HibaValasz = z.infer<typeof HibaValasz>;

/** A munkamenet-süti neve és élettartama. */
export const MUNKAMENET_SUTI = "km_munkamenet" as const;
export const MUNKAMENET_ELETTARTAM_NAP = 30 as const;

// ---------------------------------------------------------------------------
// Onboarding-piszkozat (E-6). A piszkozat a SZERVEZETHEZ tartozik (ALAPTERV 4.), nem a böngészőhöz.
// Az onboarding nem a profil végleges szerkesztője (R-06): piszkozatot ír, jóváhagyáskor átadja a hostnak.
// ---------------------------------------------------------------------------

export const ForrasTipus = z.enum(["weboldal", "leiras"]);
export type ForrasTipus = z.infer<typeof ForrasTipus>;

/** Az 1. lépés („Bemutatkozás") mezői. Minden mező üres lehet: a piszkozat bármikor menthető. */
// c30 F1 (docs/terv/FESZTIVAL-ES-NYELVI-MOD-TERV.md §1.2): the organisation's TYPE and, for companies, its CATEGORY.
// Stored as plain strings and always read through these normalisers (never z.enum in the stored profile — c30 F0 rule:
// a bad value must never make a profile unreadable).
export const SZERVEZET_TIPUSOK = ["ceg", "fesztival"] as const;
export type SzervezetTipus = (typeof SZERVEZET_TIPUSOK)[number];
/** Stored/AI value → type. Missing, unknown, other case, not a string → "ceg" (D13: unsure and unanswered = company). */
export function szervezetTipus(x: unknown): SzervezetTipus {
  const s = typeof x === "string" ? x.trim() : "";
  return (SZERVEZET_TIPUSOK as readonly string[]).includes(s) ? (s as SzervezetTipus) : "ceg";
}
/** The closed category list — the single source (c15's list, moved here from apps/web/vizual/minta-kategoria.ts, which re-exports
 *  it). The SAME list as apps/kepgyar/src/minta-foto.ts MINTA_KATEGORIAK (kepgyar does not depend on contracts). */
export const KATEGORIAK = ["epites", "vendeglatas", "bolt", "szepseg", "iroda", "muhely", "kozlekedes", "kert"] as const;
export type Kategoria = (typeof KATEGORIAK)[number] | "semleges";
/** Stored/AI value → category. Missing, typo, other case, not a string → "semleges". Surrounding spaces are trimmed. */
export function kategoria(x: unknown): Kategoria {
  const s = typeof x === "string" ? x.trim() : "";
  return (KATEGORIAK as readonly string[]).includes(s) ? (s as Kategoria) : "semleges";
}

// c30 F2 (plan §1.3): the post language mode. Read through profile-core `nyelvMod()` (never stored as an enum — F0 rule).
export const POSZT_NYELV_MODOK = ["egy", "egyben", "kulon"] as const;
export type PosztNyelvMod = (typeof POSZT_NYELV_MODOK)[number];

export const BemutatkozasLepes = z.object({
  nev: z.string().trim().max(120).default(""),
  forras_tipus: ForrasTipus.default("weboldal"),
  weboldal: z.string().trim().max(500).default(""),
  leiras: z.string().trim().max(4000).default(""),
  dokumentum_nev: z.string().trim().max(200).default(""), // a feltöltés a tárolási pontnál (6.) jön; itt csak a neve
  arculat_forrasok: z.object({
    logo: z.boolean().default(false),
    kezikonyv: z.boolean().default(false),
    referenciak: z.boolean().default(false),
    weboldal_is: z.boolean().default(true),
  }).prefault({}),
  osszefoglalo: z.string().trim().max(4000).default(""), // az AI-javaslat (E-7) vagy a kézi szöveg — javítható
  osszefoglalo_forras: z.enum(["", "weboldal", "ai", "sajat"]).default(""), // honnan jött (v6: source / ai / user)
  osszefoglalo_modositva: z.boolean().default(false), // a javaslatot kézzel módosította
  celkozonseg: z.string().trim().max(500).default(""), // a kihagyható kérdés válasza (v6 clarify → audience)
  // c30 F1: the machine's guess from the review-proposal call (javaslatok v2), copied into the profile at approval only when
  // `tipus_biztos` (profile-core profilPiszkozatbol). Plain strings, read through szervezetTipus()/kategoria().
  szervezet_tipus: z.string().trim().max(40).optional(),
  kategoria: z.string().trim().max(40).optional(),
  tipus_biztos: z.boolean().optional(),
  // c30 F6 (rajz D1): a person answered „Cég vagytok, vagy fesztivált szerveztek?” or chose under „Átírom” → copied as tipus_forras "sajat"
  tipus_sajat: z.boolean().optional(),
  // c30 F6 (rajz D2): the machine's guess of the event's dates and town (festival only) — pre-fills „Mikor és hol lesz?”
  rendezveny: z.object({
    mettol: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    meddig: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    hely: z.record(z.string(), z.string().trim().max(120)).optional(),
  }).optional(),
});
export type BemutatkozasLepes = z.infer<typeof BemutatkozasLepes>;

/** Honnan jött egy mező értéke (v6: user / source / ai / empty). */
export const MezoForras = z.enum(["", "sajat", "weboldal", "ai"]);
export type MezoForras = z.infer<typeof MezoForras>;

/** A tartalomnyelvek kódjai (v6 CONTENT_LANGS). */
export const TARTALOMNYELVEK = ["hu", "ro", "en", "de", "fr", "it", "es", "sk", "sr", "hr", "uk", "pl", "cs", "nl", "pt", "sv", "tr", "ar"] as const;
export const Tartalomnyelv = z.enum(TARTALOMNYELVEK);
export type Tartalomnyelv = z.infer<typeof Tartalomnyelv>;

/** A hangnem leírása (a „Hogyan írjunk” mező): szabályok, példák — 2026-09-21 Vilmos döntése, 300-ról 3000-re. */
export const HANGNEM_LEIRAS_MAX = 3000;

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
  hangnem_leiras: z.string().trim().max(HANGNEM_LEIRAS_MAX).default(""),
  hangnem_minta: z.string().trim().max(1500).default(""),
  hangnem_nyelv: z.string().max(5).default(""), // a minta nyelve (tartalomnyelv)
  hangnem_forras: MezoForras.default(""),
  hangnem_modositva: z.boolean().default(false),
  hangnem_kesobb: z.boolean().default(false),
});
export type KommunikacioLepes = z.infer<typeof KommunikacioLepes>;


/** Hex szín (#rrggbb) — az arculat színei. */
export const HexSzin = z.string().regex(/^#[0-9a-fA-F]{6}$/);
// R-16 K1 (TERV 1.2, gepezet 2): a logó négy helye. A logó a munkatér saját fájlja (arculat_fajl.logo_valtozat, A5 szabály);
// a tervezet/pillanatkép `logok` térképe csak (a) tartalék, ha a fájllista nem olvasható, és (b) a verziótörténet: melyik logók voltak használatban.
export const LogoValtozat = z.enum(["vilagos", "sotet", "egyszinu", "negyzetes"]);
export type LogoValtozat = z.infer<typeof LogoValtozat>;
export const ArculatLogok = z.object({
  vilagos: z.uuid().nullable().default(null),
  sotet: z.uuid().nullable().default(null),
  egyszinu: z.uuid().nullable().default(null),
  negyzetes: z.uuid().nullable().default(null),
});
export type ArculatLogok = z.infer<typeof ArculatLogok>;

// Az alap objektum külön áll, mert a pillanatkép `.extend`-del bővíti — az átalakítás (transform) után már nem bővíthető.
// R-16 (TERV 1.7 R1): MINDEN új mezőnek van alapértéke, és egyetlen meglévő mező sem szigorodik, így minden tárolt profil,
// piszkozat és pillanatkép ugyanúgy beolvasható, mint eddig (a hibás beolvasás a profilTar-ban null-t adna → adatvesztés).
const ArculatTervezetAlap = z.object({
  elsodleges: HexSzin,
  masodlagos: HexSzin,
  hatter: HexSzin,
  betu_cim: z.string().max(80).default(""), // üres = ideiglenes, semleges megjelenítés (v6 brandTemp); R-16 K5-től betűkulcs (archivo, sajat:<uuid>)
  betu_szoveg: z.string().max(80).default(""),
  betu_iranymutatas: z.string().max(200).default(""), // az AI iránymutatása, amíg nincs tényleges betű
  kepvilag: z.string().trim().max(500).default(""),
  kovetendo: z.string().trim().max(300).default(""),
  kerulendo: z.string().trim().max(300).default(""),
  lekerekites: z.number().int().min(0).max(24).default(8),
  nyelv: z.string().max(5).default("hu"), // a mintakártya nyelve
  eredet: z.enum(["forras", "ai"]).default("ai"), // a megadott források alapján / meglévő arculat híján
  modositva: z.boolean().default(false),
  // F-6 (R-6): a logó fájlja (arculat_fajl.id). R-16 K1: ELAVULT tükör — a `logok.vilagos` másolata, soha nem dobjuk el,
  // hogy egy visszaállított (régi) kód is ugyanazt a logót lássa.
  logo_fajl_id: z.uuid().nullable().default(null),
  logok: ArculatLogok.prefault({}),
  // R-16 (TERV 1.2): az egész R-16 új mezői egyszerre, hogy a K3–K7 csomagok a sémához már ne nyúljanak.
  szin_forras: z.enum(["", "logo", "honlap", "szett", "sajat", "gep"]).default(""), // honnan jött a három szín (12d)
  szin_szett: z.string().max(40).default(""), // a bevált szett azonosítója, ha szin_forras = "szett"
  szin_jeloltek: z.array(HexSzin).max(8).default([]), // a honlap színjelöltjei (K7 tölti)
  forras_cim: z.string().max(500).default(""), // a honlap, amit a gép olvasott („Honnan?”, K7 tölti)
  nevlogo_stilus: z.enum(["nev", "kor", "negyzet"]).nullable().default(null), // a választott névlogó-stílus (K6); c10: nev = szó · kor = bélyeg (kör + név alatta) · negyzet = keretes — az értékek soha nem változnak (R1)
});

/** Olvasáskori sémaváltás (TERV 1.2, nincs SQL a jsonb-n): a régi `logo_fajl_id` → `logok.vilagos`, és vissza tükrözve.
 *  A tárolt JSON-t nem írjuk át; a régi pillanatkép ugyanazt mondja, csak most `logok.vilagos`-ként is olvasható. */
function logokKitolt<T extends z.infer<typeof ArculatTervezetAlap>>(t: T): T {
  const vilagos = t.logok.vilagos ?? t.logo_fajl_id;
  return { ...t, logok: { ...t.logok, vilagos }, logo_fajl_id: vilagos };
}

/** Az arculati tervezet (v6 OB-03-B, brandprofil-minta.json): az ügyfél márkájának szabályai a készülő tartalmakhoz.
 *  A rendszer felületét nem változtatja; jóváhagyása külön történik az alapadatokétól. */
export const ArculatTervezet = ArculatTervezetAlap.transform(logokKitolt);
export type ArculatTervezet = z.infer<typeof ArculatTervezet>;

/** Arculati állapotgép (egymást kizáró): nincs → tervezet → (kesobb | jovahagyott). Jóváhagyott szerkesztése új
 *  tervezetet nyit (verzio+1), a korábbi jóváhagyott pillanatkép megmarad — csendes felülírás nincs. */
export const ArculatAllapot = z.enum(["nincs", "tervezet", "kesobb", "jovahagyott"]);
export type ArculatAllapot = z.infer<typeof ArculatAllapot>;
export const ArculatPillanatkep = ArculatTervezetAlap.extend({ jovahagyva: z.iso.datetime(), verzio: z.number().int().min(1) }).transform(logokKitolt);
export type ArculatPillanatkep = z.infer<typeof ArculatPillanatkep>;
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
export const URES_PISZKOZAT: OnboardingPiszkozat = OnboardingPiszkozat.parse({});

/** Az összefoglaló-kérés és -válasz (E-7). A válasz JAVASLAT: a felhasználó javítja és hagyja jóvá. */
export const OsszefoglaloKeres = z.object({
  nev: z.string().trim().max(120).optional(),
  forras_tipus: ForrasTipus.optional(),
  weboldal: z.string().trim().max(500).optional(),
  leiras: z.string().trim().max(4000).optional(),
});
export type OsszefoglaloKeres = z.infer<typeof OsszefoglaloKeres>;

export const OsszefoglaloValasz = z.object({
  osszefoglalo: z.string(),
  forras: z.enum(["teszt", "ai"]),
  forras_tipus: ForrasTipus,
  szolgaltato: z.string(),
  becsult_usd: z.number(),
});
export type OsszefoglaloValasz = z.infer<typeof OsszefoglaloValasz>;

/** AI-javaslatok a 2. lépéshez (E-8) — a válasz szerkezete kötött, a program ellenőrzi (javaslat, nem jogosultság). */
export const JavaslatokValasz = z.object({
  celkozonseg: z.string().trim().max(1000),
  cel: z.string().trim().max(1000),
  hangnem_leiras: z.string().trim().max(HANGNEM_LEIRAS_MAX),
  hangnem_minta: z.string().trim().max(1500),
  nyelvek: z.array(Tartalomnyelv).max(6),
  tartalomnyelv: Tartalomnyelv, // amelyen a minta íródott
  forras: z.enum(["teszt", "ai"]),
  // c30 F1: normalised by the server (onboarding/javaslatok.ts) — the AI's own answer, or the regex fallback with biztos: false
  szervezet_tipus: z.enum(SZERVEZET_TIPUSOK).optional(),
  kategoria: z.enum([...KATEGORIAK, "semleges"]).optional(),
  biztos: z.boolean().optional(),
  // c30 F6: the event's dates and town (festival only; normalised by the server, never invented — missing = unknown)
  rendezveny: z.object({
    mettol: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    meddig: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    hely: z.record(z.string(), z.string().trim().max(120)).optional(),
  }).optional(),
});
export type JavaslatokValasz = z.infer<typeof JavaslatokValasz>;

export const HangnemFinomitasKeres = z.object({
  irany: z.enum(["kozvetlenebb", "targyilagosabb", "egyedi", "kockak"]), // R-10: a jelölt hangnem-kockákból
  megjegyzes: z.string().trim().max(300).optional(),
  hangnem_leiras: z.string().trim().max(HANGNEM_LEIRAS_MAX),
  hangnem_minta: z.string().trim().max(1500),
  tartalomnyelv: Tartalomnyelv,
});
export type HangnemFinomitasKeres = z.infer<typeof HangnemFinomitasKeres>;

export const HangnemFinomitasValasz = z.object({
  hangnem_leiras: z.string().trim().max(HANGNEM_LEIRAS_MAX),
  hangnem_minta: z.string().trim().max(1500),
  forras: z.enum(["teszt", "ai"]),
});
export type HangnemFinomitasValasz = z.infer<typeof HangnemFinomitasValasz>;

/** Arculat-javaslat (E-9): az 1. lépés forrásaiból az AI tervezetet készít — csak jóváhagyás után válik szabállyá. */
export const ArculatJavaslatValasz = z.object({
  tervezet: ArculatTervezet,
  forras: z.enum(["teszt", "ai"]),
});
export type ArculatJavaslatValasz = z.infer<typeof ArculatJavaslatValasz>;

/** A jóváhagyott profil (R-06): a piszkozat jóváhagyáskor átkerül a szervezet profiljába, a piszkozat törlődik. */
/** R-18 6. kör (Kati D): egy hivatalos név három nyelven — bármelyik üres lehet (a hiányzót nem találjuk ki), de egy legalább kell. */
export const HivatalosNev = z.object({
  hu: z.string().trim().max(200).default(""),
  ro: z.string().trim().max(200).default(""),
  en: z.string().trim().max(200).default(""),
}).refine((n) => !!(n.hu || n.ro || n.en), { message: "ures" });
export type HivatalosNev = z.infer<typeof HivatalosNev>;
export const HIVATALOS_NEV_MAX = 200;

// R-18 7. kör (Csilla 10-12, IRANYOK-round7.md): a cég kínálata (szolgáltatás / termék / étel), az árak a posztokban, a közösségi oldal és a
// posztolási szokások, és a tématerv (téma + javasolt poszttípus). Mind a meglévő szervezet_profil.adatok jsonb-ben él (új tábla, új RLS nélkül).
/** A poszt fajtái (Posztszöveg chipsor): fotóalbum · Picmess kép · videó · szavazás · szöveges kártya. */
export const PosztTipus = z.enum(["album", "picmess", "video", "szavazas", "kartya"]);
export type PosztTipus = z.infer<typeof PosztTipus>;
/** Egy sor a kínálatból: név + amit a forrás mondott róla (pl. terület) + ár (üres = nincs) + bekapcsolva (kivett pipa = nem posztolunk róla). */
export const KinalatSor = z.object({
  nev: z.string().trim().min(1).max(160),
  reszlet: z.string().trim().max(200).default(""),
  ar: z.string().trim().max(60).default(""),
  aktiv: z.boolean().default(true),
});
export type KinalatSor = z.infer<typeof KinalatSor>;
export const KINALAT_MAX = 60;
/** Egy téma a tématervből, a javasolt poszttípussal. */
/** c30 F7 (plan §4): a festival's recurring topics. They are THEMES that use the formats (PosztTipus stays as it is). */
export const FESZTIVAL_TEMA_FAJTAK = ["visszaszamlalo", "holnapi_program", "mai_program", "fellepo", "gyakorlati", "album", "koszono"] as const;
export type FesztivalTemaFajta = (typeof FESZTIVAL_TEMA_FAJTAK)[number];
/** `fajta` (c30 F7): a festival topic's kind — a plain string so a stored unknown value never breaks a profile; readers normalise it. */
export const TemaTerv = z.object({ tema: z.string().trim().min(1).max(160), tipus: PosztTipus, fajta: z.string().trim().max(40).optional() });
export type TemaTerv = z.infer<typeof TemaTerv>;
export const TEMA_MAX = 12;

/** c30 F6: the event's dates and place (festival only). `hely` per content language: {"hu": "Marosvásárhely", "ro": "Târgu Mureș"}. */
export const Rendezveny = z.object({
  mettol: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  meddig: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  hely: z.partialRecord(Tartalomnyelv, z.string().trim().max(120)).optional(),
  belepo: z.string().trim().max(200).optional(),
  /** c30 F6 (Csilla 10-17): the town as the MACHINE last wrote it, per language. A second-language town equal to this is still the
   *  machine's — it is re-translated when the first-language town changes; one that differs is the person's and is never overwritten. */
  hely_gep: z.partialRecord(Tartalomnyelv, z.string().trim().max(120)).optional(),
});
export type Rendezveny = z.infer<typeof Rendezveny>;

export const SzervezetProfil = z.object({
  nev: z.string().trim().min(1).max(120),
  osszefoglalo: z.string().trim().min(1).max(4000),
  osszefoglalo_forras: MezoForras,
  osszefoglalo_modositva: z.boolean().default(false),
  celkozonseg: z.string().trim().max(1000),
  celkozonseg_forras: MezoForras,
  celkozonseg_modositva: z.boolean().default(false),
  cel: z.string().trim().max(1000),
  cel_forras: MezoForras,
  cel_modositva: z.boolean().default(false),
  nyelvek: z.array(Tartalomnyelv).max(18),
  nyelvek_forras: MezoForras,
  hangnem_leiras: z.string().trim().max(HANGNEM_LEIRAS_MAX),
  hangnem_minta: z.string().trim().max(1500),
  hangnem_nyelv: z.string().max(5),
  hangnem_forras: MezoForras,
  hangnem_modositva: z.boolean().default(false),
  arculat: ArculatLepes,
  kesobbre: z.array(z.enum(["celkozonseg", "cel", "nyelvek", "hangnem", "arculat"])), // a jóváhagyáskor hiányzó / későbbre hagyott részek
  jovahagyva: z.iso.datetime(),
  jovahagyta: z.uuid(),
  frissitve: z.iso.datetime().optional(), // az utolsó mentés a fiókoldalon (E-10); jóváhagyáskor nincs
  // R-18 6. kör (Kati D): a cég hivatalos nevei (intézmény, esemény, előadás) — minden fordítás és írás kötelező névpárjai.
  // A meglévő szervezet_profil.adatok jsonb-ben él (új tábla, új RLS nélkül — a profil sorát a saját szervezet szabálya védi).
  hivatalos_nevek: z.array(HivatalosNev).max(HIVATALOS_NEV_MAX).optional(),
  // R-18 7. kör: a honlap (a piszkozatból a jóváhagyáskor, vagy a kutatásból), a kínálat és árak, az oldal, a szokások, a tématerv.
  honlap: z.string().trim().max(500).optional(),
  kinalat: z.array(KinalatSor).max(KINALAT_MAX).optional(),
  kinalat_fajlok: z.array(z.uuid()).max(10).optional(), // a feltöltött étlap / árlista (PDF, fotó) — a fájltár „dokumentum” célú fájljai
  arak_posztban: z.boolean().optional(), // nincs = még nem válaszolt: a gép ilyenkor árat NEM ír
  kozossegi_oldal: z.string().trim().max(300).optional(),
  kepernyokepek: z.array(z.uuid()).max(5).optional(),
  poszt_szokasok: z.string().trim().max(800).optional(), // a képernyőképekből kiolvasva: hangnem, hossz, emoji, hashtag
  tema_terv: z.array(TemaTerv).max(TEMA_MAX).optional(),
  beallitas_r7: z.iso.datetime().optional(), // mikor zárult (vagy maradt félbe) a 7. kör beállítás-sora
  // c30 F1 (plan §1.2): type and category — plain strings, read ONLY through szervezetTipus() / kategoria() (apps/web
  // profil/tipus-szabaly.ts kategoriaOf adds the hospitality-regex fallback). Missing = today's behaviour (plan §1.7: no backfill).
  szervezet_tipus: z.string().trim().max(40).optional(),
  kategoria: z.string().trim().max(40).optional(),
  tipus_forras: z.string().trim().max(20).optional(), // "ai" (the machine, sure) | "sajat" (a person chose it — F6)
  // c30 F2 (plan §1.3): how a post uses two languages — "egy" (one language), "egyben" (both in one post, F3), "kulon" (separate
  // posts per language, today's behaviour). Plain string, read ONLY through profile-core `nyelvMod()`; missing = today's behaviour.
  poszt_nyelv_mod: z.string().trim().max(20).optional(),
  // c30 F6 (plan §1.2, rajz D2/D9a): the event (festival only) — dates, town per language, the optional entry line. `rendezveny` is
  // written only when a person confirms „Mikor és hol lesz?”; `rendezveny_javaslat` is the machine's guess copied at approval.
  // `program_forras`: where the programme was last read from (the Programod line „· a Word-fájlból”, and what „Újraolvasom” re-reads).
  rendezveny: Rendezveny.optional(),
  rendezveny_javaslat: Rendezveny.optional(),
  program_forras: z.object({ fajta: z.enum(["link", "pdf", "word", "foto"]), link: z.string().trim().max(500).optional(), ido: z.iso.datetime() }).optional(),
  // c30 F6b (live 10-17: a 60–120 s read was cut by the proxy at 60 s — „couldn't read" first, the result later): the read runs in the
  // background; this is its state, polled by the page. `fut` older than PROGRAM_OLVASAS_ELAKAD_MS counts as stuck (a restart mid-read).
  program_olvasas: z.object({
    id: z.uuid(),
    allapot: z.enum(["fut", "kesz", "hiba"]),
    fajta: z.enum(["link", "pdf", "word", "foto"]).optional(),
    kezdve: z.iso.datetime(),
    vege: z.iso.datetime().optional(),
    hiba: z.string().max(40).optional(),
    merleg: z.object({ beszurt: z.number().int(), frissitett: z.number().int(), torolt: z.number().int(), megtartott: z.number().int() }).optional(),
  }).optional(),
  // c30 F0 (docs/terv/FESZTIVAL-ES-NYELVI-MOD-TERV.md §8 risk 2; docs/decisions/2026-10-17-c30-f0-profil-biztositek.md):
  // the STORED profile keeps keys this version does not know. A plain z.object strips them on parse, so after a rollback the
  // next save by the older code would silently delete every newer field. `.loose()` (zod 4) passes them through untouched.
  // Only this stored shape is loose: input schemas (ProfilModositas and the per-field savers) stay non-loose, so a client
  // still cannot inject keys. Nested objects (arculat, kinalat rows, …) still strip unknown sub-keys: a new nested field
  // needs its own rollback-floor deploy first.
}).loose();
export type SzervezetProfil = z.infer<typeof SzervezetProfil>;

export const JovahagyasValasz = z.object({ profil: SzervezetProfil });
export type JovahagyasValasz = z.infer<typeof JovahagyasValasz>;
export const ProfilValasz = z.object({ profil: SzervezetProfil.nullable() });
export type ProfilValasz = z.infer<typeof ProfilValasz>;

/** A profil módosítása a fiókoldalon (E-10): egy vagy több mező; a kiszolgáló a forrást/módosítva jelet a v6 userEdit
 *  szabálya szerint állítja (saját érték, vagy módosított javaslat), a `kesobbre` listát újraszámolja. */
export const ProfilModositas = z.object({
  nev: z.string().trim().min(1).max(120).optional(),
  osszefoglalo: z.string().trim().min(1).max(4000).optional(),
  celkozonseg: z.string().trim().max(1000).optional(),
  cel: z.string().trim().max(1000).optional(),
  // Legalább egy nyelv: az üres lista a nyelvek törlése volna, nem mentés (hiba 2026-09-21).
  nyelvek: z.array(Tartalomnyelv).min(1).max(18).optional(),
  hangnem_leiras: z.string().trim().max(HANGNEM_LEIRAS_MAX).optional(),
  hangnem_minta: z.string().trim().max(1500).optional(),
  arculat: ArculatLepes.optional(),
});
export type ProfilModositas = z.infer<typeof ProfilModositas>;

/** A fiókoldal adatai (E-10): a szervezet és tagjai, a belépett ember. */
export const SzervezetReszletek = z.object({
  id: z.uuid(),
  nev: Nev,
  letrehozva: z.iso.datetime(),
  tagok: z.array(z.object({ fiok_id: z.uuid(), nev: Nev, szerep: Szerep })),
});
export type SzervezetReszletek = z.infer<typeof SzervezetReszletek>;

// ---------------------------------------------------------------------------
// F-7a (D-F35): csomag — melyik munkatér melyik modult használhatja. A pilotban egy csomag ("pilot", benne a Hírfigyelő), ár és fizetés nélkül.
// ---------------------------------------------------------------------------
/** A rendszer ismert moduljai — az első az egyetlen önálló modul (R-19). Új modul: ide, és a csomagok `modulok` mezőjébe. */
export const MODULOK = ["hirfigyelo"] as const;
export const Modul = z.enum(MODULOK);
export type Modul = z.infer<typeof Modul>;
export const ALAP_CSOMAG_KOD = "radar"; // F9-A9: a próbaidőszak csomagja a Radar (volt: pilot)
export const Csomag = z.object({
  kod: z.string().min(1).max(40),
  modulok: z.array(Modul),
  /** havi ár — a pilotban null (nincs ár); a pénznemmel együtt értelmes */
  ar_havi: z.number().nonnegative().nullable(),
  penznem: z.string().length(3).nullable(),
  /** F9-A8: legfeljebb ennyi forrás figyelhető; null = nincs korlát (a próbaidőszakban 5) */
  forras_max: z.number().int().positive().nullable(),
});
export type Csomag = z.infer<typeof Csomag>;

// ---------------------------------------------------------------------------
// R-11/B1b: az iránytű (D-F36) — nem a tartalom forrása, hanem a szűrője:
// a célok, a vízió, az értékek, az időszakok, a tolni/tiltott szavak és a kerülendő témák
// együtt döntik el, miről szabad és miről nem szabad írni. A forrás minden mezőnél
// a MezoForras (sajat/weboldal/ai), hogy az összhangjelzés tudja, honnan ered az érték.
// ---------------------------------------------------------------------------
/**
 * Az iránytű mezőinek felső határa. 2026-09-21 (Vilmos hibája): az AI hosszabb „Mikorra” szöveget írt a 60 karakteresnél,
 * a mentés és a jóváhagyás némán elbukott. A határok bővebbek lettek, és az AI-javaslat ezekre vágva érkezik.
 */
export const IRANYTU_HATAR = {
  nev: 200, miert: 1200, mikorra: 200, mirol_tudod: 600, magyarazat: 800, mit: 800, vizio: 2000, tiltott_szo: 80, tema: 200,
} as const;

export const IranytuCelSema = z.object({
  id: z.uuid(),
  nev: z.string().trim().min(1).max(IRANYTU_HATAR.nev),
  miert: z.string().trim().max(IRANYTU_HATAR.miert).default(""),
  mikorra: z.string().trim().max(IRANYTU_HATAR.mikorra).default(""),
  mirol_tudod: z.string().trim().max(IRANYTU_HATAR.mirol_tudod).default(""),
  forras: MezoForras,
});
export type IranytuCelSema = z.infer<typeof IranytuCelSema>;

export const IranytuErtekSema = z.object({
  id: z.uuid(),
  nev: z.string().trim().min(1).max(IRANYTU_HATAR.nev),
  magyarazat: z.string().trim().max(IRANYTU_HATAR.magyarazat).default(""),
  forras: MezoForras,
});
export type IranytuErtekSema = z.infer<typeof IranytuErtekSema>;

export const IranytuIdoszakSema = z.object({
  id: z.uuid(),
  nev: z.string().trim().min(1).max(IRANYTU_HATAR.nev),
  mettol: z.string().trim().default(""),
  meddig: z.string().trim().default(""),
  mit: z.string().trim().max(IRANYTU_HATAR.mit).default(""),
  forras: MezoForras,
});
export type IranytuIdoszakSema = z.infer<typeof IranytuIdoszakSema>;

export const IranytuTetelSema = z.object({
  id: z.uuid(),
  nev: z.string().trim().min(1).max(IRANYTU_HATAR.nev),
  forras: MezoForras,
});
export type IranytuTetelSema = z.infer<typeof IranytuTetelSema>;

export const IranytuSema = z.object({
  celok: z.array(IranytuCelSema).default([]),
  vizio: z.string().trim().max(IRANYTU_HATAR.vizio).default(""),
  vizio_forras: MezoForras,
  ertekek: z.array(IranytuErtekSema).default([]),
  idoszakok: z.array(IranytuIdoszakSema).default([]),
  tolni: z.array(IranytuTetelSema).default([]),
  tiltott_szavak: z.array(z.string().trim().max(IRANYTU_HATAR.tiltott_szo)).default([]),
  kerulendo_temak: z.array(z.string().trim().max(IRANYTU_HATAR.tema)).default([]),
});
export type IranytuSema = z.infer<typeof IranytuSema>;

export const IranytuVerzioSema = z.object({
  verzio: z.number().int().min(1),
  adatok: IranytuSema,
  jovahagyva: z.iso.datetime(),
  jovahagyta_nev: z.string().trim().default(""),
});
export type IranytuVerzioSema = z.infer<typeof IranytuVerzioSema>;

export const IranytuAllapotSema = z.object({
  tervezet: IranytuSema.nullable(),
  jovahagyott: IranytuSema.nullable(),
  jovahagyva: z.iso.datetime().nullable(),
  jovahagyta_nev: z.string().trim().default(""),
  verzio: z.number().int().default(0),
  van_tervezet: z.boolean(),
});
export type IranytuAllapotSema = z.infer<typeof IranytuAllapotSema>;

// R-11/A1: a Posztszöveg adatai. Egy munka = egy gondolat, három felületre és három nyelvre.
// Egy szöveg = egy felület + egy nyelv; a véglegesítés cellánként szól (P-1).
// Az eredetjelölés az UTOLSÓ AI-javaslathoz képest számol (A-4), ezért a javaslatot is eltesszük.

// R-17 C (Erika #20, Csilla 10-06): a negyedik felület — „Blog / honlap” cikk (cím + hosszabb szöveg, hashtag nélkül).
export const PosztFelulet = z.enum(["fb", "ig", "li", "blog"]);
export type PosztFelulet = z.infer<typeof PosztFelulet>;

// A PosztNyelv a meglévő Tartalomnyelv; nem csinálunk újat.
export const PosztNyelv = Tartalomnyelv;
export type PosztNyelv = z.infer<typeof PosztNyelv>;

/** A fajta kimenete (egy nyelven). Videó: a 45 mp-es forgatókönyv sorai + két másik kezdés; szavazás: kérdés + 2–4 válasz;
 *  fotóalbum: a képek sorrendje (a szöveg a poszt mezőjében); Picmess / szöveges kártya: a képre kerülő cím + egy sor. */
export const VideoSor = z.object({
  ido: z.string().trim().max(20),
  elmondod: z.string().trim().max(400),
  felirat: z.string().trim().max(60).default(""),
  kep: z.string().trim().max(160).default(""),
});
export type VideoSor = z.infer<typeof VideoSor>;
export const TipusAdat = z.object({
  tipus: PosztTipus,
  video: z.object({ sorok: z.array(VideoSor).max(10), hookok: z.array(z.string().trim().max(200)).max(3).default([]) }).optional(),
  szavazas: z.object({ kerdes: z.string().trim().max(200), valaszok: z.array(z.string().trim().max(80)).min(2).max(4) }).optional(),
  album: z.object({ kepek: z.array(z.string().trim().max(120)).max(10) }).optional(),
  kartya: z.object({ cim: z.string().trim().max(90), sor: z.string().trim().max(140).default("") }).optional(),
});
export type TipusAdat = z.infer<typeof TipusAdat>;

/** c30 F10: a poszt fotóalbuma (PosztForras.album). `gep`: ki tette sorba — „ai” (a gép válogatta) vagy „sorrend” (a gép nem volt elérhető:
 *  a készítés ideje szerint, egyenletesen). `allapot`: „fut” = a válogatás most fut (a háttérben), „kesz”, „hiba”. */
export const ALBUM_FOTO_POSZTBAN = 20;
export const PosztAlbum = z.object({
  fotok: z.array(z.object({ fajl_id: z.string().uuid(), leiras: z.string().trim().max(160).default("") })).max(ALBUM_FOTO_POSZTBAN).default([]),
  allapot: z.enum(["fut", "kesz", "hiba"]).default("kesz"),
  kezdve: z.string().max(40).optional(),
  gep: z.enum(["ai", "sorrend"]).optional(),
});
export type PosztAlbum = z.infer<typeof PosztAlbum>;

export const PosztForras = z.object({
  tipus: z.enum(["hir", "terv", "belso", "sajat"]),
  azonosito: z.string().trim().default(""),
  cim: z.string().trim().default(""),
  url: z.string().trim().default(""),
  szoveg: z.string().trim().max(4000).default(""),
  // R-15 (gepezet 5, 11): a gép írja a poszt megírásakor — a lista, a Kezdőlap és a Hírek kártyája ebből dolgozik
  rovid_nev: z.string().trim().max(60).default(""),
  rovid_cim: z.string().trim().max(160).default(""),
  otlet: z.string().trim().max(160).default(""),
  // R-15 (gepezet 19): a poszt képe — a fájltár egy "kep" célú fájlja; üres = nincs kép. Egy kép több poszthoz is mehet.
  kep_fajl_id: z.string().trim().default(""),
  // R-18 6. kör (Kati C, Csilla 10-11): a cselekvésre hívás nyelvenként — a „Beleírom” a poszt utolsó bekezdésének teszi, az újraírás megtartja
  cta: z.record(z.string(), z.string().trim().max(300)).optional(),
  // R-18 7. kör: a poszt fajtája (nincs = a mai szöveges poszt), a témából javasolt fajta, és fajtánként a gép kimenete nyelvenként
  poszt_tipus: PosztTipus.optional(),
  tipus_javasolt: PosztTipus.optional(),
  tipus_adat: z.record(z.string(), TipusAdat).optional(),
  // R-18 8. kör (Kati 10-13: „Kép szerkesztése”): a poszthoz tett kép szerkesztő-beállításai (minta, mezők, színváltozat, méret, román mezők) —
  // ebből nyílik újra a szerkesztő ugyanígy. A fotók nem (azok a fájltárban vannak, a szerkesztőben újra hozzáadhatók).
  kep_beallitas: z.object({
    helyzet: z.string().max(20),
    ertek: z.record(z.string(), z.string().max(400)),
    valtozat: z.string().max(20).default(""),
    meret: z.string().max(20).default(""),
    ro: z.record(z.string(), z.string().max(400)).optional(), // a c30 F4 előtti mentés: a második nyelv román volt (olvasva marad)
    // c30 F4 (Csilla 10-17): a második nyelvű kép mezői a valódi nyelvvel — mostantól ez íródik (a szervezet második nyelve, pl. „de”)
    masik: z.object({ nyelv: Tartalomnyelv, ertek: z.record(z.string(), z.string().max(400)) }).optional(),
  }).optional(),
  // R-18 8. kör · Naptár (Csilla 10-14, zárt válasz 2): a „Poszt törlése” puha törlés — a sor marad, csak minden lista elrejti (10 mp-ig
  // „Visszavonás”, és utána sem vész el semmi). Az időpont ISO. Nincs új tábla, nincs új oszlop: a meglévő forras jsonb-ben.
  torolve: z.string().max(40).optional(),
  // c30 F10 (terv §1.5, §6; rajz D8a–c): a fotóalbum — a gép (vagy a felhasználó) választotta fotók a poszt sorrendjében (≤ 20; a fotók a
  // fájltár `album` célú sorai, az album kulcsa a poszt id-je), és a válogatás állapota („fut”: a gép most válogat — a lap várakozik).
  // Hibás tartalom soha nem teszi olvashatatlanná a posztot (`.catch`): akkor nincs album, a fotók a fájltárban megmaradnak.
  album: PosztAlbum.optional().catch(undefined),
  // „Levétel a naptárból”: a poszt megmarad, csak a naptárról kerül le — a korábbi napjai itt, hogy a „Visszavonás” visszaadja őket.
  naptar_le: z.object({
    tervezett_nap: z.string().max(10).nullable(),
    javasolt_nap: z.string().max(10).nullable(),
    kiteve: z.string().max(40).nullable(),
    ido: z.string().max(40),
  }).optional(),
});
export type PosztForras = z.infer<typeof PosztForras>;



export const PosztSzoveg = z.object({
  felulet: PosztFelulet,
  nyelv: PosztNyelv,
  szoveg: z.string().trim().max(6000).default(""),
  // Az utolsó AI-javaslat; ehhez képest számoljuk az eredetjelölést (A-4).
  javaslat: z.string().trim().max(6000).default(""),
  hashtagek: z.array(z.string().trim()).default([]),
  allapot: z.enum(["nincs", "javaslat", "szerkesztve", "vegleges"]),
  veglegesitve: z.iso.datetime().nullable(),
  nyelvre_szabva: z.boolean().default(false),
  elavult_forditas: z.boolean().default(false),
  // R-17 C2: a cikk címe — csak a „blog” felületen (a többinél nincs). A gép a szöveggel együtt írja; kézzel is átírható.
  cim: z.string().trim().max(200).optional(),
});
export type PosztSzoveg = z.infer<typeof PosztSzoveg>;

export const OsszhangAllapot = z.object({
  allapot: z.enum(["ok", "ellentmond", "nem_futott"]),
  mondat: z.string().trim().default(""),
  // Melyik iránytű-pont; a pont szövege is megmarad.
  pont: z.string().trim().default(""),
  pont_szoveg: z.string().trim().default(""),
  szovegresz: z.string().trim().default(""),
  teendok: z.array(z.string().trim()).default([]),
  ideje: z.iso.datetime().nullable(),
});
export type OsszhangAllapot = z.infer<typeof OsszhangAllapot>;

export const PosztMunka = z.object({
  id: z.uuid(),
  szervezet_id: z.uuid(),
  cim: z.string().trim().max(200),
  forras: PosztForras,
  szovegek: z.array(PosztSzoveg).default([]),
  // Amíg nincs szöveg, nincs mit vizsgálni — ilyenkor nincs jelzés sem (R-11/A 02).
  osszhang: OsszhangAllapot.nullable(),
  // A piros összhangjelzés ténye a véglegesítés után is megmarad (A-6).
  piros_veglegesites: z.boolean().default(false),
  letrehozva: z.iso.datetime(),
  frissitve: z.iso.datetime(),
});
export type PosztMunka = z.infer<typeof PosztMunka>;

export const PosztMunkaLista = z.object({
  id: z.uuid(),
  cim: z.string().trim().max(200),
  forras_tipus: z.enum(["hir", "terv", "belso", "sajat"]),
  // A-8: ugyanabból a hírből ugyanaz a munka nyílik meg — ezért a lista is hozza a forrás azonosítóját.
  forras_azonosito: z.string().trim().default(""),
  allapot: z.enum(["nincs", "javaslat", "szerkesztve", "vegleges"]),
  piros_veglegesites: z.boolean().default(false),
  frissitve: z.iso.datetime(),
});
export type PosztMunkaLista = z.infer<typeof PosztMunkaLista>;

// ---- c30 F5 (terv §1.4, §3): a rendezvény programja (program_tetel, 0174) ----
/** c30 F6b: a background programme read still „fut" after this long is reported as stuck (the server restarted mid-read). */
export const PROGRAM_OLVASAS_ELAKAD_MS = 10 * 60 * 1000;
export const PROGRAM_FAJTAK = ["koncert", "eloadas", "gyerek", "jatek", "workshop", "kiallitas", "gasztro", "vasar", "unnepseg", "egyeb"] as const;
export const ProgramFajta = z.enum(PROGRAM_FAJTAK);
export type ProgramFajta = z.infer<typeof ProgramFajta>;
/** Nyelvenként egy szöveg: {"hu": "…", "ro": "…"} — csak tartalomnyelv-kulcs. */
export const ProgramNyelvi = z.partialRecord(Tartalomnyelv, z.string().trim().max(400));
export type ProgramNyelvi = z.infer<typeof ProgramNyelvi>;
const PROGRAM_NAP = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const PROGRAM_IDO = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
/** Egy programtétel, ahogy a végpontok adják. `nap` null = a rendezvény egészére; `kezdes` null = egész nap. */
export const ProgramTetel = z.object({
  id: z.string().uuid(),
  nap: PROGRAM_NAP.nullable(),
  kezdes: PROGRAM_IDO.nullable(),
  vege: PROGRAM_IDO.nullable(),
  nev: ProgramNyelvi,
  leiras: ProgramNyelvi,
  helyszin: ProgramNyelvi,
  fellepo: z.string().trim().max(200),
  fajta: ProgramFajta,
  jegy: z.string().trim().max(200),
  bizonytalan: z.boolean(),
  aktiv: z.boolean(),
  forras: z.enum(["gep", "sajat"]),
  modositva: z.boolean(),
  kep_fajl_id: z.string().uuid().nullable(), // c30 F6 (rajz D4 „Fotó hozzá”): a fájltár egy saját fájlja
});
export type ProgramTetel = z.infer<typeof ProgramTetel>;
/** Egy tétel szerkeszthető mezői (POST új saját tétel / PUT módosítás) — a gép-mezők (forras, modositva) nem írhatók kívülről. */
export const ProgramTetelMezok = z.object({
  nap: PROGRAM_NAP.nullable(),
  kezdes: PROGRAM_IDO.nullable(),
  vege: PROGRAM_IDO.nullable(),
  nev: ProgramNyelvi,
  leiras: ProgramNyelvi,
  helyszin: ProgramNyelvi,
  fellepo: z.string().trim().max(200),
  fajta: ProgramFajta,
  jegy: z.string().trim().max(200),
  bizonytalan: z.boolean(),
  aktiv: z.boolean(),
  kep_fajl_id: z.string().uuid().nullable(),
}).partial();
export type ProgramTetelMezok = z.infer<typeof ProgramTetelMezok>;
/** Szervezetenként legfeljebb ennyi (nem törölt) tétel (terv §1.4). */
export const PROGRAM_MAX_TETEL = 400;
