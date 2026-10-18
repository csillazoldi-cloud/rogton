// R-16 K2 (gepezet 9): a POST helyzet-minta törzse és az arculat felülírása — adatbázis és képgyártó nélkül.
import { describe, it, expect } from "vitest";
import { MintaKeres, mintaArculat } from "../vizual/minta";
import type { KepArculat } from "../vizual/helyzet";

const SAJAT = "data:image/png;base64,SAJAT";
const alap: KepArculat = {
  nev: "Kövesi Térkő Kft.",
  fo: "#1f3a5f",
  hatter: "#f3f6fa",
  masodik: "#7fb2e5",
  betu: "archivo",
  logok: { vilagos: { adat: SAJAT, atlatszo: false } },
  logo: SAJAT,
};

describe("MintaKeres", () => {
  it("elfogadja a terv törzsét (a betűket és a névlogót K5/K6-ig csak elfogadja)", () => {
    const k = MintaKeres.parse({ valtozat: "szines", szinek: { fo: "#2f5d50", masodik: "#c9a86a", hatter: "#f1ede4" }, betuk: { cim: "gelasio", szoveg: "public-sans" }, nevlogo: { stilus: "kor" } });
    expect(k.valtozat).toBe("szines");
  });
  it("üres törzs is jó (a munkatér mentett színei)", () => {
    expect(MintaKeres.safeParse({}).success).toBe(true);
  });
  it("hibás szín, hiányzó szín, ismeretlen változat → nem jó", () => {
    expect(MintaKeres.safeParse({ szinek: { fo: "zöld", masodik: "#c9a86a", hatter: "#f1ede4" } }).success).toBe(false);
    expect(MintaKeres.safeParse({ szinek: { fo: "#2f5d50", hatter: "#f1ede4" } }).success).toBe(false);
    expect(MintaKeres.safeParse({ valtozat: "sotet" }).success).toBe(false);
    expect(MintaKeres.safeParse({ nevlogo: { stilus: "kep" } }).success).toBe(false);
  });
});

describe("mintaArculat", () => {
  it("a három szín felülírja a munkatérét, a többi marad", () => {
    const k = MintaKeres.parse({ szinek: { fo: "#2F5D50", masodik: "#c9a86a", hatter: "#f1ede4" } });
    const a = mintaArculat(alap, k);
    expect(a).toMatchObject({ fo: "#2f5d50", masodik: "#c9a86a", hatter: "#f1ede4", betu: "archivo", nev: "Kövesi Térkő Kft." });
    expect(alap.fo).toBe("#1f3a5f"); // az alap nem változik
  });
  it("a logó MINDIG a munkatér saját fájlja — a törzsbe csempészett logó vagy fájl-azonosító nem jut át", () => {
    const k = MintaKeres.parse({
      szinek: { fo: "#2f5d50", masodik: "#c9a86a", hatter: "#f1ede4" },
      logo: "data:image/png;base64,IDEGEN",
      logok: { vilagos: { adat: "data:image/png;base64,IDEGEN", atlatszo: true } },
      logo_fajl_id: "00000000-0000-4000-8000-000000000000",
    });
    expect(Object.keys(k).sort()).toEqual(["szinek"]);
    const a = mintaArculat(alap, k);
    expect(a.logo).toBe(SAJAT);
    expect(a.logok).toEqual({ vilagos: { adat: SAJAT, atlatszo: false } });
    expect(JSON.stringify(a)).not.toContain("IDEGEN");
  });
  it("szín nélkül a munkatér arculata változatlan", () => {
    expect(mintaArculat(alap, MintaKeres.parse({ valtozat: "szines" }))).toEqual(alap);
  });
});

// R-16 K5 (TERV §2-K5 „POST helyzet-minta gains betuk”): a két betű a kérésből hat a képre; a saját betű bájtja csak a végpont által
// a munkatér saját fájljaiból betöltött listából jöhet (a fenti „csak elfogadja” próba a K2 állapotát írja le — a törzs továbbra is
// ugyanígy olvasódik, csak most hat is).
describe("mintaArculat — betűk (R-16 K5)", () => {
  const ID = "0b9e6f2c-1d2a-4c3b-9e8f-7a6b5c4d3e2f";
  const SAJAT_BETU = { kulcs: `sajat:${ID}`, adat: "data:font/ttf;base64,AAEAAA==", formatum: "truetype" as const };
  it("cím és szöveg külön; a régi `betu` a cím", () => {
    const a = mintaArculat(alap, MintaKeres.parse({ betuk: { cim: "space-grotesk", szoveg: "public-sans" } }));
    expect(a).toMatchObject({ betu_cim: "space-grotesk", betu_szoveg: "public-sans", betu: "space-grotesk", sajat_betuk: [] });
  });
  it("saját betű: csak ha a végpont a munkatér fájljából betöltötte; a törzsben küldött bájt nem létezik (a zod eldobja)", () => {
    const k = MintaKeres.parse({ betuk: { cim: SAJAT_BETU.kulcs, szoveg: "archivo" }, sajat_betuk: [{ ...SAJAT_BETU, adat: "data:font/ttf;base64,IDEGEN" }] });
    expect(Object.keys(k).sort()).toEqual(["betuk"]);
    expect(mintaArculat(alap, k).sajat_betuk).toEqual([]);
    expect(mintaArculat(alap, k, [SAJAT_BETU]).sajat_betuk).toEqual([SAJAT_BETU]);
    expect(JSON.stringify(mintaArculat(alap, k, [SAJAT_BETU]))).not.toContain("IDEGEN");
  });
  it("a nem kért saját betű nem kerül a képre", () => {
    const k = MintaKeres.parse({ betuk: { cim: "gelasio", szoveg: "archivo" } });
    expect(mintaArculat({ ...alap, sajat_betuk: [SAJAT_BETU] }, k, [SAJAT_BETU]).sajat_betuk).toEqual([]);
  });
});
