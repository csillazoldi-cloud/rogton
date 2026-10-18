// R-16 K1 (TERV 1.4, gepezet 3): a logó elemzése — a böngésző a feltöltés előtt egy kicsinyített (≤ 64 × 64) canvasról
// adja a képpontokat, ez a tiszta függvény megmondja: átlátszó-e, mennyire világos, hány színű, milyen arányú, és mik a fő színei.
// Az eredmény az `arculat_fajl.elemzes` oszlopba kerül (a kiszolgáló zod-dal ellenőrzi), és ebből dől el, melyik helyre kerül.
import { z } from "zod";
import { HexSzin } from "@km/contracts";
import type { Kepadat, LogoHely } from "./host";
import { hexbe, nemMarkaszin, relativVilagossag, tavolsag, type Rgb } from "./szin";

export const LogoElemzes = z.object({
  /** Átlátszó hátterű-e: a képpontok legalább 5 %-a (majdnem) teljesen átlátszó. A képoldal (K2) csak ilyet színez át. */
  atlatszo: z.boolean(),
  /** A logó „tintájának” átlagos relatív világossága (0 = fekete, 1 = fehér); átlátszatlan képnél a saját háttér nélkül. */
  vilagossag: z.number().min(0).max(1),
  /** A tinta színeinek száma (≥ 2 % részesedés, élsimítás és a saját egyszínű háttér nélkül). */
  szinszam: z.number().int().min(0).max(64),
  /** Szélesség / magasság az EREDETI képen. */
  arany: z.number().positive().max(100),
  /** Legfeljebb 5 fő szín, gyakoriság szerint; fehér, fekete, szürke nélkül (a honlap-színek szabálya). */
  szinek: z.array(HexSzin).max(5),
});
export type LogoElemzes = z.infer<typeof LogoElemzes>;

/** A küszöbök egy helyen — a próbák és a README ugyanezekre hivatkoznak. */
export const ELEMZES_KUSZOB = {
  atlatszoAlfa: 16, // ez alatti alfa = átlátszó képpont
  atlatszoArany: 0.05, // ennyi átlátszó képpont fölött „átlátszó hátterű”
  fedettAlfa: 200, // a színszámlálásba csak a (majdnem) fedett képpontok számítanak — a félig átlátszó él élsimítás
  osszevonTav: 48, // ennél közelebbi színek egy színnek számítanak (4 bites kvantálás + JPEG-zaj)
  minResz: 0.02, // ennél kisebb részesedésű szín nem szín (élsimítás, zaj)
  keverekTav: 28, // ennyire eshet egy szín két nagyobb szín egyenesétől, hogy élsimítási keveréknek számítson
  hatterPerem: 0.6, // a perem ekkora hányada egy színű → az a kép saját háttere (átlátszatlan kép)
} as const;

type Csoport = { rgb: Rgb; db: number };

/** A képpontok színcsoportjai: 4 bites kvantálás, majd a közeli csoportok összevonása (súlyozott középpel). */
function csoportok(kepek: Rgb[]): Csoport[] {
  const tarolo = new Map<number, { r: number; g: number; b: number; db: number }>();
  for (const [r, g, b] of kepek) {
    const k = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const t = tarolo.get(k);
    if (t) { t.r += r; t.g += g; t.b += b; t.db++; } else tarolo.set(k, { r, g, b, db: 1 });
  }
  const rendezett = [...tarolo.values()].map((t) => ({ rgb: [t.r / t.db, t.g / t.db, t.b / t.db] as Rgb, db: t.db })).sort((a, b) => b.db - a.db);
  const ki: Csoport[] = [];
  for (const c of rendezett) {
    const cel = ki.find((o) => tavolsag(o.rgb, c.rgb) < ELEMZES_KUSZOB.osszevonTav);
    if (cel) {
      const ossz = cel.db + c.db;
      cel.rgb = [(cel.rgb[0] * cel.db + c.rgb[0] * c.db) / ossz, (cel.rgb[1] * cel.db + c.rgb[1] * c.db) / ossz, (cel.rgb[2] * cel.db + c.rgb[2] * c.db) / ossz];
      cel.db = ossz;
    } else ki.push({ rgb: [...c.rgb] as Rgb, db: c.db });
  }
  return ki.sort((a, b) => b.db - a.db);
}

/** Élsimítási keverék-e: a szín két NAGYOBB csoport közti szakaszon fekszik (a végpontoktól távol). */
function keverek(c: Csoport, tobbi: Csoport[]): boolean {
  const nagyobbak = tobbi.filter((o) => o !== c && o.db > c.db);
  for (let i = 0; i < nagyobbak.length; i++) {
    for (let j = i + 1; j < nagyobbak.length; j++) {
      const a = nagyobbak[i]!.rgb, b = nagyobbak[j]!.rgb;
      const ab: Rgb = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const hossz2 = ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2;
      if (hossz2 === 0) continue;
      const t = ((c.rgb[0] - a[0]) * ab[0] + (c.rgb[1] - a[1]) * ab[1] + (c.rgb[2] - a[2]) * ab[2]) / hossz2;
      if (t <= 0.08 || t >= 0.92) continue;
      const p: Rgb = [a[0] + ab[0] * t, a[1] + ab[1] * t, a[2] + ab[2] * t];
      if (tavolsag(p, c.rgb) < ELEMZES_KUSZOB.keverekTav) return true;
    }
  }
  return false;
}

/**
 * A logó elemzése. `rgba`: a kicsinyített kép képpontjai (≤ 64 × 64), `eredetiSzelesseg/Magassag`: az eredeti kép mérete (az arányhoz).
 * Szabályok (TERV 1.4, a K1-ben pontosítva — lásd README „Eltérések”):
 *  - átlátszó: a képpontok ≥ 5 %-ának alfája < 16;
 *  - a színek a (majdnem) fedett képpontokból (alfa ≥ 200); 4 bites kvantálás, közeli színek összevonva, < 2 % elhagyva,
 *    két nagyobb szín keveréke (élsimítás) elhagyva;
 *  - átlátszatlan képnél a perem ≥ 60 %-át adó szín a kép SAJÁT HÁTTERE: nem számít a tinta színei közé, és a világosságba sem;
 *  - szinek: a megmaradt színek (a háttérrel együtt) gyakoriság szerint, fehér/fekete/szürke nélkül, legfeljebb 5.
 */
export function logoElemzes(kep: Kepadat, eredetiSzelesseg: number, eredetiMagassag: number): LogoElemzes {
  const { rgba, szelesseg: w, magassag: h } = kep;
  const n = w * h;
  const arany = Math.min(100, Math.max(0.01, eredetiMagassag > 0 ? eredetiSzelesseg / eredetiMagassag : 1));
  let atlatszoDb = 0;
  const fedett: Rgb[] = [];
  const reszben: Rgb[] = [];
  const perem: (Rgb | null)[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const a = Number(rgba[i + 3] ?? 0);
      const rgb: Rgb = [Number(rgba[i] ?? 0), Number(rgba[i + 1] ?? 0), Number(rgba[i + 2] ?? 0)];
      const peremen = x === 0 || y === 0 || x === w - 1 || y === h - 1;
      if (a < ELEMZES_KUSZOB.atlatszoAlfa) { atlatszoDb++; if (peremen) perem.push(null); continue; }
      if (a >= ELEMZES_KUSZOB.fedettAlfa) fedett.push(rgb); else reszben.push(rgb);
      if (peremen) perem.push(a >= ELEMZES_KUSZOB.fedettAlfa ? rgb : null);
    }
  }
  const atlatszo = n > 0 && atlatszoDb / n >= ELEMZES_KUSZOB.atlatszoArany;
  const minta = fedett.length > 0 ? fedett : reszben;
  if (minta.length === 0) return { atlatszo: true, vilagossag: 0, szinszam: 0, arany: kerekit(arany), szinek: [] };

  const osszes = csoportok(minta);
  let maradt = osszes.filter((c) => c.db / minta.length >= ELEMZES_KUSZOB.minResz);
  maradt = maradt.filter((c) => !keverek(c, maradt));
  if (maradt.length === 0) maradt = osszes.slice(0, 1);

  // A kép saját, egyszínű háttere (csak átlátszatlan képnél): a perem nagy része egy csoportba esik.
  let hatter: Csoport | null = null;
  if (!atlatszo && perem.length > 0) {
    for (const c of maradt) {
      const db = perem.filter((p) => p !== null && tavolsag(p, c.rgb) < ELEMZES_KUSZOB.osszevonTav).length;
      if (db / perem.length >= ELEMZES_KUSZOB.hatterPerem) { hatter = c; break; }
    }
  }
  const tinta = maradt.filter((c) => c !== hatter);
  const vilagossagBol = tinta.length > 0 ? tinta : maradt;
  const sulySum = vilagossagBol.reduce((s, c) => s + c.db, 0);
  const vilagossag = vilagossagBol.reduce((s, c) => s + relativVilagossag(c.rgb) * c.db, 0) / Math.max(1, sulySum);
  const szinek = maradt.filter((c) => !nemMarkaszin(c.rgb)).slice(0, 5).map((c) => hexbe(c.rgb));
  return { atlatszo, vilagossag: kerekit(vilagossag), szinszam: tinta.length, arany: kerekit(arany), szinek };
}

function kerekit(x: number): number {
  return Math.round(x * 1000) / 1000;
}

/** A helyek határai (TERV 1.4) — ugyanezek a besorolásban. */
export const HELY_KUSZOB = {
  sotetLogo: 0.45, // ez alatti világosság: sötét logó → világos háttérre való
  negyzetMin: 0.8,
  negyzetMax: 1.25,
  vilagosraMax: 0.6, // ütközéskor a világos helyre még elmegy (közepes tónus is)
  sotetreMin: 0.35, // ütközéskor a sötét helyre már elmegy (közepes tónus is)
} as const;

/** Egyszínű-e a logó (egy tintaszín, átlátszó háttér — csak ezt tudja a képoldal átszínezni, gepezet 4). */
export function egyszinuLogo(e: LogoElemzes): boolean {
  return e.szinszam <= 1 && e.atlatszo;
}

export function negyzetesLogo(e: LogoElemzes): boolean {
  return e.arany >= HELY_KUSZOB.negyzetMin && e.arany <= HELY_KUSZOB.negyzetMax;
}

/**
 * A logó természetes helye (TERV 1.4 `javasoltHely`, a K1-ben pontosítva):
 *  1. egyszínű (egy tintaszín, átlátszó) ÉS sötét vagy színes → `egyszinu` (a fehér egyszínű logó a sötét háttérre való);
 *  2. négyzetes arány (0,8–1,25) → `negyzetes`;
 *  3. sötét logó (világosság < 0,45) → `vilagos` (világos háttérre kerül);
 *  4. különben → `sotet`.
 * Elemzés nélkül (PDF, olvashatatlan kép) → `vilagos`.
 */
export function javasoltHely(e: LogoElemzes | null): LogoHely {
  if (!e) return "vilagos";
  if (egyszinuLogo(e) && e.vilagossag < HELY_KUSZOB.sotetLogo) return "egyszinu";
  if (negyzetesLogo(e)) return "negyzetes";
  if (e.vilagossag < HELY_KUSZOB.sotetLogo) return "vilagos";
  return "sotet";
}

/** Az `x-logo-elemzes` fejléc: base64url JSON, legfeljebb 2 KB (TERV 2-K1). Csak ASCII kerül bele (számok, hex, igaz/hamis). */
export const ELEMZES_MAX_BAJT = 2048;

export function elemzesFejlecbe(e: LogoElemzes): string {
  return btoa(JSON.stringify(e)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** A fejléc visszafejtése és ellenőrzése. Bármilyen hiba (rossz kódolás, túl nagy, nem felel meg a sémának) → null — nem hiba. */
export function elemzesFejlecbol(fejlec: string | null | undefined): LogoElemzes | null {
  if (!fejlec || fejlec.length > Math.ceil((ELEMZES_MAX_BAJT * 4) / 3) + 4) return null;
  try {
    const b64 = fejlec.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
    if (json.length > ELEMZES_MAX_BAJT) return null;
    const e = LogoElemzes.safeParse(JSON.parse(json));
    return e.success ? e.data : null;
  } catch {
    return null;
  }
}
