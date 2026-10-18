// R-16 K4 (TERV §2-K8): minden feliratkulcs, amit a 12d/12d2 kódja használ, megvan egy migrációban mindhárom nyelven — a K4
// saját kulcsai (0137) a feliratfájl (design/R16-arculat/feliratok.json) szövegével betűre; a 0137 pontosan a TERV 21 kulcsa.
// Fájlolvasás, adatbázis nélkül (a r16-arculat-feliratok.proba.ts mintájára).
import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SZETT_IDK } from "@rogton/arculat-core";

const gy = (ut: string) => new URL(`../../../${ut}`, import.meta.url).pathname;
const KOD = [
  "apps/web/app/fiok/arculat/szinek/Szinek.tsx",
  "apps/web/app/fiok/arculat/szinek/page.tsx",
  "apps/web/app/fiok/arculat/szinek/mas/MasSzin.tsx",
  "apps/web/app/fiok/arculat/szinek/mas/page.tsx",
  "apps/web/app/fiok/arculat/_kozos/IgyNezKi.tsx",
  "packages/arculat-core/src/szin-javaslat.ts",
].map((f) => readFileSync(gy(f), "utf8")).join("\n");
const MIG = gy("apps/web/adatbazis/migraciok/");
const osszes = readdirSync(MIG).filter((f) => f.endsWith(".sql")).map((f) => readFileSync(MIG + f, "utf8")).join("\n");
const k4 = readFileSync(MIG + "0137_r16_szinek_feliratok.sql", "utf8");
const fajl = JSON.parse(readFileSync(gy("design/R16-arculat/feliratok.json"), "utf8")) as Record<"hu" | "ro" | "en", Record<string, string>>;
const sql = (s: string) => s.replace(/'/g, "''");

/** TERV §2-K8, a 0137 sora — betűre. */
const TERV_0137 = ["szin.ful_fo", "szin.ful_masodik", "szin.ful_hatter", "szin.kerdes_fo", "szin.kerdes_masodik", "szin.kerdes_hatter", "szin.logobol", "szin.mas", "szin.erintsd",
  "szettek.kerdes", "szettek.alcim", "szettek.alcim_rovid", "szettek.mas", "szettek.logobol", "szettek.honlaprol",
  "szettek.termeszetes", "szettek.meleg", "szettek.friss", "szettek.megbizhato", "szettek.elegans", "szettek.jatekos"].map((k) => `r16.arculat.${k}`);

const hasznalt = [...new Set([
  ...[...KOD.matchAll(/["'`]((?:r16\.arculat|r15\.kozos|fiok|onboarding3|kozos)\.[a-z0-9_.]+)["'`]/g)].map((m) => m[1]!),
  // a sablonos kulcsok: t(`r16.arculat.szin.kerdes_${ful}`), t(`r16.arculat.szin.ful_${f}`), `r16.arculat.szettek.${id}`
  ...["fo", "masodik", "hatter"].flatMap((f) => [`r16.arculat.szin.kerdes_${f}`, `r16.arculat.szin.ful_${f}`]),
  // kirakás-zár javítás (10-01): a 12d2 cím alatti halk sora, t(`r16.arculat.szin.hol_${ful}`) — 0143
  ...["fo", "masodik", "hatter"].map((f) => `r16.arculat.szin.hol_${f}`),
  ...SZETT_IDK.map((id) => `r16.arculat.szettek.${id}`),
])].sort();

describe("a 12d/12d2 feliratai", () => {
  it("a kód a rajz fő kulcsait használja (a keresés működik)", () => {
    for (const k of ["r16.arculat.szettek.kerdes", "r16.arculat.szettek.mas", "r16.arculat.ez_legyen", "r16.arculat.megse", "r16.arculat.szin.logobol", "r16.arculat.szin.erintsd", "r16.arculat.szettek.logobol", "r16.arculat.szettek.honlaprol"]) expect(hasznalt).toContain(k);
  });
  it("a 0137 pontosan a TERV §2-K8 21 kulcsa × 3 nyelv (63 sor), a feliratfájl szövegével betűre", () => {
    const sorok = [...k4.matchAll(/\('(r16\.arculat\.[a-z0-9_.]+)', '(hu|ro|en)', /g)];
    expect(sorok.length).toBe(63);
    expect([...new Set(sorok.map((m) => m[1]))].sort()).toEqual([...TERV_0137].sort());
    for (const k of TERV_0137) for (const ny of ["hu", "ro", "en"] as const) expect(k4, `${k} ${ny}`).toContain(`('${k}', '${ny}', '${sql(fajl[ny][k]!)}')`);
  });
  it("minden használt kulcs valamelyik migrációban megvan, mindhárom nyelven", () => {
    const hiany: string[] = [];
    for (const k of hasznalt) for (const ny of ["hu", "ro", "en"]) if (!osszes.includes(`('${k}', '${ny}',`)) hiany.push(`${k} (${ny})`);
    expect(hiany).toEqual([]);
  });
});
