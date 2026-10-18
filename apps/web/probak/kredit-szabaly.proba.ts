import { describe, it, expect } from "vitest";
import {
  EZRED,
  MUVELET_AR,
  ALAP_MUNKATER_HAVI,
  ezredbe,
  kreditbe,
  honapKulcs,
  haviKeretek,
  megoszt,
  maradt,
  indithato,
  kijelzes,
  type TagKeret,
  type Egyenleg,
} from "../kredit/szabaly";

describe("konstansok", () => {
  it("az egység ezred", () => {
    expect(EZRED).toBe(1000);
  });
  it("egy művelet 1 kredit", () => {
    expect(MUVELET_AR).toBe(1);
  });
  it("alap havi keret 1000 kredit", () => {
    expect(ALAP_MUNKATER_HAVI).toBe(1000);
  });
});

describe("ezredbe / kreditbe", () => {
  it("ezredbe(1) = 1000", () => {
    expect(ezredbe(1)).toBe(1000);
  });
  it("ezredbe(0.3333) = 333", () => {
    expect(ezredbe(0.3333)).toBe(333);
  });
  it("kreditbe(1500) = 1.5", () => {
    expect(kreditbe(1500)).toBe(1.5);
  });
});

describe("honapKulcs", () => {
  it("Bukarestben 2026-09-30T22:30Z már október", () => {
    expect(honapKulcs(new Date("2026-09-30T22:30:00Z"))).toBe("2026-10");
  });
  it("Bukarestben 2026-09-30T20:00Z még szeptember", () => {
    expect(honapKulcs(new Date("2026-09-30T20:00:00Z"))).toBe("2026-09");
  });
});

describe("haviKeretek", () => {
  it("három egyenlő tag: 333334 / 333333 / 333333, összeg 1 000 000", () => {
    const tagok: TagKeret[] = [
      { fiok_id: "a", kulon: null },
      { fiok_id: "b", kulon: null },
      { fiok_id: "c", kulon: null },
    ];
    const k = haviKeretek(1000, tagok);
    expect(k.get("a")).toBe(333334);
    expect(k.get("b")).toBe(333333);
    expect(k.get("c")).toBe(333333);
    const osszeg = (k.get("a") ?? 0) + (k.get("b") ?? 0) + (k.get("c") ?? 0);
    expect(osszeg).toBe(1000000);
  });

  it("egy külön 400, két egyenlő: 400000 / 300000 / 300000", () => {
    const tagok: TagKeret[] = [
      { fiok_id: "a", kulon: 400 },
      { fiok_id: "b", kulon: null },
      { fiok_id: "c", kulon: null },
    ];
    const k = haviKeretek(1000, tagok);
    expect(k.get("a")).toBe(400000);
    expect(k.get("b")).toBe(300000);
    expect(k.get("c")).toBe(300000);
  });

  it("túlosztott külön (1200) esetén a maradék 0", () => {
    const tagok: TagKeret[] = [
      { fiok_id: "a", kulon: 1200 },
      { fiok_id: "b", kulon: null },
    ];
    const k = haviKeretek(1000, tagok);
    expect(k.get("a")).toBe(1200000);
    expect(k.get("b")).toBe(0);
  });

  it("üres tagokra üres Map", () => {
    const k = haviKeretek(500, []);
    expect(k.size).toBe(0);
  });
});

describe("megoszt", () => {
  it("1 kredit három fiók között: 334 / 333 / 333, összeg 1000", () => {
    const m = megoszt(1, ["a", "b", "c"]);
    expect(m.get("a")).toBe(334);
    expect(m.get("b")).toBe(333);
    expect(m.get("c")).toBe(333);
    const osszeg = (m.get("a") ?? 0) + (m.get("b") ?? 0) + (m.get("c") ?? 0);
    expect(osszeg).toBe(1000);
  });

  it("egy fiók kapja az egészet", () => {
    const m = megoszt(1, ["a"]);
    expect(m.get("a")).toBe(1000);
  });

  it("ismétlődő fiók_id egyszer számít: a 500, b 500", () => {
    const m = megoszt(1, ["a", "a", "b"]);
    expect(m.get("a")).toBe(500);
    expect(m.get("b")).toBe(500);
    expect(m.size).toBe(2);
  });

  it("üres listára üres Map", () => {
    const m = megoszt(1, []);
    expect(m.size).toBe(0);
  });
});

describe("maradt", () => {
  it("túlfelhasználásnál 0", () => {
    expect(maradt({ keret: 1000, felhasznalt: 1500 })).toBe(0);
  });
});

describe("indithato", () => {
  it("van maradék mindkettőnél → true", () => {
    const tag: Egyenleg = { keret: 1000, felhasznalt: 999 };
    const munkater: Egyenleg = { keret: 5000, felhasznalt: 100 };
    expect(indithato(tag, munkater)).toBe(true);
  });
  it("a tagnak elfogyott → false", () => {
    const tag: Egyenleg = { keret: 1000, felhasznalt: 1000 };
    const munkater: Egyenleg = { keret: 5000, felhasznalt: 100 };
    expect(indithato(tag, munkater)).toBe(false);
  });
  it("a munkatérnek elfogyott → false", () => {
    const tag: Egyenleg = { keret: 1000, felhasznalt: 0 };
    const munkater: Egyenleg = { keret: 5000, felhasznalt: 5000 };
    expect(indithato(tag, munkater)).toBe(false);
  });
});

describe("kijelzes", () => {
  it("312,5 magyarul", () => {
    expect(kijelzes(312500, "hu")).toBe("312,5");
  });
  it("312 angolul (egész, tizedes nélkül)", () => {
    expect(kijelzes(312000, "en")).toBe("312");
  });
  it("0,3 magyarul", () => {
    expect(kijelzes(333, "hu")).toBe("0,3");
  });
  it("0 magyarul", () => {
    expect(kijelzes(0, "hu")).toBe("0");
  });
});
