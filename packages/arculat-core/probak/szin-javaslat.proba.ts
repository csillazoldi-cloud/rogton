// R-16 K4 (TERV §2-K4 Self-test, gepezet 6 · 6b): a 12d négy összeállításának sorrendje és a 12d2 gyűrűje — tiszta számítás.
import { describe, expect, it } from "vitest";
import {
  GYURU, SZETTEK, arnyalat, deltaE, kontraszt, legkozelebbiSzett, logoSzinSor, majdnemEgyforma, szett, szinJavaslatok, szinekbolOsszeallitas,
  type JavaslatBemenet,
} from "../src/index.js";

const KOVESI = "Kövesi Térkő Kft. Térkövezés, burkolás és udvarépítés Marosvásárhelyen és környékén.";
const alapszett = (id: string) => { const s = szett(id)!; return { fo: s.fo, masodik: s.masodik, hatter: s.hatter }; };
const be = (resz: Partial<JavaslatBemenet>): JavaslatBemenet => ({
  jelenlegi: alapszett("termeszetes"), szinForras: "szett", szinSzett: "termeszetes", vanLogo: false, logoSzinek: [], szakma: KOVESI, ...resz,
});

describe("12d — a négy összeállítás sorrendje", () => {
  it("Kövesi (térkő) → Természetes · Megbízható · Elegáns a hangulatok; a mostani (Megbízható) elöl ✓, utána a többi hangulat", () => {
    const j = szinJavaslatok(be({ jelenlegi: alapszett("megbizhato"), szinSzett: "megbizhato" }));
    expect(j).toHaveLength(4);
    expect(j[0]).toMatchObject({ kulcs: "jelenlegi", jelenlegi: true, nev: "r16.arculat.szettek.megbizhato", forras: "szett", szett: "megbizhato" });
    // Megbízható már látszik (a mostani) → kimarad; a hangulatok után a feliratfájl sorrendje tölt (Meleg)
    expect(j.slice(1).map((x) => x.kulcs)).toEqual(["termeszetes", "elegans", "meleg"]);
    expect(j.filter((x) => x.jelenlegi)).toHaveLength(1);
  });
  it("Kövesi logó nélkül, a mostani a Természetes szett → Megbízható · Elegáns · (Meleg)", () => {
    const j = szinJavaslatok(be({}));
    expect(j.map((x) => x.kulcs)).toEqual(["jelenlegi", "megbizhato", "elegans", "meleg"]);
    expect(j[0]!.nev).toBe("r16.arculat.szettek.termeszetes");
  });
  it("pékség → a Meleg az első hangulat", () => {
    const j = szinJavaslatok(be({ jelenlegi: { fo: "#123456", masodik: "#abcdef", hatter: "#fafafa" }, szinForras: "sajat", szinSzett: "", szakma: "Cipó Pékség, kovászos kenyér" }));
    expect(j[1]!.kulcs).toBe("meleg");
    expect(j.slice(1).map((x) => x.kulcs)).toEqual(["meleg", "termeszetes", "jatekos"]);
  });
  it("ismeretlen szakma → gepezet 6 alapja: természetes · megbízható · meleg", () => {
    const j = szinJavaslatok(be({ jelenlegi: { fo: "#5a189a", masodik: "#ff9e00", hatter: "#fff7ee" }, szinForras: "", szinSzett: "", szakma: "Valami Kft." }));
    expect(j.slice(1).map((x) => x.kulcs)).toEqual(["termeszetes", "megbizhato", "meleg"]);
  });
  it("a mostani címkéje: logo → „A logódból”, honlap → „A honlapodról”, saját logóval → „A logódból”, saját logó nélkül → a legközelebbi szett", () => {
    expect(szinJavaslatok(be({ szinForras: "logo" }))[0]).toMatchObject({ nev: "r16.arculat.szettek.logobol", forras: "logo" });
    expect(szinJavaslatok(be({ szinForras: "honlap" }))[0]).toMatchObject({ nev: "r16.arculat.szettek.honlaprol", forras: "honlap" });
    expect(szinJavaslatok(be({ szinForras: "sajat", vanLogo: true }))[0]).toMatchObject({ nev: "r16.arculat.szettek.logobol", forras: "sajat" });
    const kozel = { fo: "#203b60", masodik: "#80b0e0", hatter: "#f2f5f9" }; // majdnem a Megbízható
    expect(szinJavaslatok(be({ jelenlegi: kozel, szinForras: "gep" }))[0]).toMatchObject({ nev: "r16.arculat.szettek.megbizhato", forras: "sajat" });
    expect(szinJavaslatok(be({ szinForras: "szett", szinSzett: "nincs-ilyen", jelenlegi: kozel }))[0]!.nev).toBe("r16.arculat.szettek.megbizhato");
  });
  it("saját színek logóval, de a logó-összeállítástól eltérőn: a mostani a legközelebbi szett nevét kapja (nincs két „A logódból”)", () => {
    const j = szinJavaslatok(be({ vanLogo: true, logoSzinek: ["#1b5e20", "#f9a825"], jelenlegi: { fo: "#c2410c", masodik: "#7fb2e5", hatter: "#f3f6fa" }, szinForras: "sajat", szinSzett: "" }));
    expect(j.filter((x) => x.nev === "r16.arculat.szettek.logobol")).toHaveLength(1);
    expect(j[0]).toMatchObject({ jelenlegi: true, forras: "sajat" });
    expect(j[0]!.nev).not.toBe("r16.arculat.szettek.logobol");
    expect(j[1]!.kulcs).toBe("logo");
  });
  it("a logóból rakott összeállítás a második, ha eltér a mostanitól; utána két hangulat", () => {
    const j = szinJavaslatok(be({ vanLogo: true, logoSzinek: ["#c0392b", "#f1c40f"], jelenlegi: alapszett("termeszetes") }));
    expect(j.map((x) => x.kulcs)).toEqual(["jelenlegi", "logo", "megbizhato", "elegans"]);
    const l = j[1]!;
    expect(l).toMatchObject({ forras: "logo", nev: "r16.arculat.szettek.logobol", jelenlegi: false });
    expect(kontraszt(l.fo, l.hatter)).toBeGreaterThanOrEqual(4.5);
  });
  it("a logóból rakott összeállítás kimarad, ha (majdnem) a mostani — és a mostani már a logóból jött", () => {
    const logo = szinekbolOsszeallitas(["#2f5d50", "#c9a86a"])!;
    const j = szinJavaslatok(be({ vanLogo: true, logoSzinek: ["#2f5d50", "#c9a86a"], jelenlegi: logo, szinForras: "logo" }));
    expect(j.map((x) => x.kulcs)).not.toContain("logo");
    expect(j).toHaveLength(4);
  });
  it("logó nélkül a honlap színjelöltjeiből rakott összeállítás „A honlapodról”", () => {
    const j = szinJavaslatok(be({ honlapSzinek: ["#8e2de2", "#ffb703"] }));
    expect(j[1]).toMatchObject({ kulcs: "honlap", forras: "honlap", nev: "r16.arculat.szettek.honlaprol" });
  });
  it("a majdnem egyformák kimaradnak (ΔE < 10 mindhárom színen), és mindig négy kártya van, mind különböző", () => {
    for (const s of SZETTEK) {
      const j = szinJavaslatok(be({ jelenlegi: alapszett(s.id), szinSzett: s.id }));
      expect(j).toHaveLength(4);
      for (let a = 0; a < j.length; a++) for (let b = a + 1; b < j.length; b++) expect(majdnemEgyforma(j[a]!, j[b]!)).toBe(false);
    }
  });
  it("Tibor-bíráló 09-30: a saját színek a Természeteshez állnak legközelebb (de ΔE ≥ 10) → a mostani „Természetes ✓”, és NEM jön még egy „Természetes”", () => {
    // a Természetes szett kissé elmozdítva: egyik színen sem majdnem egyforma, a neve mégis az lenne
    const j = szinJavaslatok(be({ jelenlegi: { fo: "#2a6a55", masodik: "#c49a55", hatter: "#f5f0e0" }, szinForras: "ai", szinSzett: "" }));
    expect(j).toHaveLength(4);
    expect(j[0]!.nev).toBe("r16.arculat.szettek.termeszetes");
    expect(new Set(j.map((x) => x.nev)).size).toBe(4);
    expect(j.slice(1).map((x) => x.kulcs)).toEqual(["megbizhato", "elegans", "meleg"]);
  });
});

describe("színtani segédek", () => {
  it("ΔE: ugyanaz 0, fekete–fehér 100", () => {
    expect(deltaE("#2f5d50", "#2f5d50")).toBe(0);
    expect(Math.round(deltaE("#000000", "#ffffff"))).toBe(100);
    expect(deltaE("nem", "#ffffff")).toBe(Infinity);
  });
  it("a legközelebbi szett a sajátja", () => {
    for (const s of SZETTEK) expect(legkozelebbiSzett(alapszett(s.id))).toBe(s.id);
  });
  it("a színekből rakott összeállítás: a fő szín olvasható a háttéren, a túl világos logószín sötétítve", () => {
    const o = szinekbolOsszeallitas(["#ffd166", "#06d6a0"])!; // egyik sem elég sötét fehéren
    expect(kontraszt(o.fo, o.hatter)).toBeGreaterThanOrEqual(4.5);
    expect(kontraszt(o.fo, "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(szinekbolOsszeallitas(["#ffffff", "#000000", "#808080"])).toBeNull(); // nincs márkaszín
    const egy = szinekbolOsszeallitas(["#1f3a5f"])!; // egy szín: a második a legközelebbi szetté
    expect(egy.masodik).toBe(szett("megbizhato")!.masodik);
  });
});

describe("12d2 — a gyűrű és a logó színei", () => {
  it("a gyűrű pontosan 12 különböző szín: a hat szett fő és második színe, árnyalat szerint", () => {
    expect(GYURU).toHaveLength(12);
    expect(new Set(GYURU).size).toBe(12);
    expect([...GYURU].sort()).toEqual(SZETTEK.flatMap((s) => [s.fo, s.masodik]).sort());
    for (let i = 1; i < GYURU.length; i++) expect(arnyalat(GYURU[i]!)).toBeGreaterThanOrEqual(arnyalat(GYURU[i - 1]!));
  });
  it("a logó színsora: ismétlés nélkül, legfeljebb 5, kisbetűvel", () => {
    expect(logoSzinSor(["#2F5D50", "#2f5d50", "#c9a86a", "#2f5d51", "#111111", "#222222", "#333333", "#444444"])).toEqual(["#2f5d50", "#c9a86a", "#111111", "#222222", "#333333"]);
  });
});
