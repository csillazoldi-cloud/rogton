// A5 (Kati 09-25: „a képszerkesztő nem vette át a feltöltött arculati elemeket”) — R-16 gepezet 1 / kerdesek 5:
// a kép a legfrissebb feltöltött logót kapja, a jóváhagyási állapottól függetlenül. A három hibás eset és a tartalék.
// A `kepArculat` (apps/web vizual/helyzet.ts) a pillanatkép logo_fajl_id-jét adja tartaléknak: jóváhagyottnál a
// jóváhagyott verzióét, „kesobb”/tervezetnél a tervezetét, tervezet nélkül null-t — ezt modellezik az esetek.
import { describe, expect, it } from "vitest";
import { hasznaltLogoId, kepreAlkalmasLogo, KEP_LOGO_MAX_BAJT, type FajlMeta } from "../src/index.js";

type F = Pick<FajlMeta, "id" | "cel" | "tipus" | "meret" | "feltoltve">;
const fajl = (id: string, feltoltve: string, tobbi: Partial<F> = {}): F => ({ id, cel: "logo", tipus: "png", meret: 40_000, feltoltve, ...tobbi });

describe("hasznaltLogoId — a képen használt logó", () => {
  it("jóváhagyott pillanatkép logó nélkül + később feltöltött logó → a feltöltött (a) eset)", () => {
    // A jóváhagyott v1-ben nincs logó; a feltöltés új tervezetet nyitott (D-F31), a kép viszont a v1-ből dolgozott.
    expect(hasznaltLogoId([fajl("uj-logo", "2026-09-24T10:00:00.000Z")], null)).toBe("uj-logo");
  });

  it("jóváhagyott pillanatkép RÉGI logóval + újabb feltöltés → az újabb", () => {
    const lista = [fajl("regi", "2026-09-01T08:00:00.000Z"), fajl("uj", "2026-09-24T10:00:00.000Z")];
    expect(hasznaltLogoId(lista, "regi")).toBe("uj");
  });

  it("„későbbre hagyott” arculat: a feltöltés nem írt logo_fajl_id-t, a kép mégis megkapja (b) eset)", () => {
    expect(hasznaltLogoId([fajl("spotlight-01", "2026-09-24T10:00:00.000Z")], undefined)).toBe("spotlight-01");
  });

  it("nincs tervezet (tervezet = null) + feltöltött logó → a feltöltött (c) eset)", () => {
    expect(hasznaltLogoId([fajl("egyetlen", "2026-09-24T10:00:00.000Z")], null)).toBe("egyetlen");
  });

  it("a pillanatképben van logó, újabb fájl nincs → marad a pillanatkép logója", () => {
    expect(hasznaltLogoId([], "pillanatkep-logo")).toBe("pillanatkep-logo");
    expect(hasznaltLogoId(null, "pillanatkep-logo")).toBe("pillanatkep-logo");
    // ugyanaz a fájl a listában is: ugyanazt adja
    expect(hasznaltLogoId([fajl("pillanatkep-logo", "2026-09-01T08:00:00.000Z")], "pillanatkep-logo")).toBe("pillanatkep-logo");
  });

  it("se fájl, se pillanatkép-logó → null (a képgyártó a cég nevét írja)", () => {
    expect(hasznaltLogoId([], null)).toBeNull();
  });

  it("a képre nem alkalmas fájlt átugorja: PDF logó, túl nagy, más cél — a következő legfrissebb alkalmas marad", () => {
    const lista = [
      fajl("jo", "2026-09-10T08:00:00.000Z"),
      fajl("pdf", "2026-09-20T08:00:00.000Z", { tipus: "pdf" }),
      fajl("nagy", "2026-09-21T08:00:00.000Z", { meret: KEP_LOGO_MAX_BAJT }),
      fajl("kezikonyv", "2026-09-22T08:00:00.000Z", { cel: "kezikonyv" }),
      fajl("referencia", "2026-09-23T08:00:00.000Z", { cel: "referencia", tipus: "jpg" }),
    ];
    expect(hasznaltLogoId(lista, "pillanatkep")).toBe("jo");
    expect(kepreAlkalmasLogo({ cel: "logo", tipus: "webp", meret: 1 })).toBe(true);
    expect(kepreAlkalmasLogo({ cel: "logo", tipus: "jpg", meret: 0 })).toBe(false);
  });

  it("ha csak alkalmatlan logó-fájl van, a pillanatkép logója marad", () => {
    expect(hasznaltLogoId([fajl("pdf", "2026-09-20T08:00:00.000Z", { tipus: "pdf" })], "pillanatkep")).toBe("pillanatkep");
  });

  it("a lista sorrendje nem számít; egyező időnél az azonosító dönt (determinisztikus)", () => {
    const a = fajl("a", "2026-09-24T10:00:00.000Z");
    const b = fajl("b", "2026-09-24T10:00:00.000Z");
    const c = fajl("c", "2026-09-01T10:00:00.000Z");
    expect(hasznaltLogoId([a, b, c], null)).toBe("b");
    expect(hasznaltLogoId([c, b, a], null)).toBe("b");
  });
});

// R-16 K1 (TERV 1.1, gepezet 2): a négy logóhely. Új esetek — a fenti 9 A5-eset változatlan.
import { hasznaltLogok, logoHelye, type LogoValtozat } from "../src/index.js";

type H = F & { logo_valtozat?: LogoValtozat | null };
const hely = (id: string, feltoltve: string, logo_valtozat: LogoValtozat | null, tobbi: Partial<H> = {}): H => ({ ...fajl(id, feltoltve), logo_valtozat, ...tobbi });

describe("hasznaltLogok — helyenként a legfrissebb (R-16 K1)", () => {
  it("helyenként a legfrissebb képre alkalmas fájl nyer", () => {
    const lista = [
      hely("vil-regi", "2026-09-01T08:00:00.000Z", "vilagos"),
      hely("vil-uj", "2026-09-20T08:00:00.000Z", "vilagos"),
      hely("sot", "2026-09-10T08:00:00.000Z", "sotet"),
      hely("egy-regi", "2026-09-11T08:00:00.000Z", "egyszinu"),
      hely("egy-uj", "2026-09-12T08:00:00.000Z", "egyszinu"),
    ];
    expect(hasznaltLogok(lista, null)).toEqual({ vilagos: "vil-uj", sotet: "sot", egyszinu: "egy-uj", negyzetes: null });
  });

  it("a hely nélküli (régi) logó-sor világosnak számít, és egy újabb világos felülírja", () => {
    expect(logoHelye({ logo_valtozat: null })).toBe("vilagos");
    expect(logoHelye({})).toBe("vilagos");
    const lista = [hely("regi-null", "2026-09-01T08:00:00.000Z", null), fajl("regi-hianyzo", "2026-09-02T08:00:00.000Z")];
    expect(hasznaltLogok(lista, null).vilagos).toBe("regi-hianyzo");
    expect(hasznaltLogok([...lista, hely("uj-vil", "2026-09-03T08:00:00.000Z", "vilagos")], null).vilagos).toBe("uj-vil");
  });

  it("a PDF és a túl nagy fájl kimarad — a hely a következő alkalmasat kapja", () => {
    const lista = [
      hely("sot-png", "2026-09-01T08:00:00.000Z", "sotet"),
      hely("sot-pdf", "2026-09-05T08:00:00.000Z", "sotet", { tipus: "pdf" }),
      hely("negy-nagy", "2026-09-05T08:00:00.000Z", "negyzetes", { meret: KEP_LOGO_MAX_BAJT }),
    ];
    const h = hasznaltLogok(lista, null);
    expect(h.sotet).toBe("sot-png");
    expect(h.negyzetes).toBeNull();
  });

  it("üres helyen a pillanatkép logója a tartalék; ha van fájl, a fájl nyer", () => {
    const pk = { vilagos: "pk-vil", sotet: "pk-sot", egyszinu: null, negyzetes: "pk-negy" };
    expect(hasznaltLogok([hely("sot-fajl", "2026-09-01T08:00:00.000Z", "sotet")], pk)).toEqual({ vilagos: "pk-vil", sotet: "sot-fajl", egyszinu: null, negyzetes: "pk-negy" });
    expect(hasznaltLogok(null, pk)).toEqual(pk);
  });

  it("hasznaltLogoId = a világos hely; ha az üres, az egyszínű — a sötét (fehér) logó a világos képre nem kerül", () => {
    expect(hasznaltLogoId([hely("egy", "2026-09-01T08:00:00.000Z", "egyszinu")], null)).toBe("egy");
    expect(hasznaltLogoId([hely("sot", "2026-09-01T08:00:00.000Z", "sotet")], null)).toBeNull();
    expect(hasznaltLogoId([hely("egy", "2026-09-01T08:00:00.000Z", "egyszinu"), hely("vil", "2026-08-01T08:00:00.000Z", "vilagos")], null)).toBe("vil");
    // a pillanatkép világos logója előbb jön, mint az egyszínű fájl (a régi viselkedés tartaléka)
    expect(hasznaltLogoId([hely("egy", "2026-09-01T08:00:00.000Z", "egyszinu")], "pk")).toBe("pk");
  });
});
