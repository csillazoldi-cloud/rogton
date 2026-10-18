// R-16 K4 (TERV §2-K4, gepezet 6 · 6b, kerdesek 4) — a 12d négy színösszeállítása és a 12d2 tizenkét színű gyűrűje. Tiszta számítás.
// A sorrend (TERV §2-K4 „Suggestion order”):
//  1. a MOSTANI színek, ✓ — a címkéjük a forrásukból: „A logódból” · „A honlapodról” · a szett neve; saját / üres / gépi forrásnál
//     „A logódból”, ha van logó, különben a hozzá legközelebbi szett neve;
//  2. a logóból rakott összeállítás, ha van logó a színeivel és eltér a mostanitól (logó nélkül: a honlap színjelöltjeiből ugyanígy,
//     „A honlapodról” címkével — a gép csak azt mondja, amit tud: honnan jöttek a színek);
//  3–4. a szakma hangulatai, amelyek még nem látszanak (a majdnem egyformák — ΔE < 10 mindhárom színen — kimaradnak);
//  ha így sincs négy, a többi bevált szett a feliratfájl sorrendjében (a rajzon mindig négy kép van).
// A hex-literálokat kerüljük (tokenőr): a fehér a hexbe([255,255,255]), a gyűrű a hat szett színeiből áll.
import { SZETTEK, hangulatok, szett, type SzettId } from "./szettek";
import { hexbe, hexbol, nemMarkaszin, relativVilagossag, sotetitve, telitettsegVilagossag, type Rgb } from "./szin";

export type SzinHarmas = { fo: string; masodik: string; hatter: string };
/** Ahonnan az összeállítás jön — ezt menti a `szin_forras` (a „sajat” a 12d2 egyenkénti választása). */
export type JavaslatForras = "logo" | "honlap" | "szett" | "sajat";

export type SzinJavaslat = SzinHarmas & {
  /** a kártya kulcsa: „jelenlegi” · „logo” · „honlap” · a szett azonosítója */
  kulcs: string;
  /** a címke feliratkulcsa (r16.arculat.szettek.*) */
  nev: string;
  forras: JavaslatForras;
  /** csak `forras = "szett"`-nél */
  szett?: SzettId;
  jelenlegi: boolean;
};

export type JavaslatBemenet = {
  /** a munkatér tényleges színei (jóváhagyott pillanatkép ?? tervezet ?? alapszett) */
  jelenlegi: SzinHarmas;
  /** a tárolt `szin_forras` és `szin_szett` */
  szinForras: string;
  szinSzett: string;
  /** van-e a képeken használt logó */
  vanLogo: boolean;
  /** a logók elemzett színei (≤ 5, gyakoriság szerint; `LogoElemzes.szinek`) */
  logoSzinek: readonly string[];
  /** a honlap színjelöltjei (`tervezet.szin_jeloltek`, a K7 tölti) */
  honlapSzinek?: readonly string[];
  /** a cég neve + összefoglalója (a szakma → hangulat táblához) */
  szakma: string;
};

export const JAVASLAT_DB = 4;
/** ennél kisebb ΔE (CIE76) mindhárom színen = ugyanaz az összeállítás */
export const MAJDNEM_EGYFORMA = 10;
/** a fő szín a világos háttéren (és a háttér a fő színnel) legalább ennyire olvasható */
export const OLVASHATO = 4.5;

const FEHER: Rgb = [255, 255, 255];
const kisbetus = (h: string) => h.toLowerCase();

/** WCAG kontraszt két hex-szín között (1–21); érvénytelen bemenet → 1. */
export function kontraszt(a: string, b: string): number {
  const ra = hexbol(a), rb = hexbol(b);
  if (!ra || !rb) return 1;
  const la = relativVilagossag(ra), lb = relativVilagossag(rb);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** sRGB → CIE Lab (D65). */
function lab([r, g, b]: Rgb): [number, number, number] {
  const lin = (c: number) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  const R = lin(r), G = lin(g), B = lin(b);
  const x = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047;
  const y = 0.2126 * R + 0.7152 * G + 0.0722 * B;
  const z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

/** ΔE (CIE76) két hex-szín között; érvénytelen bemenet → végtelen. */
export function deltaE(a: string, b: string): number {
  const ra = hexbol(a), rb = hexbol(b);
  if (!ra || !rb) return Infinity;
  const la = lab(ra), lb = lab(rb);
  return Math.hypot(la[0] - lb[0], la[1] - lb[1], la[2] - lb[2]);
}

/** Majdnem ugyanaz-e a két összeállítás: mindhárom szín ΔE-je < 10. */
export function majdnemEgyforma(a: SzinHarmas, b: SzinHarmas): boolean {
  return deltaE(a.fo, b.fo) < MAJDNEM_EGYFORMA && deltaE(a.masodik, b.masodik) < MAJDNEM_EGYFORMA && deltaE(a.hatter, b.hatter) < MAJDNEM_EGYFORMA;
}

/** A hozzá legközelebbi bevált szett (a három ΔE összege szerint). */
export function legkozelebbiSzett(h: SzinHarmas): SzettId {
  let legjobb = SZETTEK[0]!, min = Infinity;
  for (const s of SZETTEK) {
    const d = deltaE(h.fo, s.fo) + deltaE(h.masodik, s.masodik) + deltaE(h.hatter, s.hatter);
    if (d < min) { min = d; legjobb = s; }
  }
  return legjobb.id;
}

/** A szín árnyalata fokban (0–360) — a gyűrű sorrendjéhez. */
export function arnyalat(hex: string): number {
  const rgb = hexbol(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((c) => c / 255) as Rgb;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d === 0) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

/**
 * A 12d2 rögzített gyűrűje (gepezet 6b): a hat szett fő és második színe, árnyalat szerint (a rajzon felül kezdve, óramutató
 * szerint). Nincs kódmező, csúszka, szabad színválasztó — a gyűrű 12 bevált színe elég.
 */
export const GYURU: readonly string[] = [...SZETTEK.flatMap((s) => [s.fo, s.masodik])]
  .map(kisbetus)
  .sort((a, b) => arnyalat(a) - arnyalat(b) || relativVilagossag(hexbol(a)!) - relativVilagossag(hexbol(b)!));

/** A fő szín árnyalatának legvilágosabb tintája (fehérrel keverve), amelyen a fő szín még olvasható (≥ 4,5). */
export function vilagosTinta(fo: string): string {
  const rgb = hexbol(fo);
  if (!rgb) return hexbe(FEHER);
  const kever = (k: number): string => hexbe([rgb[0] + (255 - rgb[0]) * k, rgb[1] + (255 - rgb[1]) * k, rgb[2] + (255 - rgb[2]) * k]);
  // 94 % fehér: még látszik az árnyalat; ha így nem olvasható a fő szín rajta, a fehér felé lépünk
  for (const k of [0.94, 0.96, 0.98, 1]) { const t = kever(k); if (kontraszt(fo, t) >= OLVASHATO) return t; }
  return hexbe(FEHER);
}

/**
 * Összeállítás színekből (a logó vagy a honlap színei, gyakoriság szerint): fő = a legtelítettebb elég sötét szín (a világos
 * tintáján olvasható); ha egyik sem elég sötét, a legtelítettebb sötétítve. Második = a következő, a főtől eltérő szín
 * (ΔE ≥ 10); ha nincs, a fő színhez legközelebbi bevált szett második színe. Háttér = a fő szín legvilágosabb olvasható tintája.
 * Márkaszín nélkül (csak fehér/fekete/szürke) → null.
 */
export function szinekbolOsszeallitas(szinek: readonly string[]): SzinHarmas | null {
  const jo = [...new Set(szinek.map(kisbetus))].filter((h) => { const r = hexbol(h); return r !== null && !nemMarkaszin(r); });
  if (jo.length === 0) return null;
  const telitett = (h: string) => telitettsegVilagossag(hexbol(h)!).s;
  const rendezett = [...jo].sort((a, b) => telitett(b) - telitett(a));
  // elég sötét = fehéren is olvasható (≥ 4,5) — akkor a világos tintáján is (a `vilagosTinta` legfeljebb a fehérig megy)
  const sotetEleg = rendezett.find((h) => kontraszt(h, hexbe(FEHER)) >= OLVASHATO);
  const fo = sotetEleg ?? kisbetus(sotetitve(rendezett[0]!, 0.12) ?? rendezett[0]!);
  const masik = jo.find((h) => h !== sotetEleg && deltaE(h, fo) >= MAJDNEM_EGYFORMA);
  const masodik = masik ?? szett(legkozelebbiSzett({ fo, masodik: fo, hatter: vilagosTinta(fo) }))!.masodik;
  return { fo, masodik, hatter: vilagosTinta(fo) };
}

/** A mostani színek címkéje és forrása (TERV §2-K4 1.). */
function jelenlegiCimke(be: JavaslatBemenet, logobol: SzinHarmas | null): Pick<SzinJavaslat, "nev" | "forras"> & { szett?: SzettId } {
  if (be.szinForras === "logo") return { nev: "r16.arculat.szettek.logobol", forras: "logo" };
  if (be.szinForras === "honlap") return { nev: "r16.arculat.szettek.honlaprol", forras: "honlap" };
  const sz = be.szinForras === "szett" ? szett(be.szinSzett) : undefined;
  if (sz) return { nev: `r16.arculat.szettek.${sz.id}`, forras: "szett", szett: sz.id };
  // saját / üres / gépi (AI) forrás: a logó neve, ha van logó; különben a legközelebbi szetté — a mentés forrása „sajat” marad.
  // K4 (mérve a 12d-n): ha a logóból rakott összeállítás ismert és NEM ez, a mostani a legközelebbi szett nevét kapja — különben két
  // „A logódból” kártya állna egymás mellett (a mostani 12d2-választás és a valódi logó-összeállítás).
  if (be.vanLogo && (!logobol || majdnemEgyforma(be.jelenlegi, logobol))) return { nev: "r16.arculat.szettek.logobol", forras: "sajat" };
  return { nev: `r16.arculat.szettek.${legkozelebbiSzett(be.jelenlegi)}`, forras: "sajat" };
}

/** A 12d négy kártyája, sorrendben; az első mindig a mostani (✓). */
export function szinJavaslatok(be: JavaslatBemenet): SzinJavaslat[] {
  const jelenlegi: SzinHarmas = { fo: kisbetus(be.jelenlegi.fo), masodik: kisbetus(be.jelenlegi.masodik), hatter: kisbetus(be.jelenlegi.hatter) };
  const logobol = be.vanLogo ? szinekbolOsszeallitas(be.logoSzinek) : null;
  const ki: SzinJavaslat[] = [{ kulcs: "jelenlegi", ...jelenlegi, ...jelenlegiCimke({ ...be, jelenlegi }, logobol), jelenlegi: true }];
  // Két kártya nem viselheti ugyanazt a nevet (Tibor-bíráló 09-30, 12d telefon: a mostani „Természetes ✓” mellett egy második
  // „Természetes” állt — a mostani a legközelebbi szett NEVÉT kapta, a szett maga pedig ΔE ≥ 10-zel átcsúszott a szűrőn).
  // A név a lapon az egyetlen, amiből Tibor a különbséget látja: azonos névvel a kártya kimarad, jön a sorban következő.
  const uj = (j: SzinJavaslat) => {
    if (ki.length >= JAVASLAT_DB || ki.some((k) => majdnemEgyforma(k, j) || k.nev === j.nev)) return;
    ki.push(j);
  };
  // 2. a logóból (logó nélkül a honlapról)
  if (logobol) uj({ kulcs: "logo", ...logobol, nev: "r16.arculat.szettek.logobol", forras: "logo", jelenlegi: false });
  else if (!be.vanLogo && be.honlapSzinek?.length) {
    const honlapbol = szinekbolOsszeallitas(be.honlapSzinek);
    if (honlapbol) uj({ kulcs: "honlap", ...honlapbol, nev: "r16.arculat.szettek.honlaprol", forras: "honlap", jelenlegi: false });
  }
  // 3–4. a szakma hangulatai, majd (ha kell) a többi bevált szett
  const sorrend: SzettId[] = [...hangulatok(be.szakma), ...SZETTEK.map((s) => s.id)];
  for (const id of sorrend) {
    const s = szett(id)!;
    uj({ kulcs: s.id, fo: s.fo, masodik: s.masodik, hatter: s.hatter, nev: `r16.arculat.szettek.${s.id}`, forras: "szett", szett: s.id, jelenlegi: false });
  }
  return ki;
}

/** A 12d2 „A logódból:” sora: a logók színei (az elemzés már kiszűrte a fehéret, feketét, szürkét), ismétlés nélkül, legfeljebb 5. */
export function logoSzinSor(szinek: readonly string[]): string[] {
  const ki: string[] = [];
  for (const h of szinek.map(kisbetus)) {
    if (!hexbol(h) || ki.some((k) => deltaE(k, h) < 3)) continue;
    ki.push(h);
    if (ki.length === 5) break;
  }
  return ki;
}
