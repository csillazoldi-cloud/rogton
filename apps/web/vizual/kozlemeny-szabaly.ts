// VZ-1 · Közlemények (design/VZ1-szerkeszto, Csilla jóváhagyta 2026-10-06 17:32, minden ★ alapértékkel) — a TISZTA szabályok:
// a lap egyszerű kérdései (Mi a helyzet? · Hol? · Mikor? · …) → a képgyártó receptjének tartalma; a posztból kitöltés válaszának
// ellenőrzése; a rövidebb javaslat. Adatbázis és hálózat nélkül, a böngésző és a kiszolgáló is használja.
// Próba: probak/vz1-kozlemeny-szabaly.proba.ts.
//
// A recept mezői változatlanok (packages/vizual-receptek); a lap csak másképp kérdez:
//   zavar     — allapot (zavar · keses · helyreallt = „Lezárva · Lassabban halad · Újra járható”, kerdesek 2) + allapot_cimke (ugyanaz a szó),
//               „Hol?” → a kép főcíme (focim); közlekedési munkatéren „Melyik járat?” → jarat.kod, a főcím a járat neve (kerdesek 3),
//               „Mikor?” → idoszak + nap (a hét napja szóval — a recept T2 szabálya szerint a „nap” mezőben nem állhat szám) + azonosító sor dátuma,
//               „Merre lehet menni helyette?” → reszletek/helyette, „Mikor szólunk újra?” (Részletek) → reszletek/kovetkezo_frissites
//   allitas   — „A mondat” → focim
//   adatsavok — „Mi legyen a kép címe?” → focim, „A számok” → savok (2–4), „Honnan van a szám?” → forras (valós, vagy „csak példa” →
//               a fiók nyilatkozata), a rovatcímke a „Számokban” szó
// A sorszám (azonosito_sor.sorszam) a gépé: az utolsó + 1 munkaterenként és receptenként (kerdesek 8), Részletek alatt átírható.

export const SABLONOK = ["zavar", "allitas", "adatsavok"] as const;
export type Sablon = (typeof SABLONOK)[number];
export const ALLAPOTOK = ["zavar", "keses", "helyreallt"] as const;
export type Allapot = (typeof ALLAPOTOK)[number];
/** A három állapot szava (kerdesek 2): a lapon és a kép sávján ugyanaz. */
export const ALLAPOT_FELIRAT: Record<Allapot, string> = { zavar: "vz1r.lezarva", keses: "vz1r.lassan", helyreallt: "vz1r.ujra_jarhato" };
/** A V1 kártyáinak neve és mondata (a recept azonosítója marad). */
export const SABLON_NEV: Record<Sablon, { nev: string; mi: string }> = {
  zavar: { nev: "vz1r.forgalmi_nev", mi: "vz1r.forgalmi_mi" },
  allitas: { nev: "vz1r.mondat_nev", mi: "vz1r.mondat_mi" },
  adatsavok: { nev: "vz1r.szamok_nev", mi: "vz1r.szamok_mi" },
};
/** „Hol?” vagy „Melyik járat?” — a munkatér iparági csomagja dönti el (kerdesek 3): a „tomegkozlekedes” csomagnál járat. */
export type HolFajta = "hol" | "jarat";
export function holFajta(csomagok: readonly string[]): HolFajta {
  return csomagok.includes("tomegkozlekedes") ? "jarat" : "hol";
}

export const SOR_MIN = 2;
export const SOR_MAX = 4;

export type ZavarUrlap = { allapot: Allapot; hol: string; nap: string; kezdet: string; veg: string; vegKb: boolean; helyette: string; frissites: string };
export type AllitasUrlap = { mondat: string };
export type SavSor = { nev: string; szam: string };
export type SavokUrlap = { cim: string; sorok: SavSor[]; honnan: string; csakPelda: boolean };
export type Urlap = { zavar: ZavarUrlap; allitas: AllitasUrlap; adatsavok: SavokUrlap };

/** A román (második nyelvű) szövegek mezőnként — a kulcs a lap mezője (hol, helyette, mondat, cim, honnan, sor0…sor3). */
export type Masodik = Record<string, string>;

const IDO = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATUM = /^\d{4}-\d{2}-\d{2}$/;

export function maIso(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function uresUrlap(ma: string): Urlap {
  return {
    zavar: { allapot: "zavar", hol: "", nap: ma, kezdet: "", veg: "", vegKb: false, helyette: "", frissites: "" },
    allitas: { mondat: "" },
    adatsavok: { cim: "", sorok: [{ nev: "", szam: "" }, { nev: "", szam: "" }], honnan: "", csakPelda: false },
  };
}

/** A szám mező: egész vagy tizedes (vesszővel is), 0 és 100 között. Üres → null (még nincs). */
export function szamErtelmez(s: string): { ok: true; ertek: number | null } | { ok: false } {
  const t = s.trim().replace(",", ".").replace(/\s*%$/, "");
  if (t === "") return { ok: true, ertek: null };
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(t)) return { ok: false };
  const n = Number(t);
  return n >= 0 && n <= 100 ? { ok: true, ertek: n } : { ok: false };
}

/** Mondatkezdő nagybetű a képre (a recept T5 szabálya: csupa kisbetűs mondatkezdés nem lehet) — a mező a beírtat mutatja. */
export function mondatKezdo(s: string): string {
  const t = s.trim().replace(/\s+/g, " ");
  return t ? t.charAt(0).toLocaleUpperCase("hu") + t.slice(1) : t;
}

/** Rövidítési javaslat: az első tagmondat, vagy a szavak kétharmada (a VZ-2 Kitöltő szabálya) — a gép mondata, a munkatárs dönt. */
export function rovidebb(s: string): string {
  const t = s.trim();
  const m = t.match(/^(.{8,}?)[,;:.!?–—]\s/);
  if (m && m[1]!.length < t.length * 0.8) return m[1]!.trim() + (/[.!?]$/.test(t) ? "." : "");
  const szavak = t.split(/\s+/);
  return szavak.slice(0, Math.max(2, Math.floor(szavak.length * 0.66))).join(" ");
}

/** A hét napja szóval (a kép „nap” mezője) a megadott nyelven. */
export function hetNapja(iso: string, nyelv: string): string {
  if (!DATUM.test(iso)) return "";
  const [e, h, n] = iso.split("-").map(Number);
  try {
    return new Intl.DateTimeFormat(nyelv, { weekday: "long", timeZone: "UTC" }).format(new Date(Date.UTC(e!, h! - 1, n!)));
  } catch {
    return "";
  }
}

/** A nap a mezőben: „okt. 8., szerda” (a felület nyelvén). */
export function napSzoveg(iso: string, nyelv: string): string {
  if (!DATUM.test(iso)) return "";
  const [e, h, n] = iso.split("-").map(Number);
  try {
    return new Intl.DateTimeFormat(nyelv, { month: "short", day: "numeric", weekday: "long", timeZone: "UTC" }).format(new Date(Date.UTC(e!, h! - 1, n!)));
  } catch {
    return iso;
  }
}

/** Mi hiányzik még a képhez (a lap címkéje) — üres, ha a kép elkészíthető. */
export function hianyzo(sablon: Sablon, u: Urlap): string | null {
  if (sablon === "zavar") return u.zavar.hol.trim() ? null : "hol";
  if (sablon === "allitas") return u.allitas.mondat.trim() ? null : "mondat";
  const s = u.adatsavok;
  if (!s.cim.trim()) return "cim";
  const jo = s.sorok.filter((r) => {
    const sz = szamErtelmez(r.szam);
    return r.nev.trim() && sz.ok && sz.ertek !== null;
  });
  if (jo.length < SOR_MIN || s.sorok.some((r) => !szamErtelmez(r.szam).ok)) return "savok";
  if (!s.csakPelda && !s.honnan.trim()) return "honnan";
  return null;
}

type Par = { elsodleges: string; masodlagos?: string };
function par(a: string, b: string | undefined, kezdo = true): Par | undefined {
  const x = kezdo ? mondatKezdo(a) : a.trim();
  if (!x) return undefined;
  const y = b === undefined ? "" : kezdo ? mondatKezdo(b) : b.trim();
  return y ? { elsodleges: x, masodlagos: y } : { elsodleges: x };
}

export type Epites = {
  sablon: Sablon;
  urlap: Urlap;
  /** a felület (Tibor) nyelve — ez a kép első nyelve */
  nyelv: string;
  /** „Románul is”: a második nyelv szövegei (üres mező → az a mező egynyelvű marad) */
  ro: Masodik | null;
  /** a három állapot szava a második nyelven (a kép sávjára) */
  allapotRo: Record<Allapot, string>;
  /** a lap nyelvén: a három állapot szava, a „Számokban” rovatcímke és a járat-főcím sablonja */
  allapotSzo: Record<Allapot, string>;
  rovat: { elso: string; masodik: string };
  jaratFocim: { elso: string; masodik: string };
  holFajta: HolFajta;
  sorszam: number;
  /** a kép a beírt helyett ezt a rövidebb szöveget mutatja (kerdesek 5): mezőnév → szöveg; a második nyelvé „ro:mezőnév” */
  rovidites?: Record<string, string>;
};

/** A képgyártónak küldött tartalom ({mezok, rovid}) — a lap kérdéseiből. A dátum: a „Mikor?” napja (forgalmi) vagy a mai nap. */
export function tartalomEpit(e: Epites, ma: string): { mezok: Record<string, unknown>; rovid: Record<string, never> } {
  const ro = e.ro;
  const m2 = (k: string) => (ro ? e.rovidites?.[`ro:${k}`] ?? ro[k] ?? "" : undefined);
  const r = (k: string, s: string) => e.rovidites?.[k] ?? s;
  const mezok: Record<string, unknown> = {};
  if (e.sablon === "zavar") {
    const z = e.urlap.zavar;
    mezok["allapot"] = z.allapot;
    mezok["allapot_cimke"] = par(e.allapotSzo[z.allapot], ro ? e.allapotRo[z.allapot] : undefined, false);
    if (e.holFajta === "jarat") {
      const kod = z.hol.trim().slice(0, 12);
      if (kod) {
        mezok["jarat"] = { kod };
        mezok["focim"] = par(e.jaratFocim.elso.replace("{kod}", kod), ro ? e.jaratFocim.masodik.replace("{kod}", kod) : undefined, false);
      }
    } else {
      const f = par(r("hol", z.hol), m2("hol"));
      if (f) mezok["focim"] = f;
    }
    if (IDO.test(z.kezdet) && IDO.test(z.veg)) mezok["idoszak"] = { kezdet: z.kezdet, veg: z.veg, veg_kozelito: z.vegKb };
    const nap = DATUM.test(z.nap) ? z.nap : ma;
    const n1 = hetNapja(nap, e.nyelv);
    if (n1) mezok["nap"] = par(n1, ro ? hetNapja(nap, "ro") : undefined, false);
    const sorok: unknown[] = [];
    const h = par(z.helyette, m2("helyette"));
    if (h) sorok.push({ azonosito: "helyette", szoveg: h });
    if (IDO.test(z.frissites)) sorok.push({ azonosito: "kovetkezo_frissites", ido: z.frissites });
    if (sorok.length) mezok["reszletek"] = sorok;
    mezok["azonosito_sor"] = { sorszam: e.sorszam, datum: nap };
  } else if (e.sablon === "allitas") {
    const f = par(r("mondat", e.urlap.allitas.mondat), m2("mondat"));
    if (f) mezok["focim"] = f;
    mezok["azonosito_sor"] = { sorszam: e.sorszam, datum: ma };
  } else {
    const s = e.urlap.adatsavok;
    mezok["rovat_cimke"] = par(e.rovat.elso, ro ? e.rovat.masodik : undefined, false);
    const f = par(r("cim", s.cim), m2("cim"));
    if (f) mezok["focim"] = f;
    const savok = s.sorok
      .map((sor, i) => ({ sor, i, sz: szamErtelmez(sor.szam) }))
      .filter((x) => x.sor.nev.trim() && x.sz.ok && x.sz.ertek !== null)
      .map((x) => ({ cimke: par(r(`sor${x.i}`, x.sor.nev), m2(`sor${x.i}`)), ertek: (x.sz as { ertek: number }).ertek }));
    if (savok.length) mezok["savok"] = savok;
    if (s.csakPelda) mezok["forras"] = { nyilatkozat: true };
    else {
      const v = par(s.honnan, m2("honnan"));
      if (v) mezok["forras"] = { valos: v };
    }
    mezok["azonosito_sor"] = { sorszam: e.sorszam, datum: ma };
  }
  return { mezok, rovid: {} };
}

/** A lap egy mezője, amelyre a képgyártó „nem fér ki” jelzése vonatkozik: a recept mezőjéből (és a sávoknál a sor címkéjéből). */
export function lapMezo(sablon: Sablon, receptMezo: string, urlap: Urlap, reszlet?: string): string | null {
  if (receptMezo === "focim") return sablon === "zavar" ? "hol" : sablon === "allitas" ? "mondat" : "cim";
  if (sablon === "zavar" && receptMezo === "reszletek") return "helyette";
  if (sablon === "adatsavok" && receptMezo === "savok") {
    // a szabály részlete az érintett címke elejét idézi: „„Tisztán hagytuk a terepet…” 25 karakter > 22”
    const idezet = reszlet?.match(/„([^”…]+)/)?.[1]?.trim();
    const i = urlap.adatsavok.sorok.findIndex((s) => (idezet ? mondatKezdo(s.nev).startsWith(idezet) : false));
    return i >= 0 ? `sor${i}` : null;
  }
  if (sablon === "adatsavok" && receptMezo === "forras") return "honnan";
  return null;
}

/** A sávcímke hossza (a recept A7 szabálya: legfeljebb 22 karakter nyelvenként) — a rövidebb javaslat a szóhatáron. */
export function rovidCimke(s: string, max = 22): string {
  const t = s.trim();
  if (t.length <= max) return t;
  const r = rovidebb(t);
  if (r.length <= max) return r;
  const v = t.slice(0, max);
  return v.slice(0, Math.max(v.lastIndexOf(" "), Math.floor(max / 2))).trim();
}

// ——— a posztból kitöltés (gepezet 2): a gép JSON-válaszának ellenőrzése. Ami hiányzik vagy hibás, üres marad. ———

const szoveg = (x: unknown, max: number) => (typeof x === "string" ? x.replace(/\s+/g, " ").trim().slice(0, max) : "");

/** A válasz → a lap mezői (csak ami a recepthez tartozik és helyes alakú). `ma`: ha a nap hiányzik, a mai nap. */
export function kitoltesErtelmez(sablon: Sablon, nyers: unknown, ma: string): Partial<Urlap> {
  const j = (nyers && typeof nyers === "object" ? nyers : {}) as Record<string, unknown>;
  const resz = (j[sablon] && typeof j[sablon] === "object" ? j[sablon] : j) as Record<string, unknown>;
  if (sablon === "zavar") {
    const allapot = (ALLAPOTOK as readonly string[]).includes(String(resz["allapot"])) ? (resz["allapot"] as Allapot) : "zavar";
    const ido = (x: unknown) => (typeof x === "string" && IDO.test(x.trim()) ? x.trim() : "");
    const nap = typeof resz["nap"] === "string" && DATUM.test(resz["nap"]) ? resz["nap"] : ma;
    const kezdet = ido(resz["kezdet"]), veg = ido(resz["veg"]);
    return {
      zavar: {
        allapot, hol: szoveg(resz["hol"], 120), nap,
        kezdet: kezdet && veg ? kezdet : "", veg: kezdet && veg ? veg : "", vegKb: resz["veg_kb"] === true && !!(kezdet && veg),
        helyette: szoveg(resz["helyette"], 160), frissites: ido(resz["frissites"]),
      },
    };
  }
  if (sablon === "allitas") return { allitas: { mondat: szoveg(resz["mondat"], 200) } };
  const sorok = (Array.isArray(resz["savok"]) ? resz["savok"] : [])
    .map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : {}))
    .map((x) => ({ nev: szoveg(x["nev"], 60), szam: typeof x["szam"] === "number" && x["szam"] >= 0 && x["szam"] <= 100 ? String(x["szam"]) : "" }))
    .filter((x) => x.nev && x.szam)
    .slice(0, SOR_MAX);
  while (sorok.length < SOR_MIN) sorok.push({ nev: "", szam: "" });
  return { adatsavok: { cim: szoveg(resz["cim"], 120), sorok, honnan: szoveg(resz["forras"], 120), csakPelda: false } };
}

/** A képgyártó válaszából: melyik recept-mező nem fér ki, és melyik szabály tiltja a letöltést (nem az arculat miatt). */
export type KepValasz = {
  kep: string;
  mezok: { mezo: string; allapot: "zold" | "sarga" | "piros"; lepesek: { fajta: string }[]; problemak?: { reszlet: string }[] }[];
  kepalairas: string[];
  jelzesek: { szabaly: string; szigorusag: "tiltas" | "figyelmeztetes"; mezo?: string; reszlet?: string; uzenet?: string; arculati: boolean }[];
  tiltott: boolean;
};
export type Baj = { fajta: "nem_fer"; lapMezo: string; masodikIs: boolean } | { fajta: "szabaly"; lapMezo: string | null } | null;

/** Az első baj Tibor felől (kerdesek 4): ami nem fér ki → rövidebb javaslat; nem az arculatból eredő tiltás → egy mondat. */
export function bajKeres(sablon: Sablon, v: KepValasz, urlap: Urlap): Baj {
  for (const m of v.mezok) {
    if (m.allapot !== "piros") continue;
    const lm = lapMezo(sablon, m.mezo, urlap);
    // a második nyelv is túl hosszú-e (a képgyártó részlete: „masodlagos: 4 sor > 3”); ha nem derül ki, csak az első nyelvet rövidítjük
    if (lm) return { fajta: "nem_fer", lapMezo: lm, masodikIs: (m.problemak ?? []).some((p) => p.reszlet.startsWith("masodlagos")) };
  }
  const t = v.jelzesek.find((j) => j.szigorusag === "tiltas" && !j.arculati);
  if (!t) return null;
  const lm = t.mezo ? lapMezo(sablon, t.mezo, urlap, t.reszlet) : null;
  // a sávcímke túl hosszú (A7): ez is „nem fér ki” — rövidebb címkét javasolunk
  if (lm && (t.szabaly === "A7" || t.szabaly === "M6" || t.szabaly === "M1")) return { fajta: "nem_fer", lapMezo: lm, masodikIs: false };
  return { fajta: "szabaly", lapMezo: lm };
}

/** A gép kisebb betűvel írt-e (egy halk sor, gepezet 7). */
export function kisebbBetu(v: KepValasz): boolean {
  return v.mezok.some((m) => m.lepesek.some((l) => l.fajta === "lepcso"));
}

/** A képaláírásba költözött sorok nyelvenként („Címke · Cím: első / második” → {elso, masodik}). */
export function kepalairasSorok(v: KepValasz): { elso: string; masodik: string }[] {
  return v.kepalairas.map((s) => {
    const resz = s.slice(s.indexOf(": ") + 2);
    const [a, b = ""] = resz.split(" / ");
    return { elso: (a ?? "").trim(), masodik: b.trim() };
  });
}

/** A letöltéskor a rendszergazdának küldött jelzések (kerdesek 4) — csak a szükséges, rövidített mezők. */
export function jelzesKivonat(v: KepValasz): { szabaly: string; szigorusag: string; arculati: boolean; mezo: string; reszlet: string }[] {
  return v.jelzesek.slice(0, 20).map((j) => ({
    szabaly: String(j.szabaly).slice(0, 12), szigorusag: j.szigorusag === "tiltas" ? "tiltas" : "figyelmeztetes", arculati: !!j.arculati,
    mezo: String(j.mezo ?? "").slice(0, 40), reszlet: String(j.reszlet ?? j.uzenet ?? "").slice(0, 200),
  }));
}

/** A lap egy szöveges mezőjének értéke (hol · helyette · mondat · cim · honnan · sor0…sor3). */
export function ertekOlvas(u: Urlap, mezo: string): string {
  if (mezo === "hol" || mezo === "helyette") return u.zavar[mezo];
  if (mezo === "mondat") return u.allitas.mondat;
  if (mezo === "cim" || mezo === "honnan") return u.adatsavok[mezo];
  const i = mezo.match(/^sor(\d)$/)?.[1];
  return i !== undefined ? u.adatsavok.sorok[Number(i)]?.nev ?? "" : "";
}

/** Ugyanez írásra — új objektumot ad (React-állapothoz). */
export function ertekIr(u: Urlap, mezo: string, s: string): Urlap {
  if (mezo === "hol" || mezo === "helyette") return { ...u, zavar: { ...u.zavar, [mezo]: s } };
  if (mezo === "mondat") return { ...u, allitas: { mondat: s } };
  if (mezo === "cim" || mezo === "honnan") return { ...u, adatsavok: { ...u.adatsavok, [mezo]: s } };
  const i = mezo.match(/^sor(\d)$/)?.[1];
  if (i === undefined) return u;
  return { ...u, adatsavok: { ...u.adatsavok, sorok: u.adatsavok.sorok.map((r, j) => (j === Number(i) ? { ...r, nev: s } : r)) } };
}

/** A rövidebb javaslat a mező fajtája szerint: a sávcímke a recept 22 karakterére, minden más az első tagmondatra / kétharmadára. */
export function javaslat(mezo: string, s: string): string {
  return /^sor\d$/.test(mezo) ? rovidCimke(s) : rovidebb(s);
}

/** A lap fordítható szöveges mezői receptenként (a „Románul is” mezői). Közlekedési munkatéren a járat kódja nem fordul. */
export function forditandoMezok(sablon: Sablon, u: Urlap, hol: HolFajta): string[] {
  if (sablon === "zavar") return hol === "jarat" ? ["helyette"] : ["hol", "helyette"];
  if (sablon === "allitas") return ["mondat"];
  return ["cim", ...u.adatsavok.sorok.map((_, i) => `sor${i}`), "honnan"];
}

/** A dátum a kész lapon és a fájl nevében: ÉÉÉÉ.HH.NN (mint a kép azonosító sora a rajzon). */
export function pontosDatum(iso: string): string {
  return DATUM.test(iso) ? iso.replaceAll("-", ".") : iso;
}

/** A tárolt recept-azonosító → a lap receptje (ismeretlen: null). */
export function sablonNeve(s: string): Sablon | null {
  return (SABLONOK as readonly string[]).includes(s) ? (s as Sablon) : null;
}

/** Az időmező gépelése → „ÓÓ:PP” (8 · 08 · 8:00 · 800 · 0800 · 8.00 · 8h); ha nem idő, a beírt marad (a kép nem kap időt, amíg nem helyes). */
export function idoNormal(s: string): string {
  const t = s.trim().replace(/[.h]/g, ":").replace(/\s+/g, "");
  let m = t.match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (!m) { const n = t.match(/^(\d{1,2})(\d{2})$/); if (n) m = [t, n[1]!, n[2]!] as unknown as RegExpMatchArray; }
  if (!m) return s.trim();
  const o = Number(m[1]), p = Number(m[2] ?? "0");
  if (o > 23 || p > 59) return s.trim();
  return `${String(o).padStart(2, "0")}:${String(p).padStart(2, "0")}`;
}
