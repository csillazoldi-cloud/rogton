// R-15 c5 3. kör (design/R15/rajz/R15-lapok-6.dc.html; Csilla 10-10 21:02–21:03) + a fájlkorlát 100 MB (Csilla 10-10). Fájlolvasás, adatbázis nélkül:
//  · 0160 pontosan a feliratok-8.json kulcsai × 3 nyelv, betűre; „Még {n} javaslat”; T3 tiltott szó nincs; a 10 MB-os régi kulcsok maradnak;
//  · Kezdőlap: a csempék elöl (div role=navigation, a négy lap), telefonon minden „Még vár” sor a link mögött;
//  · 13/14: ikonok a sorok előtt (a tulajdonos nézetén és a kapcsolóknál);
//  · feltöltés: a nem-betű út lemezre ír (torzsFajlba), nincs `arrayBuffer()` a feltöltő végpontokon; a hibaszöveg célonként (100 / 10 MB);
//  · nginx: csak az /api/arculat/fajl kap 105m-et, az alap 12m marad.
import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

const gy = (ut: string) => new URL(`../../../${ut}`, import.meta.url).pathname;
const olvas = (ut: string) => readFileSync(gy(ut), "utf8");
const MIG = gy("apps/web/adatbazis/migraciok/");

describe("c5 3. kör + 100 MB", () => {
  it("0160: a feliratok-8.json kulcsai × 3 nyelv, betűre; tiltott szó nélkül", () => {
    const fajl = JSON.parse(olvas("design/R15/feliratok-8.json")) as Record<"hu" | "ro" | "en", Record<string, string>>;
    const m = olvas("apps/web/adatbazis/migraciok/0160_r15_c5_kor3_feliratok.sql");
    expect(Object.keys(fajl.hu).length).toBe(8);
    expect((m.match(/^ {2}\('/gm) ?? []).length).toBe(24);
    for (const ny of ["hu", "ro", "en"] as const) for (const [k, v] of Object.entries(fajl[ny])) {
      expect(m).toContain(`('${k}', '${ny}', '${v.replace(/'/g, "''")}')`);
      expect(/ai-javaslat|ai-keret|\bmodul|verzió|token/i.test(v)).toBe(false);
    }
    expect(fajl.hu["r15.kezdolap.meg_apro"]).toBe("Még {n} javaslat");
    for (const ny of ["hu", "ro", "en"] as const) {
      expect(fajl[ny]["fajl.hiba_tul_nagy_100"]).toContain("100 MB");
      expect(fajl[ny]["arculat_fajl.tipusok"]).toContain("100 MB");
    }
    // a 10 MB-os kulcsok maradnak (betű, posztkép) — a 0160 nem írja át őket
    const korabbi = readdirSync(MIG).filter((f) => f.endsWith(".sql") && f < "0160").map((f) => readFileSync(MIG + f, "utf8")).join("\n");
    for (const k of ["fajl.hiba_tul_nagy", "arculat_fajl.nagy_mit", "arculat_fajl.halozat_mit"]) {
      expect(korabbi).toContain(`('${k}', 'hu',`);
      expect(m).not.toContain(`('${k}', 'hu',`);
    }
  });

  it("a rajzok a „javaslat” szót mutatják, az „apróság” link nincs", () => {
    for (const r of ["R15-lapok-6.dc.html", "R15-lapok-5.dc.html", "R15-lapok-2.dc.html", "R15-lapok-1.dc.html"]) {
      expect(olvas(`design/R15/rajz/${r}`)).not.toMatch(/data-felirat="r15\.kezdolap\.meg_apro"[^>]*>[^<]*apróság/);
    }
  });

  it("Kezdőlap: a csempék elöl, a négy lap, telefonon minden sor a link mögött", () => {
    const c = olvas("apps/web/app/_kozos/R15Csempek.tsx");
    expect(c).toContain('role="navigation"');
    expect(c.replace(/^\s*\/\/.*$/gm, "")).not.toMatch(/<nav[\s>]/); // a megjegyzés említheti
    for (const h of ["/hirfigyelo", "/poszt", "/kepek", "/iranytu"]) expect(c).toContain(`href: "${h}"`);
    const k = olvas("apps/web/app/kezdolap/R15Kezdolap.tsx");
    expect(k.indexOf("<R15Csempek")).toBeLessThan(k.indexOf('className="r15-fej"'));
    expect(k).toContain("const telLathato = 0;");
    expect(k).not.toContain('t("r15.kozos.legutobb"');
  });

  it("13/14: ikonok a sorok előtt", () => {
    const g = olvas("apps/web/app/gephaz/Gephaz.tsx");
    for (const n of ["szervezet", "megjelenes", "csapat", "kredit", "halado", "penz", "meres", "kapcsolat", "szoveg"]) expect(g).toMatch(new RegExp(`"${n}"`));
    const b = olvas("apps/web/app/beallitasok/Beallitasok.tsx");
    for (const n of ["harang", "hirek", "figyelem", "kredit", "chip", "ora"]) expect(b).toContain(`"${n}"`);
  });

  it("feltöltés: lemezre írt törzs, nincs teljes memória-puffer; a hibaszöveg célonként", () => {
    const r = olvas("apps/web/app/api/arculat/fajl/route.ts");
    expect(r).not.toContain("arrayBuffer()");
    expect(r).toContain("torzsFajlba(keres, max)");
    expect(r).toContain("feltoltFajlbol(");
    expect(r).toContain("celMaxMeret(cel)");
    const k = olvas("apps/web/app/api/r15/kep/route.ts");
    expect(k).not.toContain("arrayBuffer()");
    expect(k).toContain("KEP_MAX_MERET_BAJT");
    const l = olvas("apps/web/app/api/arculat/fajl/[id]/route.ts");
    expect(l).toContain("fajlFolyam(");
    const a = olvas("apps/web/app/_kozos/ArculatAnyagok.tsx");
    expect(a).toContain('korlat10 ? "arculat_fajl.nagy_mit" : "arculat_fajl.nagy_mit_100"');
    expect(olvas("apps/web/app/fiok/arculat/betuk/Betuk.tsx")).toContain("hibaMitKulcs(hiba, true)");
  });

  // G2 (2026-10-18): a fork nginx-e az uzem/nginx.conf (a nas/ megszűnt), és az arculati fájl korlátja 95 MB a kódban (a Cloudflare
  // peremének ~100 MB-os korlátja alatt) — ezért az nginx 100m-et enged ezen az úton a régi 105m helyett. Az alap 12m változatlan.
  it("nginx: csak az /api/arculat/fajl kap 100m-et, az alap 12m marad", () => {
    const n = olvas("uzem/nginx.conf");
    expect((n.match(/client_max_body_size/g) ?? []).length).toBe(2);
    expect(n).toMatch(/\n {4}client_max_body_size 12m;/);
    expect(n).toMatch(/location = \/api\/arculat\/fajl \{\s*client_max_body_size 100m;/);
  });
});
