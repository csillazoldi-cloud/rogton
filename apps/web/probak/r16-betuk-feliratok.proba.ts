// R-16 K5 (TERV §2-K5, §2-K8): minden feliratkulcs, amit a 12e kódja használ, megvan egy migrációban mindhárom nyelven — az
// r16.arculat.* kulcsok a 0135 / 0136 / 0138 valamelyikében, a feliratfájl (design/R16-arculat/feliratok.json) szövegével betűre;
// a többi (fiok.*, kozos.*, arculat_fajl.*) egy korábbi migrációban. A 0138 pontosan a TERV 9 kulcsa × 3 nyelv. Fájlolvasás, adatbázis nélkül.
import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

const gy = (ut: string) => new URL(`../../../${ut}`, import.meta.url).pathname;
const KOD = [
  "apps/web/app/fiok/arculat/betuk/Betuk.tsx",
  "apps/web/app/fiok/arculat/betuk/page.tsx",
  "apps/web/app/_kozos/ArculatAnyagok.tsx", // a hibaMitKulcs kulcsai
  "packages/arculat-core/src/betuk.ts",
].map((f) => readFileSync(gy(f), "utf8")).join("\n");
const MIG = gy("apps/web/adatbazis/migraciok/");
const osszes = readdirSync(MIG).filter((f) => f.endsWith(".sql")).map((f) => readFileSync(MIG + f, "utf8")).join("\n");
const k5 = readFileSync(MIG + "0138_r16_betuk_feliratok.sql", "utf8");
// 2026-10-06 (R-17 kör, Kati #4 #7 #8 #9 #12 #16): a 0147 hét r16.arculat.* kulcs szövegét cserélte, és a feliratfájl
// (design/R16-arculat/feliratok.json) is az új szöveget mondja — ezért a 0147 is a keresett migrációk közé került (a régi sorok maradnak).
const r16 = ["0135_r16_logo_helyek.sql", "0136_r16_arculat_szakasz_feliratok.sql", "0138_r16_betuk_feliratok.sql", "0147_visszajelzes_1006_feliratok.sql"].map((f) => readFileSync(MIG + f, "utf8")).join("\n");
const fajl = JSON.parse(readFileSync(gy("design/R16-arculat/feliratok.json"), "utf8")) as Record<"hu" | "ro" | "en", Record<string, string>>;
const sql = (s: string) => s.replace(/'/g, "''");
const hasznalt = [...new Set([...KOD.matchAll(/["'`]((?:r16\.arculat|fiok|kozos|arculat_fajl)\.[a-z0-9_.]+)["'`]/g)].map((m) => m[1]!))].sort();

describe("a 12e feliratai", () => {
  it("a kód a rajz kulcsait használja (a keresés működik)", () => {
    for (const k of ["r16.arculat.betu.kerdes", "r16.arculat.betu.ful_cim", "r16.arculat.betu.ful_szoveg", "r16.arculat.betu.sajat", "r16.arculat.betu.sajat_tipus", "r16.arculat.betu.sajat_nev", "r16.arculat.betu.hiba_tipus", "r16.arculat.betu.hianyzo_betuk", "r16.arculat.betu.licenc", "r16.arculat.ez_legyen", "r16.arculat.megse"]) expect(hasznalt).toContain(k);
  });
  it("minden r16.arculat.* kulcs a 0135 / 0136 / 0138-ban, hu/ro/en, a feliratfájl szövegével", () => {
    const hiany: string[] = [];
    for (const k of hasznalt.filter((x) => x.startsWith("r16.arculat."))) for (const ny of ["hu", "ro", "en"] as const) {
      const szoveg = fajl[ny][k];
      if (szoveg === undefined || !r16.includes(`('${k}', '${ny}', '${sql(szoveg)}')`)) hiany.push(`${k} (${ny})`);
    }
    expect(hiany).toEqual([]);
  });
  it("a többi kulcs egy korábbi migrációban megvan, mindhárom nyelven", () => {
    const hiany: string[] = [];
    for (const k of hasznalt.filter((x) => !x.startsWith("r16.arculat."))) for (const ny of ["hu", "ro", "en"]) if (!osszes.includes(`('${k}', '${ny}',`)) hiany.push(`${k} (${ny})`);
    expect(hiany).toEqual([]);
  });
  it("a 0138 pontosan a TERV §2-K8 9 kulcsa × 3 nyelv (27 sor)", () => {
    const sorok = [...k5.matchAll(/\('(r16\.arculat\.[a-z0-9_.]+)', '(hu|ro|en)', /g)];
    expect(sorok.length).toBe(27);
    expect([...new Set(sorok.map((m) => m[1]))].sort()).toEqual(["kerdes", "ful_cim", "ful_szoveg", "sajat", "sajat_tipus", "sajat_nev", "hiba_tipus", "hianyzo_betuk", "licenc"].map((k) => `r16.arculat.betu.${k}`).sort());
  });
});
