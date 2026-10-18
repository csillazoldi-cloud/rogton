// Kirakás-zár javítás (10-01 22:07, Csilla: jóváhagyva) — a 0143 feliratai: a 12d2 „Más színt” címe alatti halk sor, fülenként
// (r16.arculat.szin.hol_fo · _masodik · _hatter). A 0143 pontosan ez a 3 kulcs × 3 nyelv, a design/R16-arculat/feliratok.json szövegével
// betűre; T3 tiltott szó egyik nyelven sem; T1: egy mondat, rövid. A névlogó lap (12g) a jóváhagyott 12a kulcsokat használja (0142).
// Fájlolvasás, adatbázis nélkül.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const gy = (ut: string) => new URL(`../../../${ut}`, import.meta.url).pathname;
const MIG = gy("apps/web/adatbazis/migraciok/");
const k0143 = readFileSync(MIG + "0143_r16_zar_feliratok.sql", "utf8");
const k0142 = readFileSync(MIG + "0142_r15_utokeres2_feliratok.sql", "utf8");
const fajl = JSON.parse(readFileSync(gy("design/R16-arculat/feliratok.json"), "utf8")) as Record<"hu" | "ro" | "en", Record<string, string>>;
const masSzin = readFileSync(gy("apps/web/app/fiok/arculat/szinek/mas/MasSzin.tsx"), "utf8");
const nevlogo = readFileSync(gy("apps/web/app/fiok/arculat/nevlogo/Nevlogo.tsx"), "utf8") + readFileSync(gy("apps/web/app/fiok/arculat/nevlogo/page.tsx"), "utf8");
const sql = (s: string) => s.replace(/'/g, "''");
const KULCSOK = ["fo", "masodik", "hatter"].map((f) => `r16.arculat.szin.hol_${f}`);
const NYELVEK = ["hu", "ro", "en"] as const;
// T3 (design/R15/tokenek.md 3. pont) — ugyanaz a lista, mint a r15-utokeres2-feliratok.proba.ts-ben
const TILTOTT = [/futás/i, /\bmodul/i, /szűrés/i, /verzió/i, /ai-keret/i, /\btoken/i, /forrás-állapot/i, /ai-javaslat/i, /\bmodule/i, /\bversion/i, /\bversiune/i, /\brulare/i];

describe("0143 — a kirakás-zár két piros asztali nézetének feliratai", () => {
  it("a 0143 pontosan a 3 kulcs × 3 nyelv (9 sor), a feliratfájl szövegével betűre", () => {
    const sorok = [...k0143.matchAll(/\('(r16\.arculat\.[a-z0-9_.]+)', '(hu|ro|en)', /g)];
    expect(sorok.length).toBe(9);
    expect([...new Set(sorok.map((m) => m[1]))].sort()).toEqual([...KULCSOK].sort());
    for (const k of KULCSOK) for (const ny of NYELVEK) {
      expect(fajl[ny][k], `${k} ${ny} a feliratfájlban`).toBeTruthy();
      expect(k0143, `${k} ${ny}`).toContain(`('${k}', '${ny}', '${sql(fajl[ny][k]!)}')`);
    }
  });
  it("ismételhető (ON CONFLICT … DO UPDATE), és csak feliratot ír", () => {
    expect(k0143).toMatch(/ON CONFLICT \("kulcs", "nyelv"\) DO UPDATE SET "szoveg" = EXCLUDED\."szoveg"/);
    expect(k0143).not.toMatch(/\b(ALTER|DROP|DELETE|CREATE|TRUNCATE)\b/i);
  });
  it("T3: nincs tiltott szó, T1: egy rövid mondat (≤ 10 szó) minden nyelven", () => {
    const bajok: string[] = [];
    for (const k of KULCSOK) for (const ny of NYELVEK) {
      const v = fajl[ny][k]!;
      for (const t of TILTOTT) if (t.test(v)) bajok.push(`${k} (${ny}) tiltott: ${v}`);
      if (v.split(/\s+/).filter(Boolean).length > 10) bajok.push(`${k} (${ny}) hosszú: ${v}`);
      if ((v.match(/[.!?]/g) ?? []).length !== 1 || !/[.!?]$/.test(v)) bajok.push(`${k} (${ny}) nem egy mondat: ${v}`);
    }
    expect(bajok).toEqual([]);
  });
  it("a 12d2 a cím alatt fülenként a hol_* sort mutatja, kérdés-alcímként", () => {
    expect(masSzin).toContain("t(`r16.arculat.szin.hol_${ful}`)");
    expect(masSzin).toMatch(/className="r15-kerdes-alcim[^"]*" data-r15="kerdes-alcim"/);
  });
  it("a 12g címe és alcíme a jóváhagyott 12a szövege (0142 kulcsai), a régi „Készítsünk egyet?” nem látszik", () => {
    for (const k of ["r16.arculat.nevlogo.kerdes", "r16.arculat.nevlogo.alcim"]) {
      expect(nevlogo).toContain(`"${k}"`);
      for (const ny of NYELVEK) expect(k0142, `${k} ${ny}`).toContain(`('${k}', '${ny}', `);
    }
    expect(nevlogo).not.toContain('"r16.arculat.keszit.kerdes"');
    expect(nevlogo).not.toContain('"r16.arculat.keszit.alcim"');
  });
});
