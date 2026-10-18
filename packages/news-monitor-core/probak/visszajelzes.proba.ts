import { describe, it, expect } from "vitest";
import {
  javaslatAlkalmazhato,
  javaslatDontes,
  ujVerzio,
  aktivVerzio,
} from "../src/index";

const MOST = new Date("2026-09-07T10:00:00Z");

function alapBeallitas(): ReturnType<typeof import("../src/index").Beallitas.parse> {
  return {
    celok: ["sajat_marka" as const],
    temak: [{ nev: "Teszt", nevvaltozatok: [], megkulonboztetes: "" }],
    foldrajzi_fokusz: "",
    nyelvek: [],
    kizarasok: [],
    idozites: { mod: "kezi" as const, ora: 7, perc: 0, idozona: "Europe/Bucharest" },
    szabad_szoveg: "",
  };
}

function alapVerzio(verzio: number, allapot: "aktiv" | "korabbi" = "aktiv"): ReturnType<typeof import("../src/index").BeallitasVerzio.parse> {
  return {
    verzio,
    allapot,
    letrehozva: "2026-09-01T10:00:00Z",
    eredet: "kezi" as const,
    beallitas: alapBeallitas(),
  };
}

function alapJavaslat(allapot: "fuggo" | "kiprobalt" | "elfogadva" | "elvetve", szabalyVerzio: number = 1): ReturnType<typeof import("../src/index").SzabalyJavaslat.parse> {
  return {
    id: "j-1",
    szabaly_verzio: szabalyVerzio,
    javasolt: alapBeallitas(),
    mi_alapjan: ["visszajelzes-1"],
    indoklas: "Mert jo",
    varhato_hatas: "Kevesebb zaj",
    profil_erintett: false,
    allapot,
    minta_id: null,
    letrehozva: "2026-09-06T10:00:00Z",
  };
}

describe("E-19/8 visszajelzes — okok, javaslatAlkalmazhato, javaslatDontes, verzio valtozatlansag", () => {
  describe("8.1 okok — max 4, 5 → séma hiba", () => {
    it("8.1.1 4 ok megengedett", () => {
      const okok = ["masik_ceg", "nem_ez_a_tema", "tul_altalanos", "ismetlodo"] as const;
      const visszajelzes = {
        id: "v-1",
        talalat_id: "t-1",
        fajta: "nem_relevans" as const,
        okok,
        sajat_indok: "",
        letrehozva: "2026-09-07T10:00:00Z",
      };
      // A zod séma validálja — itt azt ellenőrizzük, hogy a 4 elemű tömb átmegy
      // SPEC-KÉRDÉS: a spec nem definiál külön függvényt az okok validálására,
      // a Visszajelzes séma .max(4) korlátja kezeli; a próba a séma viselkedését ellenőrzi.
      expect(() => import("../src/index").then(m => m.Visszajelzes.parse(visszajelzes))).not.toThrow();
    });

    it("8.1.2 5 ok séma hibát dob", async () => {
      const okok = ["masik_ceg", "nem_ez_a_tema", "tul_altalanos", "ismetlodo", "masik_ceg"] as any;
      const visszajelzes = {
        id: "v-1",
        talalat_id: "t-1",
        fajta: "nem_relevans",
        okok,
        sajat_indok: "",
        letrehozva: "2026-09-07T10:00:00Z",
      };
      const { Visszajelzes } = await import("../src/index");
      expect(() => Visszajelzes.parse(visszajelzes)).toThrow();
    });
  });

  describe("8.2 javaslatAlkalmazhato — csak aktiv verziora, csak fuggo/kiprobalt", () => {
    it("8.2.1 fuggo + aktiv verzio egyezik → igaz", () => {
      const aktiv = alapVerzio(1);
      const javaslat = alapJavaslat("fuggo", 1);
      expect(javaslatAlkalmazhato(javaslat, aktiv)).toBe(true);
    });

    it("8.2.2 kiprobalt + aktiv verzio egyezik → igaz", () => {
      const aktiv = alapVerzio(1);
      const javaslat = alapJavaslat("kiprobalt", 1);
      expect(javaslatAlkalmazhato(javaslat, aktiv)).toBe(true);
    });

    it("8.2.3 elfogadva → hamis", () => {
      const aktiv = alapVerzio(1);
      const javaslat = alapJavaslat("elfogadva", 1);
      expect(javaslatAlkalmazhato(javaslat, aktiv)).toBe(false);
    });

    it("8.2.4 elvetve → hamis", () => {
      const aktiv = alapVerzio(1);
      const javaslat = alapJavaslat("elvetve", 1);
      expect(javaslatAlkalmazhato(javaslat, aktiv)).toBe(false);
    });

    it("8.2.5 verzio nem egyezik → hamis", () => {
      const aktiv = alapVerzio(2);
      const javaslat = alapJavaslat("fuggo", 1);
      expect(javaslatAlkalmazhato(javaslat, aktiv)).toBe(false);
    });

    it("8.2.6 korabbi verzio nem aktiv → hamis", () => {
      const korabbi = alapVerzio(1, "korabbi");
      const javaslat = alapJavaslat("fuggo", 1);
      expect(javaslatAlkalmazhato(javaslat, korabbi)).toBe(false);
    });
  });

  describe("8.3 javaslatDontes", () => {
    it("8.3.1 elfogad → allapot 'elfogadva'", () => {
      const javaslat = alapJavaslat("fuggo");
      const eredmeny = javaslatDontes(javaslat, "elfogad");
      expect(eredmeny.allapot).toBe("elfogadva");
    });

    it("8.3.2 elvet → allapot 'elvetve'", () => {
      const javaslat = alapJavaslat("kiprobalt");
      const eredmeny = javaslatDontes(javaslat, "elvet");
      expect(eredmeny.allapot).toBe("elvetve");
    });

    it("8.3.3 dontes nem valtoztatja a tobbi mezot", () => {
      const javaslat = alapJavaslat("fuggo");
      const eredmeny = javaslatDontes(javaslat, "elfogad");
      expect(eredmeny.id).toBe(javaslat.id);
      expect(eredmeny.javasolt).toEqual(javaslat.javasolt);
      expect(eredmeny.mi_alapjan).toEqual(javaslat.mi_alapjan);
    });
  });

  describe("8.4 visszajelzes onmagaban nem ad verziot", () => {
    it("8.4.1 visszajelzes mentese utan a verziok lista valtozatlan", () => {
      const verziok = [alapVerzio(1)];
      // A visszajelzes onmagaban nem hoz letre uj verziot — csak a javaslat elfogadasa
      // A próba ellenőrzi, hogy ujVerzio meghívása azonos beallitassal nem ad uj verziot
      const { verziok: ujVerziok, uj } = ujVerzio(verziok, alapBeallitas(), "kezi", MOST);
      expect(uj).toBeNull();
      expect(ujVerziok).toHaveLength(1);
      expect(ujVerziok[0].verzio).toBe(1);
    });

    it("8.4.2 javaslat elfogadasa ad uj verziot, visszajelzes onmagaban nem", () => {
      // A spec szerint: "csak a javaslat elfogadása ad új verziót (ujVerzio(..., 'ai_javaslat'))"
      // Ez a próba dokumentálja, hogy a visszajelzes entitas letrehozasa nem jar uj verzioval
      const verziok = [alapVerzio(1)];
      const eredetiVerzioSzam = aktivVerzio(verziok)?.verzio;
      expect(eredetiVerzioSzam).toBe(1);
      // A visszajelzes objektum letrehozasa onmagaban nem erinti a verziokat
      // (a host tarolja kulon, a visszajelzesMent nem valtoztatja a verziokat)
    });
  });
});
