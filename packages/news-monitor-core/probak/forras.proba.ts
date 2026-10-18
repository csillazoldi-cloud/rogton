import { describe, it, expect } from "vitest";
import {
  cimKiegeszit,
  forrasCimOsztalyoz,
  kanonikusUrl,
  forrasEllenorzesEredmeny,
} from "../src/index";

const MOST = new Date("2026-09-07T10:00:00Z");

describe("forras.ts — cim osztalyozas, kanonikus URL, ellenorzes (E-19)", () => {
  it("2.1: facebook.com → nem_tamogatott + belepes_mogott", () => {
    const eredmeny = forrasCimOsztalyoz("https://facebook.com/csoport");
    expect(eredmeny.allapot).toBe("nem_tamogatott");
    expect(eredmeny.ok).toBe("belepes_mogott");
  });

  it("2.2: m.facebook.com → nem_tamogatott + belepes_mogott", () => {
    const eredmeny = forrasCimOsztalyoz("https://m.facebook.com/post");
    expect(eredmeny.allapot).toBe("nem_tamogatott");
    expect(eredmeny.ok).toBe("belepes_mogott");
  });

  it("2.3: instagram → nem_tamogatott + belepes_mogott", () => {
    const eredmeny = forrasCimOsztalyoz("https://instagram.com/p/abc");
    expect(eredmeny.allapot).toBe("nem_tamogatott");
    expect(eredmeny.ok).toBe("belepes_mogott");
  });

  it("2.4: x.com → nem_tamogatott + belepes_mogott", () => {
    const eredmeny = forrasCimOsztalyoz("https://x.com/felhasznalo/status/123");
    expect(eredmeny.allapot).toBe("nem_tamogatott");
    expect(eredmeny.ok).toBe("belepes_mogott");
  });

  it("2.5: http://localhost → nem_nyilvanos", () => {
    const eredmeny = forrasCimOsztalyoz("http://localhost:3000/api");
    expect(eredmeny.allapot).toBe("nem_tamogatott");
    expect(eredmeny.ok).toBe("nem_nyilvanos");
  });

  it("2.6: http://192.168.1.5 → nem_nyilvanos", () => {
    const eredmeny = forrasCimOsztalyoz("http://192.168.1.5/oldal");
    expect(eredmeny.allapot).toBe("nem_tamogatott");
    expect(eredmeny.ok).toBe("nem_nyilvanos");
  });

  it("2.7: ftp://… → nem_nyilvanos", () => {
    const eredmeny = forrasCimOsztalyoz("ftp://pelda.hu/fajl.txt");
    expect(eredmeny.allapot).toBe("nem_tamogatott");
    expect(eredmeny.ok).toBe("nem_nyilvanos");
  });

  it("2.8: nem url → ervenytelen", () => {
    const eredmeny = forrasCimOsztalyoz("ez nem egy url");
    expect(eredmeny.allapot).toBe("nem_tamogatott");
    expect(eredmeny.ok).toBe("ervenytelen");
  });

  it("2.9: https://pelda.hu/feed → rss", () => {
    const eredmeny = forrasCimOsztalyoz("https://pelda.hu/feed");
    expect(eredmeny.tipus).toBe("rss");
    expect(eredmeny.allapot).toBe("ellenorzes_alatt");
    expect(eredmeny.ok).toBeNull();
  });

  it("2.10: https://pelda.hu/hirek → null tipus, ellenorzes_alatt", () => {
    const eredmeny = forrasCimOsztalyoz("https://pelda.hu/hirek");
    expect(eredmeny.tipus).toBeNull();
    expect(eredmeny.allapot).toBe("ellenorzes_alatt");
    expect(eredmeny.ok).toBeNull();
  });

  it("2.11: kanonikusUrl — utm_ es fbclid kiszures, toredek le, parameterek rendezve, zaro / le, gazda kisbetus", () => {
    const eredmeny = kanonikusUrl("https://PELDA.HU/cikk?utm_source=email&b=2&a=1&fbclid=abc#resz");
    expect(eredmeny).toBe("https://pelda.hu/cikk?a=1&b=2");
  });

  it("2.12: kanonikusUrl — gyoker utani / marad", () => {
    const eredmeny = kanonikusUrl("https://pelda.hu/");
    expect(eredmeny).toBe("https://pelda.hu/");
  });

  it("2.13: kanonikusUrl — hibas URL → Error", () => {
    expect(() => kanonikusUrl("nem url")).toThrow();
  });

  it("2.14: forrasEllenorzesEredmeny — hasznalhato + utolso_sikeres", () => {
    const forras: any = {
      id: "f1",
      cim: "https://pelda.hu/feed",
      tipus: null,
      eredet: "kezi",
      allapot: "ellenorzes_alatt",
      ellenorzott: false,
      utolso_sikeres: null,
      hiba_ok: null,
    };
    const eredmeny = forrasEllenorzesEredmeny(
      forras,
      { elerheto: true, tipus: "rss" as const, szovegOlvashato: true, hibaOk: null },
      MOST
    );
    expect(eredmeny.allapot).toBe("hasznalhato");
    expect(eredmeny.ellenorzott).toBe(true);
    expect(eredmeny.utolso_sikeres).toBe(MOST.toISOString());
    expect(eredmeny.tipus).toBe("rss");
  });

  it("2.15: forrasEllenorzesEredmeny — korlatozott", () => {
    const forras: any = {
      id: "f1",
      cim: "https://pelda.hu/feed",
      tipus: null,
      eredet: "kezi",
      allapot: "ellenorzes_alatt",
      ellenorzott: false,
      utolso_sikeres: null,
      hiba_ok: null,
    };
    const eredmeny = forrasEllenorzesEredmeny(
      forras,
      { elerheto: true, tipus: "rss" as const, szovegOlvashato: false, hibaOk: null },
      MOST
    );
    expect(eredmeny.allapot).toBe("korlatozott");
    expect(eredmeny.ellenorzott).toBe(true);
  });

  it("2.16: forrasEllenorzesEredmeny — hibas", () => {
    const forras: any = {
      id: "f1",
      cim: "https://pelda.hu/feed",
      tipus: null,
      eredet: "kezi",
      allapot: "ellenorzes_alatt",
      ellenorzott: false,
      utolso_sikeres: null,
      hiba_ok: null,
    };
    const eredmeny = forrasEllenorzesEredmeny(
      forras,
      { elerheto: false, tipus: null, szovegOlvashato: false, hibaOk: "idotullepes" },
      MOST
    );
    expect(eredmeny.allapot).toBe("hibas");
    expect(eredmeny.ellenorzott).toBe(true);
    expect(eredmeny.hiba_ok).toBe("idotullepes");
    expect(eredmeny.utolso_sikeres).toBeNull();
  });

  it("2.17: AI-javaslat ellenorzes elott — ellenorzott: false", () => {
    const forras: any = {
      id: "f2",
      cim: "https://ai-javaslat.hu/feed",
      tipus: null,
      eredet: "ai_javaslat",
      allapot: "ellenorzes_alatt",
      ellenorzott: false,
      utolso_sikeres: null,
      hiba_ok: null,
    };
    expect(forras.ellenorzott).toBe(false);
    expect(forras.allapot).toBe("ellenorzes_alatt");
  });
});

// ——— E-42: a felhasználótól nem várunk el technikai tudást ———
describe("cimKiegeszit — a begépelt cím kiegészítése (E-42)", () => {
  it("protokoll nélküli cím: zi-de-zi.ro → https://zi-de-zi.ro/", () => {
    expect(cimKiegeszit("zi-de-zi.ro")).toBe("https://zi-de-zi.ro/");
  });

  it("szóközök, nagybetűk, záró pont: „ ZI-DE-ZI.ro. ” → https://zi-de-zi.ro/", () => {
    expect(cimKiegeszit(" ZI-DE-ZI.ro. ")).toBe("https://zi-de-zi.ro/");
  });

  it("www-vel és záró perjellel is jó", () => {
    expect(cimKiegeszit("www.zi-de-zi.ro/")).toBe("https://www.zi-de-zi.ro/");
  });

  it("beillesztett cikkcím változatlan marad (a töredék nélkül)", () => {
    expect(cimKiegeszit("https://zi-de-zi.ro/2026/09/09/hir/#hozzaszolasok")).toBe("https://zi-de-zi.ro/2026/09/09/hir/");
  });

  it("pont nélküli szó nem cím", () => {
    expect(cimKiegeszit("valami")).toBeNull();
  });

  it("üres bevitel nem cím", () => {
    expect(cimKiegeszit("   ")).toBeNull();
  });

  it("más protokoll nem cím", () => {
    expect(cimKiegeszit("ftp://pelda.hu/fajl.txt")).toBeNull();
  });
});

describe("forrasCimOsztalyoz — a kiegészített címmel tér vissza (E-42)", () => {
  it("zi-de-zi.ro → ellenorzes_alatt, a cím kiegészítve", () => {
    const e = forrasCimOsztalyoz("zi-de-zi.ro");
    expect(e.allapot).toBe("ellenorzes_alatt");
    expect(e.cim).toBe("https://zi-de-zi.ro/");
    expect(e.tipus).toBeNull();
    expect(e.ok).toBeNull();
  });

  it("facebook.com/valami protokoll nélkül is belepes_mogott", () => {
    const e = forrasCimOsztalyoz("facebook.com/mintamuhely");
    expect(e.allapot).toBe("nem_tamogatott");
    expect(e.ok).toBe("belepes_mogott");
  });

  it("zi-de-zi.ro/feed/ → rss (a záró perjel nem zavar)", () => {
    const e = forrasCimOsztalyoz("zi-de-zi.ro/feed/");
    expect(e.tipus).toBe("rss");
    expect(e.cim).toBe("https://zi-de-zi.ro/feed/");
  });

  it("beillesztett cikkcím → ellenorzes_alatt, nem hiba", () => {
    const e = forrasCimOsztalyoz("https://zi-de-zi.ro/2026/09/09/valami-hir/");
    expect(e.allapot).toBe("ellenorzes_alatt");
    expect(e.ok).toBeNull();
  });
});

describe("forrasEllenorzesEredmeny — a megtalált hírfolyam címe eltevődik (E-42)", () => {
  it("felfedezettCim esetén a forrás címe arra cserélődik", () => {
    const f = {
      id: "f1",
      cim: "https://zi-de-zi.ro/",
      tipus: null,
      eredet: "kezi" as const,
      allapot: "ellenorzes_alatt" as const,
      ellenorzott: false,
      utolso_sikeres: null,
      hiba_ok: null,
    };
    const e = forrasEllenorzesEredmeny(
      f,
      { elerheto: true, tipus: "rss", szovegOlvashato: true, hibaOk: null, felfedezettCim: "https://zi-de-zi.ro/feed/" },
      MOST,
    );
    expect(e.cim).toBe("https://zi-de-zi.ro/feed/");
    expect(e.tipus).toBe("rss");
    expect(e.allapot).toBe("hasznalhato");
  });

  it("felfedezettCim nélkül a cím marad", () => {
    const f = {
      id: "f1",
      cim: "https://zi-de-zi.ro/",
      tipus: null,
      eredet: "kezi" as const,
      allapot: "ellenorzes_alatt" as const,
      ellenorzott: false,
      utolso_sikeres: null,
      hiba_ok: null,
    };
    const e = forrasEllenorzesEredmeny(f, { elerheto: true, tipus: "weboldal", szovegOlvashato: true, hibaOk: null }, MOST);
    expect(e.cim).toBe("https://zi-de-zi.ro/");
  });
});
