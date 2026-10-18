// Kirakás-zár javítás (10-02 05:54, Csilla: jóváhagyva) — a 03c2 csíkos mintaképe félreérthetetlenül minta: halk „Minta” jel a képen
// (r15.kozos.minta_jel) és új képaláírás (r15.kozos.minta_sor: hol kérjük a fotót). A 0144 a design/R15/feliratok-4.json szövegével
// betűre; a szószám nem nő; nincs feltöltő elem és nincs új gomb a mintán. Fájlolvasás, adatbázis nélkül.
import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

const gy = (ut: string) => new URL(`../../../${ut}`, import.meta.url).pathname;
const MIG = gy("apps/web/adatbazis/migraciok/");
const k0144 = readFileSync(MIG + "0144_r15_minta_jel_feliratok.sql", "utf8");
const osszes = readdirSync(MIG).filter((f) => f.endsWith(".sql")).sort().map((f) => readFileSync(MIG + f, "utf8")).join("\n");
const fajl = JSON.parse(readFileSync(gy("design/R15/feliratok-4.json"), "utf8")) as Record<"hu" | "ro" | "en", Record<string, string>>;
const regi = JSON.parse(readFileSync(gy("design/R15/feliratok-3.json"), "utf8")) as Record<"hu" | "ro" | "en", Record<string, string>>;
const minta = readFileSync(gy("apps/web/app/_kozos/R15MunkaMinta.tsx"), "utf8");
const kezdolap = readFileSync(gy("apps/web/app/kezdolap/R15Kezdolap.tsx"), "utf8");
const sql = (s: string) => s.replace(/'/g, "''");
const NYELVEK = ["hu", "ro", "en"] as const;
const KULCSOK = ["r15.kozos.minta_sor", "r15.kozos.minta_jel"];
const szo = (s: string) => s.split(/\s+/).filter((x) => x && /[\p{L}\p{N}]/u.test(x)).length;
// T3 — ugyanaz a lista, mint a r15-utokeres2-feliratok.proba.ts-ben
const TILTOTT = [/futás/i, /\bmodul/i, /szűrés/i, /verzió/i, /ai-keret/i, /\btoken/i, /forrás-állapot/i, /ai-javaslat/i, /\bmodule/i, /\bversion/i, /\bversiune/i, /\brulare/i];

describe("0144 — a 03c2 mintaképe: „Minta” jel és új képaláírás", () => {
  it("a 0144 pontosan a 2 kulcs × 3 nyelv (6 sor), a feliratok-4.json szövegével betűre", () => {
    const sorok = [...k0144.matchAll(/\('(r15\.kozos\.[a-z0-9_.]+)', '(hu|ro|en)', /g)];
    expect(sorok.length).toBe(6);
    expect([...new Set(sorok.map((m) => m[1]))].sort()).toEqual([...KULCSOK].sort());
    for (const k of KULCSOK) for (const ny of NYELVEK) expect(k0144, `${k} ${ny}`).toContain(`('${k}', '${ny}', '${sql(fajl[ny][k]!)}')`);
    expect(k0144).toMatch(/ON CONFLICT \("kulcs", "nyelv"\) DO UPDATE SET "szoveg" = EXCLUDED\."szoveg"/);
    expect(k0144).not.toMatch(/\b(ALTER|DROP|DELETE|CREATE|TRUNCATE)\b/i);
  });
  it("a minta_sor utolsó értéke (a migrációk sorrendjében) a 0144-é — a 0142 régi értékét felülírja", () => {
    for (const ny of NYELVEK) {
      const re = new RegExp(`\\('r15\\.kozos\\.minta_sor', '${ny}', '((?:[^']|'')*)'\\)`, "g");
      const ertekek = [...osszes.matchAll(re)].map((m) => m[1]!.replace(/''/g, "'"));
      expect(ertekek.at(-1)).toBe(fajl[ny]["r15.kozos.minta_sor"]);
    }
  });
  it("T5: a jel + az új aláírás nem több szó, mint a régi aláírás — mindhárom nyelven; T3 tiltott szó nincs", () => {
    for (const ny of NYELVEK) {
      const uj = szo(fajl[ny]["r15.kozos.minta_jel"]!) + szo(fajl[ny]["r15.kozos.minta_sor"]!);
      expect(uj, ny).toBeLessThanOrEqual(szo(regi[ny]["r15.kozos.minta_sor"]!));
      for (const v of Object.values(fajl[ny])) for (const t of TILTOTT) expect(t.test(v), `${ny}: ${v}`).toBe(false);
    }
  });
  it("a jel a csíkos mintán (fotoResz) és a tartalék üres lapján is ott van; a minta nem feltöltő és nem gomb", () => {
    expect(minta).toContain('t("r15.kozos.minta_jel")');
    expect(minta.match(/\{jel\}/g)?.length).toBe(2);
    expect(minta).not.toMatch(/<input|<button|<FoGomb|onClick/);
    expect(kezdolap).toContain('t("r15.kozos.minta_sor")');
  });
});
