import { describe, it, expect } from "vitest";
import { poziciotBefog } from "../src/index";

// V5b: a buborék pozíciójának befogása — jobb szélen balra, alsó szélen fel, középen változatlan.

describe("poziciotBefog", () => {
  const ablak = { w: 1000, h: 800 };
  const meret = { w: 380, h: 240 };

  it("jobb szélen: x <= ablak.w - w - 12 (balra kerül)", () => {
    const poz = { x: 950, y: 100 };
    const p = poziciotBefog(poz, meret, ablak);
    expect(p.x).toBeLessThanOrEqual(ablak.w - meret.w - 12);
    expect(p.x).toBeGreaterThanOrEqual(12);
  });

  it("alsó szélen: y <= ablak.h - h - 12", () => {
    const poz = { x: 100, y: 780 };
    const p = poziciotBefog(poz, meret, ablak);
    expect(p.y).toBeLessThanOrEqual(ablak.h - meret.h - 12);
    expect(p.y).toBeGreaterThanOrEqual(12);
  });

  it("középen: változatlan", () => {
    const poz = { x: 300, y: 200 };
    const p = poziciotBefog(poz, meret, ablak);
    expect(p).toEqual(poz);
  });
});
