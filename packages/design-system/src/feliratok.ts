// A feliratok két szintje (D-09, E-16): a CSOMAG ALAPJA (a kódból jövő feliratok, három nyelven — a `felirat` tábla),
// a KÖZÖS FELÜLÍRÁS (a rendszergazda állítja) és a SZERVEZETI FELÜLÍRÁS (a tulajdonos állítja). Mindkét felülírás
// csak az eltérő szövegeket tartalmazza. Hatásos szöveg = szervezeti → közös → alap, nyelvenként; ha az adott nyelven
// egyik szinten sincs, a TARTALÉKNYELV (ALAP_NYELV — D-11 óta az angol) ugyanezen a láncon (R-09, R-14). Tiszta szabályok: nincs adatbázis, React, Next.
import { z } from "zod";
import { ALAP_NYELV, NYELVEK, type Nyelv } from "./nyelvek";

export const FELIRAT_SEMA_VERZIO = "km-feliratok/1" as const;

/** Egy nyelv szövegei kulcs szerint. */
export const FeliratSzotar = z.record(z.string(), z.string());
export type FeliratSzotar = z.infer<typeof FeliratSzotar>;

/** Egy szint felülírásai: nyelvenként csak az eltérő kulcsok. Üres szöveg = nincs felülírás (a mentés kiszűri). */
export const FeliratFelulirasok = z.object({ hu: FeliratSzotar.optional(), ro: FeliratSzotar.optional(), en: FeliratSzotar.optional() });
export type FeliratFelulirasok = z.infer<typeof FeliratFelulirasok>;

/** Három nyelv teljes szótára (a csomag alapja, vagy egy hatásos készlet). */
export type FeliratKeszlet = Record<Nyelv, FeliratSzotar>;

export const FeliratEredet = z.enum(["alap", "kozos", "szervezet", "hianyzik"]);
export type FeliratEredet = z.infer<typeof FeliratEredet>;

/** Egy szöveg egy nyelven: az érték, honnan jön, és tartalék-e (a tartaléknyelv látszik, mert ezen a nyelven nincs). */
export type FeliratErtek = { szoveg: string; eredet: FeliratEredet; tartalek: boolean };

function ertek(sz: FeliratSzotar | undefined, kulcs: string): string | undefined {
  const v = sz?.[kulcs];
  return v !== undefined && v !== "" ? v : undefined;
}

/**
 * Egy kulcs hatásos értéke egy nyelven: szervezet → közös → alap; ha egyik sem, ugyanez a lánc a tartaléknyelven.
 * A `szintek` sorrendje a legerősebbtől: [szervezet, közös, alap].
 */
export function feliratErtek(kulcs: string, nyelv: Nyelv, alap: FeliratKeszlet, kozos: FeliratFelulirasok | null, szervezet: FeliratFelulirasok | null): FeliratErtek {
  const keres = (ny: Nyelv): { szoveg: string; eredet: FeliratEredet } | null => {
    const sz = ertek(szervezet?.[ny], kulcs); if (sz !== undefined) return { szoveg: sz, eredet: "szervezet" };
    const k = ertek(kozos?.[ny], kulcs); if (k !== undefined) return { szoveg: k, eredet: "kozos" };
    const a = ertek(alap[ny], kulcs); if (a !== undefined) return { szoveg: a, eredet: "alap" };
    return null;
  };
  const sajat = keres(nyelv);
  if (sajat) return { ...sajat, tartalek: false };
  if (nyelv !== ALAP_NYELV) {
    const t = keres(ALAP_NYELV);
    if (t) return { ...t, tartalek: true };
  }
  return { szoveg: kulcs, eredet: "hianyzik", tartalek: false };
}

/** A hatásos szótár egy nyelven — ezt kapja a lap (t()). Tartaléknyelvvel; a hiányzó kulcs a kulcs maga marad. */
export function hatasosFeliratok(nyelv: Nyelv, alap: FeliratKeszlet, kozos: FeliratFelulirasok | null, szervezet: FeliratFelulirasok | null): FeliratSzotar {
  const kulcsok = new Set<string>();
  for (const ny of NYELVEK) for (const k of Object.keys(alap[ny])) kulcsok.add(k);
  for (const f of [kozos, szervezet]) if (f) for (const ny of NYELVEK) for (const k of Object.keys(f[ny] ?? {})) kulcsok.add(k);
  const ki: FeliratSzotar = {};
  for (const k of kulcsok) ki[k] = feliratErtek(k, nyelv, alap, kozos, szervezet).szoveg;
  return ki;
}

/**
 * A felülírások kiszámítása: a szerkesztett teljes készletből csak az marad, ami eltér az ALATTA lévő szint hatásos
 * értékétől (szervezetnél: közös+alap; közösnél: alap). Az üres szöveg = „vissza az alsóbb szintre”, nem kerül be.
 */
export function feliratFelulirasokSzamol(szerkesztett: { [K in Nyelv]?: FeliratSzotar | undefined }, alatta: (kulcs: string, nyelv: Nyelv) => string | undefined): FeliratFelulirasok {
  const ki: FeliratFelulirasok = {};
  for (const ny of NYELVEK) {
    const sz = szerkesztett[ny];
    if (!sz) continue;
    const d: FeliratSzotar = {};
    for (const [k, v] of Object.entries(sz)) {
      if (v === "" || v === undefined) continue;
      if (v !== alatta(k, ny)) d[k] = v;
    }
    if (Object.keys(d).length) ki[ny] = d;
  }
  return ki;
}

/** Strukturált hiba az importhoz (a felület a `feliratok.ellenorzes_<kod>` feliratokkal fordítja). */
export const FeliratHiba = z.object({
  kulcs: z.string(),
  nyelv: z.string(),
  kod: z.enum(["notObject", "badVersion", "feliratokNotObject", "badLang", "emptyValue", "badChar", "tooLong", "notString"]),
  parameterek: z.record(z.string(), z.union([z.string(), z.number()])),
});
export type FeliratHiba = z.infer<typeof FeliratHiba>;
export type FeliratEllenorzes = { ok: boolean; hibak: FeliratHiba[]; figyelmenKivul: string[]; feliratok: FeliratFelulirasok };

export const FELIRAT_MAX_HOSSZ = 2000;

/**
 * Egy `{ $schema: "km-feliratok/1", feliratok: { hu: {kulcs: szöveg}, ro: {…}, en: {…} } }` csomag ellenőrzése.
 * Ismeretlen kulcs (nincs a csomag alapjában): nem hiba, de a `figyelmenKivul` listába kerül és kimarad — a kulcsokat a kód
 * adja, itt nem lehet újat felvenni. Ismeretlen nyelv, üres/nem-szöveg érték, '<' vagy túl hosszú szöveg: hiba. Hibánál SEMMI nem íródik (A-09).
 */
export function feliratCsomagEllenoriz(obj: unknown, ismertKulcsok: ReadonlySet<string>): FeliratEllenorzes {
  const hibak: FeliratHiba[] = [];
  const figyelmenKivul: string[] = [];
  const feliratok: FeliratFelulirasok = {};
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return { ok: false, hibak: [{ kulcs: "$", nyelv: "", kod: "notObject", parameterek: {} }], figyelmenKivul, feliratok };
  const o = obj as Record<string, unknown>;
  if (o["$schema"] !== FELIRAT_SEMA_VERZIO) hibak.push({ kulcs: "$schema", nyelv: "", kod: "badVersion", parameterek: { value: typeof o["$schema"] === "string" ? o["$schema"] : "—", values: FELIRAT_SEMA_VERZIO } });
  const f = o["feliratok"];
  if (!f || typeof f !== "object" || Array.isArray(f)) { hibak.push({ kulcs: "feliratok", nyelv: "", kod: "feliratokNotObject", parameterek: {} }); return { ok: false, hibak, figyelmenKivul, feliratok }; }
  for (const [ny, sz] of Object.entries(f as Record<string, unknown>)) {
    if (!(NYELVEK as readonly string[]).includes(ny)) { hibak.push({ kulcs: "feliratok", nyelv: ny, kod: "badLang", parameterek: { value: ny, values: NYELVEK.join(", ") } }); continue; }
    if (!sz || typeof sz !== "object" || Array.isArray(sz)) { hibak.push({ kulcs: "feliratok", nyelv: ny, kod: "feliratokNotObject", parameterek: {} }); continue; }
    const d: FeliratSzotar = {};
    for (const [k, v] of Object.entries(sz as Record<string, unknown>)) {
      if (!ismertKulcsok.has(k)) { if (!figyelmenKivul.includes(k)) figyelmenKivul.push(k); continue; }
      if (typeof v !== "string") { hibak.push({ kulcs: k, nyelv: ny, kod: "notString", parameterek: {} }); continue; }
      if (!v.trim()) { hibak.push({ kulcs: k, nyelv: ny, kod: "emptyValue", parameterek: {} }); continue; }
      if (v.includes("<")) { hibak.push({ kulcs: k, nyelv: ny, kod: "badChar", parameterek: {} }); continue; }
      if (v.length > FELIRAT_MAX_HOSSZ) { hibak.push({ kulcs: k, nyelv: ny, kod: "tooLong", parameterek: { max: FELIRAT_MAX_HOSSZ } }); continue; }
      d[k] = v;
    }
    if (Object.keys(d).length) feliratok[ny as Nyelv] = d;
  }
  return { ok: hibak.length === 0, hibak, figyelmenKivul, feliratok };
}

/** Kulcsok, amelyek hibakódhoz kötöttek (a kód a kulcsot választja ki): átírhatók, de a felület jelzi. */
export function hibakodhozKotott(kulcs: string): boolean {
  return kulcs.startsWith("hiba.");
}

/** A kulcs csoportja (képernyője): az első pont előtti rész. */
export function feliratCsoport(kulcs: string): string {
  const i = kulcs.indexOf(".");
  return i > 0 ? kulcs.slice(0, i) : kulcs;
}

// --- szerződések a felületnek ---

export const FeliratVerzioAllapot = z.enum(["tervezet", "alkalmazott", "korabbi"]);
export const FeliratVerzioFej = z.object({ verzio: z.number().int().positive(), allapot: FeliratVerzioAllapot, letrehozva: z.string(), alkalmazva: z.string().nullable() });
export type FeliratVerzioFej = z.infer<typeof FeliratVerzioFej>;

/** Egy szint állapota a felületnek: az alatta lévő hatásos készlet, a saját alkalmazott és tervezet felülírásai, verziók. */
export const FeliratSzintAllapot = z.object({
  /** az ALATTA lévő szintek hatásos szótára nyelvenként (szervezetnél: közös+alap; közösnél: alap) */
  alatta: z.object({ hu: FeliratSzotar, ro: FeliratSzotar, en: FeliratSzotar }),
  alkalmazott: z.object({ verzio: z.number().int(), felulirasok: FeliratFelulirasok }).nullable(),
  tervezet: z.object({ verzio: z.number().int(), felulirasok: FeliratFelulirasok }).nullable(),
  verziok: z.array(FeliratVerzioFej),
  kulcsok: z.array(z.string()),
});
export type FeliratSzintAllapot = z.infer<typeof FeliratSzintAllapot>;

/** Tervezet mentése: a felület a felülírásokat küldi (a szerkesztett készlet és az alatta lévő különbsége). */
export const FeliratTervezetKeres = z.object({ $schema: z.literal(FELIRAT_SEMA_VERZIO), feliratok: z.record(z.string(), z.unknown()) });
export type FeliratTervezetKeres = z.infer<typeof FeliratTervezetKeres>;
