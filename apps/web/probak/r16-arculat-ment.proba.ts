// R-16 K3 (TERV §2-K3 Self-test, 1.7 R1/R2): a szakasz írási útja (`arculatMent`) — egy tranzakció, `SELECT … FOR UPDATE`.
// Valódi adatbázis (DATABASE_URL) és kiszolgáló (PROBA_CIM, a munkatér létrehozásához), a profil.proba.ts stílusában.
//  - két egyszerre érkező mentés sorban fut: a második az első eredményére épül (egyik sem vész el);
//  - jóváhagyás a semmiből = 1. verzió; Részletek jóváhagyott arculaton = verzió + 1, jóváhagyva;
//  - a profil minden mentés után beolvasható (soha nem lesz belőle null);
//  - a három végpont: szerkesztő 200, néző 403 NINCS_JOG, rossz törzs 400.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { JovahagyasValasz } from "@km/contracts";
import { arculatMent } from "../arculat/ment";
import { alapA } from "../arculat/ment";
import { jovahagyTenyleges, reszletekJovahagy } from "../arculat/lepes";
import { profilTar } from "../profil/tar";
import { keres, lezar, sql, sutiKinyer, takaritas, veletlenEmail } from "./segedek";

const jelszo = "ProbaJelszo123!";
const URES = { vilagos: null, sotet: null, egyszinu: null, negyzetes: null };

describe("arculatMent + a szakasz végpontjai (R-16 K3)", () => {
  let sutik: string;
  let nezoSutik: string;
  let szervezetId: string;

  beforeAll(async () => {
    const email = veletlenEmail();
    expect((await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev: "Cipó Anna", email, jelszo } })).statusz).toBe(201);
    const b = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo } });
    sutik = `km_munkamenet=${sutiKinyer(b.sutik, "km_munkamenet")}`;
    const sz = await keres<{ id: string }>("/api/szervezet", { modszer: "POST", torzs: { nev: "Cipó Pékség" }, sutik });
    expect(sz.statusz).toBe(201);
    szervezetId = sz.torzs.id;
    const p = await keres("/api/onboarding/piszkozat", {
      modszer: "PUT", sutik,
      torzs: {
        bemutatkozas: { nev: "Cipó Pékség", osszefoglalo: "Pékség, kovászos kenyér, kalács és pogácsa Marosvásárhelyen, a Kossuth utcában.", osszefoglalo_forras: "sajat", forras_tipus: "leiras", leiras: "pékség, kovászos kenyér" },
        kommunikacio: { celkozonseg: "a környék lakói", celkozonseg_forras: "sajat", cel: "", cel_forras: "sajat", cel_kesobb: true, nyelvek: ["hu", "ro"], nyelvek_forras: "sajat", hangnem_leiras: "", hangnem_minta: "", hangnem_nyelv: "hu", hangnem_forras: "sajat" },
      },
    });
    expect(p.statusz).toBe(200);
    const j = await keres<unknown>("/api/onboarding/jovahagyas", { modszer: "POST", torzs: {}, sutik });
    expect(j.statusz).toBe(200);
    expect(JovahagyasValasz.parse(j.torzs).profil.arculat.tervezet).toBeNull();
    // egy néző ugyanabban a munkatérben
    const nEmail = veletlenEmail();
    expect((await keres<{ id: string }>("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev: "Néző Nándor", email: nEmail, jelszo } })).statusz).toBe(201);
    const nId = (await sql<{ id: string }>("SELECT id FROM fiok WHERE email = $1", [nEmail]))[0]!.id;
    await sql("INSERT INTO tagsag (szervezet_id, fiok_id, szerep) VALUES ($1, $2, 'nezo')", [szervezetId, nId]);
    const nb = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email: nEmail, jelszo } });
    nezoSutik = `km_munkamenet=${sutiKinyer(nb.sutik, "km_munkamenet")}`;
  });

  afterAll(async () => {
    await takaritas();
    await lezar();
  });

  it("két egyszerre futó mentés sorban fut: a második az első eredményére épül, egyik sem vész el", async () => {
    const sorrend: string[] = [];
    const [a, b] = await Promise.all([
      arculatMent(szervezetId, (l, k) => { sorrend.push("A olvas"); return reszletekJovahagy(l, { kepvilag: "Friss kifli közelről" }, alapA(k), k.most, URES); }, 400).then((e) => { sorrend.push("A kész"); return e; }),
      new Promise((r) => setTimeout(r, 80)).then(() => arculatMent(szervezetId, (l, k) => { sorrend.push("B olvas"); return reszletekJovahagy(l, { kovetendo: "Valódi fotók a pultról" }, alapA(k), k.most, URES); })).then((e) => { sorrend.push("B kész"); return e; }),
    ]);
    expect(a.ok && b.ok).toBe(true);
    expect(sorrend).toEqual(["A olvas", "A kész", "B olvas", "B kész"]); // B a zár miatt csak A után olvasott
    const p = await profilTar.betolt(szervezetId);
    expect(p).not.toBeNull();
    const l = p!.arculat;
    expect(Object.keys(l.verziok).sort()).toEqual(["1", "2"]);
    expect(l.jovahagyott_verzio).toBe(2);
    expect(l.verziok["1"]).toMatchObject({ kepvilag: "Friss kifli közelről", kovetendo: "", elsodleges: "#a4471f", szin_szett: "meleg" });
    expect(l.verziok["2"]).toMatchObject({ kepvilag: "Friss kifli közelről", kovetendo: "Valódi fotók a pultról" });
  });

  it("jóváhagyás már jóváhagyott arculaton: nincs új verzió; a profil beolvasható", async () => {
    const e = await arculatMent(szervezetId, (l, k) => jovahagyTenyleges(l, alapA(k), k.most, URES));
    expect(e.ok).toBe(true);
    const p = await profilTar.betolt(szervezetId);
    expect(p).not.toBeNull();
    expect(Object.keys(p!.arculat.verziok).sort()).toEqual(["1", "2"]);
  });

  it("végpontok: visszavonás → tervezet; jóváhagyás → új verzió (3), a régiek maradnak; Részletek → 4", async () => {
    const v = await keres<{ arculat: { allapot: string; verziok: Record<string, unknown> } }>("/api/arculat/visszavon", { modszer: "POST", torzs: {}, sutik });
    expect(v.statusz).toBe(200);
    expect(v.torzs.arculat.allapot).toBe("tervezet");
    const j = await keres<{ arculat: { allapot: string; jovahagyott_verzio: number; verziok: Record<string, unknown> } }>("/api/arculat/jovahagy", { modszer: "POST", torzs: {}, sutik });
    expect(j.statusz).toBe(200);
    expect(j.torzs.arculat.allapot).toBe("jovahagyott");
    expect(j.torzs.arculat.jovahagyott_verzio).toBe(3);
    expect(Object.keys(j.torzs.arculat.verziok).sort()).toEqual(["1", "2", "3"]);
    const r = await keres<{ arculat: { jovahagyott_verzio: number; verziok: Record<string, { lekerekites: number }> } }>("/api/arculat/reszletek", { modszer: "PUT", torzs: { lekerekites: 14, kerulendo: "Stockfotó, ș ț ő ű" }, sutik });
    expect(r.statusz).toBe(200);
    expect(r.torzs.arculat.jovahagyott_verzio).toBe(4);
    expect(r.torzs.arculat.verziok["4"]?.lekerekites).toBe(14);
    expect(await profilTar.betolt(szervezetId)).not.toBeNull();
  });

  it("rossz törzs a Részleteknél → 400 ERVENYTELEN_ADAT (ismeretlen kulcs, túl nagy lekerekítés); semmi nem íródik", async () => {
    const elotte = (await profilTar.betolt(szervezetId))!.arculat;
    expect((await keres("/api/arculat/reszletek", { modszer: "PUT", torzs: { elsodleges: "#000000" }, sutik })).statusz).toBe(400);
    expect((await keres("/api/arculat/reszletek", { modszer: "PUT", torzs: { lekerekites: 99 }, sutik })).statusz).toBe(400);
    expect((await profilTar.betolt(szervezetId))!.arculat).toEqual(elotte);
  });

  it("a néző 403 NINCS_JOG mindhárom végponton, és semmi nem változik", async () => {
    const elotte = (await profilTar.betolt(szervezetId))!.arculat;
    for (const [ut, modszer] of [["/api/arculat/jovahagy", "POST"], ["/api/arculat/reszletek", "PUT"], ["/api/arculat/visszavon", "POST"]] as const) {
      const v = await keres<{ hiba: string }>(ut, { modszer, torzs: {}, sutik: nezoSutik });
      expect(v.statusz, ut).toBe(403);
      expect(v.torzs.hiba).toBe("NINCS_JOG");
    }
    expect((await profilTar.betolt(szervezetId))!.arculat).toEqual(elotte);
  });
});
