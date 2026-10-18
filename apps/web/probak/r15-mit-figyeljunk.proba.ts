// R-15 · 06 Mit figyeljünk (design/R15/rajz/R15-lapok-3.dc.html; gepezet-3 3; kerdesek-3 3, 5 — Csilla 10-01: jóváhagyva).
// Tiszta próba (nincs kiszolgáló, nincs adatbázis): a lap döntései (mitFigyeljunk.ts), és a forrásból olvasva, hogy
//  - a régi gépezet MINDEN útja megmaradt (a „HOVA KERÜLT” lista: semmi nem veszett el, csak máshol van),
//  - a fejlesztői szavak (modul, v1, Pontosítás, Mentett beállítás, Hírfigyelés) kulcsai nem kerülnek a képernyőre,
//  - minden használt feliratkulcs megvan egy migrációban, hu/ro/en.
import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { allapotKulcs, forrasSorrend, mitFigyeljunkNezet, voltKeszKereses } from "../app/hirfigyelo/beallitas/mitFigyeljunk";

const gy = (ut: string) => new URL(`../../../${ut}`, import.meta.url).pathname;
const LAP = ["apps/web/app/hirfigyelo/beallitas/Beallitas.tsx", "apps/web/app/hirfigyelo/beallitas/Forrasok.tsx", "apps/web/app/hirfigyelo/beallitas/mitFigyeljunk.ts"]
  .map((f) => readFileSync(gy(f), "utf8")).join("\n");
const MIG = gy("apps/web/adatbazis/migraciok/");
const osszes = readdirSync(MIG).filter((f) => f.endsWith(".sql")).sort().map((f) => readFileSync(MIG + f, "utf8")).join("\n");
// minden feliratkulcs-alakú szövegliterál (t("…") hívás, a `mezo("…")` segéd első és utolsó paramétere, a HIBA_FELIRAT tábla, …)
const kulcsok = [...new Set([...LAP.matchAll(/["'`]((?:r15|hf|kozos)\.[a-zA-Z0-9_.]+)["'`]/g)].map((m) => m[1]!))].sort();
const beallitas = (mod: "kezi" | "napi") => ({ idozites: { mod, ora: 7, perc: 0, idozona: "Europe/Bucharest" } });

describe("06 Mit figyeljünk — a lap döntései", () => {
  it("06a, ha a reggeli figyelés ki van kapcsolva; 06b, ha be", () => {
    expect(mitFigyeljunkNezet(beallitas("kezi"))).toBe("06a");
    expect(mitFigyeljunkNezet(beallitas("napi"))).toBe("06b");
  });
  it("„Jó így, kezdjük”: a próbát csak akkor futtatja, ha még nem volt lezárt keresés", () => {
    expect(voltKeszKereses([])).toBe(false);
    expect(voltKeszKereses([{ allapot: "hiba" }, { allapot: "fut" }, { allapot: "indul" }])).toBe(false);
    expect(voltKeszKereses([{ allapot: "hiba" }, { allapot: "kesz" }])).toBe(true);
    expect(voltKeszKereses([{ allapot: "reszleges" }])).toBe(true);
    expect(voltKeszKereses([{ allapot: "ai_fuggoben" }])).toBe(true);
  });
  it("rendben lévő oldalnak nincs állapotsora; bajnál egy emberi mondat (T3: forrás-állapot nem látszik)", () => {
    expect(allapotKulcs({ allapot: "hasznalhato" })).toBeNull();
    expect(allapotKulcs({ allapot: "ellenorzes_alatt" })).toBe("r15.mit.ellenorizzuk");
    expect(allapotKulcs({ allapot: "hibas" })).toBe("r15.mit.oldal_nem_nyilt");
    expect(allapotKulcs({ allapot: "nem_tamogatott" })).toBe("r15.mit.nem_figyelheto");
    expect(allapotKulcs({ allapot: "korlatozott" })).toBe("hf.forras_korlatozott");
  });
  it("egy lista: a kézi oldalak elöl, a gép javasoltak a végén, a sorrendjük megmarad", () => {
    const l = [{ eredet: "ai_javaslat" as const, n: "epitkezes.ro" }, { eredet: "kezi" as const, n: "maszol.ro" }, { eredet: "kezi" as const, n: "szekelyhon.ro" }, { eredet: "ai_javaslat" as const, n: "zi-de-zi.ro" }];
    expect(forrasSorrend(l).map((x) => x.n)).toEqual(["maszol.ro", "szekelyhon.ro", "epitkezes.ro", "zi-de-zi.ro"]);
  });
});

describe("06 Mit figyeljünk — semmi nem veszett el (rajz: A MAI LAPON VAN → HOVA KERÜLT)", () => {
  it("a régi gépezet minden útja megvan", () => {
    for (const ut of [
      "/api/hirfigyelo/beallitas", "/api/hirfigyelo/beallitas/tervezet", "/api/hirfigyelo/beallitas/javaslat", "/api/hirfigyelo/futas",
      "/api/hirfigyelo/forrasok", "/ellenoriz", "/api/r15/napi-figyeles",
    ]) expect(LAP, ut).toContain(ut);
    // a mentés továbbra is magától megy (800 ms), sorban, időkorláttal; a próbakeresés a sor-várakozással
    expect(LAP).toContain("setTimeout(async () => {");
    expect(LAP).toMatch(/mentoSor</);
    expect(LAP).toContain("varjSor(");
    // a bekapcsolás és a kikapcsolás is
    expect(LAP).toMatch(/hfKeres\("\/api\/r15\/napi-figyeles", "PUT"/);
    expect(LAP).toMatch(/hfKeres\("\/api\/r15\/napi-figyeles", "DELETE"\)/);
  });
  it("minden régi mező és művelet megvan, emberi kérdéssel", () => {
    for (const k of [
      "r15.mit.kit_kerdes", "r15.mit.mas_neven", "r15.mit.hol", "r15.mit.nem_erdekel", "r15.mit.ha_mast_jelent", // saját név + a négy pontosító mező
      // 2026-10-06 (Kati #17, Csilla #40 — döntés: a Találatok pontosítása lekerül Tibor útjáról): a „Mit találtunk eddig?” link nincs
      // többé a lapon, ezért a r15.mit.mit_talaltunk kikerült ebből a listából; a lap és az útja megmarad (külön próba: r15-pontositas-rejtve).
      "r15.mit.keress_most", "r15.mit.mast_javasolj", "r15.mit.mentve", "r15.mit.korlat", "r15.mit.oszinte",
      "r15.mit.oldal_szamlalo", "r15.mit.felbehagytad", "r15.mit.a_mostanit", "r15.mit.reggeli_ki",
      "hf.forras_cim_modositas", "hf.forras_eltavolitas", "hf.forras_ujraprobalas", "hf.forras_hozzaadas", "hf.forras_korlat_mondat", "hf.tema_eltavolitas",
    ]) expect(kulcsok, k).toContain(k);
  });
  it("a fejlesztői szavak kulcsai nem kerülnek a képernyőre (modul, v1, Pontosítás, Mentett beállítás, Hírfigyelés)", () => {
    for (const k of ["hf.modTag", "hf.modTitle", "hf.suActive", "hf.suDraft", "hf.beallitas_cim", "hf.ful_beallitas", "hf.ful_pontositas", "hf.pontositas_szakasz", "hf.srcGroupAi", "hf.srcAiWarn", "hf.trialDone", "hf.schDaily", "hf.futas_hiba"]) {
      expect(kulcsok, k).not.toContain(k);
    }
    expect(LAP).toContain("fulsor={false}");
  });
  it("a régi próbák jele (data-screen-label) a helyén", () => {
    expect(LAP).toContain('data-screen-label="HF-II Figyelés beállítása"');
  });
  it("minden használt feliratkulcs megvan egy migrációban, hu/ro/en (a hf.* kulcsokat is a migrációk hozzák: tools/feliratok/general.mjs)", () => {
    expect(kulcsok.length).toBeGreaterThan(40);
    const hiany: string[] = [];
    for (const k of kulcsok) for (const ny of ["hu", "ro", "en"]) if (!osszes.includes(`('${k}', '${ny}',`)) hiany.push(`${k} (${ny})`);
    expect(hiany).toEqual([]);
  });
});
