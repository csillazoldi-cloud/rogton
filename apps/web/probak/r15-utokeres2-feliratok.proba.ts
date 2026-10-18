// R-15 utókérés 2 + 4. szállítmány (06 Mit figyeljünk) + R-16 telefonos üres állapotok — a 0142 feliratai (design/R15/feliratok-3.json,
// gepezet-3, kerdesek-3). A 0142 a fájl 71 kulcsa × 3 nyelv, betűre; a három ÁTÍRT kulcs (r15.kozos.foto_munka, r15.hirek.kihagytuk,
// r15.hirek.ures_ajanlat) egy korábbi migrációban már létezett — a 0142 az értéküket írja át. Fájlolvasás, adatbázis nélkül.
import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

const gy = (ut: string) => new URL(`../../../${ut}`, import.meta.url).pathname;
const MIG = gy("apps/web/adatbazis/migraciok/");
const fajlNevek = readdirSync(MIG).filter((f) => f.endsWith(".sql")).sort();
const korabbi = fajlNevek.filter((f) => f < "0142").map((f) => readFileSync(MIG + f, "utf8")).join("\n");
const m0142 = readFileSync(MIG + "0142_r15_utokeres2_feliratok.sql", "utf8");
const fajl = JSON.parse(readFileSync(gy("design/R15/feliratok-3.json"), "utf8")) as Record<"hu" | "ro" | "en", Record<string, string>>;
const sql = (s: string) => s.replace(/'/g, "''");
const ATIRT = ["r15.kozos.foto_munka", "r15.hirek.kihagytuk", "r15.hirek.ures_ajanlat"];
// T3 (design/R15/tokenek.md 3. pont): a tiltott szavak a látható szövegben — a három nyelv mindegyikén (a tibor-proba listája + ro/en)
const TILTOTT = [/futás/i, /\bmodul/i, /szűrés/i, /verzió/i, /ai-keret/i, /\btoken/i, /forrás-állapot/i, /ai-javaslat/i, /\bmodule/i, /\bversion/i, /\bversiune/i, /\brulare/i];

describe("R-15 utókérés 2 feliratai (0142)", () => {
  it("a 0142 pontosan a feliratok-3.json kulcsai × 3 nyelv, a fájl szövegével betűre", () => {
    const sorok = [...m0142.matchAll(/\('([a-z0-9_.]+)', '(hu|ro|en)', '((?:[^']|'')*)'\)/g)];
    expect(Object.keys(fajl.hu).length).toBe(71);
    expect(sorok.length).toBe(213);
    const hiany: string[] = [];
    for (const ny of ["hu", "ro", "en"] as const) for (const [k, v] of Object.entries(fajl[ny])) if (!m0142.includes(`('${k}', '${ny}', '${sql(v)}')`)) hiany.push(`${k} (${ny})`);
    expect(hiany).toEqual([]);
    expect(new Set(sorok.map((s) => s[1])).size).toBe(71);
  });
  it("a három nyelv ugyanazokat a kulcsokat adja, üres szöveg nincs", () => {
    expect(Object.keys(fajl.ro).sort()).toEqual(Object.keys(fajl.hu).sort());
    expect(Object.keys(fajl.en).sort()).toEqual(Object.keys(fajl.hu).sort());
    for (const ny of ["hu", "ro", "en"] as const) for (const v of Object.values(fajl[ny])) expect(v.trim().length).toBeGreaterThan(0);
  });
  it("a helyőrzők nyelvenként egyeznek ({n}, {cikk}, {nap}, …)", () => {
    const h = (s: string) => [...s.matchAll(/\{([a-z]+)\}/g)].map((m) => m[1]).sort().join(",");
    for (const k of Object.keys(fajl.hu)) {
      expect(h(fajl.ro[k]!), k).toBe(h(fajl.hu[k]!));
      expect(h(fajl.en[k]!), k).toBe(h(fajl.hu[k]!));
    }
    expect(h(fajl.hu["r15.hirek.kihagytuk"]!)).toBe("n"); // a meglévő hívás ({ n: adat.kihagyott }) változatlanul jó
  });
  it("a három átírt kulcs már létezett — a többi 68 új", () => {
    for (const k of ATIRT) for (const ny of ["hu", "ro", "en"]) expect(korabbi.includes(`('${k}', '${ny}',`)).toBe(true);
    const ujak = Object.keys(fajl.hu).filter((k) => !ATIRT.includes(k));
    expect(ujak.length).toBe(68);
    for (const k of ujak) expect(korabbi.includes(`('${k}', `), k).toBe(false);
  });
  it("T3: egyik új szöveg sem tartalmaz tiltott szót, egyik nyelven sem", () => {
    const bajok: string[] = [];
    for (const ny of ["hu", "ro", "en"] as const) for (const [k, v] of Object.entries(fajl[ny])) for (const t of TILTOTT) if (t.test(v)) bajok.push(`${k} (${ny}): ${v}`);
    expect(bajok).toEqual([]);
  });
  it("ismételhető: mindkét INSERT ON CONFLICT … DO UPDATE", () => {
    expect(m0142.match(/INSERT INTO "felirat"/g)?.length).toBe(2);
    expect(m0142.match(/ON CONFLICT \("kulcs", "nyelv"\) DO UPDATE SET "szoveg" = EXCLUDED\."szoveg"/g)?.length).toBe(2);
  });
});
