// c30 F6b — the live findings on F6 (test site, real AI, org „Zilele teszt 2”, 10-17):
//  1. the programme read ran 60–120 s and the proxy cut the request at 60 s („couldn't read it”, the result later) → the read runs in the
//     background: POST 202 {olvasas}, GET polls; a read still „fut” after 10 minutes counts as stuck; the server call is not cut;
//  2. Part A ticked the UI language although the description said „magyarul és románul” → the languages NAMED in the description come
//     first (nyelvekSzovegbol), else the model's guess, else the UI language (the old behaviour);
//  3. the real model found 80 of 88 → the patterns that drop, as stubbed model answers: the name as a plain string, odd language keys
//     („HU”, „hu-HU”, „magyar”), a performer without a name, the untimed all-day items, the RO-only block; and the prompt v2 rules;
//  4. the page name is neutral for every org type: „Adatok” / „Date” / „Details” (migration 0176).
// Live part (PROBA_CIM + DATABASE_URL; test AI).
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { ProgramTetel } from "@rogton/contracts";
import { olvasasAllapot } from "../program/allapot";
import { programTisztit } from "../program/szabaly";
import { nyelvekSzovegbol } from "../profil/tipus-szabaly";
import { PROBA_CIM, keres, lezar, sql, sutiKinyer, takaritas, veletlenEmail } from "./segedek";

const fajl = (ut: string) => readFileSync(new URL(ut, import.meta.url), "utf8");

describe("F6b pure: the background read's state", () => {
  it("fut → fut; fut for over 10 minutes → hiba ELAKADT (a restart mid-read never leaves the page waiting); kesz/hiba unchanged", () => {
    const most = Date.parse("2026-10-17T14:00:00.000Z");
    const o = { id: "00000000-0000-4000-8000-000000000001", allapot: "fut" as const, kezdve: "2026-10-17T13:58:00.000Z" };
    expect(olvasasAllapot(o, most)).toEqual(o);
    expect(olvasasAllapot({ ...o, kezdve: "2026-10-17T13:49:00.000Z" }, most)).toEqual({ ...o, kezdve: "2026-10-17T13:49:00.000Z", allapot: "hiba", hiba: "ELAKADT" });
    expect(olvasasAllapot({ ...o, allapot: "kesz", kezdve: "2026-10-17T10:00:00.000Z" }, most)?.allapot).toBe("kesz");
    expect(olvasasAllapot(undefined, most)).toBeNull();
  });
});

describe("F6b pure: the content languages named in the description", () => {
  it("HU/RO/EN wordings, in the order of mention; a name like „Magyar Színház” is not a language", () => {
    expect(nyelvekSzovegbol("Marosvásárhelyi Napok: koncertek, borutca — magyarul és románul.")).toEqual(["hu", "ro"]);
    expect(nyelvekSzovegbol("Program în limba română și maghiară, 25–28 iunie.")).toEqual(["ro", "hu"]);
    expect(nyelvekSzovegbol("Pensiunea Ștefănescu: postări în limba română și germană.")).toEqual(["ro", "de"]);
    expect(nyelvekSzovegbol("We post in Romanian and English.")).toEqual(["ro", "en"]);
    expect(nyelvekSzovegbol("Előadás a Magyar Színházban, román–magyar barátság napja.")).toEqual([]);
    expect(nyelvekSzovegbol("Térkövezés, udvarok és járdák Marosvásárhelyen.")).toEqual([]);
  });
});

describe("F6b pure: what dropped from the real read (stubbed model answers)", () => {
  const ev = 2026;
  it("the name as a plain string goes to the programme's first language; odd language keys are the same language", () => {
    const t = programTisztit({ tetelek: [
      { nap: "2026-06-26", kezdes: "18:00", nev: "Mircea Rusu Band", helyszin: { HU: "Középkori Vár", "ro-RO": "Cetatea Medievală" }, fajta: "koncert" },
      { nap: "2026-06-26", kezdes: "19:00", nev: { magyar: "Magyar zenekar", română: "Trupă maghiară" }, helyszin: {}, fajta: "koncert" },
    ] }, { ev, nyelv: "hu" });
    expect(t.map((x) => [x.nev, x.helyszin])).toEqual([
      [{ hu: "Mircea Rusu Band" }, { hu: "Középkori Vár", ro: "Cetatea Medievală" }],
      [{ hu: "Magyar zenekar", ro: "Trupă maghiară" }, {}],
    ]);
    // without the programme's language a plain string stays out, as before (nothing guessed)
    expect(programTisztit({ tetelek: [{ nap: "2026-06-26", kezdes: "18:00", nev: "Mircea Rusu Band" }] }, { ev })).toEqual([]);
  });

  it("a performer without a name becomes the item's name; untimed all-day items and the RO-only „Data / Ora” block stay", () => {
    const t = programTisztit({ tetelek: [
      { nap: "2026-06-28", kezdes: "20:00", fellepo: "Kökény Attila", helyszin: { hu: "Győzelem Tér – Nagyszínpad" }, fajta: "koncert" },
      { nap: "2026-06-25", kezdes: null, nev: { ro: "Târgul Meșteșugarilor", hu: "Kézművesvásár" }, helyszin: { ro: "Piața Trandafirilor", hu: "Rózsák tere" }, fajta: "vasar" },
      { nap: "2026-06-25", nev: { ro: "Enescu Chill Zone", hu: "Enescu Chill Zone" }, helyszin: { hu: "George Enescu utca" } },
      { nap: "2026-06-26", nev: { hu: "8 borászat, 1 pálinkakészítő, 1 kézműves sajtkészítő", ro: "8 crame, 1 producător de pălincă, 1 producător de brânzeturi artizanale" }, fajta: "gasztro" },
      { nap: "27.06.2026", kezdes: "11:00 -14:00", nev: { ro: "Conferință și lansare de carte - Cartea de oaspeți a Sanatoriului Czakó" }, helyszin: { ro: "Palatul Culturii din Târgu Mureș - Sala Oglinzilor" } },
    ] }, { ev, nyelv: "hu" });
    expect(t.map((x) => [x.nap, x.kezdes, x.vege, x.nev.hu ?? null, x.nev.ro ?? null])).toEqual([
      ["2026-06-28", "20:00", null, "Kökény Attila", null],
      ["2026-06-25", null, null, "Kézművesvásár", "Târgul Meșteșugarilor"],
      ["2026-06-25", null, null, "Enescu Chill Zone", "Enescu Chill Zone"],
      ["2026-06-26", null, null, "8 borászat, 1 pálinkakészítő, 1 kézműves sajtkészítő", "8 crame, 1 producător de pălincă, 1 producător de brânzeturi artizanale"],
      ["2026-06-27", "11:00", "14:00", null, "Conferință și lansare de carte - Cartea de oaspeți a Sanatoriului Czakó"],
    ]);
  });

  it("the prompt v2 names the patterns that dropped and asks for a per-day count before answering", () => {
    const p = fajl("../prompts/program_kiolvasas.hu.md");
    expect(p.split("\n")[0]).toMatch(/program-kiolvasas · v2 · 2026-10-17 .*· v1: 2026-10-17/);
    expect(p).toMatch(/„Egész nap \/ Pe tot parcursul zilei” szakaszban a helyszín-fejléc ALATTI névsor/);
    expect(p).toMatch(/Egy fejléc alatt felsorolt kínálat/);
    expect(p).toMatch(/Data: 27\.06\.2026 · Ora: 11:00 -14:00/);
    expect(p).toMatch(/„18:00–20:30 \| Edo” alakú sor/);
    expect(p).toMatch(/menj végig a forrás MINDEN időpontos során/);
    expect(p).toMatch(/SOHA ne találj ki időt, fellépőt, helyszínt, nevet vagy napot/); // the v1 rule stays
  });
});

describe("F6b pure: the neutral page name (0176)", () => {
  it("every place that names the page says „Adatok” / „Date” / „Details” — in all three languages", () => {
    const egesz = fajl("../adatbazis/migraciok/0176_c30_f6b_adatok_felirat.sql");
    const m = egesz.slice(egesz.indexOf("INSERT INTO")); // the rows only (the header comment names the old texts)
    for (const k of ["nav.szervezet_adatai", "nav.ugyfelprofil", "r15.nav.szervezet", "fiok.szervezet_cim", "gephaz.szervezet_adatai"]) {
      expect(m, k).toContain(`('${k}', 'hu', 'Adatok')`);
      expect(m, k).toContain(`('${k}', 'ro', 'Date')`);
      expect(m, k).toContain(`('${k}', 'en', 'Details')`);
    }
    expect(m).not.toMatch(/Szervezet adatai|Datele organizației|Organisation details|Company details|Date firmă/);
    expect((m.match(/^\s+\('/gm) ?? []).length).toBe(48);
  });
});

describe("F6b live: the read in the background, the languages, the page name", () => {
  const jelszo = "ProbaJelszo123!";
  let s = "", szervezetId = "";
  beforeAll(async () => {
    const email = veletlenEmail();
    await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev: "Moldovan-Szabó Réka", email, jelszo } });
    const b = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo } });
    s = `km_munkamenet=${sutiKinyer(b.sutik, "km_munkamenet")}`;
    expect((await keres("/api/szervezet", { modszer: "POST", torzs: { nev: "Zilele teszt — próba F6b" }, sutik: s })).statusz).toBe(201);
    const o = "Marosvásárhelyi Napok — Zilele Târgumureșene: 2026. június 25–28., koncertek és vásár, în limba română și germană.";
    await keres("/api/onboarding/piszkozat", { modszer: "PUT", sutik: s, torzs: { bemutatkozas: { nev: "Zilele teszt — próba F6b", osszefoglalo: o, osszefoglalo_forras: "ai", forras_tipus: "leiras", leiras: o } } });
    szervezetId = (await sql<{ id: string }>("SELECT id FROM szervezet WHERE nev = $1", ["Zilele teszt — próba F6b"]))[0]!.id;
  });
  afterAll(async () => { await takaritas(); await lezar(); });

  it("javaslatok: the languages named in the description win over the model's guess (test AI says hu, ro)", async () => {
    const j = await keres<{ nyelvek: string[] }>("/api/onboarding/javaslatok", { modszer: "POST", sutik: s });
    expect(j.statusz).toBe(200);
    expect(j.torzs.nyelvek).toEqual(["ro", "de"]);
  });

  it("POST answers 202 at once; GET follows it to „kesz” with the programme; a stuck „fut” is reported and does not block a new read", async () => {
    const o = "Marosvásárhelyi Napok — Zilele Târgumureșene: 2026. június 25–28., koncertek és vásár, în limba română și germană.";
    await keres("/api/onboarding/piszkozat", { modszer: "PUT", sutik: s, torzs: { bemutatkozas: { nev: "Zilele teszt — próba F6b", osszefoglalo: o, osszefoglalo_forras: "ai", forras_tipus: "leiras", leiras: o, szervezet_tipus: "fesztival", kategoria: "semleges", tipus_biztos: true }, kommunikacio: { celkozonseg: "családok", celkozonseg_forras: "ai", cel: "", cel_forras: "sajat", cel_kesobb: true, nyelvek: ["hu", "ro"], nyelvek_forras: "sajat", hangnem_leiras: "", hangnem_minta: "", hangnem_nyelv: "hu", hangnem_forras: "sajat" } } });
    expect((await keres("/api/onboarding/jovahagyas", { modszer: "POST", torzs: {}, sutik: s })).statusz).toBe(200);
    const t0 = Date.now();
    const r = await keres<{ olvasas: { id: string; allapot: string } }>("/api/program/olvas", { modszer: "POST", sutik: s, torzs: { link: `${PROBA_CIM}/nincs-ilyen-program` } });
    expect(r.statusz).toBe(202);
    expect(Date.now() - t0).toBeLessThan(5000);
    expect(r.torzs.olvasas.allapot).toBe("fut");
    let g: { olvasas: { id: string; allapot: string; hiba?: string } | null; tetelek?: ProgramTetel[] } = { olvasas: null };
    for (let i = 0; i < 100; i++) {
      g = (await keres<typeof g>("/api/program/olvas", { sutik: s })).torzs;
      if (g.olvasas?.allapot !== "fut") break;
      await new Promise((k) => setTimeout(k, 200));
    }
    expect(g.olvasas?.id).toBe(r.torzs.olvasas.id);
    expect(["kesz", "hiba"]).toContain(g.olvasas?.allapot); // a link to a missing page: the server says what happened — never a proxy cut
    // a stuck read (the server restarted mid-read): reported as ELAKADT, and a new read can start
    await sql("UPDATE szervezet_profil SET adatok = jsonb_set(adatok, '{program_olvasas}', $2::jsonb) WHERE szervezet_id = $1", [szervezetId, JSON.stringify({ id: "00000000-0000-4000-8000-0000000000f6", allapot: "fut", kezdve: "2026-10-17T00:00:00.000Z" })]);
    const elakadt = await keres<{ olvasas: { allapot: string; hiba?: string } }>("/api/program/olvas", { sutik: s });
    expect([elakadt.torzs.olvasas.allapot, elakadt.torzs.olvasas.hiba]).toEqual(["hiba", "ELAKADT"]);
    const uj = await keres<{ olvasas: { id: string } }>("/api/program/olvas", { modszer: "POST", sutik: s, torzs: { link: `${PROBA_CIM}/nincs-ilyen-program` } });
    expect(uj.statusz).toBe(202);
    expect(uj.torzs.olvasas.id).not.toBe("00000000-0000-4000-8000-0000000000f6");
  });

  it("the page name in the label table: Adatok / Date / Details", async () => {
    const r = await sql<{ nyelv: string; szoveg: string }>("SELECT nyelv, szoveg FROM felirat WHERE kulcs = 'nav.szervezet_adatai' ORDER BY nyelv");
    expect(r).toEqual([{ nyelv: "en", szoveg: "Details" }, { nyelv: "hu", szoveg: "Adatok" }, { nyelv: "ro", szoveg: "Date" }]);
  });
});
