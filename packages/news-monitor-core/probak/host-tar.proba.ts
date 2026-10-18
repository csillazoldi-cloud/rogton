import { describe, it, expect } from "vitest";
import {
  jogosult,
  memoriaTar,
  cikkKulcs,
} from "../src/index";

const MOST = new Date("2026-09-07T10:00:00Z");

describe("E-19/10 host es tar — jogosultsag, memoriaTar viselkedes", () => {
  describe("10.1 jogosult", () => {
    it("10.1.1 nezo csak 'nez' műveletre jogosult", () => {
      expect(jogosult("nezo", "nez")).toBe(true);
      expect(jogosult("nezo", "beallit")).toBe(false);
      expect(jogosult("nezo", "futtat")).toBe(false);
      expect(jogosult("nezo", "visszajelez")).toBe(false);
      expect(jogosult("nezo", "javaslat_dont")).toBe(false);
    });

    it("10.1.2 tulajdonos minden műveletre jogosult", () => {
      expect(jogosult("tulajdonos", "nez")).toBe(true);
      expect(jogosult("tulajdonos", "beallit")).toBe(true);
      expect(jogosult("tulajdonos", "futtat")).toBe(true);
      expect(jogosult("tulajdonos", "visszajelez")).toBe(true);
      expect(jogosult("tulajdonos", "javaslat_dont")).toBe(true);
    });

    it("10.1.3 szerkeszto minden műveletre jogosult", () => {
      expect(jogosult("szerkeszto", "nez")).toBe(true);
      expect(jogosult("szerkeszto", "beallit")).toBe(true);
      expect(jogosult("szerkeszto", "futtat")).toBe(true);
      expect(jogosult("szerkeszto", "visszajelez")).toBe(true);
      expect(jogosult("szerkeszto", "javaslat_dont")).toBe(true);
    });
  });

  describe("10.2 memoriaTar — kivonatMent, szervezeti elkulonules, lejart torles", () => {
    it("10.2.1 kivonatMent ugyanarra a cikk-kulcsra masodszor 'letezik'", async () => {
      const tar = memoriaTar();
      const szervezetId = "sz-1";
      const kivonat = {
        id: "k-1",
        forras_id: "fr-1",
        cim: "Cikk",
        url: "https://teszt.hu/cikk",
        kanonikus_url: "https://teszt.hu/cikk",
        megjelenes: "2026-09-01T08:00:00Z",
        begyujtes: "2026-09-07T09:00:00Z",
        szoveg: "Szoveg",
        csonkolt: false,
        ujjlenyomat: "abc",
        nyelv: "hu",
        lejar: "2026-10-01T10:00:00Z",
      };

      const elso = await tar.kivonatMent(szervezetId, kivonat);
      expect(elso).toBe("uj");

      const masodik = await tar.kivonatMent(szervezetId, { ...kivonat, id: "k-2", ujjlenyomat: "def" });
      expect(masodik).toBe("letezik");
    });

    it("10.2.2 ket szervezet adata nem keveredik", async () => {
      const tar = memoriaTar();
      const kivonat = {
        id: "k-1",
        forras_id: "fr-1",
        cim: "Cikk",
        url: "https://teszt.hu/cikk",
        kanonikus_url: "https://teszt.hu/cikk",
        megjelenes: "2026-09-01T08:00:00Z",
        begyujtes: "2026-09-07T09:00:00Z",
        szoveg: "Szoveg",
        csonkolt: false,
        ujjlenyomat: "abc",
        nyelv: "hu",
        lejar: "2026-10-01T10:00:00Z",
      };

      await tar.kivonatMent("sz-1", kivonat);
      const sz1Kivonatok = await tar.kivonatok("sz-1", ["k-1"]);
      expect(sz1Kivonatok).toHaveLength(1);

      // Ugyanez a kanonikus URL más szervezetnél új kivonat
      const sz2Eredmeny = await tar.kivonatMent("sz-2", { ...kivonat, id: "k-sz2" });
      expect(sz2Eredmeny).toBe("uj");

      const sz2Kivonatok = await tar.kivonatok("sz-2", ["k-sz2"]);
      expect(sz2Kivonatok).toHaveLength(1);

      // sz-1 nem látja sz-2 kivonatát
      const sz1Ures = await tar.kivonatok("sz-1", ["k-sz2"]);
      expect(sz1Ures).toHaveLength(0);
    });

    it("10.2.3 lejartKivonatokTorol csak a lejartakat torli", async () => {
      const tar = memoriaTar();
      const szervezetId = "sz-1";

      const lejartKivonat = {
        id: "k-lejart",
        forras_id: "fr-1",
        cim: "Lejart cikk",
        url: "https://teszt.hu/lejart",
        kanonikus_url: "https://teszt.hu/lejart",
        megjelenes: "2026-08-01T08:00:00Z",
        begyujtes: "2026-08-01T09:00:00Z",
        szoveg: "Regi szoveg",
        csonkolt: false,
        ujjlenyomat: "old",
        nyelv: "hu",
        lejar: "2026-09-06T10:00:00Z", // lejart: MOST = 2026-09-07
      };

      const nemLejartKivonat = {
        id: "k-friss",
        forras_id: "fr-1",
        cim: "Friss cikk",
        url: "https://teszt.hu/friss",
        kanonikus_url: "https://teszt.hu/friss",
        megjelenes: "2026-09-06T08:00:00Z",
        begyujtes: "2026-09-06T09:00:00Z",
        szoveg: "Friss szoveg",
        csonkolt: false,
        ujjlenyomat: "new",
        nyelv: "hu",
        lejar: "2026-10-01T10:00:00Z", // nem lejart
      };

      await tar.kivonatMent(szervezetId, lejartKivonat);
      await tar.kivonatMent(szervezetId, nemLejartKivonat);

      const toroltDb = await tar.lejartKivonatokTorol(szervezetId, MOST);
      expect(toroltDb).toBe(1);

      const meglevoKivonatok = await tar.kivonatok(szervezetId, ["k-lejart", "k-friss"]);
      expect(meglevoKivonatok).toHaveLength(1);
      expect(meglevoKivonatok[0].id).toBe("k-friss");
    });

    it("10.2.4 cikkKulcs szerinti egyedi tarolas", async () => {
      // A cikkKulcs függvényt ellenőrizzük, hogy a tár helyesen használja
      const kulcs1 = cikkKulcs("sz-1", "https://teszt.hu/cikk1");
      const kulcs2 = cikkKulcs("sz-1", "https://teszt.hu/cikk1");
      const kulcs3 = cikkKulcs("sz-2", "https://teszt.hu/cikk1");
      const kulcs4 = cikkKulcs("sz-1", "https://teszt.hu/cikk2");

      expect(kulcs1).toBe(kulcs2); // azonos szervezet, azonos URL
      expect(kulcs1).not.toBe(kulcs3); // más szervezet
      expect(kulcs1).not.toBe(kulcs4); // más URL
    });
  });
});
