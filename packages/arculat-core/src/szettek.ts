// R-16 K3 (TERV §2-K3, a táblák: §2-K4) — a hat bevált színszett és a szakma → hangulat tábla. ADAT, nem felület:
// a hex-színek egy ügyfél képeinek alapszínei (a tokenőr KIVETEL-listáján áll, mint az onboarding/szinek.ts).
// Mérve 2026-09-30 (TERV §2-K4): mind a hat szett megtartja a `szines` változatot a „Kész munka” képen, és a fő/háttér kontraszt ≥ 4,9.
// A K3 a 12a alapkitöltéséhez hozza őket (a kép sosem szürke); a javaslat-logikát (12d: a jelenlegi, a logóból, a hangulatok) a K4 teszi hozzá.

/** A hat bevált szett azonosítója — a feliratkulcs `r16.arculat.szettek.<id>` (a K4 0137-es migrációja). */
export const SZETT_IDK = ["termeszetes", "meleg", "friss", "megbizhato", "elegans", "jatekos"] as const;
export type SzettId = (typeof SZETT_IDK)[number];

/** A képgyártó öt betűje (a kulcs = vizual-core BETUK kulcsa). */
export type BetuKulcs = "archivo" | "public-sans" | "space-grotesk" | "ibm-plex-sans" | "gelasio";

export type Szett = {
  id: SzettId;
  /** fő · második · háttér (kisbetűs #rrggbb) */
  fo: string;
  masodik: string;
  hatter: string;
  /** az alapkitöltés betűi (cím · szöveg) */
  cim: BetuKulcs;
  szoveg: BetuKulcs;
};

/** TERV §2-K4 táblája, betűre. A sorrend a feliratfájl sorrendje. */
export const SZETTEK: readonly Szett[] = [
  { id: "termeszetes", fo: "#2f5d50", masodik: "#c9a86a", hatter: "#f1ede4", cim: "archivo", szoveg: "public-sans" }, // földszínű zöld, homok, krém — nyugodt, kültéri
  { id: "meleg", fo: "#a4471f", masodik: "#e3a857", hatter: "#fbf3e8", cim: "gelasio", szoveg: "public-sans" }, // terrakotta, méz — étel, otthon, vendéglátás
  { id: "friss", fo: "#17745e", masodik: "#f2c94c", hatter: "#f4fbf8", cim: "space-grotesk", szoveg: "public-sans" }, // türkiz és citrom — tiszta, egészség, új
  { id: "megbizhato", fo: "#1f3a5f", masodik: "#7fb2e5", hatter: "#f3f6fa", cim: "ibm-plex-sans", szoveg: "public-sans" }, // sötétkék és égkék — pénzügy, jog, szolgáltatás
  { id: "elegans", fo: "#2b2b2e", masodik: "#b89b5e", hatter: "#f6f4ef", cim: "gelasio", szoveg: "public-sans" }, // szén és tompa arany — szépség, prémium
  { id: "jatekos", fo: "#c2410c", masodik: "#3aa6b9", hatter: "#fff8ec", cim: "space-grotesk", szoveg: "public-sans" }, // narancs és türkiz — gyerek, sport, rendezvény
];

export function szett(id: string): Szett | undefined {
  return SZETTEK.find((s) => s.id === id);
}

/**
 * Szakma → hangulat (TERV §2-K4): szótövek HU/RO/EN, kis- és nagybetű, ékezet nem számít; az első illő sor nyer.
 * A tő a SZÓ ELEJÉRE illeszkedik („pék” → „pékség”, de az „ács” nem illik a „kovács”-ra, a „jog” nem a „fogorvos”-ra) — különben a
 * rövid tövek (ács, jog, kert) szavak belsejében is találnának, és a pékségből ács lenne.
 */
export const SZAKMA_HANGULAT: readonly { tovek: readonly string[]; hangulatok: readonly [SzettId, SzettId, SzettId] }[] = [
  { tovek: ["térkő", "burkol", "építő", "épít", "ács", "asztalos", "kert", "tető", "construc", "pavaj", "grădin", "garden", "build"], hangulatok: ["termeszetes", "megbizhato", "elegans"] },
  { tovek: ["pék", "cukrász", "étterem", "kávé", "vendég", "panzió", "szállás", "brutăr", "cofet", "restaur", "bakery", "cafe"], hangulatok: ["meleg", "termeszetes", "jatekos"] },
  { tovek: ["szépség", "kozmetik", "fodrász", "virág", "esküvő", "divat", "ékszer", "frumuse", "cosmet", "beauty", "salon"], hangulatok: ["elegans", "meleg", "friss"] },
  { tovek: ["orvos", "fogorvos", "egészség", "patika", "gyógy", "klinik", "medic", "farmac", "dental", "health"], hangulatok: ["friss", "megbizhato", "termeszetes"] },
  { tovek: ["könyvel", "jog", "ügyvéd", "bank", "biztosít", "pénzügy", "tanácsad", "informatik", "szoftver", "contab", "avocat", "software"], hangulatok: ["megbizhato", "elegans", "friss"] },
  { tovek: ["iskola", "óvoda", "gyerek", "játék", "sport", "fitnesz", "rendezvény", "școal", "copii", "event"], hangulatok: ["jatekos", "friss", "meleg"] },
  { tovek: ["szállít", "fuvar", "autó", "szerviz", "logiszt", "közlekedés", "transport", "auto", "service"], hangulatok: ["megbizhato", "friss", "termeszetes"] },
];

/** Egyezés nélkül (gepezet 6): természetes · megbízható · meleg. */
export const ALAP_HANGULATOK: readonly [SzettId, SzettId, SzettId] = ["termeszetes", "megbizhato", "meleg"];

/** Kisbetű, ékezet nélkül (NFD + a kombináló jelek eldobása: ő → o, ș → s, ă → a). */
export function ekezetNelkul(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

const SZO_ELEJE = (to: string) => new RegExp(`(^|[^a-z0-9])${ekezetNelkul(to).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
const TABLA = SZAKMA_HANGULAT.map((sor) => ({ minta: sor.tovek.map(SZO_ELEJE), hangulatok: sor.hangulatok }));

/** A cég neve + összefoglalója alapján a három hangulat sorrendben; az első a 12a alapszettje. */
export function hangulatok(szoveg: string): readonly [SzettId, SzettId, SzettId] {
  const s = ekezetNelkul(szoveg);
  for (const sor of TABLA) if (sor.minta.some((m) => m.test(s))) return sor.hangulatok;
  return ALAP_HANGULATOK;
}

/** Az alapszett a szakmából (a 12a „a színeket és a betűket addig mi választottuk”). */
export function alapSzett(szoveg: string): Szett {
  return szett(hangulatok(szoveg)[0])!;
}
