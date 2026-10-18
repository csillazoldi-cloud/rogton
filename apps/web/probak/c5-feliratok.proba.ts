// c5 1. kör (design/R15/feliratok-5.json → 0157): a migráció pontosan a fájl kulcsai × 3 nyelv, betűre; a két ÁTÍRT kulcs egy korábbi
// migrációban már létezett; helyőrzők nyelvenként egyeznek; T3 tiltott szó egyik nyelven sincs. Fájlolvasás, adatbázis nélkül.
import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

const gy = (ut: string) => new URL(`../../../${ut}`, import.meta.url).pathname;
const MIG = gy("apps/web/adatbazis/migraciok/");
const korabbi = readdirSync(MIG).filter((f) => f.endsWith(".sql") && f < "0157").sort().map((f) => readFileSync(MIG + f, "utf8")).join("\n");
const m0157 = readFileSync(MIG + "0157_r15_c5_kor1_feliratok.sql", "utf8");
const fajl = JSON.parse(readFileSync(gy("design/R15/feliratok-5.json"), "utf8")) as Record<"hu" | "ro" | "en", Record<string, string>>;
const sql = (s: string) => s.replace(/'/g, "''");
const ATIRT = ["onboarding.eb_cim", "iranytu.mire_hasznalja_szoveg"];
const TILTOTT = [/futás/i, /\bmodul/i, /szűrés/i, /verzió/i, /ai-keret/i, /\btoken/i, /forrás-állapot/i, /ai-javaslat/i, /\bmodule/i, /\bversion/i, /\bversiune/i, /\brulare/i];

describe("c5 1. kör feliratai (0157)", () => {
  it("a 0157 pontosan a feliratok-5.json kulcsai × 3 nyelv, a fájl szövegével betűre", () => {
    const sorok = [...m0157.matchAll(/\('([a-z0-9_.]+)', '(hu|ro|en)', '((?:[^']|'')*)'\)/g)];
    const db = Object.keys(fajl.hu).length;
    expect(db).toBe(57);
    expect(sorok.length).toBe(db * 3);
    const hiany: string[] = [];
    for (const ny of ["hu", "ro", "en"] as const) for (const [k, v] of Object.entries(fajl[ny])) if (!m0157.includes(`('${k}', '${ny}', '${sql(v)}')`)) hiany.push(`${k} (${ny})`);
    expect(hiany).toEqual([]);
  });
  it("a három nyelv ugyanazokat a kulcsokat adja, üres szöveg nincs; a helyőrzők egyeznek", () => {
    expect(Object.keys(fajl.ro).sort()).toEqual(Object.keys(fajl.hu).sort());
    expect(Object.keys(fajl.en).sort()).toEqual(Object.keys(fajl.hu).sort());
    const h = (s: string) => [...s.matchAll(/\{([a-z]+)\}/g)].map((m) => m[1]).sort().join(",");
    for (const k of Object.keys(fajl.hu)) {
      for (const ny of ["hu", "ro", "en"] as const) expect(fajl[ny][k]!.trim().length).toBeGreaterThan(0);
      expect(h(fajl.ro[k]!), k).toBe(h(fajl.hu[k]!));
      expect(h(fajl.en[k]!), k).toBe(h(fajl.hu[k]!));
    }
    expect(h(fajl.hu["r15.ir.jovahagyva"]!)).toBe("ki,mikor");
  });
  it("az átírt kulcsok egy korábbi migrációban már léteztek; minden más kulcs ÚJ", () => {
    for (const k of ATIRT) expect(korabbi.includes(`('${k}', 'hu',`), k).toBe(true);
    for (const k of Object.keys(fajl.hu).filter((x) => !ATIRT.includes(x))) expect(korabbi.includes(`('${k}', 'hu',`), k).toBe(false);
  });
  it("T3: tiltott szó egyik új szövegben sincs, egyik nyelven sem", () => {
    for (const ny of ["hu", "ro", "en"] as const) for (const [k, v] of Object.entries(fajl[ny])) for (const r of TILTOTT) expect(r.test(v), `${k} (${ny}): ${v}`).toBe(false);
  });
  it("a 02 címe Csilla 10-10-i szövege (Q2)", () => {
    expect(fajl.hu["onboarding.eb_cim"]).toBe("Mit kell tudnunk rólatok?");
  });
});
