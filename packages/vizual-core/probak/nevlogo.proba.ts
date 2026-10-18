// R-16 K6 (TERV §2-K6 Self-test, gepezet 13): a névlogó SVG-je hamis betű-porttal (rögzített betűszélesség), böngésző és betűfájl nélkül.
//  - a három próbanév (gepezet 13): „Ördögh Ősz Árpád Kft.”, „Știință și Țară SRL”, egy 44 karakteres név → két sor; semmi nem lóg ki
//    a viewBoxból (az ékezet fölül, a román vessző alul is belül);
//  - három stílus × négy változat: érvényes XML, csak útvonal (nincs `<text>`, `<script>`, eseménykezelő, külső hivatkozás);
//  - a változatok színei: a világos név olvasható a fehéren, az egyszínű csupa fekete, a négyzetes csak a kezdőbetű;
//  - a túl hosszú név kisebb lesz, de soha nem vágódik (a port a teljes szöveget kapja);
//  - c10 (design/R16-arculat/UTOKERES-12G.md): a három stílus ELRENDEZÉSBEN különbözik — szó (csak név, fekvő) · bélyeg (kör a kezdőbetűvel,
//    alatta a név, álló) · keretes (a név egy sávban, benne vékony keret, fekvő); a négy változat mindháromnál.
import { describe, expect, it } from "vitest";
import {
  NEVLOGO_BELYEG_KET_SOR,
  NEVLOGO_KET_SOR,
  NEVLOGO_STILUSOK,
  NEVLOGO_SZELES_MAX,
  NEVLOGO_VALTOZATOK,
  nevlogoKezdobetu,
  nevlogoSorok,
  nevlogoSvg,
  raIrt,
  wcagArany,
  type BetuUtvonal,
  type NevlogoStilus,
  type NevlogoValtozat,
} from "../src/index.ts";

/** Hamis port: minden karakter 0,6 em széles; az ékezetes nagybetű magasabb, a vesszős (Ș Ț) lejjebb ér. A „d” egy téglalap. */
const FELUL_EKEZET = /[ÁÉÍÓÖŐÚÜŰĂÂÎȘȚ]/u;
const ALUL_VESSZO = /[ȘȚșțg,]/u;
function hamisPort(naplo: string[] = []): BetuUtvonal {
  return {
    utvonal(szoveg, meret, betukoz = 0) {
      naplo.push(szoveg);
      const n = [...szoveg].length;
      if (!szoveg.trim()) return { d: "", szelesseg: 0, felso: 0, also: 0 };
      const szelesseg = n * 0.6 * meret + Math.max(0, n - 1) * betukoz * meret;
      const felso = (FELUL_EKEZET.test(szoveg) ? 0.95 : 0.7) * meret;
      const also = ALUL_VESSZO.test(szoveg) ? 0.25 * meret : 0;
      return { d: `M0 ${-felso}H${szelesseg}V${also}H0Z`, szelesseg, felso, also };
    },
  };
}

const MELEG = { fo: "#a4471f", masodik: "#e3a857", hatter: "#fbf3e8" };
const HOSSZU = "Marosvásárhelyi Építőipari és Térkövező Kft.";

type D = { x0: number; y0: number; x1: number; y1: number };
const szam = (s: string) => s.trim().split(/[\s,]+/).map(Number);

/** Az SVG elemeinek befoglalói (a hamis port téglalap-útvonalaiból, a körökből és a négyzetekből) + a viewBox. */
function geometria(svg: string): { vb: D; elemek: D[] } {
  const [vx, vy, vw, vh] = szam(svg.match(/viewBox="([^"]+)"/)![1]!);
  const elemek: D[] = [];
  for (const m of svg.matchAll(/<path transform="translate\(([-\d.]+) ([-\d.]+)\)" d="M0 ([-\d.]+)H([-\d.]+)V([-\d.]+)H0Z"/g)) {
    const [x, y, t, w, a] = m.slice(1).map(Number) as [number, number, number, number, number];
    elemek.push({ x0: x, y0: y + t, x1: x + w, y1: y + a });
  }
  for (const m of svg.matchAll(/<circle cx="([-\d.]+)" cy="([-\d.]+)" r="([-\d.]+)"/g)) {
    const [cx, cy, r] = m.slice(1).map(Number) as [number, number, number];
    elemek.push({ x0: cx - r, y0: cy - r, x1: cx + r, y1: cy + r });
  }
  for (const m of svg.matchAll(/<rect x="([-\d.]+)" y="([-\d.]+)" width="([-\d.]+)" height="([-\d.]+)"/g)) {
    const [x, y, w, h] = m.slice(1).map(Number) as [number, number, number, number];
    elemek.push({ x0: x, y0: y, x1: x + w, y1: y + h });
  }
  return { vb: { x0: vx!, y0: vy!, x1: vx! + vw!, y1: vy! + vh! }, elemek };
}

/** Egy apró XML-ellenőrzés: minden címke lezárva, jó sorrendben; egy gyökér `<svg>`. */
function ervenyesXml(svg: string): boolean {
  const verem: string[] = [];
  let gyoker = 0;
  for (const m of svg.matchAll(/<(\/?)([a-zA-Z][\w:-]*)((?:\s+[\w:-]+="[^"<>]*")*)\s*(\/?)>/g)) {
    const [, zar, nev, , onzar] = m;
    if (zar) { if (verem.pop() !== nev) return false; continue; }
    if (verem.length === 0) gyoker++;
    if (!onzar) verem.push(nev!);
  }
  const maradek = svg.replace(/<(\/?)([a-zA-Z][\w:-]*)((?:\s+[\w:-]+="[^"<>]*")*)\s*(\/?)>/g, "");
  return verem.length === 0 && gyoker === 1 && maradek.trim() === "" && svg.startsWith("<svg ");
}

function mind(nev: string) {
  const ki: { stilus: NevlogoStilus; valtozat: NevlogoValtozat; svg: string }[] = [];
  for (const stilus of NEVLOGO_STILUSOK)
    for (const valtozat of NEVLOGO_VALTOZATOK) ki.push({ stilus, valtozat, svg: nevlogoSvg({ nev, stilus, szinek: MELEG, valtozat }, hamisPort()).svg });
  return ki;
}

describe("névlogó (vizual-core nevlogoSvg, R-16 K6)", () => {
  it("a sorok: 40 karakter alatt egy sor (nagybetűvel), a 44 karakteres név a középhez legközelebbi szóköznél két sorra törik", () => {
    expect(nevlogoSorok("Ördögh Ősz Árpád Kft.")).toEqual(["ÖRDÖGH ŐSZ ÁRPÁD KFT."]);
    expect(nevlogoSorok("Știință și Țară SRL")).toEqual(["ȘTIINȚĂ ȘI ȚARĂ SRL"]);
    expect([...HOSSZU].length).toBe(44);
    expect([...HOSSZU].length).toBeGreaterThanOrEqual(NEVLOGO_KET_SOR);
    expect(nevlogoSorok(HOSSZU)).toEqual(["MAROSVÁSÁRHELYI ÉPÍTŐIPARI", "ÉS TÉRKÖVEZŐ KFT."]);
    // szóköz nélkül nem törhet: egy sor (és majd kisebb betű)
    expect(nevlogoSorok("A".repeat(45))).toHaveLength(1);
    expect(nevlogoKezdobetu("„Ördögh” Kft.")).toBe("Ö");
    expect(nevlogoKezdobetu("  știință")).toBe("Ș");
  });

  for (const nev of ["Ördögh Ősz Árpád Kft.", "Știință și Țară SRL", HOSSZU, "Cipó Pékség"]) {
    it(`${nev}: 3 stílus × 4 változat — érvényes XML, csak útvonal, és semmi nem lóg ki a viewBoxból`, () => {
      for (const { stilus, valtozat, svg } of mind(nev)) {
        const hol = `${stilus}/${valtozat}`;
        expect(ervenyesXml(svg), hol).toBe(true);
        expect(svg, hol).not.toMatch(/<text|<script|<foreignObject|<image|<a[\s>]|href|\son[a-z]+=|javascript:|<style/i);
        const { vb, elemek } = geometria(svg);
        expect(elemek.length, hol).toBeGreaterThan(0);
        for (const e of elemek) {
          expect(e.x0, hol).toBeGreaterThanOrEqual(vb.x0 - 0.01);
          expect(e.y0, hol).toBeGreaterThanOrEqual(vb.y0 - 0.01);
          expect(e.x1, hol).toBeLessThanOrEqual(vb.x1 + 0.01);
          expect(e.y1, hol).toBeLessThanOrEqual(vb.y1 + 0.01);
        }
      }
    });
  }

  it("a 44 karakteres név két szövegútvonal (két sor), a négyzetes változat csak a kezdőbetű (egy útvonal, egy négyzet)", () => {
    for (const { stilus, valtozat, svg } of mind(HOSSZU)) {
      const utak = [...svg.matchAll(/<path /g)].length;
      if (valtozat === "negyzetes") { expect(utak).toBe(1); expect([...svg.matchAll(/<rect /g)].length).toBe(1); continue; }
      // c10 (UTOKERES-12G): a várt útvonalszám az új elrendezéshez igazítva — a bélyegben (kor) a kezdőbetű is útvonal (az egyszínűben a
      // maszkban), a keretesben (negyzet) már nincs kezdőbetű, csak a két sor. Korábban: negyzet 3, a többi 2 (a négyzetes kezdőbetű miatt).
      expect(utak, `${stilus}/${valtozat}`).toBe(stilus === "kor" ? 3 : 2);
    }
  });

  it("a túl hosszú név kisebb lesz, de nem vágódik: a port a TELJES szöveget kapja, a sor a kereten belül", () => {
    const nev = "Nagyon Hosszú Nevű Marosvásárhelyi Építőipari Térkövező és Szegélyező Korlátolt Felelősségű Társaság";
    const naplo: string[] = [];
    const e = nevlogoSvg({ nev, stilus: "kor", szinek: MELEG, valtozat: "vilagos" }, hamisPort(naplo));
    const sorok = nevlogoSorok(nev);
    expect(sorok).toHaveLength(2);
    expect(sorok.join(" ")).toBe(nev.toUpperCase());
    for (const s of sorok) expect(naplo).toContain(s);
    expect(e.szelesseg).toBeLessThanOrEqual(NEVLOGO_SZELES_MAX + 10);
    // egy sor szóköz nélkül: szintén kisebb, szintén egész
    const egy = nevlogoSvg({ nev: "Ő".repeat(90), stilus: "nev", szinek: MELEG, valtozat: "vilagos" }, hamisPort());
    expect(egy.szelesseg).toBeLessThanOrEqual(NEVLOGO_SZELES_MAX + 10);
  });

  // c10 (UTOKERES-12G): a színek elvárása az új elrendezéshez igazítva. Korábban: a kis kör a második szín, a négyzet a fő szín raIrt-betűvel,
  // a sötét négyzet krém. Most (a rajz 12g javítva 09-30): a bélyeg köre a fő szín, gyűrűje a második, betűje a háttérszín; sötéten a kör krém,
  // benne a fő szín; a keretes sávja a második szín, kerete és neve a fő szín (a sávon olvashatóra igazítva). A négyzetes változat NEM változott.
  it("a változatok színei: világos = olvasható fő szín a fehéren; sötét = a háttérszín; egyszínű = csupa fekete; négyzetes = fő + raIrt(fo)", () => {
    const e = (valtozat: NevlogoValtozat, stilus: NevlogoStilus = "negyzet") => nevlogoSvg({ nev: "Cipó Pékség", stilus, szinek: MELEG, valtozat }, hamisPort());
    const kitoltesek = (svg: string) => [...new Set([...svg.matchAll(/(?:fill|stroke)="(#[0-9a-f]{6})"/g)].map((m) => m[1]!))];
    const v = e("vilagos", "kor");
    expect(wcagArany(v.tinta, "#ffffff")).toBeGreaterThanOrEqual(4.5);
    // a bélyeg (rajz 12g): fő színű kör, második színű gyűrű, a betű a háttérszín (a téglavörösön olvasható)
    expect(v.svg).toMatch(new RegExp(`<circle cx="0" cy="0" r="[\\d.]+" fill="${MELEG.fo}"/>`));
    expect(v.svg).toMatch(new RegExp(`fill="none" stroke="${MELEG.masodik}"`));
    expect(kitoltesek(v.svg)).toContain(MELEG.hatter);
    // sötéten: krém kör, benne a fő szín; a név krém
    const s = e("sotet", "kor");
    expect(s.svg).toMatch(new RegExp(`<circle cx="0" cy="0" r="[\\d.]+" fill="${MELEG.hatter}"/>`));
    expect(s.tinta).toBe(MELEG.hatter);
    // a keretes (rajz 12g): második színű sáv, benne fő színű keret és név — világoson és sötéten is (a sáv hordozza a hátterét)
    for (const valtozat of ["vilagos", "sotet"] as const) {
      const kr = e(valtozat);
      expect(kr.svg, valtozat).toMatch(new RegExp(`<rect [^>]*fill="${MELEG.masodik}"/>`));
      // a keret és a név ugyanaz a festék: a fő szín, a sávon olvashatóra igazítva (a Meleg téglavöröse a mézsárgán kissé sötétebb lesz)
      expect(kr.svg, valtozat).toMatch(new RegExp(`<rect [^>]*fill="none" stroke="${kr.tinta}"`));
      expect(wcagArany(kr.tinta, MELEG.masodik), valtozat).toBeGreaterThanOrEqual(4.5);
      expect(wcagArany(kr.tinta, "#ffffff"), valtozat).toBeGreaterThanOrEqual(wcagArany(MELEG.fo, "#ffffff"));
    }
    expect(e("sotet", "nev").tinta).toBe(MELEG.hatter); // a krém a téglavörösön olvasható
    // az egyszínűben a maszk fehér/fekete kitöltése csak a kivágásé — a látható rajz csupa fekete (a bélyegnél és a keretesnél is)
    for (const stilus of ["kor", "negyzet"] as const) {
      const egy = e("egyszinu", stilus);
      expect(egy.szinek, stilus).toEqual(["#000000"]);
      expect(egy.svg, stilus).toContain('mask="url(#kb)"');
    }
    expect(e("egyszinu", "nev").szinek).toEqual(["#000000"]);
    const n = e("negyzetes");
    expect(kitoltesek(n.svg).sort()).toEqual([MELEG.fo, raIrt(MELEG.fo)].sort());
    expect(n.szelesseg).toBe(n.magassag);
  });

  it("gyenge második szín (a fő színnel összefolyik): a gyűrű a betű színére, a sötét keretes sáv a világos színre vált", () => {
    const sz = { fo: "#a4471f", masodik: "#a5481f", hatter: "#fbf3e8" };
    const kor = nevlogoSvg({ nev: "Cipó Pékség", stilus: "kor", szinek: sz, valtozat: "vilagos" }, hamisPort());
    expect(kor.svg).toMatch(new RegExp(`fill="none" stroke="${sz.hatter}"`));
    const kr = nevlogoSvg({ nev: "Cipó Pékség", stilus: "negyzet", szinek: sz, valtozat: "sotet" }, hamisPort());
    expect(kr.svg).toMatch(new RegExp(`<rect [^>]*fill="${sz.hatter}"/>`));
    expect(wcagArany(kr.tinta, sz.hatter)).toBeGreaterThanOrEqual(4.5);
  });

  describe("c10: a három stílus elrendezésben különbözik (UTOKERES-12G)", () => {
    const g = (nev: string, stilus: NevlogoStilus) => {
      const e = nevlogoSvg({ nev, stilus, szinek: MELEG, valtozat: "vilagos" }, hamisPort());
      return { e, ...geometria(e.svg), korok: [...e.svg.matchAll(/<circle /g)].length, teglak: [...e.svg.matchAll(/<rect /g)].length };
    };
    for (const nev of ["Cipó Pékség", "Kovács és Társa Térkövezés", "Știință și Țară SRL"]) {
      it(`${nev}: szó = csak név (fekvő) · bélyeg = kör fölül, név alatta (álló) · keretes = sáv a név körül (fekvő)`, () => {
        const szo = g(nev, "nev"), kor = g(nev, "kor"), kr = g(nev, "negyzet");
        // szó: se kör, se téglalap; hosszú, lapos
        expect(szo.korok + szo.teglak).toBe(0);
        expect(szo.e.szelesseg / szo.e.magassag).toBeGreaterThan(4);
        // bélyeg: a kör (és a gyűrű) fölül, minden név-útvonal a kör ALATT; álló vagy közel négyzetes
        expect(kor.korok).toBe(2);
        expect(kor.e.szelesseg / kor.e.magassag).toBeLessThanOrEqual(1.6);
        const korDoboz = kor.elemek.find((d) => Math.abs(d.x0 + d.x1) < 0.02 && Math.abs(d.y0 + d.y1) < 0.02)!;
        const nevek = kor.elemek.filter((d) => d.y0 > korDoboz.y1 - 0.01);
        expect(nevek.length).toBe(nevlogoSorok(nev, NEVLOGO_BELYEG_KET_SOR).length);
        // keretes: két téglalap (sáv + keret), a sáv minden név-útvonalat körülölel; fekvő
        expect(kr.korok).toBe(0);
        expect(kr.teglak).toBe(2);
        const sav = kr.elemek.reduce((a, d) => ((d.x1 - d.x0) * (d.y1 - d.y0) > (a.x1 - a.x0) * (a.y1 - a.y0) ? d : a));
        for (const d of kr.elemek) {
          expect(d.x0).toBeGreaterThanOrEqual(sav.x0 - 0.01);
          expect(d.y0).toBeGreaterThanOrEqual(sav.y0 - 0.01);
          expect(d.x1).toBeLessThanOrEqual(sav.x1 + 0.01);
          expect(d.y1).toBeLessThanOrEqual(sav.y1 + 0.01);
        }
        expect(kr.e.szelesseg / kr.e.magassag).toBeGreaterThan(2);
        // első ránézésre más: a három oldalarány jól elválik (szó > keretes > bélyeg)
        expect(szo.e.szelesseg / szo.e.magassag).toBeGreaterThan(kr.e.szelesseg / kr.e.magassag);
        expect(kr.e.szelesseg / kr.e.magassag).toBeGreaterThan(1.5 * (kor.e.szelesseg / kor.e.magassag));
      });
    }

    it("a bélyeg 16 karaktertől két sorra törik (a szó és a keretes csak 40-től)", () => {
      expect(nevlogoSorok("Cipó Pékség", NEVLOGO_BELYEG_KET_SOR)).toEqual(["CIPÓ PÉKSÉG"]);
      expect(nevlogoSorok("Kovács és Társa Térkövezés", NEVLOGO_BELYEG_KET_SOR)).toEqual(["KOVÁCS ÉS TÁRSA", "TÉRKÖVEZÉS"]);
      expect(nevlogoSorok("Kovács és Társa Térkövezés")).toEqual(["KOVÁCS ÉS TÁRSA TÉRKÖVEZÉS"]);
    });
  });

  it("gyenge fő szín (világos sárga) a világos változatban sötétebbre igazítva — a név mindig olvasható", () => {
    const e = nevlogoSvg({ nev: "Napfény Cukrászda", stilus: "nev", szinek: { fo: "#f2d45c", masodik: "#3b6ea5", hatter: "#fffdf5" }, valtozat: "vilagos" }, hamisPort());
    expect(wcagArany(e.tinta, "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(wcagArany(e.tinta, "#fffdf5")).toBeGreaterThanOrEqual(4.5);
  });
});
