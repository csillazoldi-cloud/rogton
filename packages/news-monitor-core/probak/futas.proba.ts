// G4 (Rögtön, 2026-10-18): a fájl minden `idozona` értéke Europe/Bucharest → Europe/Budapest (a fork alap időzónája); ahol az eltolás
// számít (UTC+3 → UTC+2 nyáron), az elvárt UTC-időpontot újraszámoltuk, az ok a tesztnél áll.
import { describe, it, expect } from "vitest";
import {
  indithato,
  futasAtmenet,
  utolsoSikeres,
  kovetkezoFutas,
  esedekes,
} from "../src/index";

const MOST = new Date("2026-09-07T10:00:00Z");

function alapFutas(allapot: "indul" | "fut" | "kesz" | "reszleges" | "hiba" | "ai_fuggoben"): ReturnType<typeof import("../src/index").Futas.parse> {
  return {
    id: "f-1",
    szervezet_id: "sz-1",
    szabaly_verzio: 1,
    kezdet: "2026-09-07T09:00:00Z",
    veg: allapot === "indul" || allapot === "fut" ? null : "2026-09-07T09:30:00Z",
    allapot,
    uj_talalatok: 0,
    hibas_forrasok: [],
    proba: false,
  };
}

describe("E-19/6 futas — indithato, atmenetek, utolsoSikeres, kovetkezoFutas", () => {
  describe("6.1 indithato — dupla inditas tiltva", () => {
    it("6.1.1 null mellett igaz", () => {
      expect(indithato(null)).toBe(true);
    });

    it("6.1.2 'indul' allapot mellett hamis", () => {
      expect(indithato(alapFutas("indul"))).toBe(false);
    });

    it("6.1.3 'fut' allapot mellett hamis", () => {
      expect(indithato(alapFutas("fut"))).toBe(false);
    });

    it("6.1.4 'kesz' allapot mellett igaz", () => {
      expect(indithato(alapFutas("kesz"))).toBe(true);
    });

    it("6.1.5 'hiba' allapot mellett igaz", () => {
      expect(indithato(alapFutas("hiba"))).toBe(true);
    });
  });

  describe("6.2 futasAtmenet — allapotatmenetek", () => {
    it("6.2.1 kezd: indul → fut", () => {
      const indul = alapFutas("indul");
      const eredmeny = futasAtmenet(indul, { fajta: "kezd" }, MOST);
      expect(eredmeny.allapot).toBe("fut");
      expect(eredmeny.veg).toBeNull();
    });

    it("6.2.2 forras_hiba gyujt", () => {
      const fut = { ...alapFutas("fut"), allapot: "fut" as const };
      const f1 = futasAtmenet(fut, { fajta: "forras_hiba", forras_id: "fr-1", ok: "timeout" }, MOST);
      expect(f1.hibas_forrasok).toHaveLength(1);
      expect(f1.hibas_forrasok[0]).toEqual({ forras_id: "fr-1", ok: "timeout" });

      const f2 = futasAtmenet(f1, { fajta: "forras_hiba", forras_id: "fr-2", ok: "404" }, MOST);
      expect(f2.hibas_forrasok).toHaveLength(2);
    });

    it("6.2.3 vege: minden forras hibas → hiba", () => {
      const fut = { ...alapFutas("fut"), allapot: "fut" as const, hibas_forrasok: [{ forras_id: "fr-1", ok: "x" }] };
      const eredmeny = futasAtmenet(fut, { fajta: "vege", uj_talalatok: 0, osszesForras: 1 }, MOST);
      expect(eredmeny.allapot).toBe("hiba");
      expect(eredmeny.veg).toEqual(MOST.toISOString());
    });

    it("6.2.4 vege: egy hibas → reszleges", () => {
      const fut = { ...alapFutas("fut"), allapot: "fut" as const, hibas_forrasok: [{ forras_id: "fr-1", ok: "x" }] };
      const eredmeny = futasAtmenet(fut, { fajta: "vege", uj_talalatok: 2, osszesForras: 2 }, MOST);
      expect(eredmeny.allapot).toBe("reszleges");
    });

    it("6.2.5 vege: ai_hiba volt → ai_fuggoben", () => {
      const fut = { ...alapFutas("fut"), allapot: "fut" as const };
      const aiHiba = futasAtmenet(fut, { fajta: "ai_hiba" }, MOST);
      const eredmeny = futasAtmenet(aiHiba, { fajta: "vege", uj_talalatok: 3, osszesForras: 3 }, MOST);
      expect(eredmeny.allapot).toBe("ai_fuggoben");
    });

    it("6.2.6 vege: hibatlan → kesz", () => {
      const fut = { ...alapFutas("fut"), allapot: "fut" as const };
      const eredmeny = futasAtmenet(fut, { fajta: "vege", uj_talalatok: 5, osszesForras: 3 }, MOST);
      expect(eredmeny.allapot).toBe("kesz");
    });
  });

  describe("6.3 utolsoSikeres — kesz/reszleges legkesobbi, mentes nem futas", () => {
    it("6.3.1 ures lista → null", () => {
      expect(utolsoSikeres([])).toBeNull();
    });

    it("6.3.2 csak hiba → null", () => {
      expect(utolsoSikeres([alapFutas("hiba")])).toBeNull();
    });

    it("6.3.3 kesz kozul a legkesobbi", () => {
      const k1 = { ...alapFutas("kesz"), veg: "2026-09-07T08:00:00Z" };
      const k2 = { ...alapFutas("kesz"), veg: "2026-09-07T09:00:00Z" };
      expect(utolsoSikeres([k1, k2])).toEqual(k2);
    });

    it("6.3.4 reszleges is sikeres", () => {
      const r = { ...alapFutas("reszleges"), veg: "2026-09-07T10:00:00Z" };
      const k = { ...alapFutas("kesz"), veg: "2026-09-07T09:00:00Z" };
      expect(utolsoSikeres([k, r])).toEqual(r);
    });

    it("6.3.5 ai_fuggoben nem sikeres", () => {
      const a = { ...alapFutas("ai_fuggoben"), veg: "2026-09-07T11:00:00Z" };
      const k = { ...alapFutas("kesz"), veg: "2026-09-07T09:00:00Z" };
      expect(utolsoSikeres([k, a])).toEqual(k);
    });

    // SPEC-KÉRDÉS: a spec szerint "A mentés nem futás" — ez itt csak azt jelenti, hogy a mentés művelet nem futás entitás,
    // tehát nem szerepelhet a futasok listában; a próba ennek megfelelően csak futás-entitásokat vizsgál.
  });

  describe("6.4 kovetkezoFutas — idozites szerint", () => {
    it("6.4.1 kezi → null", () => {
      const idozites = { mod: "kezi" as const, ora: 7, perc: 0, idozona: "Europe/Budapest" };
      expect(kovetkezoFutas(idozites, MOST)).toBeNull();
    });

    // G4 (Rögtön, 2026-10-18): az időzóna Europe/Budapest (CEST, UTC+2 nyáron) a régi Europe/Bucharest (EEST, UTC+3) helyett —
    // ugyanaz a szabály (07:00 helyi idő), egy órával későbbi UTC-időpont: 07:00 helyi = 05:00Z.
    it("6.4.2 napi, most=10:00Z (12:00 helyi) → holnapi 05:00Z", () => {
      // 2026-09-07 10:00Z = 12:00 CEST (UTC+2, nyári idő); 07:00 helyi = 05:00Z
      const idozites = { mod: "napi" as const, ora: 7, perc: 0, idozona: "Europe/Budapest" };
      const eredmeny = kovetkezoFutas(idozites, MOST);
      expect(eredmeny).toEqual(new Date("2026-09-08T05:00:00Z"));
    });

    it("6.4.3 napi, most=03:00Z (05:00 helyi) → mai 05:00Z", () => {
      const mostKorai = new Date("2026-09-07T03:00:00Z"); // 05:00 helyi
      const idozites = { mod: "napi" as const, ora: 7, perc: 0, idozona: "Europe/Budapest" };
      const eredmeny = kovetkezoFutas(idozites, mostKorai);
      expect(eredmeny).toEqual(new Date("2026-09-07T05:00:00Z"));
    });
  });
});

describe("E-22/3 esedekes — idozites es utolsoKezdet alapjan", () => {
  it("3.1 kezi → hamis", () => {
    const idozites = { mod: "kezi" as const, ora: 7, perc: 0, idozona: "Europe/Budapest" };
    expect(esedekes(idozites, null, new Date("2026-09-07T05:00:00Z"))).toBe(false);
  });

  // G4 (Rögtön): Europe/Budapest (UTC+2 nyáron) — a régi Bucharest-időpontok egy órával későbbre kerülnek, hogy a jelentésük ugyanaz maradjon
  it("3.2 napi 07:00 Budapest, most 06:00Z (08:00 helyi), utolso null → igaz", () => {
    const idozites = { mod: "napi" as const, ora: 7, perc: 0, idozona: "Europe/Budapest" };
    expect(esedekes(idozites, null, new Date("2026-09-07T06:00:00Z"))).toBe(true);
  });

  it("3.3 utolso ma 05:10Z (07:10 helyi) → hamis (már futott ma)", () => {
    const idozites = { mod: "napi" as const, ora: 7, perc: 0, idozona: "Europe/Budapest" };
    const utolso = new Date("2026-09-07T05:10:00Z");
    expect(esedekes(idozites, utolso, new Date("2026-09-07T06:00:00Z"))).toBe(false);
  });

  it("3.4 most 03:00Z (05:00 helyi, még nem múlt el) → hamis", () => {
    const idozites = { mod: "napi" as const, ora: 7, perc: 0, idozona: "Europe/Budapest" };
    expect(esedekes(idozites, null, new Date("2026-09-07T03:00:00Z"))).toBe(false);
  });
});
