// R-16 K6 (TERV §2-K6, §2-K8): minden feliratkulcs, amit a 12g kódja (és a 12a / 12f „Nincs logóm” linkje) használ, megvan egy migrációban
// mindhárom nyelven — az r16.arculat.* kulcsok a 0135 / 0136 / 0138 / 0139 (utókérés 2: és a 0142) valamelyikében, a feliratfájl (design/R16-arculat/feliratok.json)
// szövegével betűre; a többi (fiok.*, kozos.*) egy korábbi migrációban. A 0139 pontosan a TERV 5 kulcsa × 3 nyelv. Fájlolvasás, adatbázis nélkül.
import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

const gy = (ut: string) => new URL(`../../../${ut}`, import.meta.url).pathname;
const KOD = [
  "apps/web/app/fiok/arculat/nevlogo/Nevlogo.tsx",
  "apps/web/app/fiok/arculat/nevlogo/page.tsx",
  "apps/web/app/fiok/arculat/ArculatSzakasz.tsx",
  "apps/web/app/fiok/arculat/logok/LogokFeltoltes.tsx",
].map((f) => readFileSync(gy(f), "utf8")).join("\n");
const MIG = gy("apps/web/adatbazis/migraciok/");
const osszes = readdirSync(MIG).filter((f) => f.endsWith(".sql")).map((f) => readFileSync(MIG + f, "utf8")).join("\n");
const k6 = readFileSync(MIG + "0139_r16_nevlogo_feliratok.sql", "utf8");
// Utókérés 2 (2026-10-01, Csilla: jóváhagyva): a 12a telefonos nyitó és a 12f0 r16.arculat.* kulcsai a közös 0142-ben jönnek, a szövegük
// a design/R15/feliratok-3.json-ban (egy feliratfájl és egy migráció az egész körre) — ezért mindkettő a keresett források között van.
// 2026-10-06 (R-17 kör, Kati #4 #7 #8 #9 #12 #16): a 0147 hét r16.arculat.* kulcs szövegét cserélte, és a feliratfájl
// (design/R16-arculat/feliratok.json) is az új szöveget mondja — ezért a 0147 is a keresett migrációk közé került (a régi sorok maradnak).
const r16 = ["0135_r16_logo_helyek.sql", "0136_r16_arculat_szakasz_feliratok.sql", "0137_r16_szinek_feliratok.sql", "0138_r16_betuk_feliratok.sql", "0139_r16_nevlogo_feliratok.sql", "0142_r15_utokeres2_feliratok.sql", "0147_visszajelzes_1006_feliratok.sql"]
  .map((f) => readFileSync(MIG + f, "utf8")).join("\n");
const fajl16 = JSON.parse(readFileSync(gy("design/R16-arculat/feliratok.json"), "utf8")) as Record<"hu" | "ro" | "en", Record<string, string>>;
const fajl3 = JSON.parse(readFileSync(gy("design/R15/feliratok-3.json"), "utf8")) as Record<"hu" | "ro" | "en", Record<string, string>>;
const fajl = { hu: { ...fajl16.hu, ...fajl3.hu }, ro: { ...fajl16.ro, ...fajl3.ro }, en: { ...fajl16.en, ...fajl3.en } };
const sql = (s: string) => s.replace(/'/g, "''");
const hasznalt = [...new Set([...KOD.matchAll(/["'`]((?:r16\.arculat|fiok|kozos|arculat_fajl|r15\.kozos|onboarding3)\.[a-z0-9_.]+)["'`]/g)].map((m) => m[1]!))].sort();

describe("a 12g feliratai (R-16 K6)", () => {
  it("a kód a rajz kulcsait használja (a keresés működik)", () => {
    // Kirakás-zár javítás (10-01, Csilla: jóváhagyva): a 12g címe/alcíme a jóváhagyott 12a szöveg lett (r16.arculat.nevlogo.kerdes/.alcim,
    // 0142) a keszit.kerdes/.alcim helyett — a bíráló 3/3 futáson pirosnak látta a „Készítsünk egyet?”-et. A 0139 sorai (4. próba) változatlanok.
    // 2026-10-06 (Kati #6, triage + Csilla „mindent ebben a körben”): a „A négy helyre mi tesszük.” (keszit.negy_hely) lekerült a lapról —
    // ezért NINCS többé a listában, és külön kimondjuk, hogy nem is használja. A 0139 sora (4. próba) változatlan: a kulcs az adatbázisban marad.
    for (const k of ["r16.arculat.nincs_logom", "r16.arculat.nevlogo.kerdes", "r16.arculat.nevlogo.alcim", "r16.arculat.keszit.inkabb_feltoltom", "r16.arculat.ez_legyen"]) expect(hasznalt).toContain(k);
    expect(hasznalt).not.toContain("r16.arculat.keszit.negy_hely");
  });
  it("minden r16.arculat.* kulcs a 0135–0139-ben, hu/ro/en, a feliratfájl szövegével", () => {
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
  it("a 0139 pontosan a TERV §2-K8 5 kulcsa × 3 nyelv (15 sor)", () => {
    const sorok = [...k6.matchAll(/\('(r16\.arculat\.[a-z0-9_.]+)', '(hu|ro|en)', /g)];
    expect(sorok.length).toBe(15);
    expect([...new Set(sorok.map((m) => m[1]))].sort()).toEqual(["nincs_logom", "keszit.kerdes", "keszit.alcim", "keszit.negy_hely", "keszit.inkabb_feltoltom"].map((k) => `r16.arculat.${k}`).sort());
  });
});
