import { describe, it, expect } from "vitest";
import {
  csomagBemenet,
  csomagOsszeall,
  JavitoCsomagValasz,
  type Visszajelzes,
} from "../src/index";

function vj(resz: Partial<Visszajelzes> & { id: string; lap: string }): Visszajelzes {
  return {
    id: resz.id,
    szervezet_id: resz.szervezet_id ?? "sz-1",
    szervezet_nev: resz.szervezet_nev ?? "Teszt Kft.",
    fiok_id: resz.fiok_id ?? "f-1",
    fiok_nev: resz.fiok_nev ?? "Anna",
    lap: resz.lap,
    lap_cim: resz.lap_cim ?? "",
    elem: resz.elem ?? null,
    kijelolt_szoveg: resz.kijelolt_szoveg ?? "",
    szoveg: resz.szoveg ?? "Nem működik.",
    nyelv: resz.nyelv ?? "hu",
    kep: resz.kep ?? null,
    ablak: resz.ablak ?? { w: 1280, h: 800 },
    allapot: resz.allapot ?? "uj",
    letrehozva: resz.letrehozva ?? "2026-09-15T10:00:00.000Z",
    csomag_id: resz.csomag_id ?? null,
  };
}

describe("csomagBemenet", () => {
  it("minden visszajelzést egy ADAT blokkba tesz, a képet kihagyja", () => {
    const be = csomagBemenet([
      vj({ id: "v-1", lap: "/beallitasok", elem: { cimke: "Mentés gomb", szelektor: "#mentes", szoveg_reszlet: "Mentés" }, szoveg: "Nem ment.", kep: "data:image/png;base64,AAAA" }),
      vj({ id: "v-2", lap: "/hirek", kijelolt_szoveg: "friss hír", szoveg: "Elgépelt." }),
    ]);
    expect(be).toContain("<<ADAT visszajelzes>>");
    expect(be).toContain("<<ADAT VÉGE>>");
    expect(be).toContain("Azonosító: v-1");
    expect(be).toContain("Azonosító: v-2");
    expect(be).toContain("Elem címkéje: Mentés gomb");
    expect(be).toContain("Kijelölt szöveg: friss hír");
    expect(be).not.toContain("data:image/png");
  });
});

describe("csomagOsszeall", () => {
  it("az ismeretlen visszajelzés-azonosítót kiejti", () => {
    const valasz = JavitoCsomagValasz.parse({
      osszefoglalo: "Egy tétel.",
      tetelek: [
        { cim: "Mentés javítása", javaslat: "Nézd meg a mentés végpontot.", sulyossag: "nagy", visszajelzes_ids: ["v-1", "nincs-ilyen"] },
      ],
    });
    let n = 0;
    const csomag = csomagOsszeall("2026-09-15", valasz, [vj({ id: "v-1", lap: "/beallitasok" })], () => `id-${++n}`);
    expect(csomag.tetelek).toHaveLength(1);
    expect(csomag.tetelek[0]!.visszajelzes_ids).toEqual(["v-1"]);
    expect(csomag.tetelek[0]!.lapok).toEqual(["/beallitasok"]);
    expect(csomag.visszajelzes_db).toBe(1);
  });

  it("az üres tételt kihagyja (nem marad hivatkozás)", () => {
    const valasz = JavitoCsomagValasz.parse({
      osszefoglalo: "Két tétel, az egyik üres.",
      tetelek: [
        { cim: "Valós", javaslat: "Javítsd.", sulyossag: "kozepes", visszajelzes_ids: ["v-1"] },
        { cim: "Üres", javaslat: "Nincs mögötte semmi.", sulyossag: "kicsi", visszajelzes_ids: ["nincs-ilyen"] },
      ],
    });
    let n = 0;
    const csomag = csomagOsszeall("2026-09-15", valasz, [vj({ id: "v-1", lap: "/a" })], () => `id-${++n}`);
    expect(csomag.tetelek).toHaveLength(1);
    expect(csomag.tetelek[0]!.cim).toBe("Valós");
  });

  it("a lapokat egyedivé teszi, az azonosítókat a host adja", () => {
    const valasz = JavitoCsomagValasz.parse({
      osszefoglalo: "Két visszajelzés ugyanarról a lapról.",
      tetelek: [
        { cim: "Egy tétel", javaslat: "Javítsd.", sulyossag: "nagy", visszajelzes_ids: ["v-1", "v-2"] },
      ],
    });
    let n = 0;
    const csomag = csomagOsszeall(
      "2026-09-15",
      valasz,
      [vj({ id: "v-1", lap: "/a" }), vj({ id: "v-2", lap: "/a" })],
      () => `id-${++n}`,
    );
    expect(csomag.tetelek[0]!.lapok).toEqual(["/a"]);
    expect(csomag.id).toBe("id-2");
    expect(csomag.tetelek[0]!.id).toBe("id-1");
    expect(csomag.tetelek[0]!.allapot).toBe("javasolt");
  });
});
