// 2026-10-06 — Kati #17 („nem is értem, mi ennek az aloldalnak a funkciója”), Csilla #40 („annyi gomb van”); döntés 10-06 (DONTESEK-1006):
// a „Találatok pontosítása” lap (/hirfigyelo/finomhangolas) lekerül Tibor útjáról — a menüsor, a fül és a rá mutató linkek eltűnnek, a lap
// kódja és az útja MEGMARAD (nem törlünk: EGYUTTMUKODES „meglévő funkciót elvenni” — a lap címmel továbbra is elérhető).
// Tiszta próba (nincs kiszolgáló, nincs adatbázis): a forrásból olvasva.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const APP = new URL("../app/", import.meta.url).pathname;
// a keret egy JSX-fájl (a próbakörnyezet nem tölti be) — a két állandót a forrásból olvassuk
const KERET = readFileSync(join(APP, "hirfigyelo/_kozos/HirfigyeloKeret.tsx"), "utf8");
const ELERHETO_LAPOK = new Set([...(KERET.match(/ELERHETO_LAPOK[^=]*= new Set<HfLap>\(\[([^\]]*)\]\)/)?.[1] ?? "").matchAll(/"([a-z]+)"/g)].map((m) => m[1]!));
const LAP_UT_FINOM = KERET.match(/finomhangolas: "([^"]+)"/)?.[1];

function fajlok(mappa: string, ki: string[] = []): string[] {
  for (const n of readdirSync(mappa)) {
    const p = join(mappa, n);
    if (statSync(p).isDirectory()) fajlok(p, ki);
    else if (/\.tsx?$/.test(n)) ki.push(p);
  }
  return ki;
}

describe("Találatok pontosítása — le Tibor útjáról, a lap megmarad", () => {
  it("a Hírek fülsorában nincs „Pontosítás” fül", () => {
    expect(ELERHETO_LAPOK.size, "az állandó a forrásban megtalálható").toBeGreaterThan(0);
    expect(ELERHETO_LAPOK.has("finomhangolas")).toBe(false);
    expect([...ELERHETO_LAPOK].sort()).toEqual(["attekintes", "beallitas"]);
  });

  it("egyetlen lap sem linkel rá (a lap saját mappáján és az API-n kívül)", () => {
    const linkek: string[] = [];
    for (const f of fajlok(APP)) {
      if (f.includes("/hirfigyelo/finomhangolas/") || f.includes("/app/api/")) continue;
      const s = readFileSync(f, "utf8");
      if (/href=\{?["'`]\/hirfigyelo\/finomhangolas/.test(s) || /LAP_UT\.finomhangolas/.test(s)) linkek.push(f.slice(APP.length));
    }
    expect(linkek).toEqual([]);
  });

  it("a Hírek „Beállítások” menüjéből kikerült a sor, a többi három megvan", () => {
    const hirek = readFileSync(join(APP, "hirfigyelo/R15Hirek.tsx"), "utf8");
    expect(hirek).not.toContain("r15.hirek.pontositas");
    for (const k of ["r15.hirek.miert_ezek", "r15.hirek.mit_figyeljunk", "r15.hirek.elmentett"]) expect(hirek).toContain(k);
  });

  it("a Mit figyeljünk lapon nincs „Mit találtunk eddig?” link", () => {
    const lap = readFileSync(join(APP, "hirfigyelo/beallitas/Beallitas.tsx"), "utf8");
    expect(lap).not.toContain("r15.mit.mit_talaltunk");
  });

  it("a lap kódja és az útja megmaradt (nem törlés, csak elrejtés)", () => {
    expect(LAP_UT_FINOM).toBe("/hirfigyelo/finomhangolas");
    expect(existsSync(join(APP, "hirfigyelo/finomhangolas/page.tsx"))).toBe(true);
    expect(existsSync(join(APP, "hirfigyelo/finomhangolas/Finomhangolas.tsx"))).toBe(true);
    expect(existsSync(join(APP, "api/hirfigyelo/finomhangolas/route.ts"))).toBe(true);
  });
});
