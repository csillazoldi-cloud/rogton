// R-16 K3 (TERV §2-K3 Self-test): a „Logó, színek, betűk” szakasz nézetmodellje — melyik képernyő (12a ures · 12b talalt · 12c kesz),
// a néző, az alapszett a szakmából, és a három lépés (jóváhagyás, Részletek, visszavonás) tiszta szabálya. Adatbázis nélkül fut.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SzervezetProfil, type ArculatLepes } from "@km/contracts";
import type { FajlMeta } from "@km/fajl-core";
import { arculatNezet, type NezetBemenet } from "../arculat/allapot";
import { alapTervezet } from "../arculat/alap";
import { jovahagyTenyleges, reszletekJovahagy, visszavon } from "../arculat/lepes";

const beolvas = (nev: string) => SzervezetProfil.parse(JSON.parse(readFileSync(new URL(`./r16/${nev}`, import.meta.url), "utf8")));
const kovesi = beolvas("profil-09-2x.json"); // tervezet v3 (nincs jóváhagyva), jóváhagyott v2 — a 09-2x alakú profil
const kesobb = beolvas("profil-kesobb.json"); // „későbbre hagyva”, tervezet nélkül
const most = new Date("2026-09-30T10:00:00.000Z");
const URES_LOGOK = { vilagos: null, sotet: null, egyszinu: null, negyzetes: null };

const cipo = (): NezetBemenet["profil"] => ({
  nev: "Cipó Pékség",
  osszefoglalo: "Pékség, kovászos kenyér, kalács és pogácsa Marosvásárhelyen, a Kossuth utcában.",
  nyelvek: ["hu"],
  arculat: { allapot: "nincs", tervezet: null, verzio: 1, jovahagyott_verzio: null, verziok: {} },
});
const logo = (id: string, hely: NonNullable<FajlMeta["logo_valtozat"]> | null, feltoltve = "2026-09-30T09:00:00.000Z"): FajlMeta => ({
  id, szervezet_id: "11111111-1111-4111-8111-111111111111", nev: "logo.png", tipus: "png", meret: 1000, cel: "logo",
  feltoltotte: "22222222-2222-4222-8222-222222222222", feltoltve, logo_valtozat: hely,
});
const fajl = (id: string, cel: FajlMeta["cel"]): FajlMeta => ({ ...logo(id, null), cel, tipus: "pdf", logo_valtozat: null });
const nezet = (profil: NezetBemenet["profil"], fajlok: FajlMeta[] = [], szerep: NezetBemenet["szerep"] = "tulajdonos") =>
  arculatNezet({ profil, fajlok, szerep, jovahagyoNev: "Kovács Tibor" });

describe("melyik képernyő", () => {
  it("friss munkatér (Cipó Pékség, nincs tervezet, nincs logó) → 12a, a Meleg szettel, nem szürke", () => {
    const n = nezet(cipo());
    expect(n.nezet).toBe("ures");
    expect(n.alapbol).toBe(true);
    expect(n.szinek).toEqual({ fo: "#a4471f", masodik: "#e3a857", hatter: "#fbf3e8" });
    expect(n.betuk).toMatchObject({ cim: "gelasio", szoveg: "public-sans", cimSzo: "r16.arculat.betu.klasszikus", szovegSzo: "r16.arculat.betu.tiszta" });
    expect(n.elonezet).toEqual(n.szinek); // az „Így néz ki” az alapszettel rajzol (POST)
    expect(n.vanLogo).toBe(false);
    expect(n.jovahagyva).toBeNull();
  });
  it("van logó, nincs jóváhagyva → 12b; a honlap címe nélkül nincs „Honnan?”", () => {
    const n = nezet(cipo(), [logo("33333333-3333-4333-8333-333333333333", "vilagos")]);
    expect(n.nezet).toBe("talalt");
    expect(n.logok.vilagos).toBe("33333333-3333-4333-8333-333333333333");
    expect(n.forrasCim).toBe("");
  });
  it("a színek a honlapról (szin_forras = honlap), logó nélkül is → 12b, a címmel", () => {
    const p = cipo();
    p.arculat = { ...p.arculat, allapot: "tervezet", tervezet: { ...alapTervezet(p.nev, p.osszefoglalo), szin_forras: "honlap", forras_cim: "cipopekseg.ro" } };
    const n = nezet(p);
    expect(n.nezet).toBe("talalt");
    expect(n.forrasCim).toBe("cipopekseg.ro");
  });
  it("tervezet állapot régebbi jóváhagyással (09-2x Kövesi) → 12b (van logó a pillanatképben), a sorok a TERVEZETET mutatják", () => {
    const n = nezet(kovesi);
    expect(n.nezet).toBe("talalt"); // a logó a tervezet logo_fajl_id-jéből (tartalék, fájllista nélkül is)
    expect(n.szinek.fo).toBe(kovesi.arculat.tervezet!.elsodleges);
    expect(n.betuk.cim).toBe("archivo");
    expect(n.betuk.szoveg).toBe("gelasio"); // Georgia → Gelasio (a képgyártó szabálya)
    expect(n.elonezet).toEqual(n.szinek);
  });
  it("„későbbre hagyott” munkatér → nem jóváhagyottként (12a), az alapszettel; a Kövesi-szöveg → Természetes", () => {
    const n = nezet(kesobb);
    expect(n.nezet).toBe("ures");
    expect(n.alapbol).toBe(true);
    expect(n.szinek.fo).toBe("#2f5d50");
  });
  it("jóváhagyott → 12c: a pillanatkép színei, jóváhagyó és idő, GET-kép (elonezet null)", () => {
    const p = cipo();
    p.arculat = jovahagyTenyleges(p.arculat, alapTervezet(p.nev, p.osszefoglalo), most, URES_LOGOK);
    const n = nezet(p, [logo("44444444-4444-4444-8444-444444444444", "sotet"), fajl("55555555-5555-4555-8555-555555555555", "referencia"), fajl("66666666-6666-4666-8666-666666666666", "referencia"), fajl("77777777-7777-4777-8777-777777777777", "dokumentum")]);
    expect(n.nezet).toBe("kesz");
    expect(n.jovahagyva).toEqual({ ido: "2026-09-30T10:00:00.000Z", ki: "Kovács Tibor" });
    expect(n.elonezet).toBeNull();
    expect(n.logok.sotet).toBe("44444444-4444-4444-8444-444444444444");
    expect(n.fajlok).toEqual({ kezikonyv: 0, minta: 2, dokumentum: 1 });
    expect(n.logoHatterek).toEqual({ vilagos: "#fbf3e8", sotet: "#a4471f", negyzetes: "#fbf3e8" });
  });
  it("néző: nem szerkeszthet (Csere, jóváhagyás nélkül)", () => {
    expect(nezet(cipo(), [], "nezo").szerkesztheto).toBe(false);
    expect(nezet(cipo(), [], "szerkeszto").szerkesztheto).toBe(true);
  });
});

describe("a három lépés", () => {
  const alap = alapTervezet("Cipó Pékség", "pékség, kovászos kenyér");
  it("jóváhagyás a semmiből: az alapszettből 1. verzió, szett-forrással", () => {
    const a = jovahagyTenyleges(cipo().arculat, alap, most, URES_LOGOK);
    expect(a.allapot).toBe("jovahagyott");
    expect(a.jovahagyott_verzio).toBe(1);
    expect(a.verziok["1"]).toMatchObject({ elsodleges: "#a4471f", szin_forras: "szett", szin_szett: "meleg", betu_cim: "gelasio" });
  });
  it("már jóváhagyott arculatot a jóváhagyás nem változtat (nincs új verzió)", () => {
    const a = jovahagyTenyleges(cipo().arculat, alap, most, URES_LOGOK);
    expect(jovahagyTenyleges(a, alap, new Date("2026-10-01T00:00:00.000Z"), URES_LOGOK)).toBe(a);
  });
  it("a 09-2x tervezet (v3) jóváhagyása: v3 lesz, a v1 és a v2 pillanatkép érintetlen", () => {
    const a = jovahagyTenyleges(kovesi.arculat, alap, most, undefined);
    expect(a.jovahagyott_verzio).toBe(3);
    expect(Object.keys(a.verziok).sort()).toEqual(["1", "2", "3"]);
    expect(a.verziok["2"]).toEqual(kovesi.arculat.verziok["2"]);
    expect(a.verziok["3"]?.logo_fajl_id).toBe(kovesi.arculat.tervezet!.logo_fajl_id); // olvashatatlan fájllista: a tervezet logója marad
  });
  it("Részletek jóváhagyott arculaton → új verzió (verzio + 1), jóváhagyva, a régi pillanatkép marad", () => {
    const v1 = jovahagyTenyleges(cipo().arculat, alap, most, URES_LOGOK);
    const v2 = reszletekJovahagy(v1, { kepvilag: "Friss kifli közelről, reggeli fény", lekerekites: 12 }, alap, most, URES_LOGOK);
    expect(v2.allapot).toBe("jovahagyott");
    expect(v2.jovahagyott_verzio).toBe(2);
    expect(v2.verziok["2"]).toMatchObject({ kepvilag: "Friss kifli közelről, reggeli fény", lekerekites: 12, elsodleges: "#a4471f" });
    expect(v2.verziok["1"]).toEqual(v1.verziok["1"]);
  });
  it("visszavonás után az újra-jóváhagyás NEM írja felül a meglévő pillanatképet: a következő verzió lesz", () => {
    const v1 = jovahagyTenyleges(cipo().arculat, alap, most, URES_LOGOK);
    const vissza = visszavon(v1);
    expect(vissza.allapot).toBe("tervezet");
    expect(vissza.verziok).toEqual(v1.verziok);
    const ujra = jovahagyTenyleges(vissza, alap, new Date("2026-10-01T00:00:00.000Z"), URES_LOGOK);
    expect(ujra.jovahagyott_verzio).toBe(2);
    expect(ujra.verziok["1"]).toEqual(v1.verziok["1"]);
    const r: ArculatLepes = reszletekJovahagy(visszavon(ujra), { kovetendo: "Valódi fotók" }, alap, most, URES_LOGOK);
    expect(r.jovahagyott_verzio).toBe(3);
    expect(Object.keys(r.verziok).sort()).toEqual(["1", "2", "3"]);
  });
  it("visszavonás nem jóváhagyott arculaton: nincs változás", () => {
    const a = cipo().arculat;
    expect(visszavon(a)).toBe(a);
  });
});
