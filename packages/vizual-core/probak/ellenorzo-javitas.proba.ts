import { describe, it, expect } from "vitest";
import { JAVITOTT_ELLENORZOK as E } from "../src/ellenorzo-javitas.ts";
import type { Szabaly, EllenorzoKontextus } from "../src/ellenorzo.ts";
import type { ElemMeres, LapMeres } from "../src/meres.ts";

const elem = (x: Partial<ElemMeres>): ElemMeres => ({
  mezo: "focim", nyelv: "elsodleges", tipus: "headline", szerep: "hang", szoveg: "Szöveg", csalad: "X", monospace: false,
  suly: 700, meret_px: 84, sorkoz_px: 87, betukoz_px: 0, nagybetus: false, tabularis: false, szin: "#ffffff", hatter: "#0b1a36",
  sorok: 2, x: 72, y: 200, w: 800, h: 174, kilog: false, nyelvi: ["Szöveg"], lemez: false, utolso_sor: "szöveg", utolso_sor_arany: 0.5, ...x,
});
const ktx = (elemek: ElemMeres[], csalad = "statement"): EllenorzoKontextus => ({
  meres: { szelesseg: 1080, magassag: 1350, tullepes_px: 0, elemek } as LapMeres,
  formatum: "feed45",
  parameter: (n) => ({ "grid.margin": { px: 72, ref: 1080, tengely: "w" }, "budget.dataHeadline": 28, "locale.dateFormat": "DD.MM.YYYY", "widow.minChars": 8, "widow.minRatio": 0.3, "widow.dataMaxChars": 4 } as Record<string, unknown>)[n],
  kitoltott: [],
  receptCsalad: csalad,
});
const sz = (check: string, mezoTipus: string[], feltetel: Record<string, unknown>): Szabaly => ({
  id: "X", nev: "", csoport: "", formatum: ["feed45"], mezoTipus, hatokor: "elem", feltetel: { check, ...feltetel }, szigorusag: "tiltas", uzenet: "",
});

describe("javított ellenőrzők", () => {
  const M6 = sz("max_lines", ["headline"], { limits: { "statement.headline": { feed45: 3, modifiers: { "ground=dark": "+1" } }, "data.headline": { max: 2 } } });
  it("max_lines: sötét alapon a statement-főcím 4 sort kap", () => {
    expect(E["max_lines"]!(M6, ktx([elem({ sorok: 4 })]))).toHaveLength(0);
    expect(E["max_lines"]!(M6, ktx([elem({ sorok: 5 })]))).toHaveLength(1);
  });
  it("max_lines: az adat-család korlátja csak adatlapon él", () => {
    expect(E["max_lines"]!(M6, ktx([elem({ sorok: 3, hatter: "#ffffff" })], "data"))).toHaveLength(1);
  });
  const A9 = sz("date_format", ["metadata"], { format: "@locale.dateFormat" });
  it("date_format: csak a dátumnak látszó részt nézi", () => {
    expect(E["date_format"]!(A9, ktx([elem({ tipus: "metadata", szoveg: "INFO 063 · 23.09.2026 · LINIA 23" })]))).toHaveLength(0);
    expect(E["date_format"]!(A9, ktx([elem({ tipus: "metadata", szoveg: "INFO 063 · 2026-09-23" })]))).toHaveLength(1);
  });
  it("max_chars: nyelvenként mér, nem a párt együtt", () => {
    const A7 = sz("max_chars", ["dataLabel"], { maxChars: 22 });
    expect(E["max_chars"]!(A7, ktx([elem({ tipus: "dataLabel", szoveg: "Abonament lunar · Havi bérlet", nyelvi: ["Abonament lunar", "Havi bérlet"] })]))).toHaveLength(0);
  });
  it("widow: egyetlen rövid szó az utolsó sorban", () => {
    const M8 = sz("widow", ["headline"], { widowIf: { lastLineWords: 1, "lastLineChars<": "@widow.minChars", "orLastLineWidthRatio<": "@widow.minRatio" } });
    expect(E["widow"]!(M8, ktx([elem({ utolso_sor: "ma.", utolso_sor_arany: 0.1 })]))).toHaveLength(1);
    expect(E["widow"]!(M8, ktx([elem({ utolso_sor: "közlekedik ma.", utolso_sor_arany: 0.6 })]))).toHaveLength(0);
  });
  it("grid: a sávon álló szöveg kivétel a margó alól", () => {
    const K4 = sz("grid", ["*"], { margin: "@grid.margin", exemptFromMargin: ["plate"] });
    expect(E["grid"]!(K4, ktx([elem({ x: 20, y: 10, lemez: true })]))).toHaveLength(0);
    expect(E["grid"]!(K4, ktx([elem({ x: 20, y: 10 })]))).toHaveLength(1);
  });
  it("field_role: szám információs szerepben tilos, hang szerepben szabad", () => {
    const T2 = sz("field_role", ["label"], { requireRole: "technikai", exceptRole: ["hang"] });
    expect(E["field_role"]!(T2, ktx([elem({ tipus: "label", szerep: "tajekoztatas", szoveg: "Linia 23" })]))).toHaveLength(1);
    expect(E["field_role"]!(T2, ktx([elem({ tipus: "label", szerep: "technikai", szoveg: "23", tabularis: true })]))).toHaveLength(0);
  });
});
