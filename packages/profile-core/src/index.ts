// @rogton/profile-core — az ügyfélprofil SZABÁLYAI (ALAPTERV 2.: profil, arculati verziók, jóváhagyás szabályai).
// Tiszta függvények: nincs adatbázis, nincs képernyő, nincs hálózat. A tárolást a befogadó alkalmazás adja
// (ProfilTar), a képernyők csak hívják. Az onboarding EZT használja az átadáskor; ez az onboardingot nem ismeri.
import type { ArculatLepes, ArculatLogok, ArculatTervezet, MezoForras, OnboardingPiszkozat, ProfilModositas } from "@rogton/contracts";
import { POSZT_NYELV_MODOK, Rendezveny, SzervezetProfil, TARTALOMNYELVEK, kategoria, szervezetTipus, type PosztNyelvMod, type Tartalomnyelv } from "@rogton/contracts";

// ---------------------------------------------------------------------------
// Eredet-szabály (v6 userEdit): kézi szerkesztés → saját érték, vagy módosított javaslat
// ---------------------------------------------------------------------------
export function sajatVagyModositott(f: MezoForras): { forras: MezoForras; modositva: boolean } {
  return f === "" || f === "sajat" ? { forras: "sajat", modositva: false } : { forras: f, modositva: true };
}

// ---------------------------------------------------------------------------
// A későbbre hagyott / hiányzó részek (v6 missingKeys)
// ---------------------------------------------------------------------------
export type Kesobbre = SzervezetProfil["kesobbre"][number];
export function kesobbreLista(p: Pick<SzervezetProfil, "celkozonseg" | "cel" | "nyelvek" | "hangnem_leiras" | "arculat">): Kesobbre[] {
  const ki: Kesobbre[] = [];
  if (!p.celkozonseg.trim()) ki.push("celkozonseg");
  if (!p.cel.trim()) ki.push("cel");
  if (p.nyelvek.length === 0) ki.push("nyelvek");
  if (!p.hangnem_leiras.trim()) ki.push("hangnem");
  if (p.arculat.allapot !== "jovahagyott") ki.push("arculat");
  return ki;
}

// ---------------------------------------------------------------------------
// Jóváhagyás (R-06): a piszkozatból profil lesz — a szabály itt, a tárolás a befogadóé
// ---------------------------------------------------------------------------
export type JovahagyasEredmeny = { ok: true; profil: SzervezetProfil } | { ok: false; hiba: "HIANYOS_PROFIL"; mezok: Record<string, string> };

/** Név és elfogadott tevékenységleírás a minimális befejezési feltétel (ATADO 6.1). */
export function profilPiszkozatbol(piszkozat: OnboardingPiszkozat, jovahagyta: string, most: Date = new Date()): JovahagyasEredmeny {
  const b = piszkozat.bemutatkozas, k = piszkozat.kommunikacio;
  const nev = b.nev.trim(), osszefoglalo = b.osszefoglalo.trim();
  const mezok: Record<string, string> = {};
  if (!nev) mezok["nev"] = "ures";
  if (!osszefoglalo) mezok["osszefoglalo"] = "ures";
  if (Object.keys(mezok).length > 0) return { ok: false, hiba: "HIANYOS_PROFIL", mezok };
  const hangnemKesobb = k.hangnem_kesobb || !k.hangnem_leiras.trim();
  const profil: SzervezetProfil = {
    nev, osszefoglalo,
    osszefoglalo_forras: b.osszefoglalo_forras || "sajat",
    osszefoglalo_modositva: b.osszefoglalo_modositva,
    celkozonseg: k.celkozonseg_kesobb ? "" : k.celkozonseg.trim(),
    celkozonseg_forras: k.celkozonseg_kesobb ? "" : k.celkozonseg_forras,
    celkozonseg_modositva: k.celkozonseg_kesobb ? false : k.celkozonseg_modositva,
    cel: k.cel_kesobb ? "" : k.cel.trim(),
    cel_forras: k.cel_kesobb ? "" : k.cel_forras,
    cel_modositva: k.cel_kesobb ? false : k.cel_modositva,
    nyelvek: k.nyelvek, nyelvek_forras: k.nyelvek_forras,
    hangnem_leiras: hangnemKesobb ? "" : k.hangnem_leiras.trim(),
    hangnem_minta: hangnemKesobb ? "" : k.hangnem_minta.trim(),
    hangnem_nyelv: hangnemKesobb ? "" : k.hangnem_nyelv,
    hangnem_forras: hangnemKesobb ? "" : k.hangnem_forras,
    hangnem_modositva: hangnemKesobb ? false : k.hangnem_modositva,
    arculat: piszkozat.arculat,
    kesobbre: [],
    jovahagyva: most.toISOString(),
    jovahagyta,
  };
  profil.kesobbre = kesobbreLista(profil);
  // c30 F1 (plan §2 Part A): the machine's type + category guess is copied ONLY when it was sure (D13: unsure and unanswered =
  // company, so nothing is stored and the readers fall back: type "ceg", category = the hospitality regex). A festival's category
  // is not stored. Plain strings through the normalisers; `tipus_forras` = "ai" (a person's own choice will be "sajat", F6).
  // c30 F6 (rajz D1): the person's own answer (the question, or „Átírom”) is copied too, as tipus_forras "sajat".
  if (b.tipus_biztos === true || b.tipus_sajat === true) {
    const tipus = szervezetTipus(b.szervezet_tipus);
    const kat = kategoria(b.kategoria);
    profil.szervezet_tipus = tipus;
    if (tipus === "ceg" && kat !== "semleges") profil.kategoria = kat;
    profil.tipus_forras = b.tipus_sajat === true ? "sajat" : "ai";
    // c30 F6 (rajz D2): a festival's machine-read dates and town — a guess that only pre-fills „Mikor és hol lesz?”
    if (tipus === "fesztival" && b.rendezveny) {
      const r = Rendezveny.safeParse(b.rendezveny);
      if (r.success && (r.data.mettol || r.data.meddig || r.data.hely)) profil.rendezveny_javaslat = r.data;
    }
  }
  return { ok: true, profil };
}

// ---------------------------------------------------------------------------
// Módosítás a fiókoldalon: mezőnként, az eredet-szabállyal; üres mezőbe írt érték saját érték
// ---------------------------------------------------------------------------
export function profilModositasAlkalmaz(profil: SzervezetProfil, m: ProfilModositas, most: Date = new Date()): SzervezetProfil {
  const p: SzervezetProfil = { ...profil, arculat: { ...profil.arculat } };
  function szoveg(mezo: "osszefoglalo" | "celkozonseg" | "cel" | "hangnem_leiras", forrasKulcs: "osszefoglalo_forras" | "celkozonseg_forras" | "cel_forras" | "hangnem_forras", modKulcs: "osszefoglalo_modositva" | "celkozonseg_modositva" | "cel_modositva" | "hangnem_modositva", uj: string) {
    const uresVolt = !p[mezo].trim();
    const u = uresVolt ? { forras: "sajat" as const, modositva: false } : sajatVagyModositott(p[forrasKulcs]);
    p[mezo] = uj;
    p[forrasKulcs] = u.forras as never;
    p[modKulcs] = u.modositva;
  }
  if (m.nev !== undefined) p.nev = m.nev;
  if (m.osszefoglalo !== undefined) szoveg("osszefoglalo", "osszefoglalo_forras", "osszefoglalo_modositva", m.osszefoglalo);
  if (m.celkozonseg !== undefined) szoveg("celkozonseg", "celkozonseg_forras", "celkozonseg_modositva", m.celkozonseg);
  if (m.cel !== undefined) szoveg("cel", "cel_forras", "cel_modositva", m.cel);
  if (m.hangnem_leiras !== undefined) {
    szoveg("hangnem_leiras", "hangnem_forras", "hangnem_modositva", m.hangnem_leiras);
    // A minta mondat a leíráshoz tartozik: ha a leírással együtt jön, azt tesszük el; ha nem, a régi
    // minta már nem illik az új leíráshoz, ezért kiürül (mint eddig).
    p.hangnem_minta = m.hangnem_minta ?? "";
  } else if (m.hangnem_minta !== undefined) {
    p.hangnem_minta = m.hangnem_minta;
    const u = sajatVagyModositott(p.hangnem_forras);
    p.hangnem_forras = u.forras as never;
    p.hangnem_modositva = u.modositva;
  }
  if (m.nyelvek !== undefined) { p.nyelvek = m.nyelvek; p.nyelvek_forras = "sajat"; }
  if (m.arculat !== undefined) p.arculat = m.arculat;
  p.kesobbre = kesobbreLista(p);
  p.frissitve = most.toISOString();
  return p;
}

// ---------------------------------------------------------------------------
// Arculati állapotgép (ATADO 7., v6): nincs → tervezet → (kesobb | jovahagyott); jóváhagyott szerkesztése új
// tervezet (verzio+1), a jóváhagyott pillanatképe megmarad; a tervezet elvethető → a jóváhagyott áll vissza.
// ---------------------------------------------------------------------------
/** Semleges alapértékek az ügyfélkreatívhoz (v6 KM_BRAND_DEFAULTS) — SOHA nem a SaaS-téma. */
export const ARCULAT_ALAP = { elsodleges: "#4a4a4a", masodlagos: "#9a9a9a", hatter: "#f2f2ef", betu_cim: "Georgia, serif", betu_szoveg: "system-ui, sans-serif" } as const; /* tokenőr: ok — ügyfél-arculat semleges alapértékei */

export function uresTervezet(): ArculatTervezet {
  return {
    ...ARCULAT_ALAP, betu_cim: "", betu_szoveg: "", betu_iranymutatas: "", kepvilag: "", kovetendo: "", kerulendo: "", lekerekites: 8, nyelv: "hu", eredet: "ai", modositva: false,
    logo_fajl_id: null, // F-6: alapból nincs logó-fájl
    // R-16 K1 (TERV 1.2): a négy logóhely és az R-16 új mezői — mind üres alapértékkel
    logok: { vilagos: null, sotet: null, egyszinu: null, negyzetes: null },
    szin_forras: "", szin_szett: "", szin_jeloltek: [], forras_cim: "", nevlogo_stilus: null,
  };
}

/** R-16 K1 (TERV 1.2): a `logo_fajl_id` a `logok.vilagos` tükre. Ha a módosítás csak az egyiket adja, a másik követi —
 *  különben a beolvasáskori átalakítás (`logok.vilagos ?? logo_fajl_id`) a régi `logok.vilagos`-t hozná vissza. */
function logoTukor(alap: ArculatTervezet, resz: Partial<ArculatTervezet>): Partial<ArculatTervezet> {
  if (resz.logok !== undefined) return { ...resz, logo_fajl_id: resz.logok.vilagos };
  if (resz.logo_fajl_id !== undefined) return { ...resz, logok: { ...alap.logok, vilagos: resz.logo_fajl_id } };
  return resz;
}

export function arculatModosit(a: ArculatLepes, resz: Partial<ArculatTervezet>): ArculatLepes {
  const volt = a.allapot === "jovahagyott";
  const alap = a.tervezet ?? uresTervezet();
  return { ...a, tervezet: { ...alap, ...logoTukor(alap, resz), modositva: true }, allapot: "tervezet", verzio: volt ? a.verzio + 1 : a.verzio, jovahagyott_verzio: volt ? a.verzio : a.jovahagyott_verzio };
}

/** Jóváhagyás: a tervezetből pillanatkép lesz. R-16 K1 (TERV 1.2): a `logok` a jóváhagyás pillanatában ténylegesen használt
 *  logók (a befogadó oldja fel a fájlokból: `hasznaltLogok`) — így a verziótörténet megmondja, melyik logók voltak érvényben. */
export function arculatJovahagy(a: ArculatLepes, most: Date = new Date(), logok?: ArculatLogok): ArculatLepes {
  if (!a.tervezet) return a;
  const t: ArculatTervezet = logok ? { ...a.tervezet, logok: { ...logok }, logo_fajl_id: logok.vilagos } : a.tervezet;
  return { ...a, tervezet: t, allapot: "jovahagyott", jovahagyott_verzio: a.verzio, verziok: { ...a.verziok, [String(a.verzio)]: { ...t, jovahagyva: most.toISOString(), verzio: a.verzio } } };
}

/** R-16 (kerdesek 4): minden „Ez legyen” ment ÉS jóváhagy — egy lépésben: módosítás (új verzió, ha jóváhagyott volt), majd jóváhagyás.
 *  Tervezet nélkül az üres tervezetből indul. */
export function arculatValasztJovahagy(a: ArculatLepes, resz: Partial<ArculatTervezet>, most: Date = new Date(), logok?: ArculatLogok): ArculatLepes {
  return arculatJovahagy(arculatModosit(a, resz), most, logok);
}

export type ArculatOsszefesulEredmeny = { ok: true; arculat: ArculatLepes } | { ok: false; hiba: "ELAVULT_ADAT" };

/**
 * R-16 K1 (TERV 1.7 R2): a régi fiókoldali doboz a TELJES arculatot küldi a lap megnyitásakori állapotból. Egy elavult lap
 * így eltüntethetne egy közben (másik lapon) született jóváhagyást. A szabály:
 *  1. a pillanatképek megváltoztathatatlanok: `verziok = { ...bejovo.verziok, ...szerver.verziok }` — ami a kiszolgálón van, az marad;
 *  2. ha a beküldött jóváhagyott verzió régebbi, mint a tárolt → ELAVULT_ADAT;
 *  3. ha a beküldött verziószám kisebb a tároltnál → ELAVULT_ADAT, KIVÉVE a tervezet elvetését (`arculatTervezetElvet`): akkor a
 *     tárolt verziónak nincs pillanatképe (jóvá nem hagyott tervezet volt), és a beküldött verzió a tárolt jóváhagyottra áll vissza.
 */
export function arculatOsszefesul(szerver: ArculatLepes, bejovo: ArculatLepes): ArculatOsszefesulEredmeny {
  const szJv = szerver.jovahagyott_verzio ?? 0;
  const beJv = bejovo.jovahagyott_verzio ?? 0;
  if (beJv < szJv) return { ok: false, hiba: "ELAVULT_ADAT" };
  if (bejovo.verzio < szerver.verzio) {
    const elvetes = szerver.verziok[String(szerver.verzio)] === undefined && bejovo.verzio >= szJv;
    if (!elvetes) return { ok: false, hiba: "ELAVULT_ADAT" };
  }
  return { ok: true, arculat: { ...bejovo, verziok: { ...bejovo.verziok, ...szerver.verziok } } };
}

export function arculatTervezetElvet(a: ArculatLepes): ArculatLepes {
  const jv = a.jovahagyott_verzio;
  const kep = jv === null ? undefined : a.verziok[String(jv)];
  if (!kep || jv === null) return a;
  const { jovahagyva: _j, verzio: _v, ...vissza } = kep;
  return { ...a, tervezet: vissza, allapot: "jovahagyott", verzio: jv };
}
export function arculatKesobbre(a: ArculatLepes): ArculatLepes { return { ...a, allapot: "kesobb" }; }
export function arculatMegis(a: ArculatLepes): ArculatLepes { return { ...a, allapot: a.tervezet ? "tervezet" : "nincs" }; }
export function arculatVisszavon(a: ArculatLepes): ArculatLepes { return { ...a, allapot: "tervezet" }; }
/** Az AI tervezete csak akkor kerül be, ha még nincs semmi (v6 seedStep2). */
export function arculatTervezetBefogad(a: ArculatLepes, tervezet: ArculatTervezet): ArculatLepes {
  return a.tervezet || a.allapot !== "nincs" ? a : { ...a, allapot: "tervezet", tervezet };
}

// ---------------------------------------------------------------------------
// c30 F2 (docs/terv/FESZTIVAL-ES-NYELVI-MOD-TERV.md §1.3; docs/decisions/2026-10-17-c30-f2-nyelvmod.md): the post language mode and
// the second language — pure readers. Nothing writes `poszt_nyelv_mod` yet (the setup step and the Settings switch are F3).
// ---------------------------------------------------------------------------
type NyelvProfil = { nyelvek?: readonly string[] | null; poszt_nyelv_mod?: unknown };

/** The post language mode. One (or no) content language → always "egy" (there is nothing to pair). Otherwise the stored mode if it
 *  is a known one, else "kulon" — exactly what every org has today (each language is its own post, reached by „Más nyelven”). */
export function nyelvMod(p: NyelvProfil | null | undefined): PosztNyelvMod {
  const nyelvek = Array.isArray(p?.nyelvek) ? p.nyelvek : [];
  if (nyelvek.length < 2) return "egy";
  const t = typeof p?.poszt_nyelv_mod === "string" ? p.poszt_nyelv_mod.trim() : "";
  return (POSZT_NYELV_MODOK as readonly string[]).includes(t) ? (t as PosztNyelvMod) : "kulon";
}

/** The org's second content language (the order of `nyelvek` is the order of a joined post), or null. */
export function masodikNyelv(p: NyelvProfil | null | undefined): Tartalomnyelv | null {
  const n = Array.isArray(p?.nyelvek) ? p.nyelvek[1] : undefined;
  return typeof n === "string" && (TARTALOMNYELVEK as readonly string[]).includes(n) ? (n as Tartalomnyelv) : null;
}

/** The „Más nyelven” menu (plan §5): hu, ro, en first — as today, nothing removed — then every other profile language in profile
 *  order. Unknown codes and duplicates are dropped. */
export function masNyelvenLista(nyelvek: readonly unknown[] | null | undefined): Tartalomnyelv[] {
  const ki: Tartalomnyelv[] = ["hu", "ro", "en"];
  for (const n of Array.isArray(nyelvek) ? nyelvek : []) {
    if (typeof n === "string" && (TARTALOMNYELVEK as readonly string[]).includes(n) && !ki.includes(n as Tartalomnyelv)) ki.push(n as Tartalomnyelv);
  }
  return ki;
}

// ---------------------------------------------------------------------------
// Tárolási kapu: ezt adja a befogadó (host-adapters / apps/web). A modulok csak ezen át érik el a profilt.
// ---------------------------------------------------------------------------
export interface ProfilTar {
  /** The approved profile, or null. Null ONLY when: no row (or not visible under RLS), the stored jsonb is not an object, or a
   *  core field (`PROFIL_MAG`) is missing/invalid. A bad or unknown non-core field never makes it null (c30 F0, `profilTureloOlvas`). */
  betolt(szervezetId: string): Promise<SzervezetProfil | null>;
  /** Full write of the profile. Keeps stored keys this version cannot represent (`profilMentesre`). */
  ment(szervezetId: string, profil: SzervezetProfil): Promise<void>;
  /** c30 F0: merge write of NON-core fields (`adatok = adatok || patch`) in the org's own tenant context. New code uses this. */
  mezoMent(szervezetId: string, patch: ProfilMezok): Promise<MezoMentEredmeny>;
}

// ---------------------------------------------------------------------------
// c30 F0 — profile safety net (docs/terv/FESZTIVAL-ES-NYELVI-MOD-TERV.md §1.1, §8 risks 1–4;
// docs/decisions/2026-10-17-c30-f0-profil-biztositek.md). Pure functions; the host's store (apps/web/profil/tar.ts) calls them.
// ---------------------------------------------------------------------------
type Shape = typeof SzervezetProfil.shape;
const ALAK: Record<string, Shape[keyof Shape]> = SzervezetProfil.shape;

/** The core: every field the stored profile cannot exist without (required, no default). Derived from the schema, so a new
 *  optional field is automatically non-core. Today: nev, osszefoglalo(+_forras), celkozonseg(+_forras), cel(+_forras), nyelvek(+_forras),
 *  hangnem_leiras, hangnem_minta, hangnem_nyelv, hangnem_forras, arculat, kesobbre, jovahagyva, jovahagyta. */
export const PROFIL_MAG: readonly string[] = Object.keys(ALAK).filter((k) => !ALAK[k]!.safeParse(undefined).success);
const MAG = new Set(PROFIL_MAG);
/** `kesobbre` is derived (recomputed by `kesobbreLista` on every change), so unknown entries are filtered, not fatal. */
const SZARMAZTATOTT = "kesobbre";

const sima = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);

export type TureloOlvasas =
  | { ok: true; profil: SzervezetProfil; kihagyott: string[] }
  | { ok: false; ok_hiba: "NEM_OBJEKTUM" | "HIBAS_MAG"; mezok: string[] };

/**
 * Forward-compatible read of a stored profile (risk 1). A full parse first. If it fails, every top-level field whose value does
 * not parse is LEFT OUT of the returned profile (`kihagyott`), so callers keep their types; unknown keys pass through (`.loose()`).
 * It fails only when the stored value is not an object or a core field is missing/invalid (`HIBAS_MAG`, with the field names).
 * The left-out raw values stay in the database: `profilMentesre` puts them back on the next full save.
 */
export function profilTureloOlvas(nyers: unknown): TureloOlvasas {
  if (!sima(nyers)) return { ok: false, ok_hiba: "NEM_OBJEKTUM", mezok: [] };
  const elso = SzervezetProfil.safeParse(nyers);
  if (elso.success) return { ok: true, profil: elso.data, kihagyott: [] };
  const masolat: Record<string, unknown> = { ...nyers };
  const kihagyott: string[] = [];
  let issues = elso.error.issues;
  for (let kor = 0; kor < 3; kor++) {
    const kulcsok = [...new Set(issues.map((i) => (typeof i.path[0] === "string" ? i.path[0] : "")))];
    const magHiba = kulcsok.filter((k) => k === "" || (MAG.has(k) && k !== SZARMAZTATOTT));
    if (magHiba.length) return { ok: false, ok_hiba: "HIBAS_MAG", mezok: magHiba };
    for (const k of kulcsok) {
      if (k === SZARMAZTATOTT && Array.isArray(masolat[k])) {
        masolat[k] = (masolat[k] as unknown[]).filter((x) => (ALAK[k] as Shape["kesobbre"]).element.safeParse(x).success);
      } else { delete masolat[k]; }
      if (!kihagyott.includes(k)) kihagyott.push(k);
    }
    const ujra = SzervezetProfil.safeParse(masolat);
    if (ujra.success) return { ok: true, profil: ujra.data, kihagyott };
    issues = ujra.error.issues;
  }
  return { ok: false, ok_hiba: "HIBAS_MAG", mezok: [...new Set(issues.map((i) => String(i.path[0] ?? "")))] };
}

/**
 * What a full save writes (risk 2): the new profile, plus every stored top-level key the new profile does not carry AND this
 * version cannot represent — unknown to the schema, or present but unparseable (left out by `profilTureloOlvas`). The code could
 * not have meant to delete what it could not read. A known, valid key that the new profile leaves out is still removed, as before.
 */
export function profilMentesre(tarolt: unknown, uj: SzervezetProfil): { adatok: Record<string, unknown>; megorzott: string[] } {
  const adatok: Record<string, unknown> = { ...uj };
  const megorzott: string[] = [];
  if (!sima(tarolt)) return { adatok, megorzott };
  for (const [k, v] of Object.entries(tarolt)) {
    if (adatok[k] !== undefined) continue;
    const alak = ALAK[k];
    if (!alak || !alak.safeParse(v).success) { adatok[k] = v; megorzott.push(k); }
  }
  return { adatok, megorzott };
}

/** The core keys as a type (kept in step with `PROFIL_MAG` by the F0 test). */
export const PROFIL_MAG_TIPUS = ["nev", "osszefoglalo", "osszefoglalo_forras", "celkozonseg", "celkozonseg_forras", "cel", "cel_forras", "nyelvek",
  "nyelvek_forras", "hangnem_leiras", "hangnem_minta", "hangnem_nyelv", "hangnem_forras", "arculat", "kesobbre", "jovahagyva", "jovahagyta"] as const;
/** A merge-write patch: some KNOWN non-core profile fields. (`Pick` over the schema's own keys: the loose type's index signature
 *  would make `Omit` keep nothing but `[k: string]: unknown`.) */
export type ProfilMezok = Partial<Pick<SzervezetProfil, Exclude<keyof Shape, (typeof PROFIL_MAG_TIPUS)[number]>>>;
export type MezoMentEredmeny = { ok: true; sorok: number } | { ok: false; hiba: "ERVENYTELEN_ADAT"; mezok: Record<string, string> };

/**
 * Checks a merge-write patch before it reaches SQL (risk 4). Every key must be a KNOWN, NON-core profile field and its value must
 * parse with that field's own schema (the parsed value is what gets written: trimmed, defaults applied). Unknown keys are refused
 * (no injection through the merge path), core keys are refused (they have derived rules: `profilModositasAlkalmaz`), `null` is
 * refused (it would store an unreadable value). An empty patch is refused.
 */
export function profilMezokEllenoriz(patch: unknown): { ok: true; patch: Record<string, unknown> } | { ok: false; mezok: Record<string, string> } {
  if (!sima(patch)) return { ok: false, mezok: { "": "nem_objektum" } };
  const ki: Record<string, unknown> = {};
  const mezok: Record<string, string> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    const alak = ALAK[k];
    if (!alak) { mezok[k] = "ismeretlen"; continue; }
    if (MAG.has(k)) { mezok[k] = "mag_mezo"; continue; }
    const e = alak.safeParse(v);
    if (!e.success || e.data === undefined) { mezok[k] = e.success ? "ures" : (e.error.issues[0]?.code ?? "ervenytelen"); continue; }
    ki[k] = e.data;
  }
  if (Object.keys(mezok).length) return { ok: false, mezok };
  if (!Object.keys(ki).length) return { ok: false, mezok: { "": "ures" } };
  return { ok: true, patch: ki };
}
