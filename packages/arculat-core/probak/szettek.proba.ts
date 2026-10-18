// R-16 K3 (TERV §2-K3/§2-K4): a hat bevált szett adata és a szakma → hangulat tábla (a 12a alapszettje).
import { describe, expect, it } from "vitest";
import { ALAP_HANGULATOK, BEEPITETT, SZETTEK, SZETT_IDK, alapSzett, betuKulcs, betuSzo, ekezetNelkul, hangulatok, relativVilagossag, hexbol } from "../src/index.js";

const kontraszt = (a: string, b: string) => {
  const la = relativVilagossag(hexbol(a)!), lb = relativVilagossag(hexbol(b)!);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

describe("a hat bevált szett", () => {
  it("pontosan a hat azonosító, a TERV §2-K4 színeivel, kisbetűs #rrggbb", () => {
    expect(SZETTEK.map((s) => s.id)).toEqual([...SZETT_IDK]);
    for (const s of SZETTEK) for (const h of [s.fo, s.masodik, s.hatter]) expect(h).toMatch(/^#[0-9a-f]{6}$/);
    expect(SZETTEK.find((s) => s.id === "meleg")).toMatchObject({ fo: "#a4471f", masodik: "#e3a857", hatter: "#fbf3e8", cim: "gelasio", szoveg: "public-sans" });
    expect(SZETTEK.find((s) => s.id === "termeszetes")).toMatchObject({ fo: "#2f5d50", masodik: "#c9a86a", hatter: "#f1ede4", cim: "archivo" });
  });
  it("minden szettben a fő szín olvasható a háttéren (≥ 4,5 — a TERV mérése ≥ 4,9)", () => {
    for (const s of SZETTEK) expect(kontraszt(s.fo, s.hatter)).toBeGreaterThanOrEqual(4.5);
  });
  it("minden alapbetű a beépített ötből, és van hangulatszava", () => {
    const kulcsok = BEEPITETT.map((b) => b.kulcs);
    for (const s of SZETTEK) { expect(kulcsok).toContain(s.cim); expect(kulcsok).toContain(s.szoveg); }
    expect(betuSzo("gelasio")).toBe("r16.arculat.betu.klasszikus");
    expect(betuSzo("archivo")).toBe("r16.arculat.betu.eros");
  });
});

describe("szakma → hangulat", () => {
  it("pékség → Meleg (a 12a Cipó Pékség)", () => {
    expect(hangulatok("Cipó Pékség pékség, kovászos kenyér")[0]).toBe("meleg");
    expect(alapSzett("Cipó Pékség pékség, kovászos kenyér").id).toBe("meleg");
  });
  it("térkő → Természetes · Megbízható · Elegáns (Kövesi)", () => {
    expect(hangulatok("Kövesi Térkő és Burkolat Kft. Térkövezés, szegélyezés és vízelvezetés Maros megyében")).toEqual(["termeszetes", "megbizhato", "elegans"]);
  });
  it("ékezet és kisbetű nem számít; román és angol tövek is", () => {
    expect(hangulatok("BRUTĂRIE ARTIZANALĂ")[0]).toBe("meleg");
    expect(hangulatok("Clinica Medicală Zâmbet")[0]).toBe("friss");
    expect(hangulatok("Școala de dans")[0]).toBe("jatekos");
    expect(hangulatok("Smith & Sons Accounting Software")[0]).toBe("megbizhato");
    expect(ekezetNelkul("Ördögh Ősz Știință")).toBe("ordogh osz stiinta");
  });
  it("a tő a szó elejére illik: a „kovács” nem ács, a „palacsinta” nem ács", () => {
    expect(hangulatok("Kovács Palacsintázó")).toEqual(ALAP_HANGULATOK);
  });
  it("egyezés nélkül: természetes · megbízható · meleg (gepezet 6)", () => {
    expect(hangulatok("")).toEqual(["termeszetes", "megbizhato", "meleg"]);
    expect(hangulatok("Valami Kft.")).toEqual(["termeszetes", "megbizhato", "meleg"]);
  });
});

describe("betűkulcs a tervezetből", () => {
  it("új kulcs marad; a régi CSS-szöveg a képgyártó szabálya szerint", () => {
    expect(betuKulcs("gelasio")).toBe("gelasio");
    expect(betuKulcs("'Archivo',sans-serif")).toBe("archivo");
    expect(betuKulcs("Georgia, serif")).toBe("gelasio");
    expect(betuKulcs("'IBM Plex Sans',sans-serif")).toBe("ibm-plex-sans");
    expect(betuKulcs("'Cairo',sans-serif")).toBe("public-sans");
    expect(betuKulcs("system-ui, sans-serif")).toBe("public-sans");
    expect(betuKulcs("")).toBe("public-sans");
    expect(betuKulcs(null)).toBe("public-sans");
  });
});
