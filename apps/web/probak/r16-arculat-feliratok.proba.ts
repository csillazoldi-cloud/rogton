// R-16 K3 (TERV §2-K8): minden feliratkulcs, amit a szakasz kódja használ, megvan egy migrációban mindhárom nyelven —
// az r16.arculat.* kulcsok a K1 (0135) vagy a K3 (0136) migrációjában, a feliratfájl (design/R16-arculat/feliratok.json) szövegével
// betűre; a többi (r15.kozos.*, fiok.*, onboarding3.*, kozos.*) egy korábbi migrációban. Fájlolvasás, adatbázis nélkül.
import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

const gy = (ut: string) => new URL(`../../../${ut}`, import.meta.url).pathname;
const KOD = [
  "apps/web/app/fiok/arculat/ArculatSzakasz.tsx",
  "apps/web/app/fiok/arculat/_kozos/IgyNezKi.tsx",
  "apps/web/app/fiok/arculat/page.tsx",
  "packages/arculat-core/src/betuk.ts",
].map((f) => readFileSync(gy(f), "utf8")).join("\n");
const MIG = gy("apps/web/adatbazis/migraciok/");
const osszes = readdirSync(MIG).filter((f) => f.endsWith(".sql")).map((f) => readFileSync(MIG + f, "utf8")).join("\n");
const k3 = readFileSync(MIG + "0136_r16_arculat_szakasz_feliratok.sql", "utf8");
// R-16 K6 (TERV §2-K6, §2-K8): a 12a „Nincs logóm” linkje (r16.arculat.nincs_logom) a K6 migrációjában (0139) van — a TERV a kulcsot a
// K6-hoz osztotta, és a K3-ban a link még rejtve volt. Ezért a keresés a 0139-et is nézi; minden más elvárás változatlan.
// 2026-10-06 (R-17 kör, Kati #4 #7 #8 #9 #12 #16): a 0147 hét r16.arculat.* kulcs szövegét cserélte, és a feliratfájl
// (design/R16-arculat/feliratok.json) is az új szöveget mondja — ezért a 0147 is a keresett migrációk közé került (a régi sorok maradnak).
const r16 = readFileSync(MIG + "0135_r16_logo_helyek.sql", "utf8") + k3 + readFileSync(MIG + "0139_r16_nevlogo_feliratok.sql", "utf8") + readFileSync(MIG + "0147_visszajelzes_1006_feliratok.sql", "utf8");
const fajl = JSON.parse(readFileSync(gy("design/R16-arculat/feliratok.json"), "utf8")) as Record<"hu" | "ro" | "en", Record<string, string>>;
const sql = (s: string) => s.replace(/'/g, "''");

const hasznalt = [...new Set([
  ...[...KOD.matchAll(/["'`]((?:r16\.arculat|r15\.kozos|fiok|onboarding3|kozos)\.[a-z0-9_.]+)["'`]/g)].map((m) => m[1]!),
  // a sablonos kulcs: t(`r16.arculat.logok.${hely}`)
  ...["vilagos", "sotet", "egyszinu", "negyzetes"].map((h) => `r16.arculat.logok.${h}`),
])].sort();

describe("a szakasz feliratai", () => {
  it("a kód legalább a rajz fő kulcsait használja (a keresés működik)", () => {
    for (const k of ["r16.arculat.ures.kerdes", "r16.arculat.talalt.kerdes", "r16.arculat.kesz.kerdes", "r16.arculat.logo_feltoltes", "r16.arculat.jo_logo_nelkul", "r16.arculat.igen", "r16.arculat.kep_keszitese", "r16.arculat.betu.klasszikus"]) expect(hasznalt).toContain(k);
  });
  it("minden r16.arculat.* kulcs a 0135-ben vagy a 0136-ban (K6-tól a „Nincs logóm” a 0139-ben), hu/ro/en, a feliratfájl szövegével", () => {
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
  it("a 0136 pontosan a TERV §2-K8 35 kulcsa × 3 nyelv (105 sor)", () => {
    const sorok = [...k3.matchAll(/\('(r16\.arculat\.[a-z0-9_.]+)', '(hu|ro|en)', /g)];
    expect(sorok.length).toBe(105);
    expect(new Set(sorok.map((m) => m[1])).size).toBe(35);
  });
});
