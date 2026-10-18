// R-16 K5 (TERV §2-K5 Self-test, 1.5, 1.7 R1, gepezet 7–8, kerdesek 4): a 12e végpontjai valódi adatbázissal (DATABASE_URL) és
// kiszolgálóval (PROBA_CIM), a r16-arculat-ment.proba.ts stílusában.
//  - betű feltöltése (x-fajl-cel: betu): TTF → 201 { fajl, betu: { nev, hianyzo } }, az elemzés az `elemzes` oszlopban; PNG betűnek,
//    TTF logónak → 415, és a lemezre / táblába semmi nem kerül; a „Fájlok” (cél nélküli lista) nem hozza a betűt;
//  - GET /api/arculat/betuk: az öt beépített + a saját (a munkatér nyelveire szűrt hiánnyal: hu+ro munkatérben a Caladea Italic ș ț Ș);
//  - POST /api/arculat/betuk: ment ÉS jóváhagy (verzió + 1), a saját kulcs csak a munkatér saját fájljára; ismeretlen → 400; néző 403;
//  - a profil minden mentés után beolvasható (R1).
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { profilTar } from "../profil/tar";
import { PROBA_CIM, keres, lezar, sql, sutiKinyer, takaritas, veletlenEmail } from "./segedek";

const jelszo = "ProbaJelszo123!";
const fajl = (n: string) => new Uint8Array(readFileSync(new URL(`./betuk/${n}`, import.meta.url)));
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0]);

async function feltolt(sutik: string, nev: string, cel: string, bajtok: Uint8Array) {
  const v = await fetch(`${PROBA_CIM}/api/arculat/fajl`, {
    method: "POST",
    body: bajtok.slice().buffer as ArrayBuffer, // a nyers bájtok (a TS 7 BodyInit-je ArrayBuffer-t vár)
    headers: { cookie: `${sutik}; km_nyelv=hu`, "x-fajl-nev": encodeURIComponent(nev), "x-fajl-cel": cel, "content-type": "application/octet-stream", "x-forwarded-for": `198.51.100.${Math.floor(Math.random() * 254) + 1}` },
  });
  return { statusz: v.status, torzs: (await v.json()) as { hiba?: string; fajl?: { id: string; tipus: string; cel: string }; betu?: { nev: string; hianyzo: string[] } } };
}

type Valasztek = { beepitett: { kulcs: string; szo: string; nev: string }[]; sajat: { id: string; kulcs: string; nev: string; hianyzo: string[] }[]; cim: string; szoveg: string };

describe("a 12e végpontjai (R-16 K5)", () => {
  let sutik: string;
  let nezoSutik: string;
  let szervezetId: string;
  let italicId: string;

  beforeAll(async () => {
    const email = veletlenEmail();
    expect((await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev: "Kövesi Tibor", email, jelszo } })).statusz).toBe(201);
    const b = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo } });
    sutik = `km_munkamenet=${sutiKinyer(b.sutik, "km_munkamenet")}`;
    const sz = await keres<{ id: string }>("/api/szervezet", { modszer: "POST", torzs: { nev: "Kövesi Térkő" }, sutik });
    expect(sz.statusz).toBe(201);
    szervezetId = sz.torzs.id;
    const p = await keres("/api/onboarding/piszkozat", {
      modszer: "PUT", sutik,
      torzs: {
        bemutatkozas: { nev: "Kövesi Térkő", osszefoglalo: "Térkövezés, szegélyezés és vízelvezetés Maros megyében — udvarok, járdák, parkolók.", osszefoglalo_forras: "sajat", forras_tipus: "leiras", leiras: "térkövezés" },
        kommunikacio: { celkozonseg: "családi házak tulajdonosai", celkozonseg_forras: "sajat", cel: "", cel_forras: "sajat", cel_kesobb: true, nyelvek: ["hu", "ro"], nyelvek_forras: "sajat", hangnem_leiras: "", hangnem_minta: "", hangnem_nyelv: "hu", hangnem_forras: "sajat" },
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

  it("TTF feltöltése betűnek: 201, a név és a (hu+ro munkatérben) hiányzó ș ț Ș; az elemzés az `elemzes` oszlopban", async () => {
    const v = await feltolt(sutik, "Caladea-Italic.ttf", "betu", fajl("Caladea-Italic.ttf"));
    expect(v.statusz).toBe(201);
    expect(v.torzs.fajl).toMatchObject({ tipus: "ttf", cel: "betu" });
    expect(v.torzs.betu).toEqual({ nev: "Caladea", hianyzo: ["ș", "ț", "Ș"] });
    italicId = v.torzs.fajl!.id;
    const sor = (await sql<{ elemzes: unknown; logo_valtozat: string | null }>("SELECT elemzes, logo_valtozat FROM arculat_fajl WHERE id = $1", [italicId]))[0]!;
    expect(sor).toEqual({ elemzes: { fajta: "betu", nev: "Caladea", hianyzo: ["ș", "ț", "Ș"] }, logo_valtozat: null });
    // a fájl kiszolgálása a betű MIME-jével (a 12e FontFace-e innen tölt)
    const g = await fetch(`${PROBA_CIM}/api/arculat/fajl/${italicId}`, { headers: { cookie: sutik } });
    expect(g.status).toBe(200);
    expect(g.headers.get("content-type")).toBe("font/ttf");
  });

  it("nem betű betűnek (PNG), betű logónak (TTF), csonka TTF: 415, és semmi nem kerül a táblába", async () => {
    const elotte = (await sql<{ n: string }>("SELECT count(*)::text AS n FROM arculat_fajl WHERE szervezet_id = $1", [szervezetId]))[0]!.n;
    expect(await feltolt(sutik, "logo.png", "betu", PNG)).toMatchObject({ statusz: 415, torzs: { hiba: "TIPUS_NEM_ENGEDETT" } });
    expect(await feltolt(sutik, "Caladea.ttf", "logo", fajl("Caladea-Regular.ttf"))).toMatchObject({ statusz: 415, torzs: { hiba: "TIPUS_NEM_ENGEDETT" } });
    expect(await feltolt(sutik, "csonka.ttf", "betu", fajl("Caladea-Regular.ttf").slice(0, 400))).toMatchObject({ statusz: 415, torzs: { hiba: "TIPUS_NEM_ENGEDETT" } });
    expect((await sql<{ n: string }>("SELECT count(*)::text AS n FROM arculat_fajl WHERE szervezet_id = $1", [szervezetId]))[0]!.n).toBe(elotte);
  });

  it("a „Fájlok” (cél nélküli lista) nem hozza a betűt; a cél szerinti lista igen", async () => {
    const osszes = await keres<{ fajl: { cel: string }[] }>("/api/arculat/fajl", { sutik });
    expect(osszes.torzs.fajl.some((f) => f.cel === "betu")).toBe(false);
    const betuk = await keres<{ fajl: { id: string }[] }>("/api/arculat/fajl?cel=betu", { sutik });
    expect(betuk.torzs.fajl.map((f) => f.id)).toEqual([italicId]);
  });

  it("GET /api/arculat/betuk: öt beépített a rajz sorrendjében + a saját; a tag (néző) is olvashatja", async () => {
    const v = await keres<Valasztek>("/api/arculat/betuk", { sutik: nezoSutik });
    expect(v.statusz).toBe(200);
    expect(v.torzs.beepitett.map((b) => b.kulcs)).toEqual(["archivo", "public-sans", "space-grotesk", "ibm-plex-sans", "gelasio"]);
    expect(v.torzs.sajat).toEqual([{ id: italicId, kulcs: `sajat:${italicId}`, nev: "Caladea", hianyzo: ["ș", "ț", "Ș"] }]);
    // térkő → Természetes szett (archivo · public-sans), még jóvá nem hagyott arculat: az alapszett betűi
    expect([v.torzs.cim, v.torzs.szoveg]).toEqual(["archivo", "public-sans"]);
  });

  it("POST: Cím Space Grotesk, Szöveg Public Sans → mentve ÉS jóváhagyva (1. verzió); a profil beolvasható", async () => {
    const v = await keres<{ arculat: { allapot: string; jovahagyott_verzio: number; verziok: Record<string, { betu_cim: string; betu_szoveg: string }> } }>("/api/arculat/betuk", { modszer: "POST", torzs: { cim: "space-grotesk", szoveg: "public-sans" }, sutik });
    expect(v.statusz).toBe(200);
    expect(v.torzs.arculat.allapot).toBe("jovahagyott");
    expect(v.torzs.arculat.jovahagyott_verzio).toBe(1);
    expect(v.torzs.arculat.verziok["1"]).toMatchObject({ betu_cim: "space-grotesk", betu_szoveg: "public-sans" });
    expect(await profilTar.betolt(szervezetId)).not.toBeNull();
    const g = await keres<Valasztek>("/api/arculat/betuk", { sutik });
    expect([g.torzs.cim, g.torzs.szoveg]).toEqual(["space-grotesk", "public-sans"]);
  });

  it("POST a saját betűvel (csak a szöveg): új verzió (2), az 1. változatlan", async () => {
    const v = await keres<{ arculat: { jovahagyott_verzio: number; verziok: Record<string, { betu_cim: string; betu_szoveg: string }> } }>("/api/arculat/betuk", { modszer: "POST", torzs: { szoveg: `sajat:${italicId}` }, sutik });
    expect(v.statusz).toBe(200);
    expect(v.torzs.arculat.jovahagyott_verzio).toBe(2);
    expect(v.torzs.arculat.verziok["2"]).toMatchObject({ betu_cim: "space-grotesk", betu_szoveg: `sajat:${italicId}` });
    expect(v.torzs.arculat.verziok["1"]).toMatchObject({ betu_szoveg: "public-sans" });
  });

  it("rossz törzs → 400, semmi nem íródik: ismeretlen betű, idegen/nem létező saját kulcs, üres törzs, ismeretlen mező", async () => {
    const elotte = (await profilTar.betolt(szervezetId))!.arculat;
    for (const torzs of [{ cim: "comic-sans" }, { cim: "sajat:00000000-0000-4000-8000-000000000000" }, {}, { cim: "archivo", elsodleges: "#000000" }, { cim: "Georgia, serif" }]) {
      const v = await keres<{ hiba: string }>("/api/arculat/betuk", { modszer: "POST", torzs, sutik });
      expect(v.statusz, JSON.stringify(torzs)).toBe(400);
      expect(v.torzs.hiba).toBe("ERVENYTELEN_ADAT");
    }
    expect((await profilTar.betolt(szervezetId))!.arculat).toEqual(elotte);
  });

  it("a néző: POST 403 NINCS_JOG, betűt feltölteni sem tud; semmi nem változik", async () => {
    const elotte = (await profilTar.betolt(szervezetId))!.arculat;
    const v = await keres<{ hiba: string }>("/api/arculat/betuk", { modszer: "POST", torzs: { cim: "gelasio" }, sutik: nezoSutik });
    expect(v.statusz).toBe(403);
    expect(v.torzs.hiba).toBe("NINCS_JOG");
    expect((await feltolt(nezoSutik, "Caladea-Regular.ttf", "betu", fajl("Caladea-Regular.ttf"))).statusz).toBe(403);
    expect((await profilTar.betolt(szervezetId))!.arculat).toEqual(elotte);
  });

  it("a mintakép POST `betuk`-kal a saját betűvel: PNG jön (a bájt a munkatér saját fájljából, a képgyártóig)", async () => {
    const v = await fetch(`${PROBA_CIM}/api/vizual/helyzet-minta/kesz`, { method: "POST", body: JSON.stringify({ betuk: { cim: `sajat:${italicId}`, szoveg: "public-sans" } }), headers: { cookie: sutik, "content-type": "application/json" } });
    // a képgyártó nélküli környezetben 503 (KEPGYAR_NEM_VALASZOL) — akkor ezt a lépést a helyi végigjátszás méri (meres/k5)
    expect([200, 503]).toContain(v.status);
    // c15 (2026-10-08, szabály 10 — az elvárás oka): a „Kész munka” minta a példafotóval JPEG-ként jön (a PNG ~1,3 MB volt);
    // a c15 előtti képgyártó még PNG-t ad — mindkettő kép, a lényeg (a saját betű eljut a képgyártóig) változatlan.
    if (v.status === 200) expect(v.headers.get("content-type")).toMatch(/^image\/(png|jpeg)$/);
  });
});
