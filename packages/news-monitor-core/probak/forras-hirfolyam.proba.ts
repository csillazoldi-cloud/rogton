import { describe, it, expect } from "vitest";
import {
  gyokerCim,
  forrasEllenorzesEredmeny,
} from "../src/index";

const MOST = new Date("2026-09-07T10:00:00Z");

function forras(cim: string) {
  return {
    id: "f1",
    cim,
    tipus: null,
    eredet: "kezi" as const,
    allapot: "ellenorzes_alatt" as const,
    ellenorzott: false,
    utolso_sikeres: null,
    hiba_ok: null,
  };
}

describe("gyokerCim — a cím gyökér-e (V3b)", () => {
  it("https://x.hu/ → true", () => {
    expect(gyokerCim("https://x.hu/")).toBe(true);
  });

  it("https://x.hu → true (üres útvonal)", () => {
    expect(gyokerCim("https://x.hu")).toBe(true);
  });

  it("https://x.hu/gazdasag → false", () => {
    expect(gyokerCim("https://x.hu/gazdasag")).toBe(false);
  });

  it("https://x.hu/?q=1 → false (query van)", () => {
    expect(gyokerCim("https://x.hu/?q=1")).toBe(false);
  });

  it("érvénytelen URL → false", () => {
    expect(gyokerCim("nem url")).toBe(false);
  });
});

describe("forrasEllenorzesEredmeny — nincs hírfolyam (V3b)", () => {
  it("gyökér + weboldal → hibas / nincs_hirfolyam", () => {
    const e = forrasEllenorzesEredmeny(
      forras("https://x.hu/"),
      { elerheto: true, tipus: "weboldal", szovegOlvashato: true, hibaOk: null },
      MOST,
    );
    expect(e.allapot).toBe("hibas");
    expect(e.hiba_ok).toBe("nincs_hirfolyam");
    expect(e.ellenorzott).toBe(true);
    expect(e.tipus).toBe("weboldal");
  });

  it("rovat-cím + weboldal → nem hibás", () => {
    const e = forrasEllenorzesEredmeny(
      forras("https://x.hu/gazdasag"),
      { elerheto: true, tipus: "weboldal", szovegOlvashato: true, hibaOk: null },
      MOST,
    );
    expect(e.allapot).toBe("hasznalhato");
    expect(e.hiba_ok).toBeNull();
  });

  it("gyökér + rss → hasznalhato", () => {
    const e = forrasEllenorzesEredmeny(
      forras("https://x.hu/"),
      { elerheto: true, tipus: "rss", szovegOlvashato: true, hibaOk: null },
      MOST,
    );
    expect(e.allapot).toBe("hasznalhato");
    expect(e.hiba_ok).toBeNull();
  });
});
