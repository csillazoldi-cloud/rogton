// R-17 · a 0149 (feliratok) és a 0150 (logótervezés táblái) alakja. Fájlolvasás, adatbázis nélkül.
//  - a rajz 32 r17.* kulcsa BETŰRE a design/R17-visszajelzes/feliratok.json-ból, hu/ro/en; a többi új kulcs is mindhárom nyelven;
//  - minden r17.* kulcs, amit a kód használ, megvan a 0149-ben (a dinamikus „hol_*”, „szinnev.*” kulcsok is);
//  - a 0150 csak új táblát és függvényt hoz (adatvesztés nincs), sorszintű védelemmel, ismételhetően.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const gy = (ut: string) => new URL(`../../../${ut}`, import.meta.url).pathname;
const MIG = gy("apps/web/adatbazis/migraciok/");
const m149 = readFileSync(MIG + "0149_r17_feliratok.sql", "utf8");
const m150 = readFileSync(MIG + "0150_r17_logoterv.sql", "utf8");
const korabbi = readdirSync(MIG).filter((f) => f.endsWith(".sql") && f < "0149").map((f) => readFileSync(MIG + f, "utf8")).join("\n");
const fajl = JSON.parse(readFileSync(gy("design/R17-visszajelzes/feliratok.json"), "utf8")) as Record<"hu" | "ro" | "en", Record<string, string>>;
const sql = (s: string) => s.replace(/'/g, "''");
const sorok = [...m149.matchAll(/\('([a-z0-9_.]+)', '(hu|ro|en)', '((?:[^']|'')*)'\)/g)].map((m) => ({ kulcs: m[1]!, nyelv: m[2]!, szoveg: m[3]!.replace(/''/g, "'") }));

function fajlok(mappa: string, ki: string[] = []): string[] {
  for (const n of readdirSync(mappa)) {
    const p = join(mappa, n);
    if (n === "node_modules" || n === ".next" || n === "probak") continue;
    if (statSync(p).isDirectory()) fajlok(p, ki);
    else if (/\.tsx?$/.test(n)) ki.push(p);
  }
  return ki;
}
const KOD = fajlok(gy("apps/web")).map((f) => readFileSync(f, "utf8")).join("\n");

describe("0149 — R-17 feliratok", () => {
  it("a rajz minden kulcsa betűre a feliratfájlból, hu/ro/en", () => {
    const hiany: string[] = [];
    for (const ny of ["hu", "ro", "en"] as const) for (const [k, v] of Object.entries(fajl[ny])) if (!m149.includes(`('${k}', '${ny}', '${sql(v)}')`)) hiany.push(`${k} (${ny})`);
    expect(hiany).toEqual([]);
    expect(Object.keys(fajl.hu).length).toBe(32);
  });
  it("minden új kulcs mindhárom nyelven, egyik sem létezett korábban, ismételhető", () => {
    const kulcsok = [...new Set(sorok.map((s) => s.kulcs))];
    for (const k of kulcsok) expect(sorok.filter((s) => s.kulcs === k).map((s) => s.nyelv).sort(), k).toEqual(["en", "hu", "ro"]);
    for (const k of kulcsok) expect(korabbi.includes(`('${k}',`), k).toBe(false);
    expect(m149).toMatch(/ON CONFLICT \("kulcs", "nyelv"\) DO UPDATE/);
  });
  it("minden r17.* kulcs, amit a kód használ, megvan (a dinamikus kulcsok is)", () => {
    const meglevo = new Set(sorok.map((s) => s.kulcs));
    const hasznalt = new Set([...KOD.matchAll(/["'`](r17\.[a-z0-9_.]+)["'`]/g)].map((m) => m[1]!));
    for (const h of ["facebook", "honlap", "auto", "nyomtatott", "tabla"]) hasznalt.add(`r17.logoterv.hol_${h}`);
    for (const n of ["piros", "narancs", "sarga", "homok", "zold", "turkiz", "kek", "lila", "rozsaszin", "barna", "szurke", "fekete", "feher", "krem"]) hasznalt.add(`r17.szinnev.${n}`);
    for (const e of ["nincs_beallitva", "elkuldve", "hiba", "kuldes"]) hasznalt.add(`r17.logokeres.ertesites_${e}`);
    expect([...hasznalt].filter((k) => !meglevo.has(k))).toEqual([]);
  });
  it("a köszönő oldal mondata kimondja: felhívunk, szerződés, banki átutalás, online fizetés nincs (Csilla 10-06)", () => {
    const hu = sorok.find((s) => s.kulcs === "r17.logoterv.menete" && s.nyelv === "hu")!.szoveg;
    expect(hu).toMatch(/Felhívunk/);
    expect(hu).toMatch(/szerződés/);
    expect(hu).toMatch(/átutalással/);
    expect(hu).toMatch(/online fizetés nincs/);
  });
});

describe("0150 — logótervezés: csak új táblák és függvények", () => {
  it("két tábla, RLS a kéréseken, két SECURITY DEFINER függvény; nincs törlés", () => {
    expect(m150).toContain('CREATE TABLE IF NOT EXISTS "rendszer_beallitas"');
    expect(m150).toContain('CREATE TABLE IF NOT EXISTS "logoterv_keres"');
    expect(m150).toContain('ALTER TABLE "logoterv_keres" ENABLE ROW LEVEL SECURITY;');
    expect(m150).toMatch(/CREATE POLICY "logoterv_keres_sajat_szervezet"[^;]*app\.szervezet_id/);
    expect(m150.match(/LANGUAGE sql SECURITY DEFINER/g)?.length).toBe(2);
    expect(m150).toContain("('logoterv_ar', '79'::jsonb)");
    expect(m150).toMatch(/ON CONFLICT \("kulcs"\) DO NOTHING/);
    expect(m150).not.toMatch(/\b(DROP TABLE|DROP COLUMN|DELETE FROM|TRUNCATE)\b/);
  });
});
