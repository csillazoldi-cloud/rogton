// R-13 (2026-09-22, Vilmos): fiókonkénti hírszűrés — a gép egyszer olvas, a program tagonként dönt.
import { describe, it, expect } from "vitest";
import { eloAtmegy, fokozatSzerint, kinekKell, nezoSzerint, szuroKulcs, ALAP_SZURES, type TagSzures, type EloTenyek } from "../src/tag-szures";
import { eloszur } from "../src/eloszuro";
import type { Ertekeles, Talalat } from "../src/talalat";
import type { AiHivo } from "../src/host";
import type { Beallitas } from "../src/beallitas";

const ert = (x: Partial<Ertekeles>): Ertekeles => ({
  fontossag: "erdekes", temacimke: "szakmai", miert: "Írhattok róla.", indoklas: "", osszefoglalo: "",
  szabaly_verzio: 1, ertekelve: "2026-09-22T08:00:00.000Z", csonkolt_alapjan: false, szuro_verzio: 12,
  rola_szol: false, fo_tema: "", erintett_tema: "", hely_ok: true, elo: null, ...x,
});
const tal = (e: Ertekeles | null, allapot: Talalat["ertekeles_allapot"] = "kesz"): Talalat => ({
  id: "t1", szervezet_id: "sz", esemeny_id: "e1", kivonat_id: "t1", ertekeles: e, ertekeles_allapot: allapot,
  megtekintes: "uj", jeloles: "nincs", letrehozva: "2026-09-22T08:00:00.000Z", futas_id: "f1", tartalomotlet: null,
});
const tag = (fiok_id: string, fokozat: TagSzures["fokozat"], eloszures = true): TagSzures => ({ fiok_id, fokozat, eloszures });

describe("fokozatSzerint: a három fokozat a tényekből", () => {
  it("helyi, fő témás hír: mindhárom fokozat látja", () => {
    const e = ert({ fo_tema: "iskola", hely_ok: true });
    expect(fokozatSzerint(e, "nagyon_szigoru")).toBe("erdekes");
    expect(fokozatSzerint(e, "kozepes")).toBe("erdekes");
    expect(fokozatSzerint(e, "laza")).toBe("erdekes");
  });
  it("országos, fő témás hír: a szigorú nem, a közepes és a laza igen", () => {
    const e = ert({ fo_tema: "AI", hely_ok: false });
    expect(fokozatSzerint(e, "nagyon_szigoru")).toBe("hatter");
    expect(fokozatSzerint(e, "kozepes")).toBe("erdekes");
    expect(fokozatSzerint(e, "laza")).toBe("erdekes");
  });
  it("csak érinti a témát: csak a laza látja", () => {
    const e = ert({ fo_tema: "", erintett_tema: "oktatás", hely_ok: true });
    expect(fokozatSzerint(e, "nagyon_szigoru")).toBe("hatter");
    expect(fokozatSzerint(e, "kozepes")).toBe("hatter");
    expect(fokozatSzerint(e, "laza")).toBe("erdekes");
  });
  it("rólad szól: mindenki látja, helytől függetlenül", () => {
    const e = ert({ fontossag: "fontos", rola_szol: true, fo_tema: "", hely_ok: false });
    expect(fokozatSzerint(e, "nagyon_szigoru")).toBe("fontos");
  });
  it("háttér marad háttér; a régi (tények nélküli) értékelés a tárolt fontosságot adja", () => {
    expect(fokozatSzerint(ert({ fontossag: "hatter", fo_tema: "iskola" }), "laza")).toBe("hatter");
    const regi = ert({ fo_tema: undefined, erintett_tema: undefined, hely_ok: undefined, rola_szol: undefined });
    expect(fokozatSzerint(regi, "nagyon_szigoru")).toBe("erdekes");
  });
});

describe("eloAtmegy: a tag saját előszűrője", () => {
  const helyNelkul: EloTenyek = { szolista: { nev: false, hely: false, tema: true }, cim: "fo" };
  it("a szigorúnak kell a hely, a közepesnek nem", () => {
    expect(eloAtmegy(helyNelkul, { fokozat: "nagyon_szigoru", eloszures: true })).toBe(false);
    expect(eloAtmegy(helyNelkul, { fokozat: "kozepes", eloszures: true })).toBe(true);
  });
  it("a cím „csak érinti” csak a lazának elég; a „nem” senkinek", () => {
    const e: EloTenyek = { szolista: { nev: false, hely: true, tema: true }, cim: "erinti" };
    expect(eloAtmegy(e, { fokozat: "kozepes", eloszures: true })).toBe(false);
    expect(eloAtmegy(e, { fokozat: "laza", eloszures: true })).toBe(true);
    expect(eloAtmegy({ ...e, cim: "nem" }, { fokozat: "laza", eloszures: true })).toBe(false);
  });
  it("kikapcsolt előszűrés és hiányzó tények: átmegy; a név mindig átenged", () => {
    expect(eloAtmegy({ szolista: { nev: false, hely: false, tema: false }, cim: "nem" }, { fokozat: "nagyon_szigoru", eloszures: false })).toBe(true);
    expect(eloAtmegy(null, ALAP_SZURES)).toBe(true);
    expect(eloAtmegy({ szolista: { nev: true, hely: false, tema: false }, cim: null }, ALAP_SZURES)).toBe(true);
  });
  it("kinekKell: akiknek átmegy — ők osztoznak az olvasáson", () => {
    const tagok = [tag("a", "nagyon_szigoru"), tag("b", "kozepes"), tag("c", "laza", false)];
    expect(kinekKell(helyNelkul, tagok).map((t) => t.fiok_id)).toEqual(["b", "c"]);
  });
});

describe("nezoSzerint: a találat a néző szemével", () => {
  it("a szigorú néző háttérnek látja az országos hírt, a közepes érdekesnek; a tárolt nem változik", () => {
    const t = tal(ert({ fo_tema: "AI", hely_ok: false }));
    expect(nezoSzerint(t, { fokozat: "nagyon_szigoru", eloszures: true }).ertekeles?.fontossag).toBe("hatter");
    expect(nezoSzerint(t, { fokozat: "kozepes", eloszures: true }).ertekeles?.fontossag).toBe("erdekes");
    expect(t.ertekeles?.fontossag).toBe("erdekes");
  });
  it("amit senkinek nem olvasott el a gép, az mindenkinek háttér; néző nélkül és függő találatnál nincs változás", () => {
    const t = tal(ert({ fontossag: "hatter", kiszurve: "szolista" }));
    expect(nezoSzerint(t, { fokozat: "laza", eloszures: false }).ertekeles?.fontossag).toBe("hatter");
    const e = tal(ert({ fo_tema: "AI", hely_ok: false }));
    expect(nezoSzerint(e, undefined)).toBe(e);
    expect(nezoSzerint(tal(null, "fuggoben"), ALAP_SZURES).ertekeles).toBeNull();
  });
  it("szuroKulcs", () => {
    expect(szuroKulcs({ fokozat: "kozepes", eloszures: false })).toBe("kozepes|ki");
  });
});

describe("eloszur tagonként", () => {
  const beallitas: Beallitas = { celok: ["szakmai"], temak: [{ nev: "iskola", nevvaltozatok: [], megkulonboztetes: "" }], foldrajzi_fokusz: "", nyelvek: [], kizarasok: [], idozites: { mod: "kezi", ora: 7, perc: 0, idozona: "Europe/Bucharest" }, szabad_szoveg: "" };
  const cikkek = [
    { id: "helyi", cim: "Új iskola Marosvásárhelyen", szoveg: "" },
    { id: "orszagos", cim: "Országos iskolai reform", szoveg: "" },
    { id: "sport", cim: "Győzött a csapat Marosvásárhelyen", szoveg: "" },
  ];
  const lista = { hely: { nev: "Marosvásárhely", szavak: ["Marosvásárhely"] }, temak: [{ nev: "iskola", szavak: ["iskola"] }], nevek: [] };
  const ai = (hivasok: string[]): AiHivo => (async (feladat: string, be: unknown) => {
    hivasok.push(feladat);
    if (feladat === "hf_szolista") return { ok: true, valasz: lista, becsult_usd: 0 };
    if (feladat === "hf_cim_szures") return { ok: true, valasz: { megtart: (be as { cimek: { sorszam: number }[] }).cimek.map((c) => c.sorszam), erinti: [] }, becsult_usd: 0 };
    return { ok: false, kod: "AI_NEM_ELERHETO" };
  }) as AiHivo;

  it("csak szigorú tag: az országos és a sport kiesik", async () => {
    const r = await eloszur({ ai: ai([]), profil: {} }, beallitas, cikkek, [tag("a", "nagyon_szigoru")]);
    expect([...r.kiszurt.keys()].sort()).toEqual(["orszagos", "sport"]);
  });
  it("egy közepes tag mellett az országos iskolai hírt is elolvassa a gép; a sportot senkinek", async () => {
    const r = await eloszur({ ai: ai([]), profil: {} }, beallitas, cikkek, [tag("a", "nagyon_szigoru"), tag("b", "kozepes")]);
    expect([...r.kiszurt.keys()]).toEqual(["sport"]);
    expect(r.tenyek.get("orszagos")?.szolista).toEqual({ nev: false, hely: false, tema: true });
  });
  it("ha senkinek nincs előszűrése, nincs AI-hívás és mindent elolvas", async () => {
    const hivasok: string[] = [];
    const r = await eloszur({ ai: ai(hivasok), profil: {} }, beallitas, cikkek, [tag("a", "laza", false)]);
    expect(r.kiszurt.size).toBe(0);
    expect(hivasok.length).toBe(0);
  });
});
