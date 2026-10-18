// VJ-1011 (Kati 10-10 hub-jegyzet, valódi telefon; Csilla 10-11 „proceed with the rest”). Fájlolvasás, adatbázis nélkül — az élő mérés
// a design/VJ-1011/ELOTTE-UTANA.html-ben (390 + 1440, helyi éles fordítás).
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const gy = (ut: string) => new URL(`../../../${ut}`, import.meta.url).pathname;
const olvas = (ut: string) => readFileSync(gy(ut), "utf8");

describe("VJ-1011", () => {
  it("0162: „Még {n} hír” mindhárom nyelven, a feliratfájl szövegével", () => {
    const f = JSON.parse(olvas("design/VJ-1011/feliratok.json")) as Record<"hu" | "ro" | "en", Record<string, string>>;
    const m = olvas("apps/web/adatbazis/migraciok/0162_vj_1011_feliratok.sql");
    for (const ny of ["hu", "ro", "en"] as const) expect(m).toContain(`('r15.hirek.meg_hir', '${ny}', '${f[ny]["r15.hirek.meg_hir"]!.replace(/'/g, "''")}')`);
  });
  it("#8 betűnevek: a 12e sor neve nem csak asztali; az áttekintésen a beépített betű neve a szó mellett", () => {
    const b = olvas("apps/web/app/fiok/arculat/betuk/Betuk.tsx");
    expect(b).toContain('<span className="r15-info" data-r15="info">{nev}</span>');
    expect(b).not.toContain('className="r15-info r15-csak-asztal" data-r15="info">{nev}');
    expect(olvas("apps/web/app/fiok/arculat/ArculatSzakasz.tsx")).toContain('className="r16a-betu-nev"');
  });
  it("#9 logók: a feltöltés előtt a böngésző a képre alkalmas méret (KEP_LOGO_MAX_BAJT) alá kicsinyít", () => {
    const l = olvas("apps/web/app/fiok/arculat/logok/LogokFeltoltes.tsx");
    expect(l).toContain("async function kepreMeretez(");
    expect(l).toContain("const f = await kepreMeretez(eredeti, e);");
    expect(l).toContain("KEP_LOGO_MAX_BAJT");
  });
  it("#2 kijelentkezés: nyitott menünél a sáv a lap alsó sávja fölött, a menü görget, a Nyelv · Kijelentkezés sor ragad", () => {
    const c = olvas("apps/web/app/_kozos/felsosav.css");
    expect(c).toMatch(/\.km-sav:has\(\.km-sav-telefon-menu\) \{ z-index: 72; \}/);
    expect(c).toMatch(/\.km-sav-telefon-menu \.km-sav-telefon-alul \{\s*position: sticky;/);
    // R-18 (2026-10-11, Csilla jóváhagyott rajza: A/B-profil-telefon): a ☰ menü oldalról becsúszó, TELJES magasságú lap lett — a régi
    // „100dvh − 72px” korlát (a sáv alá nyíló menühöz) helyett a lap magassága 100dvh; a görgetés és a ragadó alsó sor ugyanaz maradt.
    expect(c).toMatch(/\.km-sav-telefon-menu \{\s*height: 100dvh;\s*overflow-y: auto;/);
  });
  it("#4 Kezdőlap: telefonon a rövid nagy sor", () => {
    expect(olvas("apps/web/app/kezdolap/R15Kezdolap.tsx")).toContain('<span className="r15-csak-tel">{elso.elso_sor_rovid || elso.elso_sor || elso.forras_cim}</span>');
  });
  it("#5 Hírek: asztalon 3, telefonon 2 kártya, a többi a „Még n hír” mögött", () => {
    const h = olvas("apps/web/app/hirfigyelo/R15Hirek.tsx");
    expect(h).toContain("const LATHATO_HIR = 3;");
    expect(h).toContain("const LATHATO_HIR_TEL = 2;");
    expect(h).toContain('t("r15.hirek.meg_hir", { n: n - LATHATO_HIR })');
    expect(h).toContain('t("r15.hirek.meg_hir", { n: n - LATHATO_HIR_TEL })');
  });
});
