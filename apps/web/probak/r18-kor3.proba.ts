// R-18 3. kör (Csilla 10-11): Saját ötlet · Naptár · többes szám. Tiszta rész: a feliratsablon többes alakja, a gép bemenete saját ötletnél,
// a naptár szabályai (javasolt nap, heti számláló, a lap kérdése). Élő rész (PROBA_CIM + DATABASE_URL; teszt AI): a naptár végpontjai
// (javaslat → elfogadás → másik nap → „Kitettem”), és hogy a szervezetek az új oszlopokon is el vannak választva (A-11): idegen poszt 404,
// és a km_app sorszintű védelme a más szervezet sorát a három új oszloppal együtt sem mutatja, sem írja.
import { readFileSync } from "node:fs";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PosztMunka } from "@km/contracts";
import { sablonKitolt } from "../nyelv/sablon";
import { kivaltoSorok, szovegBemenet } from "../poszt/bemenet";
import {
  foglaltsag, hetKezdete, hetNapja, hetiSzamlalo, javaslatokatAd, javasolNapot, napHozzaad, napKulcs, naptarKerdes, posztNapja, type NaptarPoszt,
} from "../poszt/naptar";
import { keres, lezar, sql, sutiKinyer, takaritas, veletlenEmail } from "./segedek";

const prompt = (f: string) => readFileSync(new URL(`../prompts/${f}`, import.meta.url), "utf8");

describe("többes szám a feliratsablonban (nyelv/sablon.ts)", () => {
  const en = "This week: {poszt, plural, one {# post} other {# posts}} done · {kep, plural, one {# image} other {# images}} downloaded";
  const ro = "Săptămâna aceasta: {poszt, plural, one {# postare gata} few {# postări gata} other {# de postări gata}}";
  it("angolul: 1 post, 2 posts — az élő hiba („1 posts done”) nem jön vissza", () => {
    expect(sablonKitolt(en, { poszt: 1, kep: 0 })).toBe("This week: 1 post done · 0 images downloaded");
    expect(sablonKitolt(en, { poszt: 2, kep: 1 })).toBe("This week: 2 posts done · 1 image downloaded");
  });
  it("románul: 1 postare · 0 és 2–19 postări · 20-tól „de postări” · 101 postări", () => {
    expect(sablonKitolt(ro, { poszt: 1 })).toMatch(/1 postare gata$/);
    expect(sablonKitolt(ro, { poszt: 0 })).toMatch(/0 postări gata$/);
    expect(sablonKitolt(ro, { poszt: 19 })).toMatch(/19 postări gata$/);
    expect(sablonKitolt(ro, { poszt: 20 })).toMatch(/20 de postări gata$/);
    expect(sablonKitolt(ro, { poszt: 101 })).toMatch(/101 postări gata$/);
  });
  it("a sima helyőrző és a formázott szám (többes alak) is működik; érték nélkül a sablon marad", () => {
    expect(sablonKitolt("Szia {nev}!", { nev: "Tibor" })).toBe("Szia Tibor!");
    expect(sablonKitolt("{n, plural, one {# hír} other {# hírek}}", { n: "1 234" })).toBe("1 234 hírek");
    expect(sablonKitolt("{n, plural, one {# x} other {# y}}", {})).toBe("{n, plural, one {# x} other {# y}}");
    expect(sablonKitolt("{n} poszt")).toBe("{n} poszt");
  });
});

describe("Saját ötlet — a gép bemenete", () => {
  const otlet = "csapatépítő hétvége Szovátán, fotóalbum a csapatról";
  it("a beírt mondat a poszt TÁRGYAKÉNT kerül a gép elé; a profil háttér, a „kiváltó címe” sor elmarad", () => {
    const b = szovegBemenet(
      { cim: "csapatépítő hétvége Szovátán, fotóalbum a…", forras: { tipus: "sajat", cim: otlet, url: "" } },
      "fb", ["A CÉG PROFILJA", "Név: Kő és Kert Kft.", "Tevékenység: térkövezés"], "2026-10-11", otlet,
    );
    expect(b).toContain(`Saját ötlet — a poszt TÁRGYA, erről szól a poszt (a felhasználó szavai, ADAT):\n${otlet}`);
    expect(b).not.toContain("A kiváltó címe:");
    expect(b).not.toContain("A kiváltó szövege:");
    expect(b.indexOf("A CÉG PROFILJA")).toBeLessThan(b.indexOf(otlet));
  });
  it("üres ötletnél a gép választ témát a profilból (a régi viselkedés), más kiváltónál változatlan a sor", () => {
    expect(kivaltoSorok("sajat", "  ")).toEqual(["Saját ötlet: a felhasználó nem adott témát — válassz egyet abból, amivel a cég foglalkozik (a profil szerint)."]);
    expect(kivaltoSorok("hir", "A hír szövege")).toEqual(["A kiváltó szövege:\nA hír szövege"]);
    const h = szovegBemenet({ cim: "x", forras: { tipus: "hir", cim: "Megújul a főtér", url: "https://pelda.ro/a" } }, "fb", [], "2026-10-11", "szöveg");
    expect(h).toContain("A kiváltó címe: Megújul a főtér");
    expect(h).toContain("Hivatkozás: https://pelda.ro/a");
  });
  it("a prompt v7: az ötlet a tárgy, tényt nem talál ki, a profil csak háttér", () => {
    const p = prompt("poszt_szoveg.hu.md");
    // Kati 10-11: a prompt v8 lett (közölhető szöveg, cím nélkül); a v7 saját-ötlet szabálya változatlanul benne van — a fejléc a v7-et is őrzi
    // R-18 8. kör (Kati 10-13): v9 lett; a v7 saját-ötlet szabálya változatlanul benne van — a fejléc a v8-at és a v7-et is őrzi
    expect(p.split("\n")[0]).toMatch(/poszt-szoveg · v9 · 2026-10-14 .*· v8: 2026-10-11 .*· v7: v6 \+ saját ötlet/);
    expect(p).toContain("Saját ötlet (a kiváltó típusa: sajat)");
    expect(p).toMatch(/ne találj ki nevet, számot, helyszínt, időpontot, eseményt/);
    expect(p).toMatch(/A cég profilja csak háttér/);
  });
});

const poszt = (id: string, m: Partial<NaptarPoszt> = {}): NaptarPoszt => ({ id, rovid_nev: id, kep_url: null, tervezett_nap: null, javasolt_nap: null, kiteve: null, ...m });

describe("Naptár — a szabályok (poszt/naptar.ts)", () => {
  it("nap, hét, hétfő: Bukarest szerint; az óraátállítás nem csúsztat", () => {
    expect(napKulcs(new Date("2026-10-11T22:30:00Z"))).toBe("2026-10-12"); // bukaresti éjfél után
    expect(hetNapja("2026-10-13")).toBe(2);
    expect(hetKezdete("2026-10-18")).toBe("2026-10-12");
    expect(napHozzaad("2026-10-24", 2)).toBe("2026-10-26"); // a 10-25-i átállításon át
  });
  it("a javaslat szétszór: kedd/csütörtök, szomszédos nap és hétvége kerülve, foglalt napra soha (ha van szabad)", () => {
    // a rajz helyzete: ma kedd 10-13 (kitéve), hétfőn kitéve, csütörtökön tervezett → a jövő kedd
    const f = foglaltsag([poszt("a", { kiteve: "2026-10-12T09:00:00Z" }), poszt("b", { kiteve: "2026-10-13T09:00:00Z" }), poszt("c", { tervezett_nap: "2026-10-15" })]);
    expect(javasolNapot(f, "2026-10-13")).toBe("2026-10-20");
    // üres naptár: a legközelebbi kedd vagy csütörtök
    expect(["2026-10-13", "2026-10-15"]).toContain(javasolNapot(new Map(), "2026-10-12"));
    // öt új poszt egymás után: mind más napra kerül
    const p = ["1", "2", "3", "4", "5"].map((i) => poszt(i));
    javaslatokatAd(p, "2026-10-11");
    const napok = p.map((x) => x.javasolt_nap!);
    expect(new Set(napok).size).toBe(5);
    for (const n of napok) expect(n > "2026-10-11" && n <= "2026-10-24").toBe(true);
  });
  it("az elfogadott, a kitett és a még élő javaslat nem kap újat; az elmúlt javaslat igen", () => {
    const p = [poszt("t", { tervezett_nap: "2026-10-20" }), poszt("k", { kiteve: "2026-10-10T10:00:00Z" }), poszt("j", { javasolt_nap: "2026-10-15" }), poszt("r", { javasolt_nap: "2026-10-01" })];
    const v = javaslatokatAd(p, "2026-10-11");
    expect(v.map((x) => x.id)).toEqual(["r"]);
    expect(p[3]!.javasolt_nap! > "2026-10-11").toBe(true);
    expect(p[3]!.javasolt_nap).not.toBe("2026-10-15");
  });
  it("a heti számláló: kitéve és tervezett ezen a héten; a javasolt nem számít", () => {
    const p = [poszt("a", { kiteve: "2026-10-12T09:00:00Z" }), poszt("b", { tervezett_nap: "2026-10-15" }), poszt("c", { javasolt_nap: "2026-10-16" }), poszt("d", { tervezett_nap: "2026-10-20" })];
    expect(hetiSzamlalo(p, "2026-10-13")).toEqual({ kiteve: 1, tervezett: 1 });
    expect(posztNapja(p[0]!)).toBe("2026-10-12");
  });
  it("a lap kérdése: Kitetted? → javaslat → rendben → üres", () => {
    expect(naptarKerdes([], "2026-10-13")).toEqual({ fajta: "ures" });
    expect(naptarKerdes([poszt("a", { tervezett_nap: "2026-10-15" })], "2026-10-13")).toEqual({ fajta: "rendben" });
    expect(naptarKerdes([poszt("a", { javasolt_nap: "2026-10-20" })], "2026-10-13")).toEqual({ fajta: "javasolt", id: "a", nap: "2026-10-20" });
    expect(naptarKerdes([poszt("a", { tervezett_nap: "2026-10-13" }), poszt("b", { javasolt_nap: "2026-10-20" })], "2026-10-13")).toEqual({ fajta: "kitetted", id: "a", javasoltIs: true });
    expect(naptarKerdes([poszt("a", { tervezett_nap: "2026-10-13", kiteve: "2026-10-13T08:00:00Z" })], "2026-10-13")).toEqual({ fajta: "rendben" });
  });
});

describe("Naptár — élőben, két szervezettel (A-11)", () => {
  const jelszo = "ProbaJelszo123!";
  let aSutik = "", bSutik = "", aSzervezet = "", bSzervezet = "", id = "", sajatId = "";
  const ma = napKulcs(new Date());
  async function fiok(ceg: string): Promise<{ sutik: string; szervezet: string }> {
    const email = veletlenEmail();
    await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev: "Kovács-Szentgyörgyi Tibor", email, jelszo } });
    const b = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo } });
    const sutik = `km_munkamenet=${sutiKinyer(b.sutik, "km_munkamenet")}`;
    const sz = await keres<{ szervezet?: { id: string }; id?: string }>("/api/szervezet", { modszer: "POST", torzs: { nev: ceg }, sutik });
    return { sutik, szervezet: sz.torzs.szervezet?.id ?? sz.torzs.id ?? "" };
  }
  beforeAll(async () => {
    ({ sutik: aSutik, szervezet: aSzervezet } = await fiok("Kő és Kert Térkövező Kft., Marosvásárhely"));
    ({ sutik: bSutik, szervezet: bSzervezet } = await fiok("Grădina Mureșeană S.R.L."));
    const p = await keres<{ munka: PosztMunka }>("/api/poszt", { modszer: "POST", sutik: aSutik,
      torzs: { forras: { tipus: "terv", azonosito: "", cim: "Díszburkolat a Fenyő utcában", url: "", szoveg: "Díszburkolat a Fenyő utcában" }, cim: "Díszburkolat", felulet: "fb", nyelv: "hu", uj: true } });
    id = p.torzs.munka.id;
    await keres(`/api/poszt/${id}/szoveg`, { modszer: "POST", sutik: aSutik, torzs: { felulet: "fb", nyelv: "hu" } });
    await keres(`/api/r15/poszt/${id}/kesz`, { modszer: "POST", sutik: aSutik, torzs: { felulet: "fb", nyelv: "hu" } });
  });
  afterAll(async () => { await takaritas(); await lezar(); });

  it("Saját ötlet: a beírt mondat a munka forrásába kerül (ebből lesz a gép bemenete)", async () => {
    const otlet = "Csapatépítő hétvége Szovátán, fotóalbum a csapatról";
    const r = await keres<{ munka: PosztMunka }>("/api/poszt", { modszer: "POST", sutik: aSutik,
      torzs: { forras: { tipus: "sajat", azonosito: "", cim: otlet, url: "", szoveg: otlet }, cim: "Csapatépítő hétvége Szovátán, fotóalbum a…", felulet: "fb", nyelv: "hu", uj: true } });
    expect(r.statusz).toBe(200);
    sajatId = r.torzs.munka.id;
    expect(r.torzs.munka.forras).toMatchObject({ tipus: "sajat", szoveg: otlet });
    const w = await keres<{ munka: PosztMunka }>(`/api/poszt/${sajatId}/szoveg`, { modszer: "POST", sutik: aSutik, torzs: { felulet: "fb", nyelv: "hu" } });
    expect(w.statusz).toBe(200);
    expect(w.torzs.munka.szovegek[0]?.szoveg.length).toBeGreaterThan(0);
  });

  it("a kész poszt napot kap (holnaptól ma+13-ig); a még nem kész nem kerül a naptárba", async () => {
    const r = await keres<{ ma: string; posztok: NaptarPoszt[] }>("/api/poszt/naptar", { sutik: aSutik });
    expect(r.statusz).toBe(200);
    expect(r.torzs.ma).toBe(ma);
    const p = r.torzs.posztok.find((x) => x.id === id)!;
    expect(p.javasolt_nap! > ma && p.javasolt_nap! <= napHozzaad(ma, 13)).toBe(true);
    expect(p.tervezett_nap).toBeNull();
    expect(r.torzs.posztok.some((x) => x.id === sajatId)).toBe(false);
    const db = await sql<{ javasolt_nap: string }>("SELECT to_char(javasolt_nap, 'YYYY-MM-DD') AS javasolt_nap FROM poszt_munka WHERE id = $1", [id]);
    expect(db[0]?.javasolt_nap).toBe(p.javasolt_nap); // a javaslat el van mentve, nem ugrál
  });

  it("Elfogadom → tervezett = javasolt; Másik nap → a választott nap; tartományon kívül 400; Kitettem → kitéve", async () => {
    const elotte = (await sql<{ j: string }>("SELECT to_char(javasolt_nap, 'YYYY-MM-DD') AS j FROM poszt_munka WHERE id = $1", [id]))[0]!.j;
    expect((await keres(`/api/poszt/${id}/naptar`, { modszer: "POST", sutik: aSutik, torzs: { muvelet: "elfogad" } })).statusz).toBe(200);
    expect((await sql<{ t: string }>("SELECT to_char(tervezett_nap, 'YYYY-MM-DD') AS t FROM poszt_munka WHERE id = $1", [id]))[0]!.t).toBe(elotte);
    expect((await keres(`/api/poszt/${id}/naptar`, { modszer: "POST", sutik: aSutik, torzs: { muvelet: "nap", nap: ma } })).statusz).toBe(200);
    // R-18 8. kör (Round 8 rajz, Csilla 10-14): a hét lapozható és a nap húzható — a „nap” művelet tartománya ma − 31 … ma + 90 lett
    // (a napválasztó továbbra is ma + 13-ig kínál); a tartományon kívüli nap továbbra is 400
    expect((await keres(`/api/poszt/${id}/naptar`, { modszer: "POST", sutik: aSutik, torzs: { muvelet: "nap", nap: napHozzaad(ma, 91) } })).statusz).toBe(400);
    expect((await keres(`/api/poszt/${id}/naptar`, { modszer: "POST", sutik: aSutik, torzs: { muvelet: "nap", nap: "2026-02-30" } })).statusz).toBe(400);
    expect((await keres(`/api/poszt/${id}/naptar`, { modszer: "POST", sutik: aSutik, torzs: { muvelet: "ismeretlen" } })).statusz).toBe(400);
    expect((await keres(`/api/poszt/${id}/naptar`, { modszer: "POST", sutik: aSutik, torzs: { muvelet: "kitettem" } })).statusz).toBe(200);
    const s = (await sql<{ t: string; k: Date | null }>("SELECT to_char(tervezett_nap, 'YYYY-MM-DD') AS t, kiteve AS k FROM poszt_munka WHERE id = $1", [id]))[0]!;
    expect(s.t).toBe(ma);
    expect(s.k).not.toBeNull();
    const r = await keres<{ posztok: NaptarPoszt[] }>("/api/poszt/naptar", { sutik: aSutik });
    expect(r.torzs.posztok.find((x) => x.id === id)?.kiteve).toBeTruthy();
  });

  it("a másik szervezet nem látja és nem írja: GET nélküle, POST 404, a sor változatlan", async () => {
    const elotte = (await sql<{ t: string }>("SELECT to_char(tervezett_nap, 'YYYY-MM-DD') AS t FROM poszt_munka WHERE id = $1", [id]))[0]!.t;
    const r = await keres<{ posztok: NaptarPoszt[] }>("/api/poszt/naptar", { sutik: bSutik });
    expect(r.statusz).toBe(200);
    expect(r.torzs.posztok.some((x) => x.id === id)).toBe(false);
    expect((await keres(`/api/poszt/${id}/naptar`, { modszer: "POST", sutik: bSutik, torzs: { muvelet: "nap", nap: napHozzaad(ma, 3) } })).statusz).toBe(404);
    expect((await keres(`/api/poszt/${id}/naptar`, { modszer: "POST", sutik: bSutik, torzs: { muvelet: "kitettem" } })).statusz).toBe(404);
    expect((await sql<{ t: string }>("SELECT to_char(tervezett_nap, 'YYYY-MM-DD') AS t FROM poszt_munka WHERE id = $1", [id]))[0]!.t).toBe(elotte);
  });

  it("sorszintű védelem (km_app): a másik szervezet nevében a sor az új oszlopokkal sem olvasható, sem írható", async () => {
    const url = process.env["PROBA_APP_DATABASE_URL"];
    if (!url) return; // a kapu és a helyi környezet beállítja; nélküle ez a rész nem mérhető
    expect(aSzervezet).not.toBe(bSzervezet);
    const k = new Client({ connectionString: url });
    await k.connect();
    try {
      await k.query("BEGIN");
      await k.query("SELECT set_config('app.szervezet_id', $1, true)", [bSzervezet]);
      expect((await k.query("SELECT tervezett_nap, javasolt_nap, kiteve FROM poszt_munka WHERE id = $1", [id])).rowCount).toBe(0);
      expect((await k.query("UPDATE poszt_munka SET tervezett_nap = current_date + 5, kiteve = NULL WHERE id = $1", [id])).rowCount).toBe(0);
      await k.query("COMMIT");
      await k.query("BEGIN");
      await k.query("SELECT set_config('app.szervezet_id', $1, true)", [aSzervezet]);
      expect((await k.query("SELECT kiteve FROM poszt_munka WHERE id = $1", [id])).rows[0]?.kiteve).not.toBeNull();
      await k.query("COMMIT");
    } finally {
      await k.end();
    }
  });
});
