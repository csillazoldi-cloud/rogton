// VZ-2 — a hét helyzet képe (design/vz2/rajz/VZ2-kepelrendezesek.dc.html, a rajz rajzolója: design/vz2/rajz/vz2-kep.js).
// A rajz képvázlata 240 egység széles; a valódi kép 1080 px, tehát 1 egység = 4,5 px. Az arányok, a sorrend és a
// méretek a rajzéi — a szín, a betű és a logó a munkatér arculatáé. A kép a képgyártó Chromiumában készül,
// ugyanaz a fájl a képernyőn és a letöltésben.
import { z } from "zod";

export const HELYZETEK = ["kesz", "akcio", "uj", "hir", "tudtad", "esemeny", "szam"] as const;
export type Helyzet = (typeof HELYZETEK)[number];
export const MERETEK = { poszt: { w: 1080, h: 1350 }, story: { w: 1080, h: 1920 }, negyzet: { w: 1080, h: 1080 } } as const;
export type Meret = keyof typeof MERETEK;

/** R-16 K2: egy logóhely fájlja a képhez. */
const KepLogo = z.object({
  /** adat-URL (PNG/JPEG/WEBP), < 2 MB fájl */
  adat: z.string().max(3_000_000),
  /** van-e átlátszó része (a feltöltéskori elemzésből, K1); ismeretlennél false → színezés helyett lemez */
  atlatszo: z.boolean().default(false),
  /** a nem átlátszó rész átlagos relatív világossága 0–1 (elemzés, K1); ismeretlennél nincs */
  vilagossag: z.number().min(0).max(1).optional(),
});

/** R-16 K5 (TERV 1.3, 1.5, gepezet 8): a munkatér egy saját betűfájlja a képhez — a képgyártó nem látja a NAS lemezét, ezért a
 *  bájtok adat-URL-ként jönnek a kéréssel. Csak a választottak (legfeljebb kettő: cím és szöveg). */
const SajatBetu = z.object({
  /** "sajat:<fájl-azonosító>" — ugyanaz a kulcs áll a `betu_cim` / `betu_szoveg` mezőben */
  kulcs: z.string().regex(/^sajat:[0-9a-f-]{36}$/),
  /** data:font/…;base64,… — a 10 MB-os fájl base64-ben ≤ ~14 M karakter */
  adat: z.string().max(14_500_000).regex(/^data:font\/(ttf|otf|woff2);base64,/),
  formatum: z.enum(["truetype", "opentype", "woff2"]),
});
export type SajatBetu = z.infer<typeof SajatBetu>;

/** A munkatér arculata a képhez — a Szervezet adataiból vagy a jóváhagyott arculatból; hiányában a semleges alap. */
export const HelyzetArculat = z.object({
  nev: z.string().min(1).max(80),
  /** a fő szín és a háttér; hiányukban a semleges alap (SEMLEGES) */
  fo: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#2b2e36"),
  hatter: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#f4f4f2"),
  /** VZ-3: az arculat második színe (a színváltozatokhoz); null → csak a Világos változat van */
  masodik: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().default(null),
  /** a betűcsalád kulcsa (BETUK) vagy az arculat betű-szövege (pl. "'Archivo',sans-serif") — ismeretlennél a semleges alapé */
  betu: z.string().max(120).default("public-sans"),
  /** R-16 K5 (gepezet 7): KÉT betű — a cím-szerű mezők (cím, szám, a név logó helyett) a `betu_cim`-mel, minden más a `betu_szoveg`-gel.
   *  Érték: beépített kulcs (BETUK), régi CSS-szöveg, vagy "sajat:<id>" (akkor a `sajat_betuk`-ban a bájtja). Hiányuk: a régi `betu`. */
  betu_cim: z.string().max(120).optional(),
  betu_szoveg: z.string().max(120).optional(),
  /** R-16 K5: a választott saját betűk bájtjai (legfeljebb kettő) */
  sajat_betuk: z.array(SajatBetu).max(2).default([]),
  /** RÉGI (R-16 előtti) mező: EGY logó adat-URL-ként (PNG/JPEG/WEBP/SVG); null → a cég neve betűvel.
   *  Az R-16 K2 óta a `logok` térkép az elsődleges; ha az üres, ez a `logok.vilagos` helyére áll (`arculatLogok`). */
  logo: z.string().max(3_000_000).nullable().default(null),
  /** R-16 K2 (gepezet 4): a négy logóhely, mindegyik a munkatér legfrissebb fájlja arra a helyre. A `negyzetes` a hét
   *  képen nem kerül fel (TERV §4 7.), csak a teljesség kedvéért fogadjuk. */
  logok: z
    .object({ vilagos: KepLogo.optional(), sotet: KepLogo.optional(), egyszinu: KepLogo.optional(), negyzetes: KepLogo.optional() })
    .default({}),
  /** c30 F12: a munkatér fesztivál — a kép kis feliratai a fesztivál szavaival („KÉSZ MUNKA” → „ILYEN VOLT”). Hiánya: a cég feliratai. */
  fesztival: z.boolean().optional(),
});
export type HelyzetArculat = z.infer<typeof HelyzetArculat>;
export type KepLogo = z.infer<typeof KepLogo>;
export type HelyzetLogok = HelyzetArculat["logok"];

/** A tényleges logókészlet: a `logok` térkép, vagy — ha üres — a régi egyetlen `logo` a `vilagos` helyen, átlátszóság
 *  nélkül (TERV §5: a régi logóról nem tudjuk, átlátszó-e → lemez, nem színezés). Így a régi befogadó (csak `logo`) is működik. */
export function arculatLogok(a: HelyzetArculat): HelyzetLogok {
  const l = a.logok ?? {};
  if (l.vilagos || l.sotet || l.egyszinu || l.negyzetes) return l;
  return a.logo ? { vilagos: { adat: a.logo, atlatszo: false } } : {};
}

/** A semleges alap (tokenek.md: --kep-semleges-*) — minden munkatér ezt kapja, akinek nincs arculata. */
export const SEMLEGES = { fo: "#2b2e36", hatter: "#f4f4f2", szoveg: "#1d1f24", betu: "public-sans" } as const;

const Foto = z.object({
  /** adat-URL (JPEG/PNG/WEBP) */
  adat: z.string().max(12_000_000),
  /** a kép közepe a kereten belül, 0–100 % */
  x: z.number().min(0).max(100).default(50),
  y: z.number().min(0).max(100).default(50),
  /** nagyítás, 1 = kitölti a keretet */
  nagyitas: z.number().min(1).max(4).default(1),
});

export const HelyzetTartalom = z.object({
  cim: z.string().max(300).default(""),
  sor: z.string().max(400).default(""),
  szam: z.string().max(20).default(""),
  mikor: z.string().max(120).default(""),
  hol: z.string().max(120).default(""),
  /** a második nyelv egy sora (a rajz „ro” sora) */
  masodik: z.string().max(300).default(""),
  fotok: z.array(Foto).max(2).default([]),
  /** előtte–utána: két fotó egymás mellett (Kész munka) */
  elotte_utana: z.boolean().default(false),
});
export type HelyzetTartalom = z.infer<typeof HelyzetTartalom>;

/** A kép nyelvén a kis feliratok (a kép része, nem a felületé). */
const FELIRAT: Record<string, Record<string, string>> = {
  hu: { kesz: "KÉSZ MUNKA", akcio: "AKCIÓ", uj: "ÚJ", hir: "FONTOS", tudtad: "Tudtad?", esemeny: "ESEMÉNY", hol: "HOL", mikor: "MIKOR", foto: "fotó", elotte: "előtte", utana: "utána" },
  ro: { kesz: "LUCRARE GATA", akcio: "OFERTĂ", uj: "NOU", hir: "IMPORTANT", tudtad: "Știai?", esemeny: "EVENIMENT", hol: "UNDE", mikor: "CÂND", foto: "foto", elotte: "înainte", utana: "după" },
  en: { kesz: "JUST FINISHED", akcio: "OFFER", uj: "NEW", hir: "NOTICE", tudtad: "Did you know?", esemeny: "EVENT", hol: "WHERE", mikor: "WHEN", foto: "photo", elotte: "before", utana: "after" },
};

/** c30 F12: fesztiválnál ezek a kis feliratok mások (a többi ugyanaz) — a „Kész munka” egy fesztiválnál „Ilyen volt”. */
const FELIRAT_FESZTIVAL: Record<string, Record<string, string>> = {
  hu: { kesz: "ILYEN VOLT", akcio: "JEGY" },
  ro: { kesz: "CUM A FOST", akcio: "BILETE" },
  en: { kesz: "HOW IT WAS", akcio: "TICKETS" },
};

/** A munkatér választható betűi (ArculatBlokk: CIM_BETUK/SZOVEG_BETUK) → nyílt betűfájl. A Georgia helyett a vele
 *  méretazonos Gelasio áll (a Georgia nem szabad betű). Az arab betűk (Cairo, Tajawal) nincsenek: V-2 — nincs RTL. */
export const BETUK: Record<string, string> = {
  archivo: "Archivo",
  "public-sans": "Public Sans",
  "ibm-plex-sans": "IBM Plex Sans",
  "space-grotesk": "Space Grotesk",
  gelasio: "Gelasio",
};
/** Az arculat betű-szövegéből (pl. "'Archivo',sans-serif", "Georgia, serif") a betűkulcs. */
export function betuKulcs(css: string | null | undefined): string {
  const s = (css ?? "").toLowerCase();
  if (s.includes("archivo")) return "archivo";
  if (s.includes("space grotesk")) return "space-grotesk";
  if (s.includes("ibm plex sans")) return "ibm-plex-sans";
  if (s.includes("georgia")) return "gelasio";
  return "public-sans";
}

const LATIN = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
const LATIN_EXT = "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF";

/** A képgyártó betűfájljainak súlyai családonként (tools/vizual/referencia/betuk-munkater — pontosan ami ott van).
 *  Javítás (R-16 K2 közben mérve, 2026-09-30): a régi szabály a Gelasio kivételével MINDEN családnak 800-as súlyt is kért,
 *  de a Space Grotesknek és az IBM Plex Sansnak nincs 800-as fájlja → a képgyártó ENOENT-tel 500-at adott minden képre,
 *  ha a munkatér ezt a betűt választotta. A 800-as szöveg ezeknél a legközelebbi (700) súllyal rajzolódik. */
const BETU_SULYOK: Record<string, number[]> = {
  archivo: [400, 500, 600, 700, 800],
  "public-sans": [400, 500, 600, 700, 800],
  "ibm-plex-sans": [400, 500, 600, 700],
  "space-grotesk": [400, 500, 600, 700],
  gelasio: [400, 500, 600, 700],
};

/** R-16 K5: egy kép betűje — a CSS `font-family` értéke és (saját betűnél) a `@font-face` sora. */
type KepBetu = { csalad: string; beepitett: string | null; sajat: SajatBetu | null; sajatNev: string | null };

/**
 * A mező betűje (TERV 1.5): "sajat:<id>" → a saját betű, ha a bájtja megjött (különben a tartalék Public Sans); más → a beépített kulcs
 * (régi CSS-szövegből is: `betuKulcs`). A saját betű mögött MINDIG a Public Sans áll: a böngésző karakterenként vált, így egy hiányzó
 * ékezet (pl. ș) a tartalékkal rajzolódik — ez a „tartalék betű” (a 12e halk sora).
 */
function kepBetu(ertek: string, sajatok: readonly SajatBetu[]): KepBetu {
  if (ertek.startsWith("sajat:")) {
    const i = sajatok.findIndex((x) => x.kulcs === ertek);
    const s = sajatok[i];
    if (s) {
      // saját családnév a sorszámból: a betű belső neve nem ütközhet a beépítettekkel, és ha a cím és a szöveg ugyanaz a fájl,
      // a `@font-face` egyszer kerül a képbe (a fájl akár 10 MB)
      const nev = `KM Sajat ${i + 1}`;
      return { csalad: `'${nev}','Public Sans',sans-serif`, beepitett: "public-sans", sajat: s, sajatNev: nev };
    }
    return { csalad: "'Public Sans',sans-serif", beepitett: "public-sans", sajat: null, sajatNev: null };
  }
  const bk = ertek in BETUK ? ertek : betuKulcs(ertek);
  return { csalad: `'${BETUK[bk]}',sans-serif`, beepitett: bk, sajat: null, sajatNev: null };
}

function betuCss(kulcsok: readonly string[], betuCim: (fajl: string) => string, sajatok: readonly { nev: string; b: SajatBetu }[] = []): string {
  const ki: string[] = [];
  const csalad = (k: string, nev: string, sulyok: number[]) => {
    for (const w of sulyok)
      for (const [s, r] of [["latin", LATIN], ["latin-ext", LATIN_EXT]] as const)
        ki.push(`@font-face{font-family:'${nev}';font-weight:${w};font-style:normal;src:url('${betuCim(`${k}-${s}-${w}-normal.woff2`)}') format('woff2');unicode-range:${r};}`);
  };
  // R-16 K5: a cím és a szöveg betűje (ha egyezik, egyszer), és — ha van saját betű — a Public Sans is, mint tartalék
  for (const kulcs of [...new Set(kulcsok)]) csalad(kulcs, BETUK[kulcs] ?? "Public Sans", BETU_SULYOK[kulcs] ?? BETU_SULYOK["public-sans"]!);
  csalad("ibm-plex-mono", "IBM Plex Mono", [400, 500]);
  // saját betű: egy fájl, egy súly — minden súlyra ugyanaz a fájl (a böngésző a vastagot műkiemeléssel adja, ha a fájl nem vastag)
  for (const { nev, b } of sajatok) ki.push(`@font-face{font-family:'${nev}';font-weight:100 900;font-style:normal;src:url('${b.adat}') format('${b.formatum}');}`);
  return ki.join("\n");
}

// ——— színek ———
function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function fenyesseg(hex: string): number {
  const f = rgb(hex).map((c) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * f[0]! + 0.7152 * f[1]! + 0.0722 * f[2]!;
}
function kever(hex: string, cel: string, t: number): string {
  const a = rgb(hex), b = rgb(cel);
  return "#" + a.map((c, i) => Math.round(c + (b[i]! - c) * t).toString(16).padStart(2, "0")).join("");
}
/** A fő szín fölé írt szöveg: fehér vagy sötét, amelyik jobban olvasható. */
export function raIrt(hex: string): string {
  const L = fenyesseg(hex);
  const feherre = 1.05 / (L + 0.05);
  const sotetre = (L + 0.05) / (fenyesseg(SEMLEGES.szoveg) + 0.05);
  return feherre >= sotetre ? "#ffffff" : SEMLEGES.szoveg;
}

// ——— VZ-3: színváltozatok (design/vz3/szabaly.md; a rajz futtatható szabálya: design/vz3/rajz/vz3-kep.js) ———
export const VALTOZATOK = ["vilagos", "szines", "sotet", "masodik", "atmenet"] as const;
export type Valtozat = (typeof VALTOZATOK)[number];
function kontrasztArany(a: string, b: string): number {
  const x = fenyesseg(a), y = fenyesseg(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
const sotetit = (h: string, k: number) => "#" + rgb(h).map((c) => Math.round(c * k).toString(16).padStart(2, "0")).join("");
const crMin = (a: string, veg: string[]) => Math.min(...veg.map((b) => kontrasztArany(a, b)));
/** fehér vagy az arculat sötét szövegszíne — amelyik a megadott háttér(ek) MINDEGYIKÉN olvashatóbb */
function legjobb(alap: string | string[], sotet: string): string {
  const v = Array.isArray(alap) ? alap : [alap];
  return crMin("#ffffff", v) >= crMin(sotet, v) ? "#ffffff" : sotet;
}
export interface Paletta {
  /** a kép háttere: szín vagy átmenet (CSS) */
  hatter: string;
  /** a háttér végpontjai — ezeken mérünk */
  veg: string[];
  /** a törzsszöveg színe a háttéren — R-16 K2: `olvashato`-val ≥ 4,5 */
  szoveg: string;
  /** a kiemelő szín NYERSEN (dobozok kitöltése; a változat-szűrés ezt méri) */
  kiem: string;
  panel: string;
  panelVeg: string[];
  /** R-16 K2 (gepezet 5): a kiemelő szín, ha KIS szövegként áll a háttéren (akció sora, esemény címkéi) — ≥ 4,5 */
  kiemKicsi: string;
  /** … ha NAGY szövegként vagy vékony vonalként (Tudtad? fejléce és csíkja, a szám) — ≥ 3 */
  kiemNagy: string;
  /** a kiemelő színű dobozba írt betű (címke, akció száma, ÚJ) — ≥ 4,5 a dobozon */
  kiemRa: string;
  /** a hír paneljére írt betű — ≥ 4,5 a panel végpontjain */
  panelSzoveg: string;
}

// ——— R-16 K2 (gepezet 5): olvasható szöveg minden színen ———
/** WCAG-küszöbök: kis szöveg 4,5, nagy szöveg és vékony vonal 3. */
export const OLVASHATO = { kicsi: 4.5, nagy: 3 } as const;
/** WCAG-kontrasztarány két szín közt (1–21). */
export function wcagArany(a: string, b: string): number {
  return kontrasztArany(a, b);
}
/** A szín, amely a háttér(ek) MINDEGYIKÉN legalább `min` kontrasztú: ha kell, ugyanazon az árnyalaton sötétít
 *  (feketébe keverve) vagy világosít (fehérbe keverve) — előbb abba az irányba, amerre a háttér ellentéte van.
 *  Ha egyik irány sem éri el (két nagyon eltérő háttér), a legjobb elért szín. Tibor nem tud rossz színt választani. */
export function olvashato(szin: string, hatterek: string[], min: number): string {
  if (hatterek.length === 0 || crMin(szin, hatterek) >= min) return szin;
  const hattVil = Math.min(...hatterek.map(fenyesseg)) > 0.35;
  const iranyok = hattVil ? ["#000000", "#ffffff"] : ["#ffffff", "#000000"];
  let legjobbSzin = szin, legjobbCr = crMin(szin, hatterek);
  for (const cel of iranyok) {
    for (let i = 1; i <= 100; i++) {
      const j = kever(szin, cel, i / 100);
      const cr = crMin(j, hatterek);
      if (cr >= min) return j;
      if (cr > legjobbCr) (legjobbSzin = j), (legjobbCr = cr);
    }
  }
  return legjobbSzin;
}

/** A VZ-3 paletta NYERSEN (a változatok szűrése ezen mér — így a nem-Világos változatok köre nem változik R-16-tal). */
function nyersPaletta(a: HelyzetArculat, v: Valtozat): Omit<Paletta, "kiemKicsi" | "kiemNagy" | "kiemRa" | "panelSzoveg"> {
  const sz = SEMLEGES.szoveg;
  const egy = (h: string, szov: string, k: string, p: string) => ({ hatter: h, veg: [h], szoveg: szov, kiem: k, panel: p, panelVeg: [p] });
  const m2 = a.masodik ?? a.fo;
  if (v === "szines") return egy(a.fo, legjobb(a.fo, sz), m2, a.fo);
  if (v === "sotet") { const d = sotetit(a.fo, 0.55); return egy(d, "#ffffff", m2, d); }
  if (v === "masodik") return egy(a.hatter, sz, m2, m2);
  if (v === "atmenet") {
    const parok: [string, string][] = [[a.fo, m2], [a.fo, sotetit(a.fo, 0.55)]];
    for (let i = 0; i < parok.length; i++) {
      const par = parok[i]!;
      const szov = legjobb(par, sz);
      if (crMin(szov, par) >= 4.5 || i === parok.length - 1) {
        const g = `linear-gradient(160deg,${par[0]} 0%,${par[1]} 100%)`;
        return { hatter: g, veg: par, szoveg: szov, kiem: i === 0 ? a.fo : m2, panel: g, panelVeg: par };
      }
    }
  }
  // R-16 K2: a Világos háttér betűje a jobbik (fehér vagy sötét), nem a 0,35-ös küszöb — 0,21 és 0,35 közti
  // világosságú háttéren a küszöb fehéret adott, pedig ott a sötét olvashatóbb (a fehér 3 alá is eshetett).
  return egy(a.hatter, legjobb(a.hatter, sz), a.fo, a.fo);
}
/** A változat színei, a szövegként használt színek `olvashato`-val kiigazítva (R-16 K2, gepezet 5). */
export function paletta(a: HelyzetArculat, v: Valtozat): Paletta {
  const n = nyersPaletta(a, v);
  const sz = SEMLEGES.szoveg;
  return {
    ...n,
    szoveg: olvashato(n.szoveg, n.veg, OLVASHATO.kicsi),
    kiemKicsi: olvashato(n.kiem, n.veg, OLVASHATO.kicsi),
    kiemNagy: olvashato(n.kiem, n.veg, OLVASHATO.nagy),
    kiemRa: olvashato(legjobb(n.kiem, sz), [n.kiem], OLVASHATO.kicsi),
    panelSzoveg: olvashato(legjobb(n.panelVeg, sz), n.panelVeg, OLVASHATO.kicsi),
  };
}
/** Amit a kiemelő szín hordoz képenként (szabaly.md 2.). */
const ELEMEK: Record<Helyzet, string[]> = {
  kesz: ["cimke"], akcio: ["cimke", "doboz", "kisSzoveg"], uj: ["cimke"], hir: ["panel", "cimke"],
  tudtad: ["nagySzoveg", "csik"], esemeny: ["cimke", "kisSzoveg"], szam: ["nagySzoveg"],
};
/** A kép minden szövege eléri-e a küszöbét a megadott szín-hozzárendeléssel. */
function merEzt(h: Helyzet, p: { veg: string[]; szoveg: string; panelVeg: string[] }, sz: { ra: string; kicsi: string; nagy: string; panel: string }, kiem: string): boolean {
  if (h !== "uj" && h !== "hir" && crMin(p.szoveg, p.veg) < 4.5) return false;
  for (const e of ELEMEK[h]) {
    if ((e === "cimke" || e === "doboz") && kontrasztArany(sz.ra, kiem) < 4.5) return false;
    if (e === "kisSzoveg" && crMin(sz.kicsi, p.veg) < 4.5) return false;
    if ((e === "nagySzoveg" || e === "csik") && crMin(sz.nagy, p.veg) < 3) return false;
    if (e === "panel" && crMin(sz.panel, p.panelVeg) < 4.5) return false;
  }
  return true;
}
function vizsgal(h: Helyzet, a: HelyzetArculat, v: Valtozat): boolean {
  if (v !== "vilagos" && !a.masodik) return false;
  if (v === "vilagos") {
    // R-16 K2: a Világos már NEM „a jóváhagyott arculat ezt ellenőrizte" — Tibor bármely gyűrű-színt választhatja.
    // A Világos színeit `olvashato` igazítja; itt a kiigazított palettát mérjük (a próba: helyzet-olvashato.proba.ts).
    const p = paletta(a, v);
    return merEzt(h, p, { ra: p.kiemRa, kicsi: p.kiemKicsi, nagy: p.kiemNagy, panel: p.panelSzoveg }, p.kiem);
  }
  // a többi változat csak akkor marad, ha NYERS színeivel is működik (VZ-3 szabály, változatlan)
  const p = nyersPaletta(a, v);
  const sz = SEMLEGES.szoveg;
  return merEzt(h, p, { ra: legjobb(p.kiem, sz), kicsi: p.kiem, nagy: p.kiem, panel: legjobb(p.panelVeg, sz) }, p.kiem);
}
/** A megmaradó változatok, a rajz sorrendjében (a Világos mindig; az azonosan kinézők közül csak az első). */
export function valtozatok(h: Helyzet, a: HelyzetArculat): Valtozat[] {
  const latott = new Set<string>();
  const ki: Valtozat[] = [];
  for (const v of VALTOZATOK) {
    if (!vizsgal(h, a, v)) continue;
    const p = nyersPaletta(a, v);
    const al = h === "uj" ? p.kiem : h === "hir" ? `${p.panel}|${p.kiem}` : `${p.hatter}|${p.szoveg}|${p.kiem}`;
    if (latott.has(al)) continue;
    latott.add(al);
    ki.push(v);
  }
  return ki;
}

// ——— R-16 K2 (gepezet 4): logó a háttérhez ———
/** Világos-e a háttér: MINDEN végpontja 0,35 fölött (ugyanaz a küszöb, mint a paletta régi szabályáé). */
export function vilagosHatter(hatterek: string[]): boolean {
  return hatterek.length > 0 && Math.min(...hatterek.map(fenyesseg)) > 0.35;
}
export interface LogoValasztas {
  adat: string;
  /** "fekete": brightness(0) · "feher": brightness(0) invert(1) · "": ahogy van */
  szures: "" | "feher" | "fekete";
  /** a logó alá tett kis lemez színe, vagy null */
  lemez: string | null;
  /** melyik helyről jött (a próbákhoz és a data-attribútumhoz) */
  hely: "vilagos" | "sotet" | "egyszinu";
}
/** Melyik logó, hogyan kerül az adott háttérre. Tiszta függvény; null → a cég neve betűvel.
 *  Világos háttér: vilagos → egyszinu (feketére színezve, ha átlátszó ÉS világos) → sotet sötét lemezen → egyszinu világos lemezen → név.
 *  Sötét/színes háttér: sotet → egyszinu fehérre (csak átlátszónál) → vilagos fehérre (csak átlátszónál) →
 *  vilagos világos lemezen → egyszinu világos lemezen → név.
 *  A `negyzetes` a hét képen nem kerül fel (TERV §4 7.). Az „egyszinu lemezen" lépés a terv sorrendje után, a név előtt
 *  áll (TERV §4 8.: egy logós munkatér se „veszítse el" a logóját) — a terv csak a vilagos-lemezt írta ki. */
export function logoValaszt(
  logok: HelyzetLogok,
  hatterek: string[],
  lemezek: { vilagos: string; sotet: string } = { vilagos: "#ffffff", sotet: SEMLEGES.szoveg },
): LogoValasztas | null {
  const { vilagos, sotet, egyszinu } = logok;
  if (vilagosHatter(hatterek)) {
    if (vilagos) return { adat: vilagos.adat, szures: "", lemez: null, hely: "vilagos" };
    if (egyszinu) {
      const vilagosLogo = egyszinu.vilagossag !== undefined && egyszinu.vilagossag >= 0.45;
      if (!egyszinu.atlatszo || !vilagosLogo) return { adat: egyszinu.adat, szures: "", lemez: null, hely: "egyszinu" };
      return { adat: egyszinu.adat, szures: "fekete", lemez: null, hely: "egyszinu" };
    }
    if (sotet) return { adat: sotet.adat, szures: "", lemez: lemezek.sotet, hely: "sotet" };
    return null;
  }
  if (sotet) return { adat: sotet.adat, szures: "", lemez: null, hely: "sotet" };
  if (egyszinu?.atlatszo) return { adat: egyszinu.adat, szures: "feher", lemez: null, hely: "egyszinu" };
  if (vilagos?.atlatszo) return { adat: vilagos.adat, szures: "feher", lemez: null, hely: "vilagos" };
  if (vilagos) return { adat: vilagos.adat, szures: "", lemez: lemezek.vilagos, hely: "vilagos" };
  if (egyszinu) return { adat: egyszinu.adat, szures: "", lemez: lemezek.vilagos, hely: "egyszinu" };
  return null;
}
/** A lemezek színe a munkatér színeiből: világos lemez = a munkatér háttérszíne (ha világos), sötét = a sötétített fő szín (ha elég sötét). */
export function logoLemezek(a: HelyzetArculat): { vilagos: string; sotet: string } {
  const d = sotetit(a.fo, 0.55);
  return { vilagos: fenyesseg(a.hatter) > 0.35 ? a.hatter : "#ffffff", sotet: fenyesseg(d) <= 0.18 ? d : SEMLEGES.szoveg };
}
/** A „ÚJ" kép alsó sávja: fotó fölött sötét átmenet — mindig sötét háttérnek számít. */
const SOTET_ATFEDES = ["#000000"];

// ——— a kép ———
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ARANY: Record<Meret, number> = { poszt: 1.25, story: 16 / 9, negyzet: 1 };
/** A cím betűméretének lépcsői — a gép ezeken lép lefelé, ha nem fér ki. */
export const CIM_LEPCSO = [1, 0.9, 0.8, 0.7] as const;

export interface HelyzetOpciok {
  betuCim: (fajl: string) => string;
  nyelv: string;
  /** a cím lépcsője (0 = a rajz mérete) */
  fok: number;
  /** VZ-3: a színváltozat (alap: Világos) */
  valtozat?: Valtozat;
}

/** A kép HTML-je, 1080 px szélesen. A mérendő szövegek `data-mezo`-t kapnak; a blokkok `data-blokk`-ot (túlcsordulás). */
export function helyzetHtml(h: Helyzet, meret: Meret, t: HelyzetTartalom, a: HelyzetArculat, o: HelyzetOpciok): string {
  const W = MERETEK[meret].w, H = MERETEK[meret].h;
  const u = W / 240;
  const mag = meret === "story", lapos = meret === "negyzet";
  const px = (n: number) => `${+(n * u).toFixed(2)}px`;
  const pad = 14 * u;
  const cimSzorzo = CIM_LEPCSO[Math.min(o.fok, CIM_LEPCSO.length - 1)]!;
  const cimPx = (n: number) => px(n * cimSzorzo);
  const fel = { ...(FELIRAT[o.nyelv] ?? FELIRAT["hu"]!), ...(a.fesztival ? (FELIRAT_FESZTIVAL[o.nyelv] ?? FELIRAT_FESZTIVAL["hu"]!) : {}) };
  // R-16 K5 (gepezet 7): két betű — cím (a cím-szerű mezők) és szöveg (minden más); hiányukban a régi egyetlen `betu`
  const cimBetu = kepBetu(a.betu_cim ?? a.betu, a.sajat_betuk);
  const szovegBetu = kepBetu(a.betu_szoveg ?? a.betu, a.sajat_betuk);
  const betu = szovegBetu.csalad;
  const cimCsalad = `font-family:${cimBetu.csalad};`;
  const betuKulcsok = [cimBetu.beepitett, szovegBetu.beepitett].filter((k): k is string => k !== null);
  const sajatFace = [cimBetu, szovegBetu].flatMap((b) => (b.sajat && b.sajatNev ? [{ nev: b.sajatNev, b: b.sajat }] : []))
    .filter((f, i, l) => l.findIndex((g) => g.nev === f.nev) === i);
  const pal = paletta(a, o.valtozat ?? "vilagos");
  // R-16 K2 (gepezet 5): a kiemelő szín dobozként nyersen (fo), szövegként/vonalként kiigazítva (foKicsi, foNagy)
  const fo = pal.kiem, foSzoveg = pal.kiemRa, foKicsi = pal.kiemKicsi, foNagy = pal.kiemNagy, hatter = pal.hatter, szoveg = pal.szoveg;
  const panel = pal.panel, panelSzoveg = pal.panelSzoveg;
  const logok = arculatLogok(a), lemezek = logoLemezek(a);
  const foto1 = kever(a.hatter, "#000000", 0.18), foto2 = kever(a.hatter, "#000000", 0.24);
  const mono = "'IBM Plex Mono',monospace";
  const col = `display:flex;flex-direction:column;gap:${px(6)};`;

  const foto = (st: string, cimke: string, i = 0) => {
    const f = t.fotok[i];
    if (f)
      return `<div data-foto="${i}" style="position:relative;overflow:hidden;${st}"><div style="position:absolute;inset:0;background-image:url('${f.adat}');background-size:cover;background-position:${f.x}% ${f.y}%;transform:scale(${f.nagyitas});transform-origin:${f.x}% ${f.y}%;"></div></div>`;
    return `<div data-foto-hely="${i}" style="position:relative;background:repeating-linear-gradient(135deg,${foto1} 0 ${px(9)},${foto2} ${px(9)} ${px(18)});display:flex;align-items:center;justify-content:center;${st}"><span style="font-family:${mono};font-size:${px(9)};color:rgba(0,0,0,0.45);background:rgba(255,255,255,0.6);padding:${px(1)} ${px(5)};border-radius:${px(3)};">${esc(cimke)}</span></div>`;
  };
  // R-16 K2 (gepezet 4): minden logóhely tudja a saját hátterét — a logó ahhoz választ (logoValaszt)
  const SZURES = { "": "", fekete: "filter:brightness(0);", feher: "filter:brightness(0) invert(1);" } as const;
  const logo = (hatterek: string[], szin?: string) => {
    const l = logoValaszt(logok, hatterek, lemezek);
    if (!l)
      return `<div data-mezo="logo" data-logo="nev" style="font-weight:700;font-size:${px(10)};letter-spacing:0.06em;color:${szin ?? szoveg};opacity:0.85;${cimCsalad}">${esc(a.nev)}</div>`;
    const img = `<img src="${l.adat}" alt="" style="display:block;height:${px(12)};max-width:${px(90)};object-fit:contain;object-position:left center;${SZURES[l.szures]}">`;
    const jel = `data-mezo="logo" data-logo="${l.hely}" data-logo-szures="${l.szures}"`;
    if (!l.lemez) return `<div ${jel}>${img}</div>`;
    return `<div ${jel} data-logo-lemez="${l.lemez}" style="display:flex;align-self:flex-start;width:fit-content;background:${l.lemez};padding:${px(3)} ${px(5)};border-radius:${px(3)};">${img}</div>`;
  };
  const alapLogo = () => logo(pal.veg);
  // VZ-3 (kerdesek 5.): a helyzet címkéje kiemelő színű DOBOZ, benne fehér vagy sötét betű — így marad olvasható minden változatban
  const kicker = (txt: string, _szin?: string) =>
    txt ? `<div style="align-self:flex-start;font-family:${mono};font-size:${px(8.5)};letter-spacing:0.12em;font-weight:600;background:${fo};color:${foSzoveg};padding:${px(2)} ${px(6)};border-radius:${px(3)};">${esc(txt)}</div>` : "";
  const masodik = (st = "") => (t.masodik ? `<div data-mezo="masodik" style="font-size:${px(10.5)};line-height:1.3;opacity:0.75;${st}">${esc(t.masodik)}</div>` : "");
  // R-16 K5: a cím és a szám a cím-betűvel (a stílus végén, így a meglévő stílus-részletek változatlanok); minden más a lap (szöveg) betűjével
  const div = (mezo: string, szov: string, st: string) => (szov ? `<div data-mezo="${mezo}" style="${st}${mezo === "cim" || mezo === "szam" ? cimCsalad : ""}">${esc(szov)}</div>` : "");
  const vanFoto = t.fotok.length > 0;

  let belso = "";
  if (h === "kesz") {
    const fotok = t.elotte_utana
      ? `<div style="flex:${mag ? 1.6 : 1.2};display:flex;gap:${px(2)};">${foto("flex:1;", fel["elotte"]!, 0)}${foto("flex:1;", fel["utana"]!, 1)}</div>`
      : foto(`flex:${mag ? 1.8 : lapos ? 1 : 1.3};`, fel["foto"]!, 0);
    belso =
      fotok +
      `<div data-blokk="szoveg" style="padding:${px(14)};${col}">${kicker(fel["kesz"]!)}${div("cim", t.cim, `font-size:${cimPx(lapos ? 17 : 19)};font-weight:700;line-height:1.1;`)}${div("sor", t.sor, `font-size:${px(11)};line-height:1.3;`)}${masodik()}<div style="margin-top:${px(4)};">${alapLogo()}</div></div>`;
  } else if (h === "akcio") {
    belso =
      `<div data-blokk="szoveg" style="flex:1;min-height:0;padding:${px(14)};justify-content:center;${col}">${kicker(fel["akcio"]!)}` +
      div("szam", t.szam, `align-self:flex-start;background:${fo};color:${foSzoveg};font-size:${px(mag ? 54 : 44)};font-weight:800;line-height:1;padding:${px(6)} ${px(10)};border-radius:${px(4)};`) +
      div("cim", t.cim, `font-size:${cimPx(19)};font-weight:700;line-height:1.1;`) +
      div("sor", t.sor, `font-size:${px(12)};font-weight:600;color:${foKicsi};`) +
      masodik() +
      `</div>` +
      (lapos || !vanFoto ? "" : foto(`height:${mag ? 38 : 26}%;flex:none;`, fel["foto"]!, 0)) +
      `<div style="padding:${px(10)} ${px(14)};">${alapLogo()}</div>`;
  } else if (h === "uj") {
    belso =
      foto("position:absolute;inset:0;", fel["foto"]!, 0) +
      `<div style="position:absolute;left:0;right:0;bottom:0;height:62%;background:linear-gradient(transparent, rgba(0,0,0,0.72));"></div>` +
      `<div data-blokk="also" style="position:absolute;left:${px(14)};right:${px(14)};bottom:${px(14)};color:#fff;${col}">` +
      `<span style="align-self:flex-start;background:${fo};color:${foSzoveg};font-size:${px(9)};font-weight:700;letter-spacing:0.1em;padding:${px(2)} ${px(6)};border-radius:${px(3)};">${esc(fel["uj"]!)}</span>` +
      div("cim", t.cim, `font-size:${cimPx(20)};font-weight:700;line-height:1.1;`) +
      div("sor", t.sor, `font-size:${px(11)};`) +
      masodik("opacity:0.8;") +
      logo(SOTET_ATFEDES, "#ffffff") +
      `</div>`;
  } else if (h === "hir") {
    belso =
      // a hír háttere EGY felületen fut a lap aljáig (átmenetnél különben a logósávnál törne a színátmenet)
      `<div style="flex:1;min-height:0;display:flex;flex-direction:column;background:${panel};">` +
      `<div data-blokk="szoveg" style="flex:1;min-height:0;color:${panelSzoveg};padding:${px(14 * 1.2)};justify-content:center;${col}">${kicker(fel["hir"]!)}` +
      div("cim", t.cim, `font-size:${cimPx(mag ? 30 : 26)};font-weight:800;line-height:1.05;`) +
      div("mikor", t.mikor, `font-size:${px(12)};font-weight:600;opacity:0.9;`) +
      div("sor", t.sor, `font-size:${px(11)};line-height:1.3;opacity:0.9;`) +
      (t.masodik ? `<div data-mezo="masodik" style="font-size:${px(11)};opacity:0.75;border-top:${px(0.25)} solid rgba(255,255,255,0.3);padding-top:${px(5)};">${esc(t.masodik)}</div>` : "") +
      `</div><div style="padding:${px(10)} ${px(14)};">${logo(pal.panelVeg, panelSzoveg)}</div></div>`;
  } else if (h === "tudtad") {
    belso =
      `<div data-blokk="szoveg" style="flex:1;min-height:0;padding:${px(14 * 1.2)};justify-content:center;${col}">` +
      `<div style="font-size:${px(15)};font-weight:700;color:${foNagy};">${esc(fel["tudtad"]!)}</div>` +
      div("cim", t.cim, `font-size:${cimPx(mag ? 24 : 21)};font-weight:700;line-height:1.12;`) +
      `<div style="height:${px(2)};width:${px(30)};background:${foNagy};"></div>` +
      div("sor", t.sor, `font-size:${px(11.5)};line-height:1.35;`) +
      masodik() +
      `</div><div style="padding:${px(10)} ${px(14)};">${alapLogo()}</div>`;
  } else if (h === "esemeny") {
    const sor = (mezo: string, k: string, v: string) =>
      v ? `<div style="display:flex;flex-direction:column;gap:${px(0.25)};"><span style="font-size:${px(8.5)};letter-spacing:0.1em;color:${foKicsi};font-weight:600;">${esc(k)}</span><span data-mezo="${mezo}" style="font-size:${px(12)};font-weight:600;">${esc(v)}</span></div>` : "";
    belso =
      (lapos || !vanFoto ? "" : foto(`height:${mag ? 40 : 30}%;flex:none;`, fel["foto"]!, 0)) +
      `<div data-blokk="szoveg" style="flex:1;min-height:0;padding:${px(14)};justify-content:center;${col}">${kicker(fel["esemeny"]!)}` +
      div("cim", t.cim, `font-size:${cimPx(20)};font-weight:700;line-height:1.1;`) +
      sor("hol", fel["hol"]!, t.hol) +
      sor("mikor", fel["mikor"]!, t.mikor) +
      masodik() +
      `</div><div style="padding:${px(10)} ${px(14)};">${alapLogo()}</div>`;
  } else {
    belso =
      `<div data-blokk="szoveg" style="flex:1;min-height:0;padding:${px(14 * 1.2)};justify-content:center;${col}">` +
      div("szam", t.szam, `font-size:${px(mag ? 96 : 80)};font-weight:800;line-height:0.95;color:${foNagy};white-space:nowrap;`) +
      div("cim", t.cim, `font-size:${cimPx(17)};font-weight:700;line-height:1.15;`) +
      masodik() +
      `</div><div style="padding:${px(10)} ${px(14)};">${alapLogo()}</div>`;
  }

  void pad;
  void ARANY;
  return `<!doctype html><html lang="${esc(o.nyelv)}"><head><meta charset="utf-8"><style>
${betuCss(betuKulcsok, o.betuCim, sajatFace)}
html,body{margin:0;padding:0;}
*{box-sizing:border-box;}
#kep{position:relative;width:${W}px;height:${H}px;overflow:hidden;background:${hatter};color:${szoveg};font-family:${betu};display:flex;flex-direction:column;}
#kep>div.retegek{position:absolute;inset:0;display:flex;flex-direction:column;}
[data-mezo]{overflow-wrap:anywhere;hyphens:manual;}
</style></head><body><div id="kep"><div class="retegek">${belso}</div></div></body></html>`;
}

/** A mérés a lapon: melyik blokk csordul túl, melyik szöveg hány sor, és a szám kilóg-e. A böngészőben fut. */
export const HELYZET_MERO = `(() => {
  const kep = document.getElementById('kep');
  const K = kep.getBoundingClientRect();
  const tul = [];
  for (const b of document.querySelectorAll('[data-blokk]')) {
    const r = b.getBoundingClientRect();
    if (b.scrollHeight > b.clientHeight + 1 || r.top < K.top - 0.5 || r.bottom > K.bottom + 0.5) tul.push(b.getAttribute('data-blokk'));
    if (b.getAttribute('data-blokk') === 'also' && r.top < K.top + K.height * 0.2) tul.push('also');
  }
  const mezok = [];
  for (const e of document.querySelectorAll('[data-mezo]')) {
    const r = e.getBoundingClientRect();
    const lh = parseFloat(getComputedStyle(e).lineHeight) || parseFloat(getComputedStyle(e).fontSize) * 1.2;
    mezok.push({ mezo: e.getAttribute('data-mezo'), sorok: Math.max(1, Math.round(r.height / lh)), kilog: e.scrollWidth > e.clientWidth + 1 || r.right > K.right + 0.5 });
  }
  return { tul, mezok };
})()`;

export interface HelyzetMeres {
  tul: string[];
  mezok: { mezo: string; sorok: number; kilog: boolean }[];
}

export interface HelyzetEredmeny {
  html: string;
  fok: number;
  meres: HelyzetMeres;
  /** a gép lépett: a cím kisebb betűvel áll */
  kisebbBetu: boolean;
  /** a lépcső végén sem fér ki — melyik mező a hibás (a cím, vagy a szám, ha az lóg ki) */
  nemFer: string | null;
}

/** A cím legfeljebb ennyi sor (poszt · négyzet); Story-n eggyel több. Fölötte a kép már nem olvasható egy pillantással. */
export const CIM_MAX_SOR: Record<Helyzet, number> = { kesz: 3, akcio: 2, uj: 3, hir: 4, tudtad: 4, esemeny: 3, szam: 3 };

/** Összeállít, mér, és a cím lépcsőjén lefelé lép, amíg minden elfér. */
export async function helyzetIllesztes(
  h: Helyzet,
  meret: Meret,
  t: HelyzetTartalom,
  a: HelyzetArculat,
  o: Omit<HelyzetOpciok, "fok">,
  mer: (html: string) => Promise<HelyzetMeres>,
): Promise<HelyzetEredmeny> {
  let fok = 0;
  for (;;) {
    const html = helyzetHtml(h, meret, t, a, { ...o, fok });
    const meres = await mer(html);
    const szamLog = meres.mezok.some((m) => m.mezo === "szam" && m.kilog);
    const maxSor = CIM_MAX_SOR[h] + (meret === "story" ? 1 : 0);
    const baj = meres.tul.length > 0 || szamLog || meres.mezok.some((m) => m.mezo === "cim" && (m.kilog || m.sorok > maxSor));
    if (!baj) return { html, fok, meres, kisebbBetu: fok > 0, nemFer: null };
    if (szamLog || fok >= CIM_LEPCSO.length - 1) return { html, fok, meres, kisebbBetu: fok > 0, nemFer: szamLog ? "szam" : "cim" };
    fok++;
  }
}

/** A kártyák mintaszövege, amíg a gép nem ír a cég szakmájából (VZ-2 6. lépés). */
export const MINTA: Record<string, Record<Helyzet, Partial<HelyzetTartalom>>> = {
  hu: {
    kesz: { cim: "Elkészült a legújabb munkánk", sor: "Nézd meg, milyen lett!" },
    akcio: { szam: "−15%", cim: "minden termékünkre", sor: "a hónap végéig" },
    uj: { cim: "Új a kínálatunkban", sor: "Már nálunk is kapható." },
    hir: { cim: "Változik a nyitvatartás", mikor: "jövő héttől", sor: "Hétköznap 8–17 óra között várunk." },
    tudtad: { cim: "Egy jó tipp a szakmánkból.", sor: "Kérdezz tőlünk bátran, szívesen segítünk." },
    esemeny: { cim: "Nyílt nap nálunk", hol: "a telephelyünkön", mikor: "szombat, 9–14 óra" },
    szam: { szam: "100+", cim: "elégedett ügyfél tavaly." },
  },
  ro: {
    kesz: { cim: "Am terminat cea mai nouă lucrare", sor: "Vezi cum a ieșit!" },
    akcio: { szam: "−15%", cim: "la toate produsele", sor: "până la sfârșitul lunii" },
    uj: { cim: "Nou în oferta noastră", sor: "Disponibil de acum." },
    hir: { cim: "Se schimbă programul", mikor: "de săptămâna viitoare", sor: "Vă așteptăm în zilele lucrătoare, 8–17." },
    tudtad: { cim: "Un sfat util din meseria noastră.", sor: "Întreabă-ne, te ajutăm cu drag." },
    esemeny: { cim: "Zi porți deschise", hol: "la sediul nostru", mikor: "sâmbătă, 9–14" },
    szam: { szam: "100+", cim: "clienți mulțumiți anul trecut." },
  },
  en: {
    kesz: { cim: "Our latest job is finished", sor: "See how it turned out!" },
    akcio: { szam: "−15%", cim: "on all our products", sor: "until the end of the month" },
    uj: { cim: "New in our range", sor: "Available now." },
    hir: { cim: "Our opening hours change", mikor: "from next week", sor: "Weekdays 8am–5pm." },
    tudtad: { cim: "A useful tip from our trade.", sor: "Just ask us — we are happy to help." },
    esemeny: { cim: "Open day", hol: "at our site", mikor: "Saturday, 9am–2pm" },
    szam: { szam: "100+", cim: "happy customers last year." },
  },
};
