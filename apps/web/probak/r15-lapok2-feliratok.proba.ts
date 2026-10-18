// R-15 · 3. szállítmány (R15-lapok-2, kerdesek-2 10): minden feliratkulcs, amit a 03 Kezdőlap és a 04 Hírek kódja használ, megvan egy
// migrációban mindhárom nyelven; a 0141 a design/R15/feliratok-2.json 26 kulcsa × 3 nyelv, betűre; a hat ÁTÍRT kulcs egy korábbi
// migrációban (0131) már létezett — ezért a 0141 az értéküket írja át, nem új kulcsot vezet be. Fájlolvasás, adatbázis nélkül.
import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

const gy = (ut: string) => new URL(`../../../${ut}`, import.meta.url).pathname;
const KOD = [
  "apps/web/app/kezdolap/R15Kezdolap.tsx",
  "apps/web/app/hirfigyelo/R15Hirek.tsx",
  "apps/web/app/_kozos/R15MunkaMinta.tsx",
].map((f) => readFileSync(gy(f), "utf8")).join("\n");
const MIG = gy("apps/web/adatbazis/migraciok/");
const fajlNevek = readdirSync(MIG).filter((f) => f.endsWith(".sql")).sort();
const korabbi = fajlNevek.filter((f) => f < "0141").map((f) => readFileSync(MIG + f, "utf8")).join("\n");
const osszes = fajlNevek.map((f) => readFileSync(MIG + f, "utf8")).join("\n");
const m0141 = readFileSync(MIG + "0141_r15_lapok2_feliratok.sql", "utf8");
const fajl = JSON.parse(readFileSync(gy("design/R15/feliratok-2.json"), "utf8")) as Record<"hu" | "ro" | "en", Record<string, string>>;
const sql = (s: string) => s.replace(/'/g, "''");
const hasznalt = [...new Set([...KOD.matchAll(/t\(\s*["'`]([a-z0-9_]+\.[a-z0-9_.]+)["'`]/g)].map((m) => m[1]!))].sort();
const ATIRT = ["r15.kezdolap.atnezem_posztot", "r15.kezdolap.atnezem", "r15.hirek.atnezem_posztot", "r15.hirek.atnezem", "r15.hirek.atnezem_elsot", "r15.kezdolap.alcim"];

describe("R15-lapok-2 feliratai (0141)", () => {
  it("a kód a rajz új kulcsait használja (a keresés működik)", () => {
    for (const k of ["r15.kezdolap.kesz_kerdes", "r15.kozos.nyugtato", "r15.hirek.ures_kerdes", "r15.hirek.posztod", "r15.kozos.kepet_keszitek_munka", "r15.kozos.kep_minta_alt", "r15.kozos.napi_hirek_sor"]) {
      expect(hasznalt).toContain(k);
    }
  });
  it("minden használt kulcs megvan egy migrációban, hu/ro/en", () => {
    const hiany: string[] = [];
    for (const k of hasznalt) for (const ny of ["hu", "ro", "en"]) if (!osszes.includes(`('${k}', '${ny}',`)) hiany.push(`${k} (${ny})`);
    expect(hiany).toEqual([]);
  });
  it("a 0141 pontosan a feliratok-2.json 26 kulcsa × 3 nyelv, a fájl szövegével betűre", () => {
    const sorok = [...m0141.matchAll(/\('([a-z0-9_.]+)', '(hu|ro|en)', '((?:[^']|'')*)'\)/g)];
    expect(sorok.length).toBe(78);
    const hiany: string[] = [];
    for (const ny of ["hu", "ro", "en"] as const) for (const [k, v] of Object.entries(fajl[ny])) if (!m0141.includes(`('${k}', '${ny}', '${sql(v)}')`)) hiany.push(`${k} (${ny})`);
    expect(hiany).toEqual([]);
    expect(new Set(sorok.map((s) => s[1])).size).toBe(Object.keys(fajl.hu).length);
  });
  it("a hat átírt kulcs már létezett (0131) — a többi 20 új", () => {
    for (const k of ATIRT) for (const ny of ["hu", "ro", "en"]) expect(korabbi.includes(`('${k}', '${ny}',`)).toBe(true);
    const ujak = Object.keys(fajl.hu).filter((k) => !ATIRT.includes(k));
    expect(ujak.length).toBe(20);
    for (const k of ujak) expect(korabbi.includes(`('${k}', `)).toBe(false);
  });
  it("a „Ma nincs dolgod” és a régi „Napi hírfigyelés” kulcsot a lapok már nem használják (a kulcsok maradnak)", () => {
    expect(hasznalt).not.toContain("r15.kezdolap.kerdes_nulla");
    expect(hasznalt).not.toContain("r15.kezdolap.napi_figyeles");
    expect(osszes.includes("('r15.kezdolap.kerdes_nulla', 'hu',")).toBe(true);
  });
});
