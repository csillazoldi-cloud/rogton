// R-16 K4 (TERV §2-K4 Self-test, kerdesek 4): a 12d/12d2 két végpontja és az onboarding háttérmunkájának őre — valódi adatbázissal
// (DATABASE_URL) és kiszolgálóval (PROBA_CIM), a r16-arculat-ment.proba.ts mintájára.
//  - GET /api/arculat/szin-javaslatok: négy összeállítás, az első a mostani (✓), a gyűrű 12 szín; a néző is olvashatja;
//  - POST /api/arculat/szinek: ment ÉS jóváhagy (új verzió), ugyanaz még egyszer = nincs új verzió; rossz törzs 400; néző 403;
//  - a háttérmunka (hatterTervezetBefogad az arculatMent-ben) jóváhagyás után NEM ír — és ha a jóváhagyással egy időben fut, sem.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ArculatLepes, type ArculatTervezet } from "@km/contracts";
import { alapA, arculatMent } from "../arculat/ment";
import { hatterTervezetBefogad, szinekJovahagy } from "../arculat/lepes";
import { alapTervezet } from "../arculat/alap";
import { profilTar } from "../profil/tar";
import { keres, lezar, sql, sutiKinyer, takaritas, veletlenEmail } from "./segedek";

const jelszo = "ProbaJelszo123!";
type Javaslat = { kulcs: string; nev: string; fo: string; masodik: string; hatter: string; forras: string; szett?: string; jelenlegi: boolean };
type Arc = { allapot: string; jovahagyott_verzio: number | null; verzio: number; verziok: Record<string, { elsodleges: string; masodlagos: string; szin_forras: string; szin_szett: string; betu_cim: string }> };
const AI_TERVEZET: ArculatTervezet = { ...alapTervezet("Cipó", ""), elsodleges: "#5a189a", masodlagos: "#ff9e00", hatter: "#fff7ee", szin_forras: "gep", szin_szett: "" };

describe("12d/12d2 végpontok + a háttérmunka őre (R-16 K4)", () => {
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
        bemutatkozas: { nev: "Cipó Pékség", osszefoglalo: "Pékség, kovászos kenyér, kalács és pogácsa Marosvásárhelyen, a Kossuth utcában — șapte zile.", osszefoglalo_forras: "sajat", forras_tipus: "leiras", leiras: "pékség, kovászos kenyér" },
        kommunikacio: { celkozonseg: "a környék lakói", celkozonseg_forras: "sajat", cel: "", cel_forras: "sajat", cel_kesobb: true, nyelvek: ["hu", "ro"], nyelvek_forras: "sajat", hangnem_leiras: "", hangnem_minta: "", hangnem_nyelv: "hu", hangnem_forras: "sajat" },
      },
    });
    expect(p.statusz).toBe(200);
    expect((await keres("/api/onboarding/jovahagyas", { modszer: "POST", torzs: {}, sutik })).statusz).toBe(200);
    const nEmail = veletlenEmail();
    expect((await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev: "Néző Nándor", email: nEmail, jelszo } })).statusz).toBe(201);
    const nId = (await sql<{ id: string }>("SELECT id FROM fiok WHERE email = $1", [nEmail]))[0]!.id;
    await sql("INSERT INTO tagsag (szervezet_id, fiok_id, szerep) VALUES ($1, $2, 'nezo')", [szervezetId, nId]);
    const nb = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email: nEmail, jelszo } });
    nezoSutik = `km_munkamenet=${sutiKinyer(nb.sutik, "km_munkamenet")}`;
  });

  afterAll(async () => {
    await takaritas();
    await lezar();
  });

  it("GET: négy összeállítás, az első a mostani (a pékség Meleg alapszettje ✓), utána a hangulatok; a gyűrű 12 szín", async () => {
    const v = await keres<{ szettek: Javaslat[]; gyuru: string[]; logo_szinek: string[]; elemzes_nelkul: string[] }>("/api/arculat/szin-javaslatok", { sutik });
    expect(v.statusz).toBe(200);
    expect(v.torzs.szettek).toHaveLength(4);
    expect(v.torzs.szettek[0]).toMatchObject({ kulcs: "jelenlegi", jelenlegi: true, nev: "r16.arculat.szettek.meleg", fo: "#a4471f", forras: "szett", szett: "meleg" });
    expect(v.torzs.szettek.slice(1).map((s) => s.kulcs)).toEqual(["termeszetes", "jatekos", "friss"]);
    expect(new Set(v.torzs.gyuru).size).toBe(12);
    expect(v.torzs.logo_szinek).toEqual([]);
  });

  it("POST Természetes → 200, 1. verzió jóváhagyva, a szett forrással; a profil beolvasható; ugyanaz még egyszer → nincs új verzió, nincs írás", async () => {
    const v = await keres<{ arculat: Arc }>("/api/arculat/szinek", { modszer: "POST", torzs: { fo: "#2f5d50", masodik: "#c9a86a", hatter: "#f1ede4", forras: "szett", szett: "termeszetes" }, sutik });
    expect(v.statusz).toBe(200);
    expect(v.torzs.arculat).toMatchObject({ allapot: "jovahagyott", jovahagyott_verzio: 1 });
    expect(v.torzs.arculat.verziok["1"]).toMatchObject({ elsodleges: "#2f5d50", szin_forras: "szett", szin_szett: "termeszetes", betu_cim: "gelasio" }); // a betűk a 12a alapszettjéből
    expect(await profilTar.betolt(szervezetId)).not.toBeNull();
    const elotte = (await sql<{ frissitve: Date }>("SELECT frissitve FROM szervezet_profil WHERE szervezet_id = $1", [szervezetId]))[0]!.frissitve;
    const u = await keres<{ arculat: Arc }>("/api/arculat/szinek", { modszer: "POST", torzs: { fo: "#2F5D50", masodik: "#c9a86a", hatter: "#f1ede4", forras: "szett", szett: "termeszetes" }, sutik });
    expect(u.statusz).toBe(200);
    expect(Object.keys(u.torzs.arculat.verziok)).toEqual(["1"]);
    const utana = (await sql<{ frissitve: Date }>("SELECT frissitve FROM szervezet_profil WHERE szervezet_id = $1", [szervezetId]))[0]!.frissitve;
    expect(utana.getTime()).toBe(elotte.getTime());
  });

  it("GET a jóváhagyás után: a mostani a Természetes ✓, és nem ismétlődik a hangulatok között", async () => {
    const v = await keres<{ szettek: Javaslat[] }>("/api/arculat/szin-javaslatok", { sutik });
    expect(v.torzs.szettek[0]).toMatchObject({ nev: "r16.arculat.szettek.termeszetes", jelenlegi: true });
    expect(v.torzs.szettek.map((s) => s.kulcs)).not.toContain("termeszetes");
  });

  it("POST egy gyűrűszín a másodiknak (12d2, saját) → 2. verzió; az 1. pillanatkép változatlan", async () => {
    const elso = (await profilTar.betolt(szervezetId))!.arculat.verziok["1"];
    const v = await keres<{ arculat: Arc }>("/api/arculat/szinek", { modszer: "POST", torzs: { fo: "#2f5d50", masodik: "#c2410c", hatter: "#f1ede4", forras: "sajat" }, sutik });
    expect(v.statusz).toBe(200);
    expect(v.torzs.arculat.jovahagyott_verzio).toBe(2);
    expect(v.torzs.arculat.verziok["2"]).toMatchObject({ masodlagos: "#c2410c", szin_forras: "sajat", szin_szett: "" });
    expect((await profilTar.betolt(szervezetId))!.arculat.verziok["1"]).toEqual(elso);
  });

  it("rossz törzs → 400 ERVENYTELEN_ADAT (szett-forrás szett nélkül, szett saját forrással, ismeretlen kulcs, rossz hex, ismeretlen szett); semmi nem íródik", async () => {
    const elotte = (await profilTar.betolt(szervezetId))!.arculat;
    const rosszak = [
      { fo: "#2f5d50", masodik: "#c9a86a", hatter: "#f1ede4", forras: "szett" },
      { fo: "#2f5d50", masodik: "#c9a86a", hatter: "#f1ede4", forras: "sajat", szett: "meleg" },
      { fo: "#2f5d50", masodik: "#c9a86a", hatter: "#f1ede4", forras: "sajat", betu_cim: "gelasio" },
      { fo: "zöld", masodik: "#c9a86a", hatter: "#f1ede4", forras: "sajat" },
      { fo: "#2f5d50", masodik: "#c9a86a", hatter: "#f1ede4", forras: "szett", szett: "nincs-ilyen" },
    ];
    for (const torzs of rosszak) {
      const v = await keres<{ hiba: string }>("/api/arculat/szinek", { modszer: "POST", torzs, sutik });
      expect(v.statusz, JSON.stringify(torzs)).toBe(400);
      expect(v.torzs.hiba).toBe("ERVENYTELEN_ADAT");
    }
    expect((await profilTar.betolt(szervezetId))!.arculat).toEqual(elotte);
  });

  it("a néző: GET 200 (olvashat), POST 403 NINCS_JOG, és semmi nem változik", async () => {
    const elotte = (await profilTar.betolt(szervezetId))!.arculat;
    expect((await keres("/api/arculat/szin-javaslatok", { sutik: nezoSutik })).statusz).toBe(200);
    const v = await keres<{ hiba: string }>("/api/arculat/szinek", { modszer: "POST", torzs: { fo: "#1f3a5f", masodik: "#7fb2e5", hatter: "#f3f6fa", forras: "szett", szett: "megbizhato" }, sutik: nezoSutik });
    expect(v.statusz).toBe(403);
    expect(v.torzs.hiba).toBe("NINCS_JOG");
    expect((await profilTar.betolt(szervezetId))!.arculat).toEqual(elotte);
  });

  it("a háttérmunka jóváhagyás UTÁN: nem ír (valtozatlan), az arculat és a sor frissítési ideje ugyanaz", async () => {
    const elotte = (await profilTar.betolt(szervezetId))!.arculat;
    const ido = (await sql<{ frissitve: Date }>("SELECT frissitve FROM szervezet_profil WHERE szervezet_id = $1", [szervezetId]))[0]!.frissitve;
    const e = await arculatMent(szervezetId, (a) => hatterTervezetBefogad(a, AI_TERVEZET, 1));
    expect(e).toMatchObject({ ok: true, valtozatlan: true });
    expect((await profilTar.betolt(szervezetId))!.arculat).toEqual(elotte);
    expect((await sql<{ frissitve: Date }>("SELECT frissitve FROM szervezet_profil WHERE szervezet_id = $1", [szervezetId]))[0]!.frissitve.getTime()).toBe(ido.getTime());
  });

  it("a háttérmunka a jóváhagyással EGY IDŐBEN (érintetlen arculatnál): a zár sorba állítja, a jóváhagyás marad, tervezet nem íródik rá", async () => {
    // a próba-munkatér arculatát visszaállítjuk az onboardingkori, érintetlen állapotba (csak ebben a próbában, a saját munkaterén)
    await sql("UPDATE szervezet_profil SET adatok = jsonb_set(adatok, '{arculat}', $2::jsonb) WHERE szervezet_id = $1", [szervezetId, JSON.stringify(ArculatLepes.parse({}))]);
    const sorrend: string[] = [];
    const [jov, hat] = await Promise.all([
      arculatMent(szervezetId, (a, k) => { sorrend.push("jóváhagyás olvas"); return szinekJovahagy(a, { fo: "#1f3a5f", masodik: "#7fb2e5", hatter: "#f3f6fa", forras: "szett", szett: "megbizhato" }, alapA(k), k.most, undefined); }, 400)
        .then((e) => { sorrend.push("jóváhagyás kész"); return e; }),
      new Promise((r) => setTimeout(r, 80)).then(() => arculatMent(szervezetId, (a) => { sorrend.push("háttér olvas"); return hatterTervezetBefogad(a, AI_TERVEZET, 1); })),
    ]);
    expect(sorrend).toEqual(["jóváhagyás olvas", "jóváhagyás kész", "háttér olvas"]);
    expect(jov.ok).toBe(true);
    expect(hat).toMatchObject({ ok: true, valtozatlan: true });
    const a = (await profilTar.betolt(szervezetId))!.arculat;
    expect(a).toMatchObject({ allapot: "jovahagyott", jovahagyott_verzio: 1 });
    expect(a.tervezet?.elsodleges).toBe("#1f3a5f");
  });

  it("a háttérmunka érintetlen arculatnál ír (a régi viselkedés megmarad): tervezet, nincs jóváhagyás", async () => {
    await sql("UPDATE szervezet_profil SET adatok = jsonb_set(adatok, '{arculat}', $2::jsonb) WHERE szervezet_id = $1", [szervezetId, JSON.stringify(ArculatLepes.parse({}))]);
    const e = await arculatMent(szervezetId, (a) => hatterTervezetBefogad(a, AI_TERVEZET, 1));
    expect(e.ok && !("valtozatlan" in e && e.valtozatlan)).toBe(true);
    const a = (await profilTar.betolt(szervezetId))!.arculat;
    expect(a).toMatchObject({ allapot: "tervezet", jovahagyott_verzio: null });
    expect(a.tervezet?.elsodleges).toBe("#5a189a");
  });
});
