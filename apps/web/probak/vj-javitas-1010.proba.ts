// Kati visszajelzései 10-10 — javítás (design/R15/VISSZAJELZES-TRIAZS-1010.html; Csilla 10-10 19:56). Fájlolvasás, adatbázis nélkül:
//  · 0159 pontosan a feliratok-7.json kulcsa × 3 nyelv, ÚJ kulcs; T3 tiltott szó nincs;
//  · #10 a Kezdőlap a meglévő „Képet készítek a munkámról” címkét használja, #5 a Posztszöveg az újat (a régi r15.kep.uj_kep egyiken sem);
//  · #11 a Visszajelzés buborék szélessége a kerettel együtt értendő (box-sizing), telefonon a sáv tördel;
//  · #7 a román mező többsoros; #4 a Hírek kártyáján halk forrás-sor (Info, csak a domain — a kártya meglévő forras_nev mezője).
import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

const gy = (ut: string) => new URL(`../../../${ut}`, import.meta.url).pathname;
const olvas = (ut: string) => readFileSync(gy(ut), "utf8");
const MIG = gy("apps/web/adatbazis/migraciok/");

describe("Kati 10-10 javítások", () => {
  it("0159: a feliratok-7.json kulcsa × 3 nyelv, betűre, új kulcs, tiltott szó nélkül", () => {
    const fajl = JSON.parse(olvas("design/R15/feliratok-7.json")) as Record<"hu" | "ro" | "en", Record<string, string>>;
    const m = olvas("apps/web/adatbazis/migraciok/0159_vj_javitas_1010_feliratok.sql");
    const korabbi = readdirSync(MIG).filter((f) => f.endsWith(".sql") && f < "0159").map((f) => readFileSync(MIG + f, "utf8")).join("\n");
    expect(Object.keys(fajl.hu)).toEqual(["r15.kep.kep_ehhez_poszthoz"]);
    for (const ny of ["hu", "ro", "en"] as const) for (const [k, v] of Object.entries(fajl[ny])) {
      expect(m).toContain(`('${k}', '${ny}', '${v.replace(/'/g, "''")}')`);
      expect(/ai-javaslat|ai-keret|\bmodul|verzió|token/i.test(v)).toBe(false);
    }
    expect(korabbi.includes("('r15.kep.kep_ehhez_poszthoz', 'hu',")).toBe(false);
    expect(korabbi.includes("('r15.kozos.kepet_keszitek_munka', 'hu',")).toBe(true);
  });
  it("#10 / #5: a két link a pontos címkét kapja", () => {
    const k = olvas("apps/web/app/kezdolap/R15Kezdolap.tsx");
    expect(k).not.toContain('t("r15.kep.uj_kep")');
    expect(k.match(/t\("r15\.kozos\.kepet_keszitek_munka"\)/g)?.length).toBe(2);
    const p = olvas("apps/web/app/poszt/R15KepHely.tsx");
    expect(p).toContain('t("r15.kep.kep_ehhez_poszthoz")');
    // R-18 6. kör (Kati F, Csilla 10-11 „Majestic, build this baby”): a posztból a kép előbb a sablon-lépésre visz (javasolt sablon kijelölve),
    // és csak „Ezzel folytatom” után a szerkesztőbe — a link ezért /kepek?poszt=, nem közvetlenül a hír-sablon
    expect(p).toContain("/kepek?poszt=");
  });
  it("#11: telefonon a buborék box-sizing: border-box, és a jelölő sáv tördel", () => {
    const c = olvas("packages/visszajelzes-react/src/stilus.css");
    // csak telefonon (asztalon a buborék szélessége változatlan marad — Csilla 19:56: „desktop unchanged”)
    expect(c).toMatch(/@media \(max-width: 640px\) \{[\s\S]*?\.km-vj-bub \{ box-sizing: border-box; \}[\s\S]*?\.km-vj-sav \{ flex-wrap: wrap;/);
  });
  it("#7: a román mező többsoros, #4: forrás-sor a Hírek kártyáján", () => {
    const k = olvas("apps/web/app/kepek/Kitolto.tsx");
    // Kati 10-11: a román változat mezőnként fordít (a kép minden szövege románul) — a többsoros NovoMezo most mezőnként áll, a román értékkel
    expect(k).toContain("<NovoMezo ertek={roMezok[k.mezo]");
    expect(k).toMatch(/<textarea ref=\{ref\} className="km-vz2-mezo km-vz2-ro-mezo" rows=\{2\}/);
    const h = olvas("apps/web/app/hirfigyelo/R15Hirek.tsx");
    expect(h).toContain('<Info osztaly="r15h-forras r15-csak-asztal">{k.forras_nev}</Info>'); // csak a domain, csak asztalon (T5 — mérés a kódban)
  });
});
