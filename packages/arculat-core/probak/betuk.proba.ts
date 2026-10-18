// R-16 K5 (TERV §2-K5 Self-test, 1.5, gepezet 7–8): a betűk szabályai — a régi értékek kulcsa, a saját betű kulcsa, és az ékezet-
// vizsgálat egy HAMIS `van` porttal (a mag betűfájlt nem olvas; a valódi fontkit-vizsgálat az apps/web próbájáé).
import { describe, expect, it } from "vitest";
import { BEEPITETT, BetuElemzes, EKEZETEK, betuElemzes, betuKulcs, beepitettKulcs, hianyzoEkezetek, hianyzoNyelvre, sajatBetuId, sajatKulcs } from "../src/index.js";

const UUID = "0b9e6f2c-1d2a-4c3b-9e8f-7a6b5c4d3e2f";
/** Hamis port: minden karakter megvan, kivéve a felsoroltakat. */
const vanMind = (hiany = "") => (kp: number) => !hiany.includes(String.fromCodePoint(kp));

describe("a betűkulcsok", () => {
  it("a régi CSS-szövegek a beépített kulcsra (Georgia → Gelasio; Cairo/Tajawal → Public Sans: V-2)", () => {
    expect(betuKulcs("'Archivo',sans-serif")).toBe("archivo");
    expect(betuKulcs("Georgia, serif")).toBe("gelasio");
    expect(betuKulcs("'Space Grotesk', sans-serif")).toBe("space-grotesk");
    expect(betuKulcs("'Cairo', sans-serif")).toBe("public-sans");
    expect(betuKulcs("Tajawal")).toBe("public-sans");
    expect(betuKulcs("")).toBe("public-sans");
    expect(betuKulcs("gelasio")).toBe("gelasio");
  });
  it("a saját betű kulcsa: sajat:<uuid> oda-vissza; más érték nem saját", () => {
    expect(sajatKulcs(UUID.toUpperCase())).toBe(`sajat:${UUID}`);
    expect(sajatBetuId(`sajat:${UUID}`)).toBe(UUID);
    expect(sajatBetuId("sajat:nem-uuid")).toBeNull();
    expect(sajatBetuId("archivo")).toBeNull();
    expect(sajatBetuId(undefined)).toBeNull();
    // a saját kulcs a beépített listán kívül esik (a lap a tartalékot mondja, ha a fájl nincs meg)
    expect(beepitettKulcs(`sajat:${UUID}`)).toBe(false);
    expect(betuKulcs(`sajat:${UUID}`)).toBe("public-sans");
  });
  it("az öt beépített betű a rajz sorrendjében, névvel (asztalon a halk sor)", () => {
    expect(BEEPITETT.map((b) => b.nev)).toEqual(["Archivo", "Public Sans", "Space Grotesk", "IBM Plex Sans", "Gelasio"]);
  });
});

describe("az ékezet-vizsgálat (VanKarakter port)", () => {
  it("magyar munkatér: csak a magyar ékezetek számítanak", () => {
    expect(hianyzoEkezetek(vanMind(), ["hu"])).toEqual([]);
    expect(hianyzoEkezetek(vanMind("őűŐŰșț"), ["hu"])).toEqual(["ő", "ű", "Ő", "Ű"]);
    // a román ș hiánya magyar munkatérben nem baj
    expect(hianyzoEkezetek(vanMind("ș"), ["hu"])).toEqual([]);
  });
  it("magyar + román munkatér: a román vesszős ș ț is (U+0219, U+021B), a cédille-s nem helyettesíti", () => {
    expect(hianyzoEkezetek(vanMind("șȘ"), ["hu", "ro"])).toEqual(["ș", "Ș"]);
    expect(EKEZETEK.ro).toContain("ș");
    expect(EKEZETEK.ro).toContain("ț");
    expect(EKEZETEK.ro).not.toContain("ş");
    // üres nyelvlista = magyar (a felület nyelve)
    expect(hianyzoEkezetek(vanMind("ő"), [])).toEqual(["ő"]);
  });
  it("a tárolt elemzés mindkét nyelvet tartja; a lap a munkatér nyelveire szűr", () => {
    const e = betuElemzes(vanMind("őș"), "Próba Betű", "proba.ttf");
    expect(BetuElemzes.parse(e)).toEqual({ fajta: "betu", nev: "Próba Betű", hianyzo: ["ő", "ș"] });
    expect(hianyzoNyelvre(e, ["hu"])).toEqual(["ő"]);
    expect(hianyzoNyelvre(e, ["hu", "ro"])).toEqual(["ő", "ș"]);
  });
  it("névtelen betű: a fájl neve kiterjesztés nélkül", () => {
    expect(betuElemzes(vanMind(), "", "Cégem Betűje.woff2").nev).toBe("Cégem Betűje");
    expect(betuElemzes(vanMind(), null, ".ttf").nev).toBe("?");
  });
});
