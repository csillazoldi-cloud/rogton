// c30 F7 (docs/terv/FESZTIVAL-ES-NYELVI-MOD-TERV.md §3, §4 topic table, §10 F7): the festival in the post prompts and the topic plan.
// Pure: the programme SLICE for one post (the anchored item, that day's items ≤ 25, or the items the trigger names; never the internal
// note), the festival block of the post prompt, the programme's bilingual names merged into the glossary at prompt time (nevCsere puts
// „Cetatea Medievală” into the RO text), the fact guard with ONE retry (a model answer with „21:45” not in the programme), the programme
// summary for the topic plan, the festival topic fallback HU/RO/EN with `fajta`, the category line for every trade.
// Live part (PROBA_CIM + DATABASE_URL; test AI): a festival org with programme items gets the festival topics (with fajta); its post is
// written and translated with the programme's names applied; Tibor's company gets its topics as before.
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PosztMunka, ProgramTetel } from "@rogton/contracts";
import type { TisztaTetel } from "../program/szabaly";
import { BLOKK_MAX_SOR, programBlokk, programHorgony, programNevek, programOsszegzes, programSzelet, szeletTetelei } from "../program/blokk";
import { programSorok } from "../poszt/profil-blokk";
import { nevCsere } from "../poszt/nevek";
import { tenyorrelKer } from "../poszt/tipus";
import { szakmaSor, temaTartalek, temakTisztit } from "../profil/kinalat-szabaly";
import { keres, lezar, sql, sutiKinyer, takaritas, veletlenEmail } from "./segedek";

const FIX = JSON.parse(readFileSync(new URL("./adat/zilele-2026.json", import.meta.url), "utf8")) as { vart: TisztaTetel[] };
const TETELEK: ProgramTetel[] = FIX.vart.map((t, i) => ({ ...t, id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`, forras: "gep", modositva: false, kep_fajl_id: null }));
const REND = { mettol: "2026-06-25", meddig: "2026-06-28", hely: { hu: "Marosvásárhely", ro: "Târgu Mureș" } };
const tetel = (nev: string) => TETELEK.find((t) => t.nev.hu === nev)!;

describe("F7 pure: the programme slice for one post", () => {
  it("26 June: only that day's active items, ≤ 25 lines, in time order, never the internal note", () => {
    const sorok = programBlokk(TETELEK, { nap: "2026-06-26" }, "hu");
    expect(sorok.length).toBe(TETELEK.filter((t) => t.aktiv && t.nap === "2026-06-26").length);
    expect(sorok.length).toBeLessThanOrEqual(BLOKK_MAX_SOR);
    expect(sorok.every((s) => s.startsWith("2026-06-26 · "))).toBe(true);
    expect(sorok.join("\n")).not.toMatch(/ZÁSZLÓ NAPJÁT/);
    expect(sorok.join("\n")).toMatch(/2026-06-26 · 20:00 · Blahalouisiana · Győzelem Tér – Nagyszínpad/);
    expect(sorok.join("\n")).not.toMatch(/Kökény Attila/); // he plays on the 28th
    expect(programSzelet(TETELEK, { nap: "2026-06-26" }, "hu")).toEqual(sorok);
  });

  it("the anchor: program:<fajta>:<day>[:<id>] → that day or that item; else the items the trigger names; else nothing", () => {
    const k = tetel("Kökény Attila");
    expect(programHorgony("program:holnapi_program:2026-06-26", "", TETELEK)).toEqual({ nap: "2026-06-26" });
    expect(programHorgony(`program:fellepo:2026-06-28:${k.id}`, "", TETELEK)).toEqual({ id: k.id });
    expect(programHorgony("", "Kökény Attila lép fel vasárnap este", TETELEK)).toEqual({ idk: [k.id] });
    expect(programHorgony("hir:123", "Új járda a Rózsák terén", TETELEK)).toEqual({});
    // the internal note is never an anchor, even when the trigger quotes it
    expect(programHorgony("", "A ZÁSZLÓ NAPJÁT IS MEG KELL CSINÁLNI", TETELEK)).toEqual({});
    expect(szeletTetelei(TETELEK, { idk: [k.id] }).map((t) => t.nev.hu)).toEqual(["Kökény Attila"]);
  });

  it("the post's festival block: dates, town, the slice in the post's language, the slice's name pairs; no slice → a forbidding line", () => {
    const ro = programSorok({ tetelek: TETELEK, rendezveny: REND, azonosito: "program:holnapi_program:2026-06-26", kivalto: "", nyelv: "ro" }).join("\n");
    expect(ro).toMatch(/Időpont: 2026-06-25 – 2026-06-28/);
    expect(ro).toMatch(/Helyszín: Târgu Mureș/);
    expect(ro).toMatch(/- 2026-06-26 · 21:20 · Alina Eremia · Piața Victoriei – Scena Principală/);
    expect(ro).toMatch(/magyarul: Középkori Vár · románul: Cetatea Medievală/);
    expect(ro).not.toMatch(/Kökény/);
    const nincs = programSorok({ tetelek: TETELEK, rendezveny: REND, azonosito: "", kivalto: "Köszönjük, hogy itt voltatok!", nyelv: "hu" }).join("\n");
    expect(nincs).toMatch(/nincs kiválasztott programtétel/);
    expect(nincs).not.toMatch(/HIVATALOS NEVEK/);
    expect(programSorok(null)).toEqual([]);
  });

  it("glossary merge at prompt time: the RO output gets „Cetatea Medievală”, the HU output „Középkori Vár”; short or equal names are not pairs", () => {
    const nevek = programNevek(TETELEK);
    expect(nevek).toContainEqual({ hu: "Középkori Vár", ro: "Cetatea Medievală", en: "" });
    expect(nevek).toContainEqual({ hu: "Színház Tér – Borsétány", ro: "Piața Teatrului – Aleea Vinului", en: "" });
    expect(nevek.some((n) => n.hu === "Corax" || n.hu === "Edo")).toBe(false); // same in both languages / too short
    expect(nevek.filter((n) => n.hu === "Középkori Vár").length).toBe(1); // no repeats
    expect(nevCsere("Vă așteptăm vineri la Középkori Vár, de la 20:35.", nevek, "ro")).toBe("Vă așteptăm vineri la Cetatea Medievală, de la 20:35.");
    expect(nevCsere("Pénteken a Cetatea Medievală színpadán.", nevek, "hu")).toBe("Pénteken a Középkori Vár színpadán.");
  });

  it("the fact guard on a festival post: „21:45” (not in the programme) → exactly one retry naming it; the second answer stays", async () => {
    const bemenet = programSorok({ tetelek: TETELEK, rendezveny: REND, azonosito: "program:mai_program:2026-06-26", kivalto: "", nyelv: "hu" }).join("\n");
    const hivasok: string[] = [];
    const r = await tenyorrelKer("Ma este 21:45-kor a Középkori Várban várunk!", bemenet, (v) => v, async (javito) => { hivasok.push(javito); return "Ma este 21:20-kor Red Parlament a Középkori Várban."; });
    expect(hivasok.length).toBe(1);
    expect(hivasok[0]).toMatch(/FIGYELEM — .*NE használd őket: 45/);
    expect(r).toEqual({ valasz: "Ma este 21:20-kor Red Parlament a Középkori Várban.", ujrakert: ["45"] });
    // an invented performer is named too
    const n = await tenyorrelKer("Ma este a Középkori Várban fellép Zorán is!", bemenet, (v) => v, async () => "x");
    expect(n.ujrakert).toEqual(["Zorán"]);
    // only programme facts → no retry
    const ok = await tenyorrelKer("Ma 20:00-kor Blahalouisiana a Győzelem Tér – Nagyszínpadon!", bemenet, (v) => v, async () => { throw new Error("no retry expected"); });
    expect(ok.ujrakert).toEqual([]);
  });
});

describe("F7 pure: the topic plan", () => {
  it("the programme summary: counts by kind and the main stage's evening concerts — never the internal note", () => {
    const o = programOsszegzes(TETELEK, "hu").join("\n");
    expect(o).toMatch(/^A program: 87 tétel, 4 nap — koncert \d+/);
    expect(o).toMatch(/Kiemelt fellépők: .*Blahalouisiana \(2026-06-26 20:00\)/);
    expect(o).toMatch(/Kökény Attila \(2026-06-28 20:00\)/);
    expect(o).not.toMatch(/Red Parlament|ZÁSZLÓ/); // Középkori Vár is not the main stage
    expect(programOsszegzes([], "hu")).toEqual([]);
  });

  it("the festival fallback topics HU/RO/EN carry their fajta; a company's fallback is unchanged", () => {
    for (const ny of ["hu", "ro", "en"]) {
      const t = temaTartalek([], "semleges", ny, "fesztival");
      expect(t.map((x) => x.fajta)).toEqual(["visszaszamlalo", "holnapi_program", "mai_program", "fellepo", "gyakorlati", "album", "koszono"]);
      expect(t.every((x) => x.tema.trim().length > 3)).toBe(true);
    }
    expect(temaTartalek([], "semleges", "ro", "fesztival")[1]).toEqual({ tema: "Programul de mâine", tipus: "picmess", fajta: "holnapi_program" });
    expect(temaTartalek([], "epites", "hu", "ceg")).toEqual(temaTartalek([], "epites", "hu"));
    expect(temaTartalek([], "epites", "hu").some((x) => "fajta" in x)).toBe(false);
  });

  it("temakTisztit keeps a known fajta and drops an unknown one; the category line names every trade, none for semleges", () => {
    expect(temakTisztit([{ tema: "Holnapi program", tipus: "picmess", fajta: "holnapi_program" }, { tema: "Bármi", tipus: "kartya", fajta: "reklam" }]))
      .toEqual([{ tema: "Holnapi program", tipus: "picmess", fajta: "holnapi_program" }, { tema: "Bármi", tipus: "kartya" }]);
    expect(szakmaSor("epites")).toBe("A cég szakmája: építőipar.");
    expect(szakmaSor("vendeglatas")).toBe("A cég szakmája: vendéglátás.");
    expect(szakmaSor("semleges")).toBe("");
  });
});

describe("F7 live: festival topics, a festival post with the programme's names", () => {
  const jelszo = "ProbaJelszo123!";
  const belep = async (nev: string, szervezet: string, nyelvek: string[], tipus: "fesztival" | "ceg", osszefoglalo: string) => {
    const email = veletlenEmail();
    await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev, email, jelszo } });
    const b = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo } });
    const s = `km_munkamenet=${sutiKinyer(b.sutik, "km_munkamenet")}`;
    expect((await keres("/api/szervezet", { modszer: "POST", torzs: { nev: szervezet }, sutik: s })).statusz).toBe(201);
    expect((await keres("/api/onboarding/piszkozat", { modszer: "PUT", sutik: s, torzs: {
      bemutatkozas: { nev: szervezet, osszefoglalo, osszefoglalo_forras: "ai", forras_tipus: "leiras", leiras: osszefoglalo, szervezet_tipus: tipus, kategoria: tipus === "ceg" ? "epites" : "semleges", tipus_biztos: true, ...(tipus === "fesztival" ? { rendezveny: REND } : {}) },
      kommunikacio: { celkozonseg: "családok", celkozonseg_forras: "ai", cel: "", cel_forras: "sajat", cel_kesobb: true, nyelvek, nyelvek_forras: "sajat", hangnem_leiras: "", hangnem_minta: "", hangnem_nyelv: nyelvek[0], hangnem_forras: "sajat" },
    } })).statusz).toBe(200);
    expect((await keres("/api/onboarding/jovahagyas", { modszer: "POST", torzs: {}, sutik: s })).statusz).toBe(200);
    return s;
  };
  let fesz = "", tibor = "";
  beforeAll(async () => {
    // the org's name carries „Középkori Vár”: the test AI echoes the start of its input (the profile), so the RO echo shows the glossary at work
    fesz = await belep("Moldovan-Szabó Réka", "Zilele — Középkori Vár próba F7", ["hu", "ro"], "fesztival", "Marosvásárhelyi Napok — Zilele Târgumureșene: 2026. június 25–28., koncertek, borutca és kézművesvásár.");
    tibor = await belep("Kovács-Szentgyörgyi Tibor", "Kovács Térkő Kft. — Középkori Vár próba F7", ["hu"], "ceg", "Térkövezés, díszburkolat, udvarok és járdák Marosvásárhelyen.");
    for (const nev of ["Kökény Attila", "Red Parlament", "Blahalouisiana"]) {
      const t = tetel(nev);
      const r = await keres("/api/program/tetel", { modszer: "POST", sutik: fesz, torzs: { nap: t.nap, kezdes: t.kezdes, vege: t.vege, nev: t.nev, helyszin: t.helyszin, leiras: t.leiras, fellepo: t.fellepo, fajta: t.fajta } });
      expect(r.statusz).toBe(201);
    }
  });
  afterAll(async () => { await takaritas(); await lezar(); });

  it("the festival's topics come with fajta; Tibor's company gets its topics with no fajta", async () => {
    const f = await keres<{ temak: { tema: string; tipus: string; fajta?: string }[] }>("/api/onboarding/beallitas/temak", { modszer: "POST", sutik: fesz, torzs: {} });
    expect(f.statusz).toBe(200);
    expect(f.torzs.temak.map((t) => t.fajta)).toEqual(["visszaszamlalo", "holnapi_program", "fellepo", "gyakorlati", "album"]);
    const c = await keres<{ temak: { tema: string; fajta?: string }[] }>("/api/onboarding/beallitas/temak", { modszer: "POST", sutik: tibor, torzs: {} });
    expect(c.statusz).toBe(200);
    expect(c.torzs.temak[0]!.tema).toBe("[MINTA] Munkáink — kész udvarok, előtte–utána");
    expect(c.torzs.temak.some((t) => "fajta" in t)).toBe(false);
  });

  it("a festival post is written and translated; the RO text carries the programme's „Cetatea Medievală” — a company's does not", async () => {
    const poszt = async (s: string) => {
      const r = await keres<{ munka: PosztMunka }>("/api/poszt", { modszer: "POST", sutik: s, torzs: {
        forras: { tipus: "sajat", azonosito: "", cim: "Kökény Attila vasárnap", url: "", szoveg: "Kökény Attila lép fel vasárnap este a Nagyszínpadon." },
        cim: "Kökény Attila vasárnap", felulet: "fb", nyelv: "hu", uj: true,
      } });
      expect(r.statusz).toBe(200);
      const id = r.torzs.munka.id;
      expect((await keres(`/api/poszt/${id}/szoveg`, { modszer: "POST", sutik: s, torzs: { felulet: "fb", nyelv: "hu" } })).statusz).toBe(200);
      const t = await keres<{ munka: PosztMunka }>(`/api/poszt/${id}/forditas`, { modszer: "POST", sutik: s, torzs: { felulet: "fb", nyelv: "ro" } });
      expect(t.statusz).toBe(200);
      return t.torzs.munka.szovegek.find((x) => x.felulet === "fb" && x.nyelv === "ro")!.szoveg;
    };
    const ro = await poszt(fesz);
    expect(ro).toMatch(/Cetatea Medievală/);
    expect(ro).not.toMatch(/Középkori Vár/);
    const ceg = await poszt(tibor);
    expect(ceg).toMatch(/Középkori Vár/); // no programme → no pair: the company's text is untouched
    const db = await sql<{ n: number }>("SELECT count(*)::int AS n FROM program_tetel p JOIN szervezet sz ON sz.id = p.szervezet_id WHERE sz.nev = $1", ["Zilele — Középkori Vár próba F7"]);
    expect(db[0]!.n).toBe(3);
    const hn = await sql<{ a: Record<string, unknown> }>("SELECT p.adatok AS a FROM szervezet_profil p JOIN szervezet sz ON sz.id = p.szervezet_id WHERE sz.nev = $1", ["Zilele — Középkori Vár próba F7"]);
    expect(hn[0]!.a["hivatalos_nevek"] ?? []).toEqual([]); // merged at prompt time only: the profile gets no writes
  });
});
