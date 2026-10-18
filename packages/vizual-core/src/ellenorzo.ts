// A szabályellenőrző kerete: a szabalyok.json egy-egy szabályát a feltétel „check” fajtája szerint
// a megfelelő ellenőrző függvényre bízza. Ami a méréstől nem dönthető el, azt kimondja — nem hallgat el.
import type { LapMeres, ElemMeres, SzabalyMezoTipus } from "./meres.ts";

export interface Szabaly {
  id: string;
  nev: string;
  csoport: string;
  formatum: string[];
  mezoTipus: string[];
  hatokor: "elem" | "kompozicio" | "sorozat" | "feed" | "publikalas";
  feltetel: { check: string; [k: string]: unknown };
  szigorusag: "tiltas" | "figyelmeztetes";
  uzenet: string;
}

export interface Talalat {
  szabaly: string;
  szigorusag: "tiltas" | "figyelmeztetes";
  /** a mező, amelyre vonatkozik (ha egy mezőre) */
  mezo?: string;
  uzenet: string;
  /** a mért érték és a határ, ember által olvasható alakban (pl. "30 px < 36 px") */
  reszlet?: string;
}

export interface EllenorzoKontextus {
  meres: LapMeres;
  /** a lap formátumkódja (szabalyok.json szotarak.formatum kulcsa, pl. "feed45") */
  formatum: string;
  /** a márkaréteg paraméterei a szabályrendszer neveivel (pl. "min.meta" → {px,ref,tengely}) */
  parameter: (nev: string) => unknown;
  /** a lapon kitöltött mezők (a recept azonosítói) */
  kitoltott: string[];
  /** a recept családja (pl. "szolgaltatasi", "allitas", "adat") */
  receptCsalad: string;
}

/** Egy ellenőrző: a szabályra és a mérésre találatokat ad (üres lista = rendben). */
export type Ellenorzo = (sz: Szabaly, k: EllenorzoKontextus) => Talalat[];

/** A szabály mezőtípus-szűrőjének megfelelő mért elemek ("*" = minden szöveges elem). */
export function erintettElemek(sz: Szabaly, m: LapMeres): ElemMeres[] {
  const t = sz.mezoTipus;
  return m.elemek.filter((e) => (t.includes("*") ? e.szoveg !== "" : t.includes(e.tipus as SzabalyMezoTipus)));
}

/**
 * Egy {px, ref, tengely} alakú hossz átszámítása a tényleges vászonra
 * (szabalyok.json konvenciok.meret). Szám esetén a szám maga.
 */
export function hossz(ertek: unknown, m: LapMeres): number | null {
  if (typeof ertek === "number") return ertek;
  if (ertek && typeof ertek === "object") {
    const o = ertek as { px?: number; ref?: number; tengely?: string };
    if (typeof o.px === "number" && typeof o.ref === "number")
      return (o.px * (o.tengely === "h" ? m.magassag : m.szelesseg)) / o.ref;
  }
  return null;
}

/** "@min.meta" → a paraméter értéke; más érték változatlanul. */
export function feloldas(ertek: unknown, k: EllenorzoKontextus): unknown {
  if (typeof ertek === "string" && ertek.startsWith("@")) return k.parameter(ertek.slice(1));
  return ertek;
}

/** WCAG kontrasztarány két #rrggbb szín között. */
export function kontraszt(a: string, b: string): number {
  const lum = (h: string) => {
    const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
}

export interface EllenorzesEredmeny {
  talalatok: Talalat[];
  /** szabályok, amelyeket egyetlen képből nem lehet eldönteni (sorozat, feed, publikálás, kézi) */
  kivul: string[];
  /** szabályok, amelyekhez még nincs gépi ellenőrző */
  nincs_ellenorzo: string[];
  /** van-e letöltést tiltó találat */
  tiltott: boolean;
}

/** Lefuttatja az egy képre vonatkozó szabályokat. */
export function ellenoriz(
  szabalyok: Szabaly[],
  k: EllenorzoKontextus,
  ellenorzok: Record<string, Ellenorzo>,
  nemDontheto: Record<string, string> = {},
): EllenorzesEredmeny {
  const talalatok: Talalat[] = [];
  const kivul: string[] = [];
  const nincs: string[] = [];
  for (const sz of szabalyok) {
    if (sz.hatokor !== "elem" && sz.hatokor !== "kompozicio") {
      kivul.push(sz.id);
      continue;
    }
    if (!sz.formatum.includes(k.formatum)) continue;
    if (sz.feltetel["kezi"] === true) {
      kivul.push(sz.id);
      continue;
    }
    if (sz.id in nemDontheto) {
      kivul.push(sz.id);
      continue;
    }
    const f = ellenorzok[sz.feltetel.check];
    if (!f) {
      nincs.push(sz.id);
      continue;
    }
    talalatok.push(...f(sz, k));
  }
  return { talalatok, kivul, nincs_ellenorzo: nincs, tiltott: talalatok.some((t) => t.szigorusag === "tiltas") };
}
