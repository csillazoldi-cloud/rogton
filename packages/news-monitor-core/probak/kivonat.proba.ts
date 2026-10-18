import { describe, it, expect } from "vitest";
import {
  kivonatKeszit,
  ujjlenyomat,
  kivonatLejart,
  KIVONAT_MAX_HOSSZ,
} from "../src/index";

const MOST = new Date("2026-09-07T10:00:00Z");

function alapKivonatBe(szoveg: string) {
  return {
    id: "k1",
    forras_id: "f1",
    cim: "Teszt cím",
    url: "https://pelda.hu/cikk",
    megjelenes: null,
    szoveg,
    nyelv: "hu" as const,
  };
}

describe("kivonat.ts — vagas, lejarat, ujjlenyomat (E-19)", () => {
  it("3.1: 8000 felett vag szohataron es csonkolt: true", () => {
    const hosszuSzoveg = "a ".repeat(5000); // ~10000 karakter
    const kivonat = kivonatKeszit(alapKivonatBe(hosszuSzoveg), MOST);
    expect(kivonat.csonkolt).toBe(true);
    expect(kivonat.szoveg.length).toBeLessThanOrEqual(KIVONAT_MAX_HOSSZ);
    // szóhatáron vág: nem szóköz a végén
    expect(kivonat.szoveg.endsWith(" ")).toBe(false);
  });

  it("3.2: 8000 alatt csonkolt: false", () => {
    const rovidSzoveg = "Ez egy rövid szöveg.";
    const kivonat = kivonatKeszit(alapKivonatBe(rovidSzoveg), MOST);
    expect(kivonat.csonkolt).toBe(false);
    expect(kivonat.szoveg).toBe(rovidSzoveg);
  });

  it("3.3: lejar = +30 nap", () => {
    const kivonat = kivonatKeszit(alapKivonatBe("teszt"), MOST);
    const vartLejar = new Date("2026-10-07T10:00:00Z");
    expect(new Date(kivonat.lejar).getTime()).toBe(vartLejar.getTime());
  });

  it("3.4: ujjlenyomat determinisztikus", () => {
    const u1 = ujjlenyomat("Cím", "Szöveg");
    const u2 = ujjlenyomat("Cím", "Szöveg");
    expect(u1).toBe(u2);
  });

  it("3.5: kisbetu/irasjel-elteres nem valtoztat ujjlenyomaton", () => {
    const u1 = ujjlenyomat("Cím!", "Szöveg...");
    const u2 = ujjlenyomat("cím", "szöveg");
    expect(u1).toBe(u2);
  });

  it("3.6: mas szoveg mas ujjlenyomat", () => {
    const u1 = ujjlenyomat("Cím", "Első szöveg");
    const u2 = ujjlenyomat("Cím", "Második szöveg");
    expect(u1).not.toBe(u2);
  });

  it("3.7: kivonatLejart — lejart", () => {
    const kivonat = kivonatKeszit(alapKivonatBe("teszt"), MOST);
    const kesobb = new Date("2026-10-08T10:00:00Z");
    expect(kivonatLejart(kivonat, kesobb)).toBe(true);
  });

  it("3.8: kivonatLejart — nem lejart", () => {
    const kivonat = kivonatKeszit(alapKivonatBe("teszt"), MOST);
    expect(kivonatLejart(kivonat, MOST)).toBe(false);
  });

  it("3.9: kanonikus_url kiszamitva", () => {
    const kivonat = kivonatKeszit(
      {
        ...alapKivonatBe("teszt"),
        url: "https://PELDA.HU/cikk?utm_source=email",
      },
      MOST
    );
    expect(kivonat.kanonikus_url).toBe("https://pelda.hu/cikk");
  });
});
