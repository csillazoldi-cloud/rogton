// A téma két szintje (D-09, E-13): KÖZÖS ALAP (a rendszergazda állítja, teljes tokenkészlet) és
// SZERVEZETI FELÜLÍRÁS (a tulajdonos állítja; csak azok az értékek, amiket megváltoztatott).
// Hatásos téma = közös alap + felülírás. Tiszta szabályok: nincs adatbázis, nincs React, nincs Next.
// Az ellenőrző a v6 km-theme.js validate() tükre: strukturált {token, kod, parameterek} hibák, a felület fordítja.
import { z } from "zod";
import { AlapTokenek } from "./tokenek";

export const TEMA_SEMA_VERZIO = "km-theme/2" as const;
export const TAMOGATOTT_SEMAK: readonly string[] = [TEMA_SEMA_VERZIO];

type TokenSzabaly =
  | { tipus: "color" }
  | { tipus: "size"; min: number; max: number }
  | { tipus: "percent"; min: number; max: number }
  | { tipus: "num"; min: number; max: number }
  | { tipus: "enum"; ertekek: readonly string[] }
  | { tipus: "font" };

/** A km-theme/2 SCHEMA — token → szabály. Ugyanaz, mint a v6 km-theme.js-ben. */
export const TOKEN_SZABALYOK: Readonly<Record<keyof AlapTokenek, TokenSzabaly>> = {
  "--bg": { tipus: "color" }, "--bg-elev": { tipus: "color" },
  "--text": { tipus: "color" }, "--text-mut": { tipus: "color" }, "--text-dim": { tipus: "color" }, "--text-faint": { tipus: "color" },
  "--on-primary": { tipus: "color" }, "--primary": { tipus: "color" }, "--primary-2": { tipus: "color" },
  "--accent": { tipus: "color" }, "--accent-text": { tipus: "color" }, "--accent-link": { tipus: "color" },
  "--ok": { tipus: "color" }, "--err": { tipus: "color" }, "--focus": { tipus: "color" }, "--shadow-color": { tipus: "color" },
  "--shadow-strength": { tipus: "percent", min: 0, max: 80 },
  "--font-display": { tipus: "font" }, "--font-body": { tipus: "font" }, "--font-code": { tipus: "font" },
  "--font-display-arab": { tipus: "font" }, "--font-body-arab": { tipus: "font" },
  "--fw-head": { tipus: "enum", ertekek: ["500", "600", "700", "800"] },
  "--fw-strong": { tipus: "enum", ertekek: ["500", "600", "700"] },
  "--fs-h1": { tipus: "size", min: 20, max: 56 }, "--fs-base": { tipus: "size", min: 12, max: 20 }, "--fs-title": { tipus: "size", min: 14, max: 24 },
  // E-41 (nyitólap): a nyilvános főoldal méretei — a közös készlet része, a Theme-felületen állíthatók.
  "--fs-hero": { tipus: "size", min: 24, max: 80 }, "--fs-hero-sm": { tipus: "size", min: 20, max: 48 },
  "--fs-szekcio": { tipus: "size", min: 16, max: 40 }, "--fs-zaro": { tipus: "size", min: 18, max: 48 },
  "--r-card": { tipus: "size", min: 0, max: 999 }, "--r-block": { tipus: "size", min: 0, max: 999 },
  "--r-btn": { tipus: "size", min: 0, max: 999 }, "--r-field": { tipus: "size", min: 0, max: 999 }, "--r-badge": { tipus: "size", min: 0, max: 999 },
  "--bw": { tipus: "size", min: 0, max: 4 },
  // F-1: a térköz-skála — tizenöt fok, a régi hét térköz-token ezekből származik (lásd szarmaztat()).
  "--ter-0": { tipus: "size", min: 0, max: 0 },
  "--ter-1": { tipus: "size", min: 0, max: 8 }, "--ter-2": { tipus: "size", min: 0, max: 12 },
  "--ter-3": { tipus: "size", min: 0, max: 16 }, "--ter-4": { tipus: "size", min: 0, max: 20 },
  "--ter-5": { tipus: "size", min: 0, max: 24 }, "--ter-6": { tipus: "size", min: 0, max: 28 },
  "--ter-7": { tipus: "size", min: 0, max: 32 }, "--ter-8": { tipus: "size", min: 0, max: 40 },
  "--ter-9": { tipus: "size", min: 0, max: 48 }, "--ter-10": { tipus: "size", min: 0, max: 64 },
  "--ter-11": { tipus: "size", min: 0, max: 80 }, "--ter-12": { tipus: "size", min: 0, max: 112 },
  "--ter-13": { tipus: "size", min: 0, max: 160 }, "--ter-14": { tipus: "size", min: 0, max: 160 },
  "--control-min": { tipus: "size", min: 32, max: 64 },
  "--tile-min": { tipus: "size", min: 200, max: 520 }, "--fs-metric": { tipus: "size", min: 18, max: 48 }, // F-2 (R-1 tokenek.md 3.)
  "--urlap-max": { tipus: "size", min: 640, max: 720 }, "--lista-max": { tipus: "size", min: 1100, max: 1200 }, // R-7e: egységes tartalomszélesség — űrlap · lista.
  "--keszul": { tipus: "color" }, "--olvasatlan": { tipus: "color" }, "--illesztve": { tipus: "color" }, "--kapcsolo-w": { tipus: "size", min: 28, max: 64 }, "--kapcsolo-h": { tipus: "size", min: 16, max: 36 }, // F-5b (R-4 tokenek.md)
  "--blur-glass": { tipus: "size", min: 0, max: 60 }, "--glass-alpha": { tipus: "percent", min: 0, max: 30 },
  "--motion": { tipus: "enum", ertekek: ["normal", "slow", "off"] },
  "--lh": { tipus: "num", min: 1.1, max: 2.2 },
  "--sat-glass": { tipus: "percent", min: 50, max: 300 },
  "--foto-hero": { tipus: "percent", min: 0, max: 100 },
  "--foto-zaro": { tipus: "percent", min: 0, max: 100 },
  "--fatyol": { tipus: "percent", min: 0, max: 100 },
  "--accent-warm": { tipus: "color" }, "--accent-gold": { tipus: "color" }, "--aurora-opacity": { tipus: "percent", min: 0, max: 70 }, "--orb-size": { tipus: "size", min: 44, max: 120 }, // R-8
};
export const TOKEN_KULCSOK = Object.keys(TOKEN_SZABALYOK) as (keyof AlapTokenek)[];

/** Egy szín RGB-ben, ha a v6 által támogatott alakok egyike (#rgb, #rrggbb, #rrggbbaa, rgb(), rgba(), hsl(), hsla()); különben null. */
export function szinRgb(v: unknown): [number, number, number] | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  let m = /^#([0-9a-fA-F]{3})$/.exec(s);
  if (m) { const h = m[1]!; return [parseInt(h[0]! + h[0]!, 16), parseInt(h[1]! + h[1]!, 16), parseInt(h[2]! + h[2]!, 16)]; }
  m = /^#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$/.exec(s);
  if (m) { const h = m[1]!; return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  m = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(0|1|0?\.\d+|1\.0)\s*)?\)$/.exec(s);
  if (m) { const r = +m[1]!, g = +m[2]!, b = +m[3]!; return r <= 255 && g <= 255 && b <= 255 ? [r, g, b] : null; }
  m = /^hsla?\(\s*(\d{1,3}(?:\.\d+)?)\s*,\s*(\d{1,3}(?:\.\d+)?)%\s*,\s*(\d{1,3}(?:\.\d+)?)%\s*(?:,\s*(0|1|0?\.\d+|1\.0)\s*)?\)$/.exec(s);
  if (m) {
    let H = +m[1]!, S = +m[2]!, L = +m[3]!;
    if (H > 360 || S > 100 || L > 100) return null;
    H /= 360; S /= 100; L /= 100;
    const f = (n: number) => { const kk = (n + H * 12) % 12; const a = S * Math.min(L, 1 - L); return L - a * Math.max(-1, Math.min(kk - 3, 9 - kk, 1)); };
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
  }
  return null;
}

/** Relatív fényesség (WCAG); null, ha a szín nem értelmezhető. */
export function fenyesseg(v: unknown): number | null {
  const rgb = szinRgb(v);
  if (!rgb) return null;
  const c = rgb.map((x) => { const y = x / 255; return y <= 0.03928 ? y / 12.92 : Math.pow((y + 0.055) / 1.055, 2.4); });
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
}

/** Kontrasztarány két szín közt (WCAG); null, ha valamelyik nem értelmezhető. */
export function kontraszt(a: unknown, b: unknown): number | null {
  const l1 = fenyesseg(a), l2 = fenyesseg(b);
  if (l1 == null || l2 == null) return null;
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/** Strukturált hiba — a felület a `val.<kod>` feliratokkal fordítja, a paramétereket behelyettesíti. */
export const TemaHiba = z.object({
  token: z.string(),
  kod: z.enum(["notObject", "badVersion", "tokensNotObject", "emptyValue", "badChar", "badColor", "badSize", "negative", "outOfRange", "badPercent", "badNumber", "badEnum", "badFont", "notMonotonic"]),
  parameterek: z.record(z.string(), z.union([z.string(), z.number()])),
});
export type TemaHiba = z.infer<typeof TemaHiba>;

/** Egy token értékének ellenőrzése: null = jó; { ismeretlen: true } = nincs ilyen token; különben a hiba. */
export function tokenEllenoriz(kulcs: string, ertek: unknown): TemaHiba | { ismeretlen: true } | null {
  const sz = (TOKEN_SZABALYOK as Record<string, TokenSzabaly | undefined>)[kulcs];
  if (!sz) return { ismeretlen: true };
  if (typeof ertek !== "string" || !ertek.trim()) return { token: kulcs, kod: "emptyValue", parameterek: {} };
  const v = ertek;
  if (v.includes("<")) return { token: kulcs, kod: "badChar", parameterek: {} };
  switch (sz.tipus) {
    case "color":
      if (!szinRgb(v)) return { token: kulcs, kod: "badColor", parameterek: { value: v } };
      return null;
    case "size": {
      const m = /^(-?\d+(?:\.\d+)?)px$/.exec(v);
      if (!m) return { token: kulcs, kod: "badSize", parameterek: { value: v } };
      const n = parseFloat(m[1]!);
      if (n < 0) return { token: kulcs, kod: "negative", parameterek: { value: v, min: sz.min } };
      if (n < sz.min || n > sz.max) return { token: kulcs, kod: "outOfRange", parameterek: { value: v, min: sz.min, max: sz.max } };
      return null;
    }
    case "percent": {
      const p = Number(v);
      if (!Number.isFinite(p) || p < sz.min || p > sz.max) return { token: kulcs, kod: "badPercent", parameterek: { value: v, min: sz.min, max: sz.max } };
      return null;
    }
    case "num": {
      const q = Number(v);
      if (!Number.isFinite(q) || q < sz.min || q > sz.max) return { token: kulcs, kod: "badNumber", parameterek: { value: v, min: sz.min, max: sz.max } };
      return null;
    }
    case "enum":
      if (!sz.ertekek.includes(v)) return { token: kulcs, kod: "badEnum", parameterek: { value: v, values: sz.ertekek.join(", ") } };
      return null;
    case "font":
      if (v.length > 120) return { token: kulcs, kod: "badFont", parameterek: {} };
      return null;
  }
}

/**
 * F-1: a térköz-skála monotonitása. A `--ter-1` … `--ter-14` sorrenden végigmegy; ahol egy MEGADOTT fok
 * pixelértéke kisebb, mint egy előtte álló megadott fok értéke, `notMonotonic` hibát ad. Egyenlőség megengedett.
 * Ami nincs megadva, azt kihagyja — részleges készletnél is működik.
 */
export function terkozMonoton(tokenek: Partial<Record<string, string>>): TemaHiba[] {
  const hibak: TemaHiba[] = [];
  let elozoNev: string | null = null;
  let elozoErtek: number | null = null;
  for (let i = 1; i <= 14; i++) {
    const nev = `--ter-${i}`;
    const nyers = tokenek[nev];
    if (nyers === undefined) continue;
    const m = /^(-?\d+(?:\.\d+)?)px$/.exec(nyers);
    if (!m) continue;
    const ertek = parseFloat(m[1]!);
    if (elozoNev !== null && elozoErtek !== null && ertek < elozoErtek) {
      hibak.push({ token: nev, kod: "notMonotonic", parameterek: { value: nyers, prev: elozoNev, prevValue: `${elozoErtek}px` } });
    }
    elozoNev = nev;
    elozoErtek = ertek;
  }
  return hibak;
}

export type TemaEllenorzes = { ok: boolean; hibak: TemaHiba[]; figyelmenKivul: string[]; tokenek: Partial<AlapTokenek> };

/**
 * Egy `{ $schema, tokens }` csomag ellenőrzése — a v6 validate() tükre. RÉSZLEGES tokenkészletet is elfogad
 * (csak a megadott tokeneket nézi); az ismeretlen kulcsok nem hibák, de a `figyelmenKivul` listába kerülnek, és
 * a visszaadott `tokenek` közt nincsenek. Import és felülírás-mentés előtt ez fut; hibánál semmi nem íródik (A-09).
 */
export function temaEllenoriz(obj: unknown): TemaEllenorzes {
  const hibak: TemaHiba[] = [];
  const figyelmenKivul: string[] = [];
  const tokenek: Partial<AlapTokenek> = {};
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return { ok: false, hibak: [{ token: "$", kod: "notObject", parameterek: {} }], figyelmenKivul, tokenek };
  }
  const o = obj as Record<string, unknown>;
  if (typeof o["$schema"] !== "string" || !TAMOGATOTT_SEMAK.includes(o["$schema"])) {
    hibak.push({ token: "$schema", kod: "badVersion", parameterek: { value: typeof o["$schema"] === "string" ? o["$schema"] : "—", values: TAMOGATOTT_SEMAK.join(", ") } });
  }
  const tk = o["tokens"];
  if (!tk || typeof tk !== "object" || Array.isArray(tk)) {
    hibak.push({ token: "tokens", kod: "tokensNotObject", parameterek: {} });
    return { ok: false, hibak, figyelmenKivul, tokenek };
  }
  for (const [k, v] of Object.entries(tk as Record<string, unknown>)) {
    const r = tokenEllenoriz(k, v);
    if (r && "ismeretlen" in r) figyelmenKivul.push(k);
    else if (r) hibak.push(r);
    else (tokenek as Record<string, string>)[k] = v as string;
  }
  // F-1: a tokenek ellenőrzése UTÁN a térköz-skála monotonitását is nézzük.
  hibak.push(...terkozMonoton(tokenek as Partial<Record<string, string>>));
  return { ok: hibak.length === 0, hibak, figyelmenKivul, tokenek };
}

/** Szervezeti felülírás: a tokenek egy RÉSZE (csak ami eltér a közös alaptól). Ismeretlen kulcs: elutasítva. */
export const TemaFelulirasok = AlapTokenek.partial();
export type TemaFelulirasok = z.infer<typeof TemaFelulirasok>;

/** Hatásos tokenkészlet: a közös alap + a szervezet felülírásai (ami nincs felülírva, a közösből jön). */
export function egyesit(alap: AlapTokenek, felulirasok: TemaFelulirasok | null | undefined): AlapTokenek {
  if (!felulirasok) return alap;
  const ki: Record<string, string> = { ...alap };
  for (const k of TOKEN_KULCSOK) {
    const v = felulirasok[k];
    if (v !== undefined) ki[k] = v;
  }
  return ki as AlapTokenek;
}

/** A felülírások kiszámítása: a teljes (szerkesztett) készletből csak az marad, ami eltér a közös alaptól. */
export function felulirasokSzamol(alap: AlapTokenek, teljes: Partial<AlapTokenek>): TemaFelulirasok {
  const ki: Record<string, string> = {};
  for (const k of TOKEN_KULCSOK) {
    const v = teljes[k];
    if (v !== undefined && v !== alap[k]) ki[k] = v;
  }
  return ki as TemaFelulirasok;
}

/** Olvashatósági figyelmeztetések: a v6 Theme-felület három párját nézi (szöveg/háttér, gombfelirat/elsődleges, kiemelt szöveg/háttér). */
export function olvashatosagiFigyelmeztetesek(t: AlapTokenek): { par: string; arany: number }[] {
  const parok: [string, string, string][] = [
    ["--text/--bg", t["--text"], t["--bg"]],
    ["--on-primary/--primary", t["--on-primary"], t["--primary"]],
    ["--accent-text/--bg", t["--accent-text"], t["--bg"]],
  ];
  const ki: { par: string; arany: number }[] = [];
  for (const [nev, a, b] of parok) {
    const k = kontraszt(a, b);
    if (k !== null && k < 4.5) ki.push({ par: nev, arany: Math.round(k * 100) / 100 });
  }
  return ki;
}

// ---------------------------------------------------------------------------
// Verziók és állapotok — mindkét szinten ugyanaz a szabály (v6: tervezet → alkalmazás; elvetés = vissza az alkalmazotthoz).
// ---------------------------------------------------------------------------

export const TemaVerzioAllapot = z.enum(["tervezet", "alkalmazott", "korabbi"]);
export type TemaVerzioAllapot = z.infer<typeof TemaVerzioAllapot>;

/** Egy verzió leírása a felületnek (a tartalom nélkül, a listákhoz). */
export const TemaVerzioFej = z.object({
  verzio: z.number().int().positive(),
  allapot: TemaVerzioAllapot,
  letrehozva: z.string(),
  alkalmazva: z.string().nullable(),
});
export type TemaVerzioFej = z.infer<typeof TemaVerzioFej>;

/** A szervezet szintje a felület felé: mit lát, mit szerkeszt. `alap` = a közös alap hatásos tokenjei. */
export const SzervezetTemaAllapot = z.object({
  alap: AlapTokenek,
  alkalmazott: z.object({ verzio: z.number().int(), felulirasok: TemaFelulirasok }).nullable(),
  tervezet: z.object({ verzio: z.number().int(), felulirasok: TemaFelulirasok }).nullable(),
  verziok: z.array(TemaVerzioFej),
  /** a lapon most érvényes (alkalmazott) hatásos készlet */
  hatasos: AlapTokenek,
  /** R-10: az alkalmazott verzió sémakódja (ejkek · vilagos · sotet), ha sémából jött */
  sema_kod: z.string().nullable().default(null),
});
export type SzervezetTemaAllapot = z.infer<typeof SzervezetTemaAllapot>;

/** A közös alap szintje a rendszergazdának: teljes definíciók. */
export const KozosTemaAllapot = z.object({
  alkalmazott: z.object({ verzio: z.number().int(), tokenek: AlapTokenek }),
  tervezet: z.object({ verzio: z.number().int(), tokenek: AlapTokenek }).nullable(),
  verziok: z.array(TemaVerzioFej),
  /** R-10: az alkalmazott verzió sémakódja (ejkek · vilagos · sotet), ha sémából jött */
  sema_kod: z.string().nullable().default(null),
});
export type KozosTemaAllapot = z.infer<typeof KozosTemaAllapot>;

/** Tervezet mentése (mindkét szint): a felület a TELJES szerkesztett készletet küldi km-theme/2 csomagként. */
export const TemaTervezetKeres = z.object({
  $schema: z.literal(TEMA_SEMA_VERZIO),
  tokens: z.record(z.string(), z.unknown()),
});
export type TemaTervezetKeres = z.infer<typeof TemaTervezetKeres>;

/** Korábbi verzió visszaállítása: abból ÚJ tervezet lesz — élesbe csak alkalmazással kerül. */
export const TemaVisszaallitasKeres = z.object({ verzio: z.number().int().positive() });
export type TemaVisszaallitasKeres = z.infer<typeof TemaVisszaallitasKeres>;
