// R-16 K1 (TERV 2-K1 Self-test): egy csomag logó besorolása a négy helyre.
import { describe, expect, it } from "vitest";
import { besorol, helyreAlkalmas, type LogoElemzes } from "../src/index.js";

const e = (r: Partial<LogoElemzes>): LogoElemzes => ({ atlatszo: true, vilagossag: 0.2, szinszam: 2, arany: 4, szinek: [], ...r });
const sotetSzeles = e({ vilagossag: 0.1, szinszam: 2, arany: 4.5 });
const kozepSzeles = e({ vilagossag: 0.4, szinszam: 2, arany: 4.5 });
const sotetEgyszinu = e({ vilagossag: 0.02, szinszam: 1, arany: 5 });
const feher = e({ vilagossag: 0.95, szinszam: 1, arany: 4 });
const negyzetSzines = e({ atlatszo: false, vilagossag: 0.3, szinszam: 3, arany: 1 });

describe("besorol — több logó egyszerre", () => {
  it("két sötét, széles, egyszínű logó → az első egyszinu, a második a következő alkalmas: vilagos", () => {
    expect(besorol([sotetEgyszinu, sotetEgyszinu])).toEqual(["egyszinu", "vilagos"]);
  });

  it("két közepes tónusú széles logó → vilagos + a következő alkalmas: sotet", () => {
    expect(besorol([kozepSzeles, kozepSzeles])).toEqual(["vilagos", "sotet"]);
  });

  it("két nagyon sötét, kétszínű logó → mindkettő vilagos (nincs alkalmas üres hely; az újabb nyer, a régebbi előzmény)", () => {
    expect(besorol([sotetSzeles, sotetSzeles])).toEqual(["vilagos", "vilagos"]);
  });

  it("négyzetes + széles → negyzetes + vilagos", () => {
    expect(besorol([negyzetSzines, sotetSzeles])).toEqual(["negyzetes", "vilagos"]);
  });

  it("a Kövesi-eset: sötét széles + fehér + négyzetes → vilagos, sotet, negyzetes", () => {
    expect(besorol([sotetSzeles, feher, negyzetSzines])).toEqual(["vilagos", "sotet", "negyzetes"]);
  });

  it("5 fájl → 4 hely + 1 a természetes helyére", () => {
    expect(besorol([sotetSzeles, feher, sotetEgyszinu, negyzetSzines, sotetSzeles])).toEqual(["vilagos", "sotet", "egyszinu", "negyzetes", "vilagos"]);
  });

  it("PDF (elemzés nélkül) → vilagos, és csak oda alkalmas", () => {
    expect(besorol([null])).toEqual(["vilagos"]);
    expect(besorol([sotetSzeles, null])).toEqual(["vilagos", "vilagos"]);
    expect(helyreAlkalmas("sotet", null)).toBe(false);
  });

  it("a négyzetes hely csak közel négyzetes logót, az egyszínű csak átlátszó egyszínűt fogad", () => {
    expect(helyreAlkalmas("negyzetes", sotetSzeles)).toBe(false);
    expect(helyreAlkalmas("egyszinu", sotetSzeles)).toBe(false);
    expect(helyreAlkalmas("egyszinu", e({ szinszam: 1, atlatszo: false }))).toBe(false);
    expect(helyreAlkalmas("vilagos", feher)).toBe(false);
    expect(helyreAlkalmas("sotet", sotetSzeles)).toBe(false);
  });

  it("üres csomag → üres lista", () => {
    expect(besorol([])).toEqual([]);
  });
});
