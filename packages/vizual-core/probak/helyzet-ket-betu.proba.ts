// R-16 K5 (TERV §2-K5 Self-test, 1.3, 1.5, gepezet 7–8): KÉT betű a képen — a cím-szerű mezők (cím, szám, a név a logó helyett) a
// cím-betűvel, minden más a szöveg-betűvel; a saját betű adat-URL-ként `@font-face`-be kerül, a Public Sans mögötte tartalék.
// A régi (egy `betu`) arculat képe betűre ugyanaz marad: a két új mező hiányában mindkettő a `betu`.
import { describe, expect, it } from "vitest";
import { HELYZETEK, HelyzetArculat, HelyzetTartalom, MINTA, helyzetHtml, type Helyzet } from "../src/index.ts";

const alap = { nev: "Kövesi Térkő Kft.", fo: "#2f5d50", masodik: "#c9a86a", hatter: "#f1ede4" };
const kep = (h: Helyzet, arc: Record<string, unknown>, fajlok?: string[]) =>
  helyzetHtml(h, "poszt", HelyzetTartalom.parse(MINTA["hu"]![h]), HelyzetArculat.parse({ ...alap, ...arc }), { betuCim: (f) => (fajlok?.push(f), f), nyelv: "hu", fok: 0, valtozat: "vilagos" });
/** a `data-mezo="<mezo>"` elem stílusa */
const stilus = (html: string, mezo: string) => html.match(new RegExp(`data-mezo="${mezo}"[^>]*style="([^"]*)"`))?.[1] ?? "";
const ID = "0b9e6f2c-1d2a-4c3b-9e8f-7a6b5c4d3e2f";
const SAJAT = { kulcs: `sajat:${ID}`, adat: "data:font/ttf;base64,AAEAAAALAIAAAwAwT1MvMg==", formatum: "truetype" };

describe("két betű a képen (R-16 K5)", () => {
  it("Cím: Space Grotesk, Szöveg: Public Sans — a cím és a szám a cím-betű, a lap és a sor a szöveg-betű", () => {
    const fajlok: string[] = [];
    const h = kep("akcio", { betu_cim: "space-grotesk", betu_szoveg: "public-sans" }, fajlok);
    expect(stilus(h, "cim")).toContain("font-family:'Space Grotesk',sans-serif;");
    expect(stilus(h, "szam")).toContain("font-family:'Space Grotesk',sans-serif;");
    expect(stilus(h, "sor")).not.toContain("font-family");
    expect(h).toMatch(/#kep\{[^}]*font-family:'Public Sans',sans-serif;/);
    // mindkét család fájljai a képben
    expect(fajlok.some((f) => f.startsWith("space-grotesk-"))).toBe(true);
    expect(fajlok.some((f) => f.startsWith("public-sans-"))).toBe(true);
  });
  it("a név (logó helyett) is a cím-betűvel", () => {
    const h = kep("kesz", { betu_cim: "gelasio", betu_szoveg: "archivo" });
    expect(stilus(h, "logo")).toContain("font-family:'Gelasio',sans-serif;");
    expect(h).toMatch(/#kep\{[^}]*font-family:'Archivo',sans-serif;/);
  });
  it("régi arculat (csak `betu`): mindkét szerep ugyanaz, a család egyszer töltődik be", () => {
    for (const h of HELYZETEK) {
      const fajlok: string[] = [];
      const html = kep(h, { betu: "'Archivo',sans-serif" }, fajlok);
      expect(html).toMatch(/#kep\{[^}]*font-family:'Archivo',sans-serif;/);
      expect(new Set(fajlok).size).toBe(fajlok.length);
      expect(fajlok.some((f) => f.startsWith("public-sans-"))).toBe(false);
    }
  });
  it("saját betű a címre: @font-face az adat-URL-lel, a Public Sans tartalék mögötte és betöltve", () => {
    const fajlok: string[] = [];
    const h = kep("tudtad", { betu_cim: SAJAT.kulcs, betu_szoveg: "archivo", sajat_betuk: [SAJAT] }, fajlok);
    expect(h).toContain(`@font-face{font-family:'KM Sajat 1';font-weight:100 900;font-style:normal;src:url('${SAJAT.adat}') format('truetype');}`);
    expect(stilus(h, "cim")).toContain("font-family:'KM Sajat 1','Public Sans',sans-serif;");
    expect(fajlok.some((f) => f.startsWith("public-sans-"))).toBe(true);
    expect(fajlok.some((f) => f.startsWith("archivo-"))).toBe(true);
  });
  it("ugyanaz a saját betű címnek és szövegnek: egyetlen @font-face", () => {
    const h = kep("hir", { betu_cim: SAJAT.kulcs, betu_szoveg: SAJAT.kulcs, sajat_betuk: [SAJAT] });
    expect(h.split(SAJAT.adat).length - 1).toBe(1);
  });
  it("saját kulcs bájt nélkül (a fájl nem olvasható): a Public Sans áll helyette, @font-face nincs", () => {
    const h = kep("uj", { betu_cim: SAJAT.kulcs, betu_szoveg: SAJAT.kulcs });
    expect(h).not.toContain("KM Sajat");
    expect(stilus(h, "cim")).toContain("font-family:'Public Sans',sans-serif;");
  });
  it("a saját betű csak font adat-URL lehet (más séma elutasítva)", () => {
    expect(HelyzetArculat.safeParse({ ...alap, sajat_betuk: [{ ...SAJAT, adat: "https://pelda.ro/b.ttf" }] }).success).toBe(false);
    expect(HelyzetArculat.safeParse({ ...alap, sajat_betuk: [{ ...SAJAT, kulcs: "archivo" }] }).success).toBe(false);
  });
});
