// R-16 K1 (TERV 2-K1 Self-test): a logó-elemzés szintetikus képeken. A képek a böngésző kicsinyített canvasát utánozzák (≤ 64 × 64).
import { describe, expect, it } from "vitest";
import { elemzesFejlecbe, elemzesFejlecbol, javasoltHely, logoElemzes, LogoElemzes, sotetitve } from "../src/index.js";
import { ATLATSZO, benne, kep } from "./segedek";

const SOTET_ZOLD: [number, number, number, number] = [47, 93, 80, 255]; // a rajz Kövesi-zöldje
const ARANY: [number, number, number, number] = [201, 168, 106, 255];
const FEKETE: [number, number, number, number] = [26, 28, 36, 255];
const FEHER: [number, number, number, number] = [255, 255, 255, 255];

describe("logoElemzes", () => {
  it("átlátszó hátterű, sötét, egyszínű logó → egyszinu, atlatszo", () => {
    const k = kep(64, 16, (x, y) => (benne(x, y, 4, 3, 60, 13) ? FEKETE : ATLATSZO));
    const e = logoElemzes(k, 1200, 300);
    expect(e.atlatszo).toBe(true);
    expect(e.szinszam).toBe(1);
    expect(e.vilagossag).toBeLessThan(0.05);
    expect(e.arany).toBe(4);
    expect(e.szinek).toEqual([]); // a fekete nem márkaszín
    expect(javasoltHely(e)).toBe("egyszinu");
  });

  it("fehér logó átlátszó háttéren → sotet (a sötét képekre való)", () => {
    const k = kep(64, 20, (x, y) => (benne(x, y, 2, 4, 62, 16) ? FEHER : ATLATSZO));
    const e = logoElemzes(k, 800, 250);
    expect(e.atlatszo).toBe(true);
    expect(e.vilagossag).toBeGreaterThan(0.9);
    expect(javasoltHely(e)).toBe("sotet");
  });

  it("négyzetes, színes (3 szín) → negyzetes", () => {
    const k = kep(48, 48, (x, y) => (benne(x, y, 0, 0, 24, 48) ? SOTET_ZOLD : benne(x, y, 24, 0, 48, 24) ? ARANY : [200, 60, 40, 255]));
    const e = logoElemzes(k, 1000, 1000);
    expect(e.atlatszo).toBe(false);
    expect(e.szinszam).toBe(3);
    expect(e.szinek.length).toBe(3);
    expect(javasoltHely(e)).toBe("negyzetes");
  });

  it("JPEG-szerű, fehér hátterű, átlátszatlan kép → atlatszo: false; a háttér nem tintaszín; sötét tinta → vilagos", () => {
    // JPEG-zaj: a fehér háttér ±4 körül ingadozik
    const k = kep(64, 24, (x, y) => (benne(x, y, 6, 6, 58, 18) ? SOTET_ZOLD : [251 + ((x * 7 + y * 3) % 5), 252 + ((x + y) % 4), 250 + ((x * 3) % 6), 255]));
    const e = logoElemzes(k, 640, 240);
    expect(e.atlatszo).toBe(false);
    expect(e.szinszam).toBe(1);
    expect(e.vilagossag).toBeLessThan(0.2);
    expect(javasoltHely(e)).toBe("vilagos"); // átlátszatlant nem lehet átszínezni → nem egyszinu
  });

  it("élsimított kétszínű él: a keverék-árnyalatok nem színek (szinszam ≤ 2)", () => {
    // fekete betű fehér háttéren, 3 képpont széles átmenettel mindkét oldalon (élsimítás)
    const k = kep(64, 32, (x) => {
      const v = x < 20 ? 255 : x < 23 ? 255 - (x - 19) * 60 : x < 41 ? 20 : x < 44 ? 20 + (x - 40) * 60 : 255;
      return [v, v, v, 255];
    });
    const e = logoElemzes(k, 64, 32);
    expect(e.szinszam).toBeLessThanOrEqual(2);
    // és átlátszó háttéren, félig átlátszó élekkel
    const k2 = kep(64, 16, (x, y) => (benne(x, y, 8, 4, 56, 12) ? SOTET_ZOLD : benne(x, y, 7, 3, 57, 13) ? [47, 93, 80, 120] : ATLATSZO));
    const e2 = logoElemzes(k2, 64, 16);
    expect(e2.szinszam).toBe(1);
    expect(e2.atlatszo).toBe(true);
  });

  it("kétszínű (zöld + arany) széles, átlátszó logó → vilagos (nem egyszínű — a rajz Kövesi-logója)", () => {
    const k = kep(64, 14, (x, y) => (benne(x, y, 0, 1, 12, 13) ? (x < 6 ? SOTET_ZOLD : ARANY) : benne(x, y, 14, 4, 64, 10) ? SOTET_ZOLD : ATLATSZO));
    const e = logoElemzes(k, 1960, 400);
    expect(e.szinszam).toBe(2);
    expect(e.szinek).toEqual(expect.arrayContaining(["#2f5d50", "#c9a86a"]));
    expect(javasoltHely(e)).toBe("vilagos");
  });

  it("üres (teljesen átlátszó) kép → szinszam 0, nem dől el", () => {
    const e = logoElemzes(kep(8, 8, () => ATLATSZO), 8, 8);
    expect(e).toEqual({ atlatszo: true, vilagossag: 0, szinszam: 0, arany: 1, szinek: [] });
  });

  it("elemzés nélkül (PDF) → vilagos", () => {
    expect(javasoltHely(null)).toBe("vilagos");
  });
});

describe("az x-logo-elemzes fejléc (base64url JSON, ≤ 2 KB)", () => {
  const e: LogoElemzes = { atlatszo: true, vilagossag: 0.123, szinszam: 2, arany: 4.9, szinek: ["#2f5d50", "#c9a86a"] };
  it("oda-vissza ugyanaz", () => {
    const f = elemzesFejlecbe(e);
    expect(f).not.toMatch(/[+/=]/);
    expect(elemzesFejlecbol(f)).toEqual(e);
  });
  it("rossz kódolás, rossz séma, túl nagy → null (nem hiba)", () => {
    expect(elemzesFejlecbol("!!!nem-base64")).toBeNull();
    expect(elemzesFejlecbol(btoa(JSON.stringify({ ...e, vilagossag: 3 })))).toBeNull();
    expect(elemzesFejlecbol(btoa(JSON.stringify({ ...e, szinek: ["piros"] })))).toBeNull();
    expect(elemzesFejlecbol(btoa("x".repeat(3000)))).toBeNull();
    expect(elemzesFejlecbol(null)).toBeNull();
    expect(elemzesFejlecbol("")).toBeNull();
  });
});

describe("sotetitve — a 12f sötét próbahátter", () => {
  it("a már sötét fő színt nem bántja; a világosat árnyalattartóan sötétíti", () => {
    expect(sotetitve("#2f5d50")).toBe("#2f5d50");
    const s = sotetitve("#e3a857");
    expect(s).not.toBeNull();
    expect(s).not.toBe("#e3a857");
    expect(sotetitve("nem-szin")).toBeNull();
  });
});
