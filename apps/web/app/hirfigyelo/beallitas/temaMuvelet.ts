// A Figyelés beállítása lap tiszta segédei (A2, 2026-09-30 — Csilla 09-25 és Kamilla 09-16 visszajelzése:
// „a Hozzáadás gombnál vacakol, gondolkodik, nem enged”). Nincs React, nincs hálózat: a probak/ közvetlenül futtatja.
import type { Beallitas } from "@km/news-monitor-core";
import { temakBont } from "../../_kozos/temak";

type Tema = Beallitas["temak"][number];

/** A séma korlátai (`@km/news-monitor-core` Tema.nev max 120, Beallitas.temak max 30) — a próba őrzi, hogy egyezzenek. */
export const TEMA_NEV_MAX = 120;
export const TEMAK_MAX = 30;

export type TemaHozzaadasEredmeny = {
  temak: Tema[];
  /** a ténylegesen felvett nevek */
  ujak: string[];
  /** a beviteli mező új értéke: sikernél üres, ha semmi nem ment be, marad (a felhasználó javíthassa) */
  bevitel: string;
  /** ha SEMMI nem került be: miért — a felület egy mondatban mondja ki (hf.tema_*) */
  ok: null | "ures" | "mar_van" | "tul_hosszu" | "tul_sok";
};

/** Témák felvétele a beírt sorból („a, b; c”). Soha nem „csendes semmi”: ha nem vesz fel semmit, megmondja, miért. */
export function temaHozzaadas(temak: Tema[], bevitel: string): TemaHozzaadasEredmeny {
  const nevek = temakBont(bevitel);
  if (nevek.length < 1) return { temak, ujak: [], bevitel, ok: "ures" };
  const meglevo = new Set(temak.map((t) => t.nev.trim().toLocaleLowerCase("hu")));
  const ujak: string[] = [];
  let volt: { hosszu: boolean; sok: boolean; dupla: boolean } = { hosszu: false, sok: false, dupla: false };
  for (const nev of nevek) {
    if (nev.length > TEMA_NEV_MAX) { volt = { ...volt, hosszu: true }; continue; }
    const kulcs = nev.toLocaleLowerCase("hu");
    if (meglevo.has(kulcs)) { volt = { ...volt, dupla: true }; continue; }
    if (temak.length + ujak.length >= TEMAK_MAX) { volt = { ...volt, sok: true }; continue; }
    meglevo.add(kulcs);
    ujak.push(nev);
  }
  if (ujak.length < 1) {
    return { temak, ujak, bevitel, ok: volt.hosszu ? "tul_hosszu" : volt.sok ? "tul_sok" : "mar_van" };
  }
  return { temak: [...temak, ...ujak.map((nev) => ({ nev, nevvaltozatok: [], megkulonboztetes: "" }))], ujak, bevitel: "", ok: null };
}

/** Egyszerre egy mentés fut; ami közben érkezik, az nem vész el: a futó után a LEGFRISSEBB kérés megy fel.
 *  (A régi lap a futó mentés alatt érkező automatikus mentést eldobta — a közben felvett téma nem mentődött.) */
export function mentoSor<T>(ment: (ertek: T) => Promise<void>): { kuld: (ertek: T) => Promise<void>; fut: () => boolean } {
  let folyik: Promise<void> | null = null;
  let varo: { ertek: T } | null = null;
  const futtat = async (ertek: T): Promise<void> => {
    try { await ment(ertek); } catch { /* a `ment` maga jelzi a hibát a felületen; a sor nem akadhat el */ }
    while (varo) {
      const kov = varo.ertek;
      varo = null;
      try { await ment(kov); } catch { /* lásd fent */ }
    }
  };
  return {
    kuld(ertek: T) {
      if (folyik) { varo = { ertek }; return folyik; }
      folyik = futtat(ertek).finally(() => { folyik = null; });
      return folyik;
    },
    fut: () => folyik !== null,
  };
}
