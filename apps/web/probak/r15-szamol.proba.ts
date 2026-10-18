import { describe, it, expect } from "vitest";
import {
  rovidCim,
  napjaVolt,
  halad,
  forrasNev,
  sorok,
  posztKesz,
  rovidNev,
  varoPoszt,
} from "../r15/szamol";
import type { PosztMunka } from "@km/contracts";

const minta = {
  id: "00000000-0000-4000-8000-000000000001",
  szervezet_id: "00000000-0000-4000-8000-000000000002",
  cim: "Nem is térkő, hanem díszburkolat! A prémium kültéri megoldások új szintjét képviseli",
  forras: {
    tipus: "hir",
    azonosito: "a1",
    cim: "Nem is térkő, hanem díszburkolat! A prémium kültéri megoldások új szintjét képviseli",
    url: "https://www.magyarepitok.hu/x",
    szoveg: "",
    rovid_nev: "",
    rovid_cim: "Nem is térkő, hanem díszburkolat!",
    otlet: "",
  },
  szovegek: [
    {
      felulet: "fb",
      nyelv: "hu",
      szoveg: "Cím sor\n\nElső mondat. Második.\n\n#a #b",
      javaslat: "",
      hashtagek: ["a", "b"],
      allapot: "vegleges",
      veglegesitve: "2026-09-26T10:00:00.000Z",
      nyelvre_szabva: true,
      elavult_forditas: false,
    },
  ],
  osszhang: null,
  piros_veglegesites: false,
  letrehozva: "2026-09-23T10:00:00Z",
  frissitve: "2026-09-23T10:00:00Z",
} as PosztMunka;

describe("rovidCim", () => {
  it("vágja az első mondatot", () => {
    expect(rovidCim("Nem is térkő, hanem díszburkolat! A prémium kültéri megoldások új szintjét képviseli")).toBe("Nem is térkő, hanem díszburkolat!");
  });
  it("8 szónál hosszabb első mondatot vág", () => {
    const cim = "Egy ketto hato nyolc kilenc tiz tizenegy tizenkettő pont.";
    expect(rovidCim(cim)).toBe("Egy ketto hato nyolc kilenc tiz tizenegy tizenkettő…");
  });
  it("8 szónál rövidebbet változatlanul hagy", () => {
    expect(rovidCim("Egy ketto hato nyolc")).toBe("Egy ketto hato nyolc");
  });
});

describe("napjaVolt", () => {
  it("nullt ad null bemenetre", () => {
    expect(napjaVolt(null)).toBeNull();
  });
  it("0-t ad ugyanazon a napon", () => {
    expect(napjaVolt("2026-09-27T10:00:00Z", new Date("2026-09-27T05:00:00Z"))).toBe(0);
  });
  it("1-et ad előző napon", () => {
    expect(napjaVolt("2026-09-26T10:00:00Z", new Date("2026-09-27T05:00:00Z"))).toBe(1);
  });
  it("4-et ad 4 napra", () => {
    expect(napjaVolt("2026-09-23T10:00:00Z", new Date("2026-09-27T05:00:00Z"))).toBe(4);
  });
  it("nullt ad érvénytelen dátumra", () => {
    expect(napjaVolt("nem datum")).toBeNull();
  });
  it("Bukaresti időzónát kezeli", () => {
    expect(napjaVolt("2026-09-26T22:30:00Z", new Date("2026-09-27T05:00:00Z"))).toBe(0);
  });
});

describe("halad", () => {
  it("számolja az arányt", () => {
    expect(halad(1, 2, 2)).toEqual({ poszt_kesz: 1, kep_letoltve: 2, varo: 2, arany: 1 / 3 });
  });
  it("0 arányt ad üres adatnál", () => {
    expect(halad(0, 0, 0).arany).toBe(0);
  });
  it("1 arányt ad ha minden kész", () => {
    expect(halad(5, 0, 0).arany).toBe(1);
  });
});

describe("forrasNev", () => {
  it("kivágja a domaint", () => {
    expect(forrasNev("https://www.magyarepitok.hu/x")).toBe("magyarepitok.hu");
  });
  it("üres stringet ad hibás URL-re", () => {
    expect(forrasNev("hibas")).toBe("");
  });
});

describe("sorok", () => {
  it("kiválasztja az első és második mondatot", () => {
    expect(sorok("Cím sor\n\nElső mondat. Második.\n\n#a #b")).toEqual({ elso: "Cím sor", masodik: "Első mondat." });
  });
  it("üres elso-t ad csak hashtag-sornál", () => {
    expect(sorok("#a #b")).toEqual({ elso: "", masodik: "" });
  });
});

describe("posztKesz", () => {
  it("igaz ha bármelyik cella végleges", () => {
    expect(posztKesz(minta)).toBe(true);
  });
  it("hamis üres szovegek-nél", () => {
    const ures = { ...minta, szovegek: [] } as PosztMunka;
    expect(posztKesz(ures)).toBe(false);
  });
});

describe("rovidNev", () => {
  it("használja a forras.rovid_nev-et", () => {
    const m = { ...minta, forras: { ...minta.forras, rovid_nev: "Díszburkolat" } } as PosztMunka;
    expect(rovidNev(m)).toBe("Díszburkolat");
  });
  it("vágja a rovid_cim első 3 szavát", () => {
    const m = { ...minta, forras: { ...minta.forras, rovid_nev: "", rovid_cim: "Egy ketto hato nyolc kilenc" } } as PosztMunka;
    expect(rovidNev(m)).toBe("Egy ketto hato…");
  });
});

describe("varoPoszt", () => {
  it("kiértékeli a hu nyelvű fb cellát", () => {
    const v = varoPoszt(minta, "hu");
    expect(v.elso_sor).toBe("Cím sor");
    expect(v.van_szoveg).toBe(true);
  });
  it("hamis van_szoveg-ot ad üres cellákkal", () => {
    const m = { ...minta, szovegek: [{ ...minta.szovegek[0], szoveg: "" }] } as PosztMunka;
    expect(varoPoszt(m, "hu").van_szoveg).toBe(false);
  });
  it("VJ-1011: a telefonos nagy sor legfeljebb 8 szó + „…”, a teljes (≤ 12 szavas) sor marad asztalra", () => {
    const hosszu = "[MINTA] Posztszöveg a megadott forrásból: === A CÉG PROFILJA === A cég térköves udvarokat épít.";
    const m = { ...minta, szovegek: [{ ...minta.szovegek[0], szoveg: hosszu }] } as PosztMunka;
    const v = varoPoszt(m, "hu");
    expect(v.elso_sor.split(/\s+/).length).toBeGreaterThan(8);
    expect(v.elso_sor_rovid).toBe("[MINTA] Posztszöveg a megadott forrásból: === A CÉG…");
    expect(varoPoszt(minta, "hu").elso_sor_rovid).toBe("Cím sor");
  });
});

// R-15 08b — az előnézet vágása (a rajz díszburkolatos posztján mérve, 2026-09-27)
import { elonezetVag } from "../r15/szamol";
const DISZ = "Nem is térkő, hanem díszburkolat!\n\nSokan kérdezik, megéri-e prémium burkolatot tenni az udvarra. A VIASTEIN LUX-hoz hasonló díszburkolat évek múlva is szép marad, nem fakul, és könnyebb tisztán tartani.\n\nMi Marosvásárhelyen és környékén rakjuk le, az alapozástól az utolsó kőig. Kérj ingyenes felmérést, és megmutatjuk, mi illik a te udvarodhoz.\n\n#ÖtödikTérkő #díszburkolat #Marosvásárhely";

describe("elonezetVag (08b)", () => {
  it("Facebookon a 412 karakteres poszt nem vágódik", () => {
    expect(elonezetVag(DISZ, "fb")).toEqual({ latszo: DISZ, vagott: false, tul: false });
  });
  it("Instagramon egy sorban, szóhatáron vág (a rajz szerint: „…hasonló”)", () => {
    const e = elonezetVag(DISZ, "ig");
    expect(e.vagott).toBe(true);
    expect(e.latszo.endsWith("A VIASTEIN LUX-hoz hasonló")).toBe(true);
    expect(e.latszo.includes("\n")).toBe(false);
  });
  it("LinkedInen nem hagy csonka új bekezdést a „több” előtt (a rajz szerint: „…tisztán tartani”)", () => {
    const e = elonezetVag(DISZ, "li");
    expect(e.latszo.endsWith("könnyebb tisztán tartani")).toBe(true);
  });
  it("a felső határ fölött valódi baj", () => {
    expect(elonezetVag("a ".repeat(1200), "ig").tul).toBe(true);
    expect(elonezetVag("rövid", "ig").tul).toBe(false);
  });
});

// R-15 · 3. szállítmány (gepezet-2 1–2): a bemutatkozó poszt jele és a Kezdőlap állapota
import { BEMUTATKOZO_AZONOSITO, bemutatkozoPoszt, kezdolapAllapot } from "../r15/szamol";

describe("bemutatkozoPoszt (gepezet-2 1)", () => {
  it("a saját ötletből készült, rögzített azonosítójú munka a bemutatkozó", () => {
    expect(bemutatkozoPoszt({ forras: { ...minta.forras, tipus: "sajat", azonosito: BEMUTATKOZO_AZONOSITO } })).toBe(true);
  });
  it("a hírből írt és a sima „Saját ötletből” poszt nem az", () => {
    expect(bemutatkozoPoszt(minta)).toBe(false);
    expect(bemutatkozoPoszt({ forras: { ...minta.forras, tipus: "sajat", azonosito: "" } })).toBe(false);
    expect(bemutatkozoPoszt({ forras: { ...minta.forras, tipus: "hir", azonosito: BEMUTATKOZO_AZONOSITO } })).toBe(false);
  });
  it("a varoPoszt viszi a jelet", () => {
    expect(varoPoszt(minta, "hu").bemutatkozo).toBe(false);
    const b = { ...minta, forras: { ...minta.forras, tipus: "sajat", azonosito: BEMUTATKOZO_AZONOSITO } } as PosztMunka;
    expect(varoPoszt(b, "hu").bemutatkozo).toBe(true);
  });
});

describe("kezdolapAllapot (gepezet-2 2)", () => {
  const b = { bemutatkozo: true }, h = { bemutatkozo: false };
  const nulla = { poszt_kesz: 0, kep_letoltve: 0 };
  it("03a: egyetlen váró poszt, a bemutatkozó, és még soha nem lett kész poszt", () => {
    expect(kezdolapAllapot([b], nulla, false)).toBe("elso");
  });
  it("03b: a bemutatkozó mellett más is vár, vagy volt már kész poszt", () => {
    expect(kezdolapAllapot([b, h], nulla, false)).toBe("dolgos");
    expect(kezdolapAllapot([b], nulla, true)).toBe("dolgos");
    expect(kezdolapAllapot([h], nulla, false)).toBe("dolgos");
  });
  it("03c: semmi nem vár, a héten volt kész poszt vagy letöltött kép", () => {
    expect(kezdolapAllapot([], { poszt_kesz: 2, kep_letoltve: 3 }, true)).toBe("kesz");
    expect(kezdolapAllapot([], { poszt_kesz: 0, kep_letoltve: 1 }, true)).toBe("kesz");
  });
  it("03c kész-pillanat nélkül: semmi nem vár, és a héten semmi nem lett kész", () => {
    expect(kezdolapAllapot([], nulla, true)).toBe("munkad");
    expect(kezdolapAllapot([], nulla, false)).toBe("munkad");
  });
});
