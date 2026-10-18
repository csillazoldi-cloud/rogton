// c5 · 11c (design/R15/rajz/R15-lapok-4.dc.html 11c; gepezet-4 · 4; kerdesek-4 · 7–8 — Csilla 10-10): a jóváhagyott iránytű
// posztötletei — sorrend (futó kampány → „Amit tolni kell” → célok), legfeljebb 3, és a posztmunka kiváltója (tipus "terv").
// Tiszta függvény, adatbázis nélkül.
import { describe, expect, it } from "vitest";
import { PosztForras } from "@rogton/contracts";
import { OTLET_MAX, iranytuOtletek, otletForras } from "../iranytu/otletek";

const ir = {
  celok: [{ id: "c1", nev: "20 új udvar-megrendelés a tavaszi szezonra", miert: "A tavasz adja a bevétel felét." }, { id: "c2", nev: "  " }],
  tolni: [{ id: "t1", nev: "Díszburkolat udvarra" }, { id: "t2", nev: "Kocsibeálló térkőből" }, { id: "t3", nev: "Ingyenes helyszíni felmérés" }],
  idoszakok: [
    { id: "i1", nev: "Őszi felmérés: tavaszi munkák lefoglalása", mettol: "2026-10-01", meddig: "2026-11-30", mit: "Minél több felmérést foglaljanak november végéig." },
    { id: "i2", nev: "Tavaszi akció", mettol: "2027-03-01", meddig: "2027-04-30", mit: "" },
  ],
};

describe("c5 · 11c iránytű-ötletek", () => {
  it("a MA futó kampány elöl, utána a „tolni” tételek a saját sorrendjükben; legfeljebb 3", () => {
    const o = iranytuOtletek(ir, "2026-10-10");
    expect(OTLET_MAX).toBe(3);
    expect(o.map((x) => [x.fajta, x.id])).toEqual([["kampany", "i1"], ["tolni", "t1"], ["tolni", "t2"]]);
    expect(o[0]!.alatta).toBe("Minél több felmérést foglaljanak november végéig.");
  });
  it("nem futó kampány nem ötlet; a határnap még fut; üres határ = nyitott", () => {
    expect(iranytuOtletek(ir, "2027-01-15").map((x) => x.id)).toEqual(["t1", "t2", "t3"]);
    expect(iranytuOtletek(ir, "2026-11-30")[0]!.id).toBe("i1");
    expect(iranytuOtletek({ celok: [], tolni: [], idoszakok: [{ id: "n", nev: "Nyitott", mettol: "", meddig: "" }] }, "2030-01-01").map((x) => x.id)).toEqual(["n"]);
  });
  it("kevés tétel → a célok töltik ki; üres nevű tétel kimarad; nincs iránytű → nincs ötlet", () => {
    const o = iranytuOtletek({ celok: ir.celok, tolni: [{ id: "t1", nev: "Díszburkolat udvarra" }], idoszakok: [] }, "2026-10-10");
    expect(o.map((x) => [x.fajta, x.id])).toEqual([["tolni", "t1"], ["cel", "c1"]]);
    expect(iranytuOtletek(null, "2026-10-10")).toEqual([]);
    expect(iranytuOtletek({ celok: [], tolni: [], idoszakok: [] }, "2026-10-10")).toEqual([]);
  });
  it("a kiváltó: tipus \"terv\", azonosító = a tétel id-ja (A-8: ugyanaz a munka nyílik), és megfelel a PosztForras szerződésnek", () => {
    const f = otletForras(iranytuOtletek(ir, "2026-10-10")[0]!);
    expect(f.tipus).toBe("terv");
    expect(f.azonosito).toBe("i1");
    expect(f.szoveg).toContain("Őszi felmérés");
    expect(f.szoveg).toContain("2026-10-01");
    expect(PosztForras.safeParse(f).success).toBe(true);
  });
});
