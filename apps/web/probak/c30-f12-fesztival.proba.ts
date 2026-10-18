// c30 F12 (Csilla 10-17 19:26): egy fesztivál soha nem lát „cég / company / firmă” szót — a feliratok fesztivál-változata (0180, szovegek/
// fesztival.ts), a promptok és a gép bemeneti mondatai (ai/fesztival-szo.ts, poszt/profil-blokk.ts), a Képek mintái (vizual/helyzet.ts
// MINTA_FESZTIVAL, @rogton/vizual-core „ILYEN VOLT”). A cég mindenhol bájtra ugyanazt kapja, mint eddig.
import { readFileSync, readdirSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { FESZTIVAL_PROMPTOK, fesztivalBemenet, fesztivalPrompt } from "../ai/fesztival-szo";
import { profilSorok } from "../poszt/profil-blokk";
import { tipusValtozat } from "../szovegek/fesztival";
import { lapFeliratai } from "../szovegek";
import { MINTA, MINTA_FESZTIVAL, mintaSzoveg } from "../vizual/helyzet";
import { keres, lezar, sql, sutiKinyer, takaritas, veletlenEmail } from "./segedek";

const CEG = /(?<!\p{L})(c[ée]g|compan|firm[ăaei])/iu;
const mig = readFileSync(new URL("../adatbazis/migraciok/0180_c30_f12_fesztival_feliratok.sql", import.meta.url), "utf8");
const sorok = [...mig.slice(mig.indexOf("INSERT INTO")).matchAll(/\('([^']+)', '(hu|ro|en)', '((?:[^']|'')*)'\)/g)].map((m) => ({ kulcs: m[1]!, nyelv: m[2]!, szoveg: m[3]!.replace(/''/g, "'") }));

describe("a lap szótára: a fesztivál-változat (szovegek/fesztival.ts)", () => {
  const sz = { "iranytu.cim": "A cég iránytűje", "iranytu.cim@fesztival": "A fesztivál iránytűje", "nav.cegeim": "Cégeim", "nav.cegeim@fesztival": "Szervezeteim", "x": "y" };
  it("cég: a `@fesztival` kulcsok lekerülnek, minden más bájtra ugyanaz", () => {
    expect(tipusValtozat(sz, false)).toEqual({ "iranytu.cim": "A cég iránytűje", "nav.cegeim": "Cégeim", x: "y" });
    // egy valódi kulcs, ami „.fesztival”-ra végződik (c30.tipus.fesztival — „Fesztivál”), NEM változat: mindkét típusnál marad (mért hiba
    // volt az első változatban: a „.fesztival” utótag ezt a kulcsot elvitte volna a típus-választóból)
    expect(tipusValtozat({ "c30.tipus.fesztival": "Fesztivál" }, false)).toEqual({ "c30.tipus.fesztival": "Fesztivál" });
    expect(tipusValtozat({ "c30.tipus.fesztival": "Fesztivál" }, true)).toEqual({ "c30.tipus.fesztival": "Fesztivál" });
  });
  it("fesztivál: a változat a kulcs helyén; a szervezet saját felülírása erősebb; üres változat nem ír felül", () => {
    expect(tipusValtozat(sz, true)).toEqual({ "iranytu.cim": "A fesztivál iránytűje", "nav.cegeim": "Szervezeteim", x: "y" });
    expect(tipusValtozat(sz, true, new Set(["nav.cegeim"]))["nav.cegeim"]).toBe("Cégeim");
    expect(tipusValtozat({ a: "cég", "a@fesztival": "" }, true)).toEqual({ a: "cég" });
  });
});

describe("0180: a változatok", () => {
  const kulcsok = [...new Set(sorok.map((s) => s.kulcs))];
  const minden = readdirSync(new URL("../adatbazis/migraciok/", import.meta.url)).filter((f) => f.endsWith(".sql") && f < "0180").map((f) => readFileSync(new URL(`../adatbazis/migraciok/${f}`, import.meta.url), "utf8")).join("\n");
  it("44 kulcs, mind `@fesztival`, mind HU/RO/EN, és az alap kulcs létezik; a 0180 előtt egy kulcs sem végződik `@fesztival`-ra", () => {
    expect(kulcsok).toHaveLength(44);
    for (const k of kulcsok) {
      expect(k.endsWith("@fesztival"), k).toBe(true);
      expect(sorok.filter((s) => s.kulcs === k).map((s) => s.nyelv).sort(), k).toEqual(["en", "hu", "ro"]);
      expect(minden.includes(`'${k.slice(0, -"@fesztival".length)}', 'hu'`), `alap: ${k}`).toBe(true);
    }
    expect(minden.includes("@fesztival")).toBe(false);
  });
  it("egyik változat sem mondja: cég / company / firmă", () => {
    for (const s of sorok) expect(CEG.test(s.szoveg), `${s.kulcs} ${s.nyelv}: ${s.szoveg}`).toBe(false);
  });
  it("Cégeim → „Szervezeteim” (a menü a fiók MINDEN munkaterét sorolja — cég és fesztivál vegyesen lehet)", () => {
    expect(sorok.find((s) => s.kulcs === "nav.cegeim@fesztival" && s.nyelv === "hu")?.szoveg).toBe("Szervezeteim");
  });
});

describe("a gép: promptok és bemenet", () => {
  const olvas = (f: string) => readFileSync(new URL(`../prompts/${f}.hu.md`, import.meta.url), "utf8");
  it("a fesztivál promptjaiban nem marad „cég” (a cégneveket — mások nevét — nem érintjük)", () => {
    for (const f of FESZTIVAL_PROMPTOK) {
      const fesz = fesztivalPrompt(olvas(f));
      const marad = [...fesz.matchAll(/(?<!\p{L})c[ée]g\p{L}*/giu)].map((m) => m[0]).filter((w) => !/^cégnev/i.test(w));
      expect(marad, f).toEqual([]);
    }
    expect(fesztivalPrompt("Ha a bemenet elején „A CÉG PROFILJA” blokk áll, a cég szakmájából írj; a cégről ne állíts; Cég-, márka- és személynevek"))
      .toBe("Ha a bemenet elején „A FESZTIVÁL PROFILJA” blokk áll, a fesztivál témájából írj; a fesztiválról ne állíts; Fesztivál-, márka- és személynevek");
  });
  it("a gép bemenete: csak a saját mondatai cserélődnek, a felhasználó és a hír szövege nem", () => {
    const be = "A cég iránytűje:\nCél: x\nA hír: a cég bezárt (Kovács Kft.)\nválassz egyet abból, amivel a cég foglalkozik (a profil szerint).";
    expect(fesztivalBemenet(be)).toBe("A fesztivál iránytűje:\nCél: x\nA hír: a cég bezárt (Kovács Kft.)\nválassz egyet abból, amivel a fesztivál foglalkozik (a profil szerint).");
  });
  it("a profil-blokk: a cégé változatlan, a fesztiválé „A FESZTIVÁL PROFILJA”", () => {
    const p = { nev: "Kovács Térkő Kft.", osszefoglalo: "Térkövezés", celkozonseg: "", cel: "", hangnem_leiras: "Tegező", hangnem_minta: "" };
    expect(profilSorok(p)).toEqual(["=== A CÉG PROFILJA ===", "A cég neve:\nKovács Térkő Kft.", "Mivel foglalkozik:\nTérkövezés", "HOGYAN ÍRJUNK — a cég saját írási szabályai (ezeket kövesd):\nTegező", "=== A PROFIL VÉGE ==="]);
    expect(profilSorok({ ...p, szervezet_tipus: "ceg" })).toEqual(profilSorok(p));
    const f = profilSorok({ ...p, nev: "Zilele Târgumureșene", szervezet_tipus: "fesztival" }).join("\n");
    expect(f).toContain("=== A FESZTIVÁL PROFILJA ===");
    expect(f).toContain("A fesztivál neve:");
    expect(CEG.test(f)).toBe(false);
  });
});

describe("a Képek mintái", () => {
  it("MINTA_FESZTIVAL: minden helyzet, mindhárom nyelv; a cégé (MINTA) változatlan; mintaSzoveg a típus szerint", () => {
    for (const ny of ["hu", "ro", "en"]) expect(Object.keys(MINTA_FESZTIVAL[ny]!).sort()).toEqual(Object.keys(MINTA[ny]!).sort());
    expect(mintaSzoveg("hu", "kesz")).toEqual({ cim: "Elkészült a legújabb munkánk", sor: "Nézd meg, milyen lett!" });
    expect(mintaSzoveg("hu", "kesz", true).cim).toBe("Ilyen volt a tegnapi este");
    expect(mintaSzoveg("de", "esemeny", true)).toEqual(MINTA_FESZTIVAL["hu"]!["esemeny"]);
    expect(JSON.stringify(MINTA_FESZTIVAL)).not.toMatch(/munkánk|termék|ügyfél|nyitvatartás|telephely/);
  });
});

describe("élő: a lap szótára egy fesztiválnál és egy cégnél", () => {
  afterAll(async () => { await takaritas(); await lezar(); });
  async function szervezet(tipus: "ceg" | "fesztival"): Promise<string> {
    const email = veletlenEmail();
    expect((await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev: "Moldovan-Szabó Réka", email, jelszo: "ProbaJelszo123!" } })).statusz).toBe(201);
    const b = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo: "ProbaJelszo123!" } });
    const s = `km_munkamenet=${sutiKinyer(b.sutik, "km_munkamenet")}`;
    const nev = tipus === "fesztival" ? "Zilele Târgumureșene 2026" : "Kovács Térkő Kft.";
    const sz = await keres<{ id: string }>("/api/szervezet", { modszer: "POST", torzs: { nev }, sutik: s });
    const o = tipus === "fesztival" ? "Marosvásárhelyi Napok: koncertek, vásár." : "Térkövezés Marosvásárhelyen.";
    expect((await keres("/api/onboarding/piszkozat", { modszer: "PUT", sutik: s, torzs: {
      bemutatkozas: { nev, osszefoglalo: o, osszefoglalo_forras: "ai", forras_tipus: "leiras", leiras: o, szervezet_tipus: tipus, kategoria: tipus === "ceg" ? "epites" : "semleges", tipus_biztos: true },
      kommunikacio: { celkozonseg: "családok", celkozonseg_forras: "ai", cel: "", cel_forras: "sajat", cel_kesobb: true, nyelvek: ["hu", "ro"], nyelvek_forras: "sajat", hangnem_leiras: "", hangnem_minta: "", hangnem_nyelv: "hu", hangnem_forras: "sajat" },
    } })).statusz).toBe(200);
    expect((await keres("/api/onboarding/jovahagyas", { modszer: "POST", sutik: s, torzs: {} })).statusz).toBe(200);
    return sz.torzs.id;
  }
  it("fesztivál: a változatok a kulcsok helyén, `@fesztival` kulcs nincs; cég: a szótár = szervezet nélküli alap; a c30.tipus.fesztival mindkettőben megvan", async () => {
    const [f, c] = [await szervezet("fesztival"), await szervezet("ceg")];
    for (const ny of ["hu", "ro", "en"] as const) {
      const fd = await lapFeliratai(ny, f), cd = await lapFeliratai(ny, c), alap = await lapFeliratai(ny, null);
      expect(Object.keys(fd).some((k) => k.endsWith("@fesztival"))).toBe(false);
      expect(fd["c30.tipus.fesztival"]).toBe(alap["c30.tipus.fesztival"]);
      expect(cd["c30.tipus.fesztival"]).toBeTruthy();
      expect(cd).toEqual(alap);
      for (const s of sorok.filter((x) => x.nyelv === ny)) expect(fd[s.kulcs.slice(0, -"@fesztival".length)]).toBe(s.szoveg);
    }
    expect((await lapFeliratai("hu", f))["nav.cegeim"]).toBe("Szervezeteim");
    expect((await lapFeliratai("hu", c))["nav.cegeim"]).toBe("Cégeim");
    void sql;
  });
});
