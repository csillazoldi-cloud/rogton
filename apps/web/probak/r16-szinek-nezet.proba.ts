// R-16 K4 (TERV §2-K4, gepezet 6 · 6b, kerdesek 4): a 12d/12d2 nézetmodellje és a két tiszta lépés — adatbázis nélkül.
//  - `szinNezet`: a mostani színek ugyanazok, mint a 12a–12c soraié; a logó tárolt színei; az elemzés nélküli (K1 előtti) logók listája;
//  - `szinekJovahagy`: ment ÉS jóváhagy (új verzió, pillanatképet nem ír felül); változatlan, már jóváhagyott választás → ugyanaz az objektum;
//  - `hatterTervezetBefogad`: az onboarding háttérmunkája csak az érintetlen arculatba ír.
import { describe, expect, it } from "vitest";
import { ArculatLepes, type ArculatTervezet } from "@km/contracts";
import type { FajlMeta } from "@km/fajl-core";
import { szinNezet, type SzinBemenet } from "../arculat/szinek";
import { hatterTervezetBefogad, szinekJovahagy } from "../arculat/lepes";
import { alapTervezet } from "../arculat/alap";

const MOST = new Date("2026-09-30T10:00:00.000Z");
const LOGO1 = "11111111-1111-4111-8111-111111111111";
const LOGO2 = "22222222-2222-4222-8222-222222222222";

function profil(arculat: unknown): SzinBemenet["profil"] {
  return {
    nev: "Kövesi Térkő Kft.",
    osszefoglalo: "Térkövezés, burkolás és udvarépítés Marosvásárhelyen — Șoseaua Sighișoarei mellett.",
    nyelvek: ["hu", "ro"],
    arculat: ArculatLepes.parse(arculat),
  };
}
function logo(id: string, elemzes: unknown, feltoltve = "2026-09-29T08:00:00.000Z"): FajlMeta {
  return { id, szervezet_id: "33333333-3333-4333-8333-333333333333", nev: "kövesi logó.png", cel: "logo", tipus: "png", meret: 12_000, feltoltve, feltoltotte: "44444444-4444-4444-8444-444444444444", logo_valtozat: "vilagos", eredet: "feltoltes", elemzes };
}
const ELEMZES = { atlatszo: true, vilagossag: 0.2, szinszam: 2, arany: 3.2, szinek: ["#1b5e20", "#f9a825"] };

describe("szinNezet — a 12d/12d2 adata", () => {
  it("tervezet nélkül: a mostani = a Természetes alapszett (a 12a ugyanezt mutatja), címkéje a szett neve ✓", () => {
    const n = szinNezet({ profil: profil({}), fajlok: [], szerep: "szerkeszto" });
    expect(n.jelenlegi).toEqual({ fo: "#2f5d50", masodik: "#c9a86a", hatter: "#f1ede4" });
    expect(n.javaslatok[0]).toMatchObject({ kulcs: "jelenlegi", jelenlegi: true, nev: "r16.arculat.szettek.termeszetes", forras: "szett", szett: "termeszetes" });
    expect(n.javaslatok.map((j) => j.kulcs)).toEqual(["jelenlegi", "megbizhato", "elegans", "meleg"]);
    expect(n.gyuru).toHaveLength(12);
    expect(n.logoSzinek).toEqual([]);
    expect(n.bemenet.vanLogo).toBe(false);
  });
  it("tárolt elemzésű logóval: a logó színei, és a logóból rakott összeállítás a második", () => {
    const n = szinNezet({ profil: profil({}), fajlok: [logo(LOGO1, ELEMZES)], szerep: "tulajdonos" });
    expect(n.logoSzinek).toEqual(["#1b5e20", "#f9a825"]);
    expect(n.elemzesNelkul).toEqual([]);
    expect(n.javaslatok[1]).toMatchObject({ kulcs: "logo", forras: "logo" });
  });
  it("K1 előtti logó (elemzés nélkül): a böngészőre marad (`elemzesNelkul`), a logó-összeállítás addig nincs", () => {
    const n = szinNezet({ profil: profil({}), fajlok: [logo(LOGO2, null)], szerep: "szerkeszto" });
    expect(n.elemzesNelkul).toEqual([LOGO2]);
    expect(n.logoSzinek).toEqual([]);
    expect(n.javaslatok.map((j) => j.kulcs)).not.toContain("logo");
    expect(n.javaslatok[0]!.nev).toBe("r16.arculat.szettek.termeszetes"); // az alapszett forrása szett
  });
  it("jóváhagyott, nagybetűs, saját színek: kisbetűsen, a legközelebbi szett nevével (logó nélkül)", () => {
    const t = { ...alapTervezet("Kövesi Térkő Kft.", ""), elsodleges: "#1F3A5F", masodlagos: "#7FB2E5", hatter: "#F3F6FA", szin_forras: "sajat", szin_szett: "" };
    const a = { allapot: "jovahagyott", tervezet: t, verzio: 1, jovahagyott_verzio: 1, verziok: { "1": { ...t, jovahagyva: MOST.toISOString(), verzio: 1 } } };
    const n = szinNezet({ profil: profil(a), fajlok: [], szerep: "szerkeszto" });
    expect(n.jelenlegi).toEqual({ fo: "#1f3a5f", masodik: "#7fb2e5", hatter: "#f3f6fa" });
    expect(n.javaslatok[0]).toMatchObject({ nev: "r16.arculat.szettek.megbizhato", forras: "sajat" });
  });
});

describe("szinekJovahagy — „Ez legyen” (kerdesek 4)", () => {
  const alap = alapTervezet("Kövesi Térkő Kft.", "térkő");
  const URES = { vilagos: null, sotet: null, egyszinu: null, negyzetes: null };
  it("tervezet nélkül: az alapszettre épül (betűk onnan), 1. verzió jóváhagyva, a választott szett forrással", () => {
    const a = ArculatLepes.parse({});
    const b = szinekJovahagy(a, { fo: "#1F3A5F", masodik: "#7fb2e5", hatter: "#f3f6fa", forras: "szett", szett: "megbizhato" }, alap, MOST, URES);
    expect(b.allapot).toBe("jovahagyott");
    expect(b.jovahagyott_verzio).toBe(1);
    expect(b.verziok["1"]).toMatchObject({ elsodleges: "#1f3a5f", szin_forras: "szett", szin_szett: "megbizhato", betu_cim: "archivo" });
  });
  it("jóváhagyott arculaton: új verzió (+1), a régi pillanatkép változatlan; 12d2-választás → saját, szett nélkül", () => {
    const a1 = szinekJovahagy(ArculatLepes.parse({}), { fo: "#2f5d50", masodik: "#c9a86a", hatter: "#f1ede4", forras: "szett", szett: "termeszetes" }, alap, MOST, URES);
    const a2 = szinekJovahagy(a1, { fo: "#2f5d50", masodik: "#c2410c", hatter: "#f1ede4", forras: "sajat" }, alap, MOST, URES);
    expect(a2.jovahagyott_verzio).toBe(2);
    expect(a2.verziok["1"]).toEqual(a1.verziok["1"]);
    expect(a2.verziok["2"]).toMatchObject({ masodlagos: "#c2410c", szin_forras: "sajat", szin_szett: "" });
  });
  it("ugyanaz a választás a már jóváhagyottra: ugyanaz az objektum (az arculatMent nem ír, nincs üres új verzió)", () => {
    const a1 = szinekJovahagy(ArculatLepes.parse({}), { fo: "#2f5d50", masodik: "#c9a86a", hatter: "#f1ede4", forras: "szett", szett: "termeszetes" }, alap, MOST, URES);
    expect(szinekJovahagy(a1, { fo: "#2F5D50", masodik: "#c9a86a", hatter: "#f1ede4", forras: "szett", szett: "termeszetes" }, alap, MOST, URES)).toBe(a1);
  });
  it("visszavont (tervezet) állapotban a foglalt verziószám helyett a következő — pillanatképet nem ír felül", () => {
    const a1 = szinekJovahagy(ArculatLepes.parse({}), { fo: "#2f5d50", masodik: "#c9a86a", hatter: "#f1ede4", forras: "szett", szett: "termeszetes" }, alap, MOST, URES);
    const vissza = { ...a1, allapot: "tervezet" as const };
    const a2 = szinekJovahagy(vissza, { fo: "#a4471f", masodik: "#e3a857", hatter: "#fbf3e8", forras: "szett", szett: "meleg" }, alap, MOST, URES);
    expect(a2.verziok["1"]).toEqual(a1.verziok["1"]);
    expect(a2.jovahagyott_verzio).toBe(2);
  });
});

describe("hatterTervezetBefogad — az onboarding háttérmunkájának őre", () => {
  const ai: ArculatTervezet = { ...alapTervezet("Kövesi", ""), elsodleges: "#123456", szin_forras: "gep", szin_szett: "" };
  it("érintetlen arculat → a tervezet bekerül", () => {
    const b = hatterTervezetBefogad(ArculatLepes.parse({}), ai, 1);
    expect(b.allapot).toBe("tervezet");
    expect(b.tervezet?.elsodleges).toBe("#123456");
  });
  it("jóváhagyás után (12a „Így jó, logó nélkül” / 12d „Ez legyen”) → nincs változás (ugyanaz az objektum)", () => {
    const j = szinekJovahagy(ArculatLepes.parse({}), { fo: "#2f5d50", masodik: "#c9a86a", hatter: "#f1ede4", forras: "szett", szett: "termeszetes" }, alapTervezet("K", ""), MOST, undefined);
    expect(hatterTervezetBefogad(j, ai, 1)).toBe(j);
  });
  it("közben írt tervezet, visszavont jóváhagyás vagy más verzió → nincs változás", () => {
    const t = { ...ArculatLepes.parse({}), allapot: "tervezet" as const, tervezet: alapTervezet("K", "") };
    expect(hatterTervezetBefogad(t, ai, 1)).toBe(t);
    const masikVerzio = ArculatLepes.parse({ verzio: 2 });
    expect(hatterTervezetBefogad(masikVerzio, ai, 1)).toBe(masikVerzio);
    const kesobb = ArculatLepes.parse({ allapot: "kesobb" });
    expect(hatterTervezetBefogad(kesobb, ai, 1)).toBe(kesobb);
  });
});
