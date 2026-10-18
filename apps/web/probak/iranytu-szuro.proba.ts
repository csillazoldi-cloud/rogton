import { describe, it, expect } from "vitest";
import { iranytuSzuronek } from "../hirfigyelo/iranytu-szuro";

// 2026-09-22: a hírszűrő az Iránytű jóváhagyott változatát is megkapja (célok, tolni, kerülendő témák).

const id = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;

describe("Iránytű a hírszűrőnek", () => {
  it("üres vagy hiányzó iránytű: nincs mit átadni", () => {
    expect(iranytuSzuronek(null)).toBeNull();
    expect(iranytuSzuronek({ celok: [], vizio: "", vizio_forras: "", ertekek: [], idoszakok: [], tolni: [], tiltott_szavak: [], kerulendo_temak: [] })).toBeNull();
  });

  it("a célok indokkal, a tolni- és a kerülendő tételek átmennek", () => {
    const k = iranytuSzuronek({
      celok: [{ id: id(1), nev: "AI-oktatás Erdélyben", miert: "Ez a szakterületünk.", mikorra: "", mirol_tudod: "", forras: "sajat" }],
      vizio: "", vizio_forras: "", ertekek: [], idoszakok: [],
      tolni: [{ id: id(2), nev: "AI-tanfolyam", forras: "sajat" }],
      tiltott_szavak: ["olcsó"],
      kerulendo_temak: ["pártpolitika", " "],
    });
    expect(k).toEqual({ celok: ["AI-oktatás Erdélyben — Ez a szakterületünk."], tolni: ["AI-tanfolyam"], kerulendo_temak: ["pártpolitika"] });
  });
});
