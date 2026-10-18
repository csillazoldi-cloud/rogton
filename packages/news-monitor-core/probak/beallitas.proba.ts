import { describe, it, expect } from "vitest";
import {
  beallitasEllenoriz,
  beallitasNormalizal,
  beallitasAzonos,
  ujVerzio,
  visszaallit,
  aktivVerzio,
} from "../src/index";

const MOST = new Date("2026-09-07T10:00:00Z");

function alapBeallitas() {
  return {
    celok: ["sajat_marka"] as ["sajat_marka"],
    temak: [
      {
        nev: "Teszt téma",
        nevvaltozatok: [],
        megkulonboztetes: "",
      },
    ],
    foldrajzi_fokusz: "",
    nyelvek: [],
    kizarasok: [],
    idozites: {
      mod: "napi" as const,
      ora: 7,
      perc: 0,
      idozona: "Europe/Bucharest",
    },
    szabad_szoveg: "",
  };
}

describe("beallitas.ts — ellenorzes, normalizalas, verziok (E-19)", () => {
  it("1.1: hianyzo cel → required", () => {
    const eredmeny = beallitasEllenoriz({
      ...alapBeallitas(),
      celok: [],
    });
    expect(eredmeny.ok).toBe(false);
    if (!eredmeny.ok) {
      expect(eredmeny.hibak.some((h) => h.mezo === "celok" && h.kod === "required")).toBe(true);
    }
  });

  it("1.2: hianyzo tema → required", () => {
    const eredmeny = beallitasEllenoriz({
      ...alapBeallitas(),
      temak: [],
    });
    expect(eredmeny.ok).toBe(false);
    if (!eredmeny.ok) {
      expect(eredmeny.hibak.some((h) => h.mezo === "temak" && h.kod === "required")).toBe(true);
    }
  });

  it("1.3: tul rovid tema nev → too_short", () => {
    const eredmeny = beallitasEllenoriz({
      ...alapBeallitas(),
      temak: [{ nev: "", nevvaltozatok: [], megkulonboztetes: "" }],
    });
    expect(eredmeny.ok).toBe(false);
    if (!eredmeny.ok) {
      expect(eredmeny.hibak.some((h) => h.mezo.startsWith("temak") && h.kod === "too_short")).toBe(true);
    }
  });

  it("1.4: tul hosszu tema nev → too_long", () => {
    const eredmeny = beallitasEllenoriz({
      ...alapBeallitas(),
      temak: [{ nev: "a".repeat(121), nevvaltozatok: [], megkulonboztetes: "" }],
    });
    expect(eredmeny.ok).toBe(false);
    if (!eredmeny.ok) {
      expect(eredmeny.hibak.some((h) => h.mezo.startsWith("temak") && h.kod === "too_long")).toBe(true);
    }
  });

  it("1.5: tul hosszu szabad szoveg → too_long", () => {
    const eredmeny = beallitasEllenoriz({
      ...alapBeallitas(),
      szabad_szoveg: "a".repeat(2001),
    });
    expect(eredmeny.ok).toBe(false);
    if (!eredmeny.ok) {
      expect(eredmeny.hibak.some((h) => h.mezo === "szabad_szoveg" && h.kod === "too_long")).toBe(true);
    }
  });

  it("1.6: normalizalas — trim, ures elemek ki, egyediseg, rendezes", () => {
    const be = {
      ...alapBeallitas(),
      temak: [
        {
          nev: "  Teszt téma  ",
          nevvaltozatok: ["  változat B  ", "változat A", "  változat B  "],
          megkulonboztetes: "  megkülönböztetés  ",
        },
      ],
      kizarasok: ["  zár  ", "  ár  ", "  zár  "],
    };
    const normalizalt = beallitasNormalizal(be as any);
    expect(normalizalt.temak[0].nev).toBe("Teszt téma");
    expect(normalizalt.temak[0].nevvaltozatok).toEqual(["változat A", "változat B"]);
    expect(normalizalt.temak[0].megkulonboztetes).toBe("megkülönböztetés");
    expect(normalizalt.kizarasok).toEqual(["ár", "zár"]);
  });

  it("1.7: valtozatlan mentes nem ad uj verziot", () => {
    const be = alapBeallitas();
    const verzio1: any = {
      verzio: 1,
      allapot: "aktiv" as const,
      letrehozva: MOST.toISOString(),
      eredet: "kezi" as const,
      beallitas: be,
    };
    const { verziok, uj } = ujVerzio([verzio1], be, "kezi", MOST);
    expect(uj).toBeNull();
    expect(verziok).toHaveLength(1);
    expect(verziok[0].allapot).toBe("aktiv");
  });

  it("1.8: uj tartalom → verzio max+1, elozo korabbi", () => {
    const be1 = alapBeallitas();
    const be2 = { ...be1, szabad_szoveg: "uj szoveg" };
    const verzio1: any = {
      verzio: 1,
      allapot: "aktiv" as const,
      letrehozva: MOST.toISOString(),
      eredet: "kezi" as const,
      beallitas: be1,
    };
    const { verziok, uj } = ujVerzio([verzio1], be2, "kezi", MOST);
    expect(uj).not.toBeNull();
    expect(uj!.verzio).toBe(2);
    expect(uj!.allapot).toBe("aktiv");
    expect(uj!.eredet).toBe("kezi");
    expect(verziok).toHaveLength(2);
    expect(verziok[0].allapot).toBe("korabbi");
    expect(verziok[1].allapot).toBe("aktiv");
  });

  it("1.9: visszaallit → uj aktiv verzio eredet: visszaallitas", () => {
    const be1 = alapBeallitas();
    const be2 = { ...be1, szabad_szoveg: "uj szoveg" };
    const verzio1: any = {
      verzio: 1,
      allapot: "korabbi" as const,
      letrehozva: "2026-09-06T10:00:00Z",
      eredet: "kezi" as const,
      beallitas: be1,
    };
    const verzio2: any = {
      verzio: 2,
      allapot: "aktiv" as const,
      letrehozva: MOST.toISOString(),
      eredet: "kezi" as const,
      beallitas: be2,
    };
    const eredmeny = visszaallit([verzio1, verzio2], 1, MOST);
    expect(eredmeny).not.toBeNull();
    expect(eredmeny!.uj!.verzio).toBe(3);
    expect(eredmeny!.uj!.eredet).toBe("visszaallitas");
    expect(eredmeny!.uj!.allapot).toBe("aktiv");
    expect(eredmeny!.verziok[2].allapot).toBe("aktiv");
    expect(eredmeny!.verziok[1].allapot).toBe("korabbi");
  });

  it("1.10: nem letezo verzio visszaallitasa → null", () => {
    const verzio1: any = {
      verzio: 1,
      allapot: "aktiv" as const,
      letrehozva: MOST.toISOString(),
      eredet: "kezi" as const,
      beallitas: alapBeallitas(),
    };
    const eredmeny = visszaallit([verzio1], 99, MOST);
    expect(eredmeny).toBeNull();
  });

  it("1.11: aktivVerzio visszaadja az aktiv verziot", () => {
    const be = alapBeallitas();
    const verzio1: any = {
      verzio: 1,
      allapot: "korabbi" as const,
      letrehozva: "2026-09-06T10:00:00Z",
      eredet: "kezi" as const,
      beallitas: be,
    };
    const verzio2: any = {
      verzio: 2,
      allapot: "aktiv" as const,
      letrehozva: MOST.toISOString(),
      eredet: "kezi" as const,
      beallitas: be,
    };
    expect(aktivVerzio([verzio1, verzio2])!.verzio).toBe(2);
    expect(aktivVerzio([verzio1])).toBeNull();
  });
});
