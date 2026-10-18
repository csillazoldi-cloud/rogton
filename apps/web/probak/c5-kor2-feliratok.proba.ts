// c5 2. kör (design/R15/feliratok-6.json → 0158): a migráció pontosan a fájl kulcsai × 3 nyelv, betűre; mind ÚJ kulcs (meglévő érték
// nem változik); helyőrzők nyelvenként egyeznek; T3 tiltott szó egyik nyelven sincs. Fájlolvasás, adatbázis nélkül.
import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

const gy = (ut: string) => new URL(`../../../${ut}`, import.meta.url).pathname;
const MIG = gy("apps/web/adatbazis/migraciok/");
const korabbi = readdirSync(MIG).filter((f) => f.endsWith(".sql") && f < "0158").sort().map((f) => readFileSync(MIG + f, "utf8")).join("\n");
const m0158 = readFileSync(MIG + "0158_r15_c5_kor2_feliratok.sql", "utf8");
const fajl = JSON.parse(readFileSync(gy("design/R15/feliratok-6.json"), "utf8")) as Record<"hu" | "ro" | "en", Record<string, string>>;
const sql = (s: string) => s.replace(/'/g, "''");
const TILTOTT = [/futás/i, /\bmodul/i, /szűrés/i, /verzió/i, /ai-keret/i, /\btoken/i, /forrás-állapot/i, /ai-javaslat/i, /\bmodule/i, /\bversion/i, /\bversiune/i, /\brulare/i];

describe("c5 2. kör feliratai (0158)", () => {
  it("a 0158 pontosan a feliratok-6.json kulcsai × 3 nyelv, a fájl szövegével betűre", () => {
    const sorok = [...m0158.matchAll(/\('([a-z0-9_.]+)', '(hu|ro|en)', '((?:[^']|'')*)'\)/g)];
    const db = Object.keys(fajl.hu).length;
    expect(db).toBe(21);
    expect(sorok.length).toBe(db * 3);
    const hiany: string[] = [];
    for (const ny of ["hu", "ro", "en"] as const) for (const [k, v] of Object.entries(fajl[ny])) if (!m0158.includes(`('${k}', '${ny}', '${sql(v)}')`)) hiany.push(`${k} (${ny})`);
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
    expect(h(fajl.hu["r15.kezdolap.javitva_sor"]!)).toBe("n");
    expect(h(fajl.hu["r15.ert.kerdes_uj"]!)).toBe("n");
  });
  it("minden kulcs ÚJ (egyik korábbi migrációban sincs)", () => {
    for (const k of Object.keys(fajl.hu)) expect(korabbi.includes(`('${k}', 'hu',`), k).toBe(false);
  });
  it("T3: tiltott szó egyik új szövegben sincs, egyik nyelven sem", () => {
    for (const ny of ["hu", "ro", "en"] as const) for (const [k, v] of Object.entries(fajl[ny])) for (const r of TILTOTT) expect(r.test(v), `${k} (${ny}): ${v}`).toBe(false);
  });
});
