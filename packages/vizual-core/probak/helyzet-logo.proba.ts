// R-16 K2 (gepezet 4, TERV §2-K2): melyik logó, hogyan kerül a kép hátterére. Tiszta `helyzetHtml` / `logoValaszt`, böngésző nélkül.
import { describe, it, expect } from "vitest";
import { HelyzetArculat, HelyzetTartalom, MINTA, helyzetHtml, logoValaszt, type Helyzet, type Valtozat } from "../src/index.ts";

const VIL = "data:image/png;base64,VILAGOS";
const SOT = "data:image/png;base64,SOTET";
const EGY = "data:image/png;base64,EGYSZINU";
const NEG = "data:image/png;base64,NEGYZETES";
// Kövesi-szett (TERV §2-K4 „termeszetes”): zöld · homok · krém
const alap = { nev: "Kövesi Térkő Kft.", fo: "#2f5d50", masodik: "#c9a86a", hatter: "#f1ede4", betu: "archivo" };
const kep = (h: Helyzet, arc: object, valtozat: Valtozat = "vilagos") =>
  helyzetHtml(h, "poszt", HelyzetTartalom.parse(MINTA["hu"]![h]), HelyzetArculat.parse({ ...alap, ...arc }), { betuCim: (f) => f, nyelv: "hu", fok: 0, valtozat });
/** a kép logó-helye: melyik hely, milyen szűrés, milyen lemez (data-attribútumokból) */
const logoJel = (html: string) => {
  const m = html.match(/<div data-mezo="logo" data-logo="([a-z]+)"(?: data-logo-szures="([a-z]*)")?(?: data-logo-lemez="(#[0-9a-f]{6})")?/);
  return m ? { hely: m[1], szures: m[2] ?? "", lemez: m[3] ?? null } : null;
};

describe("logó a háttérhez (helyzetHtml)", () => {
  it("világos háttér → a vilagos logó, szűrés és lemez nélkül", () => {
    const h = kep("kesz", { logok: { vilagos: { adat: VIL, atlatszo: true }, sotet: { adat: SOT, atlatszo: true } } });
    expect(logoJel(h)).toEqual({ hely: "vilagos", szures: "", lemez: null });
    expect(h).toContain(VIL);
    expect(h).not.toContain(SOT);
    expect(h).not.toContain("brightness(0)");
  });
  it("színes háttér, csak átlátszó vilagos → fehérre színezve (brightness(0) invert(1))", () => {
    const h = kep("kesz", { logok: { vilagos: { adat: VIL, atlatszo: true } } }, "szines");
    expect(logoJel(h)).toEqual({ hely: "vilagos", szures: "feher", lemez: null });
    expect(h).toContain("filter:brightness(0) invert(1);");
  });
  it("színes háttér, csak nem átlátszó vilagos → világos lemezen (a munkatér háttérszíne)", () => {
    const h = kep("kesz", { logok: { vilagos: { adat: VIL, atlatszo: false } } }, "szines");
    expect(logoJel(h)).toEqual({ hely: "vilagos", szures: "", lemez: "#f1ede4" });
    expect(h).not.toContain("brightness(0)");
  });
  it("színes háttér, van sotet → a sotet, ahogy van", () => {
    const h = kep("kesz", { logok: { vilagos: { adat: VIL, atlatszo: true }, sotet: { adat: SOT, atlatszo: true } } }, "szines");
    expect(logoJel(h)).toEqual({ hely: "sotet", szures: "", lemez: null });
    expect(h).toContain(SOT);
    expect(h).not.toContain(VIL);
  });
  it("az ÚJ kép alsó sávja mindig sötét — Világos változatban is a sotet logó", () => {
    const h = kep("uj", { logok: { vilagos: { adat: VIL, atlatszo: true }, sotet: { adat: SOT, atlatszo: true } } }, "vilagos");
    expect(logoJel(h)?.hely).toBe("sotet");
  });
  it("a HÍR a panelre teszi a logót: Világos változatban a panel a fő szín (sötét) → sotet", () => {
    const h = kep("hir", { logok: { vilagos: { adat: VIL, atlatszo: true }, sotet: { adat: SOT, atlatszo: true } } }, "vilagos");
    expect(logoJel(h)?.hely).toBe("sotet");
  });
  it("nincs logó → a cég neve betűvel", () => {
    const h = kep("kesz", {});
    expect(logoJel(h)).toEqual({ hely: "nev", szures: "", lemez: null });
    expect(h).toContain("Kövesi Térkő Kft.");
  });
  it("csak a régi `logo` mező → a vilagos helyen (régi befogadó), átlátszóság nélkül", () => {
    const vil = kep("kesz", { logo: VIL });
    expect(logoJel(vil)).toEqual({ hely: "vilagos", szures: "", lemez: null });
    const szines = kep("kesz", { logo: VIL }, "szines");
    expect(logoJel(szines)).toEqual({ hely: "vilagos", szures: "", lemez: "#f1ede4" });
  });
  it("a `logok` térkép erősebb a régi `logo`-nál", () => {
    const h = kep("kesz", { logo: VIL, logok: { sotet: { adat: SOT, atlatszo: true } } }, "szines");
    expect(logoJel(h)?.hely).toBe("sotet");
  });
  it("a negyzetes a hét képen nem kerül fel", () => {
    for (const v of ["vilagos", "szines"] as const) expect(logoJel(kep("kesz", { logok: { negyzetes: { adat: NEG, atlatszo: true } } }, v))?.hely).toBe("nev");
  });
  it("világos háttér, csak sotet → sötét lemezen", () => {
    const h = kep("kesz", { logok: { sotet: { adat: SOT, atlatszo: true } } });
    const j = logoJel(h);
    expect(j?.hely).toBe("sotet");
    expect(j?.lemez).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe("logoValaszt — a sorrend", () => {
  const V = ["#f1ede4"], S = ["#2f5d50"];
  const L = { vilagos: "#f1ede4", sotet: "#1a332c" };
  const lg = (adat: string, atlatszo: boolean, vilagossag?: number) => ({ adat, atlatszo, ...(vilagossag === undefined ? {} : { vilagossag }) });
  it("világos: vilagos → egyszinu → sotet lemezen → név", () => {
    expect(logoValaszt({ vilagos: lg(VIL, false), egyszinu: lg(EGY, true), sotet: lg(SOT, true) }, V, L)?.hely).toBe("vilagos");
    expect(logoValaszt({ egyszinu: lg(EGY, true, 0.1), sotet: lg(SOT, true) }, V, L)).toMatchObject({ hely: "egyszinu", szures: "" });
    expect(logoValaszt({ egyszinu: lg(EGY, true, 0.9) }, V, L)).toMatchObject({ hely: "egyszinu", szures: "fekete" });
    expect(logoValaszt({ egyszinu: lg(EGY, false, 0.9) }, V, L)).toMatchObject({ hely: "egyszinu", szures: "" }); // nem átlátszó: nem színezzük
    expect(logoValaszt({ sotet: lg(SOT, true) }, V, L)).toMatchObject({ hely: "sotet", lemez: "#1a332c" });
    expect(logoValaszt({ negyzetes: lg(NEG, true) }, V, L)).toBeNull();
  });
  it("sötét: sotet → egyszinu fehérre (átlátszó) → vilagos fehérre (átlátszó) → vilagos lemezen → egyszinu lemezen → név", () => {
    expect(logoValaszt({ vilagos: lg(VIL, true), egyszinu: lg(EGY, true), sotet: lg(SOT, false) }, S, L)?.hely).toBe("sotet");
    expect(logoValaszt({ vilagos: lg(VIL, true), egyszinu: lg(EGY, true) }, S, L)).toMatchObject({ hely: "egyszinu", szures: "feher" });
    expect(logoValaszt({ vilagos: lg(VIL, true), egyszinu: lg(EGY, false) }, S, L)).toMatchObject({ hely: "vilagos", szures: "feher" });
    expect(logoValaszt({ vilagos: lg(VIL, false), egyszinu: lg(EGY, false) }, S, L)).toMatchObject({ hely: "vilagos", szures: "", lemez: "#f1ede4" });
    expect(logoValaszt({ egyszinu: lg(EGY, false) }, S, L)).toMatchObject({ hely: "egyszinu", szures: "", lemez: "#f1ede4" });
    expect(logoValaszt({}, S, L)).toBeNull();
  });
  it("átmenetes háttér: csak akkor világos, ha MINDKÉT végpontja az", () => {
    expect(logoValaszt({ vilagos: lg(VIL, true), sotet: lg(SOT, true) }, ["#f1ede4", "#2f5d50"], L)?.hely).toBe("sotet");
    expect(logoValaszt({ vilagos: lg(VIL, true), sotet: lg(SOT, true) }, ["#f1ede4", "#ffffff"], L)?.hely).toBe("vilagos");
  });
});
