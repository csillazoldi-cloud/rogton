// R-16 K6 (TERV §2-K6, 1.6; gepezet 13) — a névlogó: a cég nevéből, a munkatér színeiből és a cím-betűjéből egyszerű jel (SVG).
// Tiszta függvény; a szöveg körvonalát a `BetuUtvonal` port adja (host.ts — a képgyártó valósítja meg fontkittel), ezért az SVG-ben
// csak útvonal és alapidom (kör, téglalap) van: se `<text>`, se szkript, se külső hivatkozás — a logó a betűfájl nélkül is ugyanúgy néz ki.
//
// Három stílus, ELRENDEZÉSBEN különböznek (c10, design/R16-arculat/UTOKERES-12G.md; a rajz 12g „javítva 09-30: három elrendezés”):
//   nev     — „Szó”: csak a név, egy sorban, a cím-betűvel (fekvő, hosszú);
//   kor     — „Jel + név egymás alatt”: a kezdőbetű nagy, fő színű körben (benne vékony gyűrű a második színnel), alatta a név kisebb
//             (álló, „bélyeg”);
//   negyzet — „Keretes”: a név egy második színű sávban, a sávon belül vékony keret a fő színnel (fekvő, „tábla”).
// A tárolt enum-értékek (contracts `nevlogo_stilus`: "nev" | "kor" | "negyzet") NEM változnak (TERV 1.7 R1: a tárolt profil mindig
// olvasható marad) — csak az, amit a "kor" és a "negyzet" rajzol. A korábbi „kis kör + név” és „négyzetes kezdőbetű + név” megszűnt;
// a már elmentett gépi logó fájljai nem változnak, a következő újrakészítés (szín / cím-betű „Ez legyen”) már az új elrendezéssel ír.
// Semmi rajzolt kép, semmi AI-kép.
//
// Négy változat, egy-egy logóhelyre (gepezet 13, TERV §2-K6) — mindhárom stílusnál magától:
//   vilagos   — világos háttérre: a név a fő színnel (`olvashato` a fehérhez és a világos háttérszínhez igazítva);
//   sotet     — sötét / színes háttérre: a név a háttérszínnel, ha az a fő színen olvasható, különben fehérrel; a bélyeg köre ugyanez
//               a világos szín, benne a betű a fő szín (a rajz 12g telefon, sötét mintakép); a keretes sáv a második szín, ha az a fő
//               színtől elválik, különben a világos szín — a név a sávon olvashatóra igazítva;
//   egyszinu  — minden fekete, átlátszó háttéren (a kép sötét háttéren fehérre színezi: `logoValaszt`, átlátszó = igaz); ami a kör vagy
//               a sáv belsejében van (betű, gyűrű, keret, név), az maszkkal KIVÁGÁS — így a fehérre színezett logó is olvasható;
//   negyzetes — csak a kezdőbetű egy fő színű négyzetben (betű: `raIrt(fo)`), név nélkül — mindhárom stílusnál ugyanaz (TERV §2-K6).
// Elrendezés: a nevet a rajz szerint NAGYBETŰVEL, kis betűközzel írjuk („CIPÓ PÉKSÉG”). A szó és a keretes egy sor a szélesség-keretig;
// a 40 vagy több karakteres név a középhez legközelebbi szóköznél két sorra törik; a bélyeg (álló) már 16 karaktertől tör. Ami így sem
// fér ki, az kisebb lesz — levágás SOHA.
// A rajz egységei a méretek aránya: szó — viewBox 36 magas, betű 21, betűköz 1,5; bélyeg — viewBox 124 × 104, kör r = 34, gyűrű r = 29
// (vonal 1,5), kezdőbetű 38, név 14 (betűköz 1), a név alapvonala 28-cal a kör alatt; keretes — viewBox 212 × 56, sáv rx 4, keret 5-tel
// beljebb (rx 2, vonal 1), név 21, középen.
import { z } from "zod";
import type { BetuUtvonal } from "./host.ts";
import { OLVASHATO, olvashato, raIrt, vilagosHatter, wcagArany } from "./helyzet.ts";

export const NEVLOGO_STILUSOK = ["nev", "kor", "negyzet"] as const;
export type NevlogoStilus = (typeof NEVLOGO_STILUSOK)[number];
export const NEVLOGO_VALTOZATOK = ["vilagos", "sotet", "egyszinu", "negyzetes"] as const;
export type NevlogoValtozat = (typeof NEVLOGO_VALTOZATOK)[number];

const Hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const NevlogoSzinek = z.object({ fo: Hex, masodik: Hex, hatter: Hex });
export type NevlogoSzinek = z.infer<typeof NevlogoSzinek>;

/** A képgyártó `POST /nevlogo` törzse (TERV §2-K6): a név, a stílus, a három szín, a cím-betű kulcsa (beépített kulcs vagy "sajat:<id>")
 *  és — saját betűnél — a fájl bájtja adat-URL-ként (a képgyártó a NAS lemezét nem látja, mint a K5-nél). */
export const NevlogoKeres = z.object({
  nev: z.string().trim().min(1).max(120),
  stilus: z.enum(NEVLOGO_STILUSOK),
  szinek: NevlogoSzinek,
  betu: z.string().max(120).default("public-sans"),
  sajat_betu: z
    .object({ adat: z.string().max(14_500_000).regex(/^data:font\/(ttf|otf|woff2);base64,/), formatum: z.enum(["truetype", "opentype", "woff2"]) })
    .optional(),
});
export type NevlogoKeres = z.infer<typeof NevlogoKeres>;

export interface NevlogoBemenet {
  nev: string;
  stilus: NevlogoStilus;
  szinek: NevlogoSzinek;
  valtozat: NevlogoValtozat;
}
export interface NevlogoEredmeny {
  svg: string;
  /** a viewBox szélessége és magassága (egység) — a képgyártó ebből számolja a PNG magasságát */
  szelesseg: number;
  magassag: number;
  /** a név festéke (négyzetesnél a négyzet) — a befogadó ebből írja az elemzés világosságát */
  tinta: string;
  /** minden látható szín, ismétlés nélkül */
  szinek: string[];
}

/** A szó rajzának egységei (21-es betűre). */
const F = 21;
const BETUKOZ = 1.5 / 21;
/** Egy sor legfeljebb ilyen széles (egység) — a 39 karakteres név a rajz betűjével még belefér; e fölött kisebb lesz. */
export const NEVLOGO_SZELES_MAX = 600;
/** Ennyi karaktertől törik két sorra (gepezet 13: „hosszú, 40+ betűs név”). */
export const NEVLOGO_KET_SOR = 40;
/** A bélyeg (álló) ennyi karaktertől tör két sorra — különben a név sokkal szélesebb lenne a körnél, és a jel fekvő lenne. */
export const NEVLOGO_BELYEG_KET_SOR = 16;
const SOR_TAV = 1.3; // alapvonaltól alapvonalig, a betűméret szorzója
const SZEGELY = 2 / 21;

/** A bélyeg (rajz 12g, viewBox 124 × 104) — a név betűméretének (14) szorzói. */
const B_NEV = 14;
const B_BETUKOZ = 1 / 14;
const B_KOR_R = 34 / 14;
/** a kör a név szélesebb sorához nő (a rajzon r ≈ 0,29 × a név szélessége), de legfeljebb másfélszeresére — a név ne törpüljön el */
const B_KOR_NEV_ARANY = 0.29, B_KOR_MAX = 1.5;
const B_GYURU = 29 / 34, B_GYURU_VONAL = 1.5 / 34, B_BETU = 38 / 34;
/** a kör alja és a név alapvonala közt (a rajzon 98 − 70 = 28 = 2 × 14) */
const B_NEV_ALAPVONAL = 28 / 14;

/** A keretes (rajz 12g, viewBox 212 × 56) — a név betűméretének (21) szorzói. */
const K_PAD_X = 21.5 / 21, K_PAD_Y = 20.6 / 21, K_R = 4 / 21, K_BELSO = 5 / 21, K_BELSO_R = 2 / 21, K_VONAL = 1 / 21;

/** Két szín „elválik-e” egymástól (a gyűrű és a sáv döntése): ez alatt összefolynak, a gép másik színt választ. */
const ELVALIK = 1.5;

const k = (n: number) => String(+n.toFixed(2));

/** A név, ahogy a logóra kerül: egy szóköz a szavak közt, nagybetűvel (a rajz 12g). */
export function nevlogoSzoveg(nev: string): string {
  return nev.trim().replace(/\s+/g, " ").toUpperCase();
}

/** A kezdőbetű: a név első betűje vagy számjegye (nagybetűvel); ha nincs ilyen, az első karakter. */
export function nevlogoKezdobetu(nev: string): string {
  const s = nevlogoSzoveg(nev);
  return s.match(/[\p{L}\p{N}]/u)?.[0] ?? [...s][0] ?? "?";
}

/** Egy vagy két sor: `hatar` (alap: 40) karaktertől a középhez legközelebbi szóköznél törik (egyenlő távolságnál a korábbinál).
 *  Szóköz nélkül egy sor. */
export function nevlogoSorok(nev: string, hatar: number = NEVLOGO_KET_SOR): string[] {
  const s = nevlogoSzoveg(nev);
  const kar = [...s];
  if (kar.length < hatar) return [s];
  const kozep = kar.length / 2;
  let legjobb = -1;
  kar.forEach((c, i) => {
    if (c === " " && (legjobb < 0 || Math.abs(i - kozep) < Math.abs(legjobb - kozep))) legjobb = i;
  });
  if (legjobb < 0) return [s];
  return [kar.slice(0, legjobb).join(""), kar.slice(legjobb + 1).join("")];
}

/** A változat színei. `nev`: a szó és a bélyeg neve · `jel` / `jelBetu` / `gyuru`: a bélyeg köre, kezdőbetűje, gyűrűje ·
 *  `sav` / `savNev`: a keretes sávja és a rajta álló keret + név · `negyzet` / `negyzetBetu`: a négyzetes változat. */
export type NevlogoSzinezes = { nev: string; jel: string; jelBetu: string; gyuru: string; sav: string; savNev: string; negyzet: string; negyzetBetu: string };
const FEKETE = "#000000";
const FEHER = "#ffffff";

/** A változat színei (gepezet 13; a rajz 12g: a bélyeg köre a fő szín, gyűrűje a második, betűje a háttérszín; a keretes sávja a
 *  második szín, kerete és neve a fő szín; a négyzetes négyzete a fő szín, benne `raIrt`). Minden szöveg olvashatóra igazítva. */
export function nevlogoSzinezes(sz: NevlogoSzinek, v: NevlogoValtozat): NevlogoSzinezes {
  const fo = sz.fo.toLowerCase(), masodik = sz.masodik.toLowerCase(), hatter = sz.hatter.toLowerCase();
  if (v === "egyszinu") return { nev: FEKETE, jel: FEKETE, jelBetu: FEKETE, gyuru: FEKETE, sav: FEKETE, savNev: FEKETE, negyzet: FEKETE, negyzetBetu: FEKETE };
  const gyuru = (kor: string, betu: string) => (wcagArany(masodik, kor) >= ELVALIK ? masodik : betu);
  const negyzetes = { negyzet: fo, negyzetBetu: raIrt(fo) };
  if (v === "sotet") {
    // a sötét hely a fő színű / sötét képekre kerül: a név a háttérszín, ha azon olvasható, különben a jobbik a háttérszín és a fehér közül;
    // a bélyeg köre ugyanilyen világos, benne a betű a fő szín (a világos körön olvashatóra igazítva)
    const nev = wcagArany(hatter, fo) >= OLVASHATO.kicsi ? hatter : wcagArany(FEHER, fo) >= wcagArany(hatter, fo) ? FEHER : hatter;
    const jelBetu = olvashato(fo, [nev], OLVASHATO.kicsi);
    // a keretes sáv a fő színű képen: a második szín, ha attól elválik; különben a világos név-szín
    const sav = wcagArany(masodik, fo) >= ELVALIK ? masodik : nev;
    return { nev, jel: nev, jelBetu, gyuru: gyuru(nev, jelBetu), sav, savNev: olvashato(fo, [sav], OLVASHATO.kicsi), ...negyzetes };
  }
  const alatta = vilagosHatter([hatter]) ? [FEHER, hatter] : [FEHER];
  const nev = olvashato(fo, alatta, OLVASHATO.kicsi);
  // a bélyeg betűje a rajz szerint a háttérszín a fő színű körön — ha azon nem olvasható (nagy betű: 3 : 1), akkor raIrt(fo)
  const jelBetu = wcagArany(hatter, fo) >= OLVASHATO.nagy ? hatter : raIrt(fo);
  return {
    nev, jel: fo, jelBetu, gyuru: gyuru(fo, jelBetu),
    sav: masodik, savNev: olvashato(fo, [masodik], OLVASHATO.kicsi),
    ...negyzetes,
  };
}

type Doboz = { x0: number; y0: number; x1: number; y1: number };
type Ut = ReturnType<BetuUtvonal["utvonal"]>;

const fej = (w: number, h: number, x: number, y: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${k(x)} ${k(y)} ${k(w)} ${k(h)}" width="${k(w)}" height="${k(h)}">`;
const ut = (t: Ut, x: number, y: number, fill: string) => (t.d ? `<path transform="translate(${k(x)} ${k(y)})" d="${t.d}" fill="${fill}"/>` : "");
/** Az egyszínű kivágás: a maszkban a fehér alakzat látszik, a fekete rész (betű, gyűrű, keret, név) átlátszó lesz. */
const maszk = (d: Doboz, feher: string, fekete: string) =>
  `<defs><mask id="kb" maskUnits="userSpaceOnUse" x="${k(d.x0)}" y="${k(d.y0)}" width="${k(d.x1 - d.x0)}" height="${k(d.y1 - d.y0)}">${feher}${fekete}</mask></defs>`;

/** A viewBox: minden elem befoglalója + egy kis szegély — így semmi nem lóg ki (a próba ezt méri). */
function keret(dobozok: Doboz[], sz: number, tartalek: Doboz): Doboz & { w: number; h: number } {
  const d0 = dobozok.length ? dobozok : [tartalek];
  const x0 = Math.min(...d0.map((d) => d.x0)) - sz, y0 = Math.min(...d0.map((d) => d.y0)) - sz;
  const x1 = Math.max(...d0.map((d) => d.x1)) + sz, y1 = Math.max(...d0.map((d) => d.y1)) + sz;
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

/** Az eredmény a befoglalóból. */
function kesz(dobozok: Doboz[], sz: number, tartalek: Doboz, tartalom: string, tinta: string, szinek: string[]): NevlogoEredmeny {
  const v = keret(dobozok, sz, tartalek);
  return { svg: fej(v.w, v.h, v.x0, v.y0) + tartalom + `</svg>`, szelesseg: +v.w.toFixed(2), magassag: +v.h.toFixed(2), tinta, szinek: [...new Set(szinek)] };
}

/** A névlogó SVG-je. */
export function nevlogoSvg(b: NevlogoBemenet, port: BetuUtvonal): NevlogoEredmeny {
  const szin = nevlogoSzinezes(b.szinek, b.valtozat);
  const kezdo = nevlogoKezdobetu(b.nev);

  if (b.valtozat === "negyzetes") {
    // csak a kezdőbetű egy fő színű négyzetben (100 × 100, a sarok 7 / 34-e), a betű a festéke szerint középen — mindhárom stílusnál
    const S = 100;
    const l = port.utvonal(kezdo, S * 0.62);
    const lx = (S - l.szelesseg) / 2, ly = S / 2 + (l.felso - l.also) / 2;
    const svg = fej(S, S, 0, 0) + `<rect x="0" y="0" width="${S}" height="${S}" rx="${k(S * (7 / 34))}" fill="${szin.negyzet}"/>` + ut(l, lx, ly, szin.negyzetBetu) + `</svg>`;
    return { svg, szelesseg: S, magassag: S, tinta: szin.negyzet, szinek: [...new Set([szin.negyzet, szin.negyzetBetu])] };
  }
  if (b.stilus === "kor") return belyeg(b, port, szin, kezdo);
  if (b.stilus === "negyzet") return keretes(b, port, szin);
  return szo(b, port, szin);
}

/** „Szó” (nev): csak a név, balra zárva, egy (40+ karakternél két) sorban. */
function szo(b: NevlogoBemenet, port: BetuUtvonal, szin: NevlogoSzinezes): NevlogoEredmeny {
  const sorok = nevlogoSorok(b.nev);
  const szelesAlap = Math.max(...sorok.map((s) => port.utvonal(s, F, BETUKOZ).szelesseg), 0);
  const f = szelesAlap > NEVLOGO_SZELES_MAX ? (F * NEVLOGO_SZELES_MAX) / szelesAlap : F;
  const nagy = port.utvonal("H", f).felso || f * 0.7;
  const elemek: string[] = [];
  const dobozok: Doboz[] = [];
  sorok.forEach((s, i) => {
    const t = port.utvonal(s, f, BETUKOZ);
    const y = i * SOR_TAV * f;
    if (!t.d) return;
    elemek.push(ut(t, 0, y, szin.nev));
    dobozok.push({ x0: 0, y0: y - t.felso, x1: t.szelesseg, y1: y + t.also });
  });
  return kesz(dobozok, SZEGELY * f, { x0: 0, y0: -nagy, x1: 1, y1: 0 }, elemek.join(""), szin.nev, [szin.nev]);
}

/** „Jel + név egymás alatt” (kor): a kezdőbetű a fő színű körben, benne gyűrű; alatta a név kisebb, középre zárva. Álló. */
function belyeg(b: NevlogoBemenet, port: BetuUtvonal, szin: NevlogoSzinezes, kezdo: string): NevlogoEredmeny {
  const sorok = nevlogoSorok(b.nev, NEVLOGO_BELYEG_KET_SOR);
  // a név mérete: a rajz 14-e; ami a szélesség-keretnél szélesebb, arányosan kisebb (a kör a rajz méretén marad)
  const szelesAlap = Math.max(...sorok.map((s) => port.utvonal(s, B_NEV, B_BETUKOZ).szelesseg), 0);
  const f = szelesAlap > NEVLOGO_SZELES_MAX ? (B_NEV * NEVLOGO_SZELES_MAX) / szelesAlap : B_NEV;
  const utak = sorok.map((s) => port.utvonal(s, f, B_BETUKOZ));
  const szeles = Math.max(...utak.map((t) => t.szelesseg), 0);
  const R = Math.min(B_KOR_R * B_NEV * B_KOR_MAX, Math.max(B_KOR_R * B_NEV, szeles * B_KOR_NEV_ARANY));
  const u = R / (B_KOR_R * B_NEV); // a kör a rajzhoz képest (1 = a rajz mérete) — a gyűrű, a betű és a távolság vele nő
  const gy = R * B_GYURU, gyV = R * B_GYURU_VONAL;
  const l = port.utvonal(kezdo, R * B_BETU);
  const lx = -l.szelesseg / 2, ly = (l.felso - l.also) / 2;
  const nagy = port.utvonal("H", f).felso || f * 0.7;
  const elso = R + B_NEV_ALAPVONAL * B_NEV * u; // az első sor alapvonala (a kör közepe az y = 0)

  const korDoboz: Doboz = { x0: -R, y0: -R, x1: R, y1: R };
  const dobozok: Doboz[] = [korDoboz];
  const nevek: string[] = [];
  utak.forEach((t, i) => {
    const y = elso + i * SOR_TAV * f;
    if (!t.d) return;
    nevek.push(ut(t, -t.szelesseg / 2, y, szin.nev));
    dobozok.push({ x0: -t.szelesseg / 2, y0: y - t.felso, x1: t.szelesseg / 2, y1: y + t.also });
  });
  const gyuru = (stroke: string) => `<circle cx="0" cy="0" r="${k(gy)}" fill="none" stroke="${stroke}" stroke-width="${k(gyV)}"/>`;
  let jel: string;
  if (b.valtozat === "egyszinu") {
    // egy szín: a betű és a gyűrű kivágás a fekete körből — a fehérre színezett logóban is átlátszó marad
    jel = maszk(korDoboz, `<circle cx="0" cy="0" r="${k(R)}" fill="#ffffff"/>`, gyuru("#000000") + ut(l, lx, ly, "#000000")) +
      `<circle cx="0" cy="0" r="${k(R)}" fill="${szin.jel}" mask="url(#kb)"/>`;
  } else {
    jel = `<circle cx="0" cy="0" r="${k(R)}" fill="${szin.jel}"/>` + gyuru(szin.gyuru) + ut(l, lx, ly, szin.jelBetu);
  }
  const szinek = b.valtozat === "egyszinu" ? [szin.jel, szin.nev] : [szin.jel, szin.gyuru, ...(l.d ? [szin.jelBetu] : []), szin.nev];
  return kesz(dobozok, SZEGELY * B_NEV * u, { x0: -R, y0: -R, x1: R, y1: elso - nagy }, jel + nevek.join(""), szin.nev, szinek);
}

/** „Keretes” (negyzet): a név a második színű sávban, a sávon belül vékony keret; a név középen. Fekvő, „tábla”. */
function keretes(b: NevlogoBemenet, port: BetuUtvonal, szin: NevlogoSzinezes): NevlogoEredmeny {
  const sorok = nevlogoSorok(b.nev);
  const szelesAlap = Math.max(...sorok.map((s) => port.utvonal(s, F, BETUKOZ).szelesseg), 0);
  const f = szelesAlap + 2 * K_PAD_X * F > NEVLOGO_SZELES_MAX ? (F * NEVLOGO_SZELES_MAX) / (szelesAlap + 2 * K_PAD_X * F) : F;
  const utak = sorok.map((s) => port.utvonal(s, f, BETUKOZ));
  const szeles = Math.max(...utak.map((t) => t.szelesseg), 0);
  const nagy = port.utvonal("H", f).felso || f * 0.7;
  // a sáv: a nagybetű-magasság fölött és az utolsó alapvonal alatt ugyanannyi (a rajzon a „CIPÓ PÉKSÉG” pontosan középen);
  // az ékezet (Á Ő) és a román vessző (Ș Ț) a sávon belül marad — a próba méri
  const utolso = (sorok.length - 1) * SOR_TAV * f;
  const sav: Doboz = { x0: -szeles / 2 - K_PAD_X * f, y0: -nagy - K_PAD_Y * f, x1: szeles / 2 + K_PAD_X * f, y1: utolso + K_PAD_Y * f };
  const b0 = K_BELSO * f, vonal = K_VONAL * f;
  const rect = (d: Doboz, r: number, attr: string) => `<rect x="${k(d.x0)}" y="${k(d.y0)}" width="${k(d.x1 - d.x0)}" height="${k(d.y1 - d.y0)}" rx="${k(r)}" ${attr}/>`;
  const belso = (stroke: string) => rect({ x0: sav.x0 + b0, y0: sav.y0 + b0, x1: sav.x1 - b0, y1: sav.y1 - b0 }, K_BELSO_R * f, `fill="none" stroke="${stroke}" stroke-width="${k(vonal)}"`);
  const nevek = (fill: string) => utak.map((t, i) => ut(t, -t.szelesseg / 2, i * SOR_TAV * f, fill)).join("");
  const dobozok: Doboz[] = [sav];
  utak.forEach((t, i) => { if (t.d) dobozok.push({ x0: -t.szelesseg / 2, y0: i * SOR_TAV * f - t.felso, x1: t.szelesseg / 2, y1: i * SOR_TAV * f + t.also }); });
  let tartalom: string;
  if (b.valtozat === "egyszinu") {
    // egy szín: a keret és a név kivágás a fekete sávból
    tartalom = maszk(sav, rect(sav, K_R * f, `fill="#ffffff"`), belso("#000000") + nevek("#000000")) + rect(sav, K_R * f, `fill="${szin.sav}" mask="url(#kb)"`);
  } else {
    tartalom = rect(sav, K_R * f, `fill="${szin.sav}"`) + belso(szin.savNev) + nevek(szin.savNev);
  }
  return kesz(dobozok, SZEGELY * f, sav, tartalom, szin.savNev, b.valtozat === "egyszinu" ? [szin.sav] : [szin.sav, szin.savNev]);
}
