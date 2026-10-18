// Kati #9 (10-02): a „Milyen betűtípus illik hozzátok?” lapon (12e) egy betűcsalád több fájlja egyszerre kijelölhető és feltölthető;
// a lehetőséget a meglévő súgó mondja ki („TTF, OTF vagy WOFF2 fájl — egyszerre több is”), új látható mondat nélkül (T5).
// Tiszta próba: a sorrendi feltöltés segédje (tobbFajl.ts) hamis feltöltővel, a fájlválasztó `multiple`-je, és a 0147 súgószövege.
// A valódi böngészős végigjátszást (két Caladea-fájl egyszerre → két „Saját:” sor) a MEASURED.md képernyőképei mérik.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { egymasUtan } from "../app/fiok/arculat/betuk/tobbFajl";

const LAP = readFileSync(new URL("../app/fiok/arculat/betuk/Betuk.tsx", import.meta.url), "utf8");
const MIG = readFileSync(new URL("../adatbazis/migraciok/0147_visszajelzes_1006_feliratok.sql", import.meta.url), "utf8");

describe("több betűfájl egyszerre (Kati #9)", () => {
  it("a fájlok a kijelölés sorrendjében, EGYMÁS UTÁN mennek fel (soha nem kettő egyszerre)", async () => {
    const naplo: string[] = [];
    let fut = 0;
    let legtobb = 0;
    const { elso, hiba, db } = await egymasUtan(["Caladea-Regular.ttf", "Caladea-Italic.ttf", "Caladea Félkövér, dőlt.otf"], async (f) => {
      fut++; legtobb = Math.max(legtobb, fut);
      naplo.push(`be:${f}`);
      await new Promise((r) => setTimeout(r, 5));
      naplo.push(`ki:${f}`);
      fut--;
      return { sor: { kulcs: `sajat:${f}` } };
    });
    expect(legtobb).toBe(1);
    expect(naplo).toEqual(["be:Caladea-Regular.ttf", "ki:Caladea-Regular.ttf", "be:Caladea-Italic.ttf", "ki:Caladea-Italic.ttf", "be:Caladea Félkövér, dőlt.otf", "ki:Caladea Félkövér, dőlt.otf"]);
    expect(elso).toEqual({ kulcs: "sajat:Caladea-Regular.ttf" }); // az első sikeres lesz kiválasztva
    expect(hiba).toBeNull();
    expect(db).toBe(3);
  });

  it("egy hibás fájl nem állítja meg a többit; az első SIKERES a kiválasztott, a lap az utolsó hibát mutatja", async () => {
    const eredmeny = await egymasUtan(["logo.png", "Caladea-Regular.ttf", "tul-nagy.otf", "Caladea-Italic.ttf"], async (f) =>
      f === "logo.png" ? { hiba: "TIPUS_NEM_ENGEDETT" } : f === "tul-nagy.otf" ? { hiba: "TUL_NAGY" } : { sor: f });
    expect(eredmeny).toEqual({ elso: "Caladea-Regular.ttf", hiba: "TUL_NAGY", db: 2 });
  });

  it("üres választás: nincs feltöltés, nincs kiválasztás", async () => {
    let hivas = 0;
    expect(await egymasUtan([], async () => { hivas++; return { sor: 1 }; })).toEqual({ elso: null, hiba: null, db: 0 });
    expect(hivas).toBe(0);
  });

  it("a fájlválasztó több fájlt enged, és a lap a sorrendi segédet használja", () => {
    expect(LAP).toMatch(/<input ref=\{fajlRef\} type="file" accept=\{ELFOGAD\} multiple hidden/);
    expect(LAP).toContain("Array.from(e.target.files ?? [])");
    expect(LAP).toContain("egymasUtan(fajlok, egyetFeltolt)");
  });

  it("a súgó (meglévő kulcs) mondja ki, hu/ro/en — új látható mondat nincs", () => {
    expect(MIG).toContain("('r16.arculat.betu.sajat_tipus', 'hu', 'TTF, OTF vagy WOFF2 fájl — egyszerre több is')");
    expect(MIG).toContain("('r16.arculat.betu.sajat_tipus', 'ro', 'Fișier TTF, OTF sau WOFF2 — chiar mai multe deodată')");
    expect(MIG).toContain("('r16.arculat.betu.sajat_tipus', 'en', 'A TTF, OTF or WOFF2 file — several at once')");
    // a kulcs a fájlválasztó linkjének súgója (title), nem külön sor
    expect(LAP).toMatch(/title=\{t\("r16\.arculat\.betu\.sajat_tipus"\)\}/);
  });
});
