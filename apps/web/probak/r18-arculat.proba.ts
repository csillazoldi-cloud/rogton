// R-18 arculatfrissítés (Csilla 2026-10-11): fájlolvasás + a lap HTML-je (ha fut próbakörnyezet). A képernyőképek és a rajzzal való
// összevetés: design/R18-arculatfrissites/epitett/.
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { r18BetuFajlok } from "@rogton/design-system";

const gy = (ut: string) => new URL(`../../../${ut}`, import.meta.url).pathname;
const olvas = (ut: string) => readFileSync(gy(ut), "utf8");

describe("R-18 arculatfrissítés", () => {
  it("0163: a 9 új kulcs mindhárom nyelven, a feliratfájl szövegével", () => {
    const f = JSON.parse(olvas("design/R18-arculatfrissites/feliratok.json")) as Record<"hu" | "ro" | "en", Record<string, string>>;
    const m = olvas("apps/web/adatbazis/migraciok/0163_r18_arculatfrissites_feliratok.sql");
    expect(Object.keys(f.hu)).toHaveLength(9);
    for (const ny of ["hu", "ro", "en"] as const) {
      for (const [k, v] of Object.entries(f[ny])) expect(m).toContain(`('${k}', '${ny}', '${v.replace(/'/g, "''")}')`);
    }
    expect(f.hu["fejlec.termeknev"]).toBe("Posztgyár");
    expect(f.ro["nav.cegeim"]).toBe("Companiile mele");
  });

  it("a lap feje: mód-szkript festés előtt, saját betűk, a mód blokkja a hatásos tokenek UTÁN, a fényudvar a lap alján", () => {
    const l = olvas("apps/web/app/layout.tsx");
    expect(l).toContain("<script dangerouslySetInnerHTML={{ __html: MOD_FEJ_SZKRIPT }} />");
    expect(l.indexOf('id="km-tokenek"')).toBeLessThan(l.indexOf('id="km-modok"'));
    expect(l).toContain('<style id="km-betuk">{betuCss("/betuk")}</style>');
    expect(l).toContain('className="km-aurora"');
    expect(l).not.toMatch(/fonts\.googleapis\.com[^"]*(Inter|JetBrains)/);
    const m = olvas("apps/web/app/_kozos/mod.ts");
    expect(m).toContain("localStorage.getItem");
    expect(m).toMatch(/try\{m=window\.localStorage/);
  });

  it("a saját betűfájlok mind megvannak (latin + latin-ext)", () => {
    for (const f of r18BetuFajlok()) expect(existsSync(gy(`apps/web/public/betuk/${f}`)), f).toBe(true);
    // G4 (Rögtön, 2026-10-18): a régi halvány márkafelirat két PNG-je kikerült (a régi cégnevet hordozták, a fájlnevük is) — most az
    // a próba, hogy NINCSENEK meg; az a/t jel két PNG-je G5-ig marad.
    for (const f of ["at-jel-szines.png", "at-jel-tinta.png"]) expect(existsSync(gy(`apps/web/public/r18/${f}`)), f).toBe(true);
    for (const f of ["aitmetica-szurke.png", "aitmetica-tinta.png"]) expect(existsSync(gy(`apps/web/public/r18/${f}`)), f).toBe(false);
  });

  it("a felső sáv: Profil menü, Cégeim csak egynél több cégnél, harang a régi Értesítések helyett, mód-váltó; semmi nem tűnt el", () => {
    const s = olvas("apps/web/app/_kozos/FelsoSav.tsx");
    expect(s).toContain("const tobbCeg = adat.munkaterek.length > 1;");
    expect(s).toContain('t("nav.profil")');
    expect(s).toContain('t("nav.cegeim")');
    expect(s).toContain('<ModValto valtozat="gomb" />');
    expect(s).toContain('<ModValto valtozat="sor" />');
    expect(s).toContain('"/api/szervezet/valt"');
    // minden korábbi cél elérhető marad
    for (const ut of ["/kezdolap", "/hirfigyelo", "/poszt", "/kepek", "/iranytu", "/fiok", "/gephaz", "/beallitasok", "/sajat-fiok", "/tagok", "/visszajelzes"]) {
      expect(s, ut).toContain(`href="${ut}"`);
    }
    expect(s).toContain("VISSZAJELZES_INDIT");
    expect(s).toContain("<KilepesGomb />");
    expect(s).toContain("<Nyelvvalaszto");
  });

  it("élő lap (ha van próbakörnyezet): a belépőlap HTML-jében a mód blokkja és a fényudvar", async () => {
    const cim = process.env.PROBA_CIM;
    if (!cim) return;
    const v = await fetch(`${cim}/belepes`);
    const html = await v.text();
    expect(html).toContain('<style id="km-modok">');
    expect(html).toContain(':root[data-mod="vilagos"]{');
    expect(html).toContain("--primary:#4b09d8");
    expect(html).toContain("@font-face{font-family:");
    expect(html).toContain('class="km-aurora"');
    expect(html).not.toContain("km-sav"); // a belépés előtti lapon nincs felső sáv (kezdolap.proba 11, tagok-lap.proba 7)
  });
});
