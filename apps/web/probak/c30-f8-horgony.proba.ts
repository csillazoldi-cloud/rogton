// c30 F8 (docs/terv/FESZTIVAL-ES-NYELVI-MOD-TERV.md §4, §10 F8; rajz D7a · D7b): the festival's anchored ideas.
// Pure (the clock is injected — „ma” is a parameter): the anchors for 25–28 June 2026 (countdown 11, 18, 22, 24 June; tomorrow's
// programme 24–27; today's programme 25–28; album 26–29; thank-you 29), the per-day caps (2 before, 3 during), DST-safe days, the
// idempotent key read back by the F7 slice, the Kezdőlap's due ideas on 24 June, the Naptár ghost rows, the topic kinds.
// Live part (PROBA_CIM + DATABASE_URL; test AI): „Megírjuk” twice opens the same post with the anchor's day; the Kezdőlap of a festival
// whose event starts tomorrow shows the idea card; a company's Kezdőlap shows none.
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PosztMunka, ProgramTetel, TemaTerv } from "@rogton/contracts";
import type { TisztaTetel } from "../program/szabaly";
import { HORGONY_MAX_ALATT, HORGONY_MAX_ELOTTE, esedekesOtletek, horgonyFajtak, horgonyJavaslatok, horgonyKulcs, szellemSorok, type HorgonyOtlet } from "../program/horgony";
import { programHorgony } from "../program/blokk";
import { napHozzaad, napKulcs } from "../poszt/naptar";
import { idoszakCimke } from "../app/_kozos/c30-program-szabaly";
import { keres, lezar, sql, sutiKinyer, takaritas, veletlenEmail } from "./segedek";

const FIX = JSON.parse(readFileSync(new URL("./adat/zilele-2026.json", import.meta.url), "utf8")) as { vart: TisztaTetel[] };
const TETELEK: ProgramTetel[] = FIX.vart.map((t, i) => ({ ...t, id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`, forras: "gep", modositva: false, kep_fajl_id: null }));
const REND = { mettol: "2026-06-25", meddig: "2026-06-28", hely: { hu: "Marosvásárhely", ro: "Târgu Mureș" } };
const MIND = horgonyFajtak(null);
const napjai = (l: HorgonyOtlet[], f: string) => l.filter((o) => o.fajta === f).map((o) => o.nap);

describe("F8 pure: the anchors for 25–28 June 2026", () => {
  const l = horgonyJavaslatok(REND, TETELEK, MIND);
  it("countdown 11, 18, 22, 24 June; tomorrow's programme 24–27; today's 25–28; album 26–29; thank-you 29; practical info 20", () => {
    expect(napjai(l, "visszaszamlalo")).toEqual(["2026-06-11", "2026-06-18", "2026-06-22", "2026-06-24"]);
    expect(l.filter((o) => o.fajta === "visszaszamlalo").map((o) => o.hatra)).toEqual([14, 7, 3, 1]);
    expect(napjai(l, "holnapi_program")).toEqual(["2026-06-24", "2026-06-25", "2026-06-26", "2026-06-27"]);
    expect(l.filter((o) => o.fajta === "holnapi_program").map((o) => o.cel_nap)).toEqual(["2026-06-25", "2026-06-26", "2026-06-27", "2026-06-28"]);
    expect(napjai(l, "mai_program")).toEqual(["2026-06-25", "2026-06-26", "2026-06-27", "2026-06-28"]);
    expect(napjai(l, "album")).toEqual(["2026-06-26", "2026-06-27", "2026-06-28", "2026-06-29"]);
    expect(napjai(l, "koszono")).toEqual(["2026-06-29"]);
    // −1 (24 June) is full (tomorrow's programme + countdown): practical info only on −5
    expect(napjai(l, "gyakorlati")).toEqual(["2026-06-20"]);
  });

  it("caps: at most 2 a day before the event, 3 during and after; the more important kind stays", () => {
    const db = new Map<string, number>();
    for (const o of l) db.set(o.nap, (db.get(o.nap) ?? 0) + 1);
    for (const [nap, n] of db) expect(n, nap).toBeLessThanOrEqual(nap < "2026-06-25" ? HORGONY_MAX_ELOTTE : HORGONY_MAX_ALATT);
    expect(l.filter((o) => o.nap === "2026-06-24").map((o) => o.fajta)).toEqual(["holnapi_program", "visszaszamlalo"]);
    expect(l.filter((o) => o.nap === "2026-06-26").map((o) => o.fajta)).toEqual(["mai_program", "holnapi_program", "album"]);
  });

  it("performers: the main stage's evening concerts, 1–3 days before, at most one a day; the card names from the programme", () => {
    const f = l.filter((o) => o.fajta === "fellepo");
    expect(f.length).toBeGreaterThan(0);
    expect(new Set(f.map((o) => o.nap)).size).toBe(f.length);
    for (const o of f) {
      const t = TETELEK.find((x) => x.id === o.program_id)!;
      expect(t.helyszin.hu).toBe("Győzelem Tér – Nagyszínpad");
      expect(o.cel_nap).toBe(t.nap);
      expect(o.nap < t.nap! && o.nap >= napHozzaad(t.nap!, -3)).toBe(true);
    }
    expect(l.find((o) => o.fajta === "holnapi_program" && o.cel_nap === "2026-06-26")!.nevek).toEqual(["Blahalouisiana", "Alina Eremia"]);
    // a day without the main stage (Thursday): its two latest evening concerts, in time order
    expect(l.find((o) => o.fajta === "holnapi_program" && o.cel_nap === "2026-06-25")!.nevek).toEqual(["Alina Manole & Band", "Koncert az Óratoronyból"]);
  });

  it("the key is idempotent and the F7 slice reads it back (the item, or the programme day)", () => {
    const h = l.find((o) => o.fajta === "holnapi_program" && o.cel_nap === "2026-06-26")!;
    expect(h.kulcs).toBe("program:holnapi_program:2026-06-26");
    expect(programHorgony(h.kulcs, "", TETELEK)).toEqual({ nap: "2026-06-26" });
    const f = l.find((o) => o.fajta === "fellepo")!;
    expect(f.kulcs).toBe(`program:fellepo:${f.cel_nap}:${f.program_id}`);
    expect(programHorgony(f.kulcs, "", TETELEK)).toEqual({ id: f.program_id });
    expect(horgonyJavaslatok(REND, TETELEK, MIND)).toEqual(l); // same input → the same ideas, the same keys
    expect(new Set(l.map((o) => o.kulcs)).size).toBe(l.length);
    expect(horgonyKulcs({ fajta: "koszono", nap: "2026-06-29", cel_nap: null })).toBe("program:koszono:2026-06-29");
  });

  it("DST-safe: an event across the October change (25 Oct 2026, Bucharest) gets every day once; the day key is Bucharest's", () => {
    const o = horgonyJavaslatok({ mettol: "2026-10-23", meddig: "2026-10-27" }, [], MIND);
    expect(napjai(o, "mai_program")).toEqual(["2026-10-23", "2026-10-24", "2026-10-25", "2026-10-26", "2026-10-27"]);
    expect(napjai(o, "holnapi_program")).toEqual(["2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25", "2026-10-26"]);
    const m = horgonyJavaslatok({ mettol: "2027-03-27", meddig: "2027-03-29" }, [], MIND); // the March change (28 Mar 2027)
    expect(napjai(m, "album")).toEqual(["2027-03-28", "2027-03-29", "2027-03-30"]);
    expect(napKulcs(new Date("2026-06-23T21:30:00Z"))).toBe("2026-06-24"); // 00:30 in Bucharest is already the 24th
  });

  it("no dates or a backwards range → nothing; the topic plan's kinds limit the ideas (none marked → all seven)", () => {
    expect(horgonyJavaslatok(null, TETELEK, MIND)).toEqual([]);
    expect(horgonyJavaslatok({ mettol: "2026-06-28", meddig: "2026-06-25" }, TETELEK, MIND)).toEqual([]);
    const tema: TemaTerv[] = [{ tema: "Holnapi program", tipus: "picmess", fajta: "holnapi_program" }, { tema: "Fotóalbum", tipus: "album", fajta: "album" }, { tema: "x", tipus: "kartya" }];
    expect(horgonyFajtak(tema)).toEqual(["holnapi_program", "album"]);
    expect(new Set(horgonyJavaslatok(REND, TETELEK, horgonyFajtak(tema)).map((o) => o.fajta))).toEqual(new Set(["holnapi_program", "album"]));
    expect(horgonyFajtak([{ tema: "Munkáink", tipus: "album" }]).length).toBe(7);
  });
});

describe("F8 pure: the Kezdőlap on 24 June and the Naptár week of 22 June (clock injected)", () => {
  const l = horgonyJavaslatok(REND, TETELEK, MIND);
  it("24 June: due today first, then tomorrow and the day after, at most 3; an idea that already became a post is gone", () => {
    const e = esedekesOtletek(l, "2026-06-24", new Set(), 3);
    expect(e.map((o) => `${o.nap} ${o.fajta}`)).toEqual(["2026-06-24 holnapi_program", "2026-06-24 visszaszamlalo", "2026-06-25 mai_program"]);
    const megirt = esedekesOtletek(l, "2026-06-24", new Set(["program:holnapi_program:2026-06-25"]), 3);
    expect(megirt.map((o) => o.kulcs)).not.toContain("program:holnapi_program:2026-06-25");
    expect(esedekesOtletek(l, "2026-05-01", new Set(), 3)).toEqual([]); // nothing due yet
  });
  it("the ghost rows: from today on, never for a past day, never for an idea that is already a post", () => {
    const s = szellemSorok(l, "2026-06-24", new Set(["program:visszaszamlalo:2026-06-24"]));
    expect(s.every((o) => o.nap >= "2026-06-24")).toBe(true);
    expect(s.some((o) => o.kulcs === "program:visszaszamlalo:2026-06-24")).toBe(false);
    expect(s.filter((o) => o.nap >= "2026-06-22" && o.nap <= "2026-06-28").length).toBeGreaterThan(5);
  });
});

describe("F8 live: „Megírjuk” and the Kezdőlap", () => {
  const jelszo = "ProbaJelszo123!";
  const belep = async (nev: string, szervezet: string, tipus: "fesztival" | "ceg", rendezveny?: Record<string, unknown>) => {
    const email = veletlenEmail();
    await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev, email, jelszo } });
    const b = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo } });
    const s = `km_munkamenet=${sutiKinyer(b.sutik, "km_munkamenet")}`;
    expect((await keres("/api/szervezet", { modszer: "POST", torzs: { nev: szervezet }, sutik: s })).statusz).toBe(201);
    const o = tipus === "fesztival" ? "Marosvásárhelyi Napok — koncertek, borutca, kézművesvásár." : "Térkövezés, udvarok és járdák Marosvásárhelyen.";
    await keres("/api/onboarding/piszkozat", { modszer: "PUT", sutik: s, torzs: {
      bemutatkozas: { nev: szervezet, osszefoglalo: o, osszefoglalo_forras: "ai", forras_tipus: "leiras", leiras: o, szervezet_tipus: tipus, kategoria: tipus === "ceg" ? "epites" : "semleges", tipus_biztos: true, ...(rendezveny ? { rendezveny } : {}) },
      kommunikacio: { celkozonseg: "családok", celkozonseg_forras: "ai", cel: "", cel_forras: "sajat", cel_kesobb: true, nyelvek: tipus === "ceg" ? ["hu"] : ["hu", "ro"], nyelvek_forras: "sajat", hangnem_leiras: "", hangnem_minta: "", hangnem_nyelv: "hu", hangnem_forras: "sajat" },
    } });
    expect((await keres("/api/onboarding/jovahagyas", { modszer: "POST", torzs: {}, sutik: s })).statusz).toBe(200);
    return s;
  };
  // the event starts TOMORROW (Bucharest) — the server's real clock, so „Holnapi program” is due today
  const ma = napKulcs(new Date());
  const holnap = napHozzaad(ma, 1);
  let fesz = "", ceg = "";
  beforeAll(async () => {
    fesz = await belep("Moldovan-Szabó Réka", "Zilele — próba F8", "fesztival", { mettol: holnap, meddig: napHozzaad(holnap, 2), hely: { hu: "Marosvásárhely", ro: "Târgu Mureș" } });
    ceg = await belep("Kovács-Szentgyörgyi Tibor", "Kovács Térkő Kft. — próba F8", "ceg");
    for (const t of [{ nev: { hu: "Blahalouisiana", ro: "Blahalouisiana" }, kezdes: "20:00" }, { nev: { hu: "Alina Eremia", ro: "Alina Eremia" }, kezdes: "21:20" }]) {
      expect((await keres("/api/program/tetel", { modszer: "POST", sutik: fesz, torzs: { nap: holnap, kezdes: t.kezdes, nev: t.nev, helyszin: { hu: "Győzelem Tér – Nagyszínpad", ro: "Piața Victoriei – Scena Principală" }, fajta: "koncert" } })).statusz).toBe(201);
    }
  });
  afterAll(async () => { await takaritas(); await lezar(); });

  it("the festival's Kezdőlap shows the idea card („Holnapi program · …”, „Holnap: Blahalouisiana és Alina Eremia”, Megírjuk); the company's does not", async () => {
    const f = await fetch(`${process.env["PROBA_CIM"]}/kezdolap`, { headers: { cookie: `${fesz}; km_nyelv=hu` } }).then((r) => r.text());
    expect(f).toContain(`Holnapi program · ${idoszakCimke(holnap, holnap, "hu")}`);
    expect(f).toContain("Holnap: Blahalouisiana és Alina Eremia");
    expect(f).toContain("Megírjuk");
    const c = await fetch(`${process.env["PROBA_CIM"]}/kezdolap`, { headers: { cookie: `${ceg}; km_nyelv=hu` } }).then((r) => r.text());
    expect(c).not.toContain("Holnapi program · ");
    expect(c).not.toContain("Visszaszámlálás · ");
  });

  it("„Megírjuk” twice opens the SAME post, with the anchor's day as the suggested day; after it, the idea is not offered again", async () => {
    const kuld = () => keres<{ munka: PosztMunka }>("/api/poszt", { modszer: "POST", sutik: fesz, torzs: {
      forras: { tipus: "terv", azonosito: `program:holnapi_program:${holnap}`, cim: "Holnap: Blahalouisiana és Alina Eremia", url: "", szoveg: "Holnapi program\nHolnap: Blahalouisiana és Alina Eremia" },
      cim: "Holnap: Blahalouisiana és Alina Eremia", felulet: "fb", nyelv: "hu", javasolt_nap: ma,
    } });
    const a = await kuld(), b = await kuld();
    expect([a.statusz, b.statusz]).toEqual([200, 200]);
    expect(b.torzs.munka.id).toBe(a.torzs.munka.id);
    const sor = await sql<{ j: string | null }>("SELECT javasolt_nap::text AS j FROM poszt_munka WHERE id = $1", [a.torzs.munka.id]);
    expect(sor[0]!.j).toBe(ma);
    expect((await sql<{ n: number }>("SELECT count(*)::int AS n FROM poszt_munka p JOIN szervezet sz ON sz.id = p.szervezet_id WHERE sz.nev = $1", ["Zilele — próba F8"]))[0]!.n).toBe(1);
    const f = await fetch(`${process.env["PROBA_CIM"]}/kezdolap`, { headers: { cookie: `${fesz}; km_nyelv=hu` } }).then((r) => r.text());
    expect(f).not.toContain(`Holnapi program · ${idoszakCimke(holnap, holnap, "hu")}`); // this idea is gone (the post waits under its title)
    // an invalid day is ignored (the post is still created, without a day)
    const c = await keres<{ munka: PosztMunka }>("/api/poszt", { modszer: "POST", sutik: fesz, torzs: { forras: { tipus: "terv", azonosito: "program:koszono:2099-02-30", cim: "x", url: "", szoveg: "x" }, cim: "x", felulet: "fb", nyelv: "hu", javasolt_nap: "2099-02-30" } });
    expect(c.statusz).toBe(200);
    expect((await sql<{ j: string | null }>("SELECT javasolt_nap::text AS j FROM poszt_munka WHERE id = $1", [c.torzs.munka.id]))[0]!.j).toBeNull();
  });
});
