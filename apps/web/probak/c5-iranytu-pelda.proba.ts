// c5 · 11a (Csilla 10-10 14:09 B + 14:24 Q13 ★): a még üres Iránytű halvány példája a cég SZAKMÁJA szerint, a c15 zárt listájából.
// Minden szakma minden sorához van felirat a 0157-ben, három nyelven. Adatbázis nélkül (a migráció szövegét olvassa).
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MINTA_KATEGORIAK } from "../vizual/minta-kategoria";
import { iranytuPeldaKulcsok } from "../iranytu/pelda";

const m0157 = readFileSync(new URL("../adatbazis/migraciok/0157_r15_c5_kor1_feliratok.sql", import.meta.url), "utf8");

describe("c5 · 11a szakma szerinti példa", () => {
  it("építés → a rajz kulcsai; más szakma → _<szakma> végű kulcsok; ismeretlen / hiányzó → semleges", () => {
    expect(iranytuPeldaKulcsok("epites").kulcsok).toEqual(["r15.ir.pelda_kampany", "r15.ir.pelda_tolni", "r15.ir.pelda_cel"]);
    expect(iranytuPeldaKulcsok("vendeglatas").kulcsok).toEqual(["r15.ir.pelda_kampany_vendeglatas", "r15.ir.pelda_tolni_vendeglatas", "r15.ir.pelda_cel_vendeglatas"]);
    for (const x of [undefined, null, "", "pizzeria", 3]) {
      const p = iranytuPeldaKulcsok(x);
      expect(p.kategoria).toBe("semleges");
      expect(p.kulcsok[0]).toBe("r15.ir.pelda_kampany_semleges");
    }
  });
  it("minden szakma (8 + semleges) minden sora megvan a 0157-ben hu/ro/en nyelven", () => {
    for (const k of [...MINTA_KATEGORIAK, "semleges"]) {
      for (const kulcs of iranytuPeldaKulcsok(k).kulcsok) {
        for (const ny of ["hu", "ro", "en"]) expect(m0157.includes(`('${kulcs}', '${ny}', '`), `${kulcs} ${ny}`).toBe(true);
      }
    }
  });
});
