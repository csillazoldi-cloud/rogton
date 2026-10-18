import { describe, it, expect } from "vitest";
import {
  mintaLejart,
  osszehasonlithato,
  osszehasonlitas,
} from "../src/index";

const MOST = new Date("2026-09-07T10:00:00Z");

function alapMinta(lejar: string): ReturnType<typeof import("../src/index").Minta.parse> {
  return {
    id: "m-1",
    szervezet_id: "sz-1",
    szabaly_verzio: 1,
    talalat_ids: ["t-1", "t-2"],
    letrehozva: "2026-09-01T10:00:00Z",
    lejar,
  };
}

function alapKivonat(id: string): ReturnType<typeof import("../src/index").Kivonat.parse> {
  return {
    id,
    forras_id: "fr-1",
    cim: "Teszt cikk",
    url: "https://teszt.hu/cikk",
    kanonikus_url: "https://teszt.hu/cikk",
    megjelenes: "2026-09-01T08:00:00Z",
    begyujtes: "2026-09-01T09:00:00Z",
    szoveg: "Teszt szoveg",
    csonkolt: false,
    ujjlenyomat: "abc123",
    nyelv: "hu",
    lejar: "2026-10-01T10:00:00Z",
  };
}

function alapErtekeles(fontossag: "fontos" | "erdekes" | "hatter", szabalyVerzio: number = 1): ReturnType<typeof import("../src/index").Ertekeles.parse> {
  return {
    fontossag,
    temacimke: "szakmai" as const,
    miert: "Mert fontos",
    indoklas: "",
    szabaly_verzio: szabalyVerzio,
    ertekelve: "2026-09-07T10:00:00Z",
    csonkolt_alapjan: false,
  };
}

describe("E-19/7 minta — lejarat, osszehasonlithatosag, osszehasonlitas", () => {
  describe("7.1 mintaLejart", () => {
    it("7.1.1 lejart minta → igaz", () => {
      const lejart = alapMinta("2026-09-06T10:00:00Z");
      expect(mintaLejart(lejart, MOST)).toBe(true);
    });

    it("7.1.2 nem lejart minta → hamis", () => {
      const nemLejart = alapMinta("2026-09-08T10:00:00Z");
      expect(mintaLejart(nemLejart, MOST)).toBe(false);
    });
  });

  describe("7.2 osszehasonlithato", () => {
    it("7.2.1 lejart minta → {ok:false, ok_kod:'lejart'}", () => {
      const lejart = alapMinta("2026-09-06T10:00:00Z");
      const eredmeny = osszehasonlithato(lejart, [alapKivonat("t-1"), alapKivonat("t-2")], MOST);
      expect(eredmeny).toEqual({ ok: false, ok_kod: "lejart" });
    });

    it("7.2.2 hianyzo kivonat → {ok:false, ok_kod:'hianyos'}", () => {
      const minta = alapMinta("2026-09-08T10:00:00Z");
      const eredmeny = osszehasonlithato(minta, [alapKivonat("t-1")], MOST); // t-2 hianyzik
      expect(eredmeny).toEqual({ ok: false, ok_kod: "hianyos" });
    });

    it("7.2.3 teljes, nem lejart → {ok:true}", () => {
      const minta = alapMinta("2026-09-08T10:00:00Z");
      const eredmeny = osszehasonlithato(minta, [alapKivonat("t-1"), alapKivonat("t-2")], MOST);
      expect(eredmeny).toEqual({ ok: true });
    });
  });

  describe("7.3 osszehasonlitas — fontossag sorrend: fontos > erdekes > hatter", () => {
    it("7.3.1 elorebb: hatter → fontos", () => {
      const regi = [alapErtekeles("hatter")];
      const uj = [alapErtekeles("fontos")];
      const eredmeny = osszehasonlitas(regi, uj);
      expect(eredmeny).toEqual([{ talalat_id: expect.any(String), valtozas: "elorebb" }]);
    });

    it("7.3.2 hatrebb: fontos → erdekes", () => {
      const regi = [alapErtekeles("fontos")];
      const uj = [alapErtekeles("erdekes")];
      const eredmeny = osszehasonlitas(regi, uj);
      expect(eredmeny).toEqual([{ talalat_id: expect.any(String), valtozas: "hatrebb" }]);
    });

    it("7.3.3 valtozatlan: erdekes → erdekes", () => {
      const regi = [alapErtekeles("erdekes")];
      const uj = [alapErtekeles("erdekes")];
      const eredmeny = osszehasonlitas(regi, uj);
      expect(eredmeny).toEqual([{ talalat_id: expect.any(String), valtozas: "valtozatlan" }]);
    });

    it("7.3.4 tobb talalat, megfelelo sorrend", () => {
      const regi = [alapErtekeles("erdekes", 1), alapErtekeles("hatter", 2)];
      const uj = [alapErtekeles("fontos", 3), alapErtekeles("erdekes", 4)];
      const eredmeny = osszehasonlitas(regi, uj);
      expect(eredmeny).toHaveLength(2);
      expect(eredmeny[0].valtozas).toBe("elorebb"); // erdekes → fontos
      expect(eredmeny[1].valtozas).toBe("elorebb"); // hatter → erdekes
    });
  });
});
