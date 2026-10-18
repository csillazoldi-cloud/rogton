// R-16 K6 (TERV §2-K6 Self-test, 1.6, 1.7 R5; gepezet 13; kerdesek 4): a névlogó tárolása és újrakészítése valódi adatbázissal (DATABASE_URL)
// és kiszolgálóval (PROBA_CIM), a képgyártó HELYETT hamis készítővel (a képgyártó füstpróbája külön: apps/kepgyar/probak/nevlogo-fust.ts).
// A próba és a kiszolgáló ugyanazt a FAJL_MAPPA-t használja (a feltöltött és a gép-írta fájlt mindkettő olvassa).
//  - „Ez legyen”: 8 új sor (4 hely × PNG + SVG), mind `cel='logo'`, `eredet='gep'`, a helyével; a stílus a tervezetben, jóváhagyva, és a
//    pillanatkép `logok`-ja a 4 új PNG; a készítő a munkatér színeit és cím-betűjét kapta (Cipó Pékség → Meleg szett, Gelasio);
//  - újrakészítés: csak ahol a hely legfrissebb fájlja a gépé; a feltöltött logó sora érintetlen, és a képeken az marad a világos helyen;
//    gépi hely nélkül semmi nem íródik; sor nem módosul, nem törlődik;
//  - a végpontok: a néző 403, rossz stílus 400; a gép-írta SVG kiszolgálása szigorú fejlécekkel; SVG feltöltése továbbra is 415;
//  - a fájlnév ékezetes (Latin-1-en kívüli) betűvel is kiszolgálható (a K6 közben javított fejléc).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hasznaltLogok } from "@km/fajl-core";
import { profilTar } from "../profil/tar";
import { fajlTar } from "../fajl/tar";
import { nevlogoMent, regeneral, ujraKeszitendoHelyek, type NevlogoBemenet, type NevlogoKeszito } from "../arculat/nevlogo";
import { PROBA_CIM, keres, lezar, sql, sutiKinyer, takaritas, veletlenEmail } from "./segedek";

const jelszo = "ProbaJelszo123!";
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 0x1f, 0x15, 0xc4, 0x89, 0, 0, 0, 0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0, 1, 0, 0, 5, 0, 1, 0x0d, 0x0a, 0x2d, 0xb4, 0, 0, 0, 0, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);

/** Hamis készítő: rögzíti, mit kapott; minden változat egy apró PNG és egy útvonalas SVG. */
function hamis(naplo: NevlogoBemenet[]): NevlogoKeszito {
  return async (b) => {
    naplo.push(b);
    const v = (tinta: string) => ({ svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 2"><path d="M0 0H10V2H0Z" fill="${tinta}"/></svg>`, png: PNG, szelesseg: 10, magassag: 2, tinta, szinek: [tinta] });
    return { vilagos: v(b.szinek.fo), sotet: v(b.szinek.hatter), egyszinu: v("#000000"), negyzetes: v(b.szinek.fo) };
  };
}

type Sor = { id: string; nev: string; tipus: string; cel: string; eredet: string; logo_valtozat: string | null; feltoltve: string; elemzes: unknown };
const sorok = (szervezetId: string) => sql<Sor>("SELECT id, nev, tipus, cel, eredet, logo_valtozat, feltoltve::text, elemzes FROM arculat_fajl WHERE szervezet_id = $1 ORDER BY feltoltve, id", [szervezetId]);

async function feltolt(sutik: string, nev: string, bajtok: Uint8Array, fej: Record<string, string>) {
  const v = await fetch(`${PROBA_CIM}/api/arculat/fajl`, {
    method: "POST",
    body: bajtok.slice().buffer as ArrayBuffer,
    headers: { cookie: `${sutik}; km_nyelv=hu`, "x-fajl-nev": encodeURIComponent(nev), "content-type": "application/octet-stream", "x-forwarded-for": `198.51.100.${Math.floor(Math.random() * 254) + 1}`, ...fej },
  });
  return { statusz: v.status, torzs: (await v.json()) as { hiba?: string; fajl?: { id: string } } };
}

describe("ujraKeszitendoHelyek (tiszta)", () => {
  const f = (id: string, h: string | null, eredet: "gep" | "feltoltes" | "honlap", ido: string) => ({ id, cel: "logo" as const, logo_valtozat: h as never, eredet, feltoltve: ido });
  it("csak ahol a hely legfrissebb fájlja a gépé; a hely nélküli régi sor világos; más cél nem számít", () => {
    expect(ujraKeszitendoHelyek([])).toEqual([]);
    expect(ujraKeszitendoHelyek([
      f("a", "vilagos", "gep", "2026-09-30T10:00:00.000Z"), f("b", "vilagos", "feltoltes", "2026-09-30T11:00:00.000Z"),
      f("c", "sotet", "gep", "2026-09-30T10:00:00.000Z"), f("d", null, "gep", "2026-09-30T09:00:00.000Z"),
      f("e", "egyszinu", "honlap", "2026-09-30T12:00:00.000Z"), f("g", "egyszinu", "gep", "2026-09-30T10:00:00.000Z"),
    ])).toEqual(["sotet"]);
    // régebbi feltöltés, újabb gépi → a gépé a hely
    expect(ujraKeszitendoHelyek([f("x", "negyzetes", "feltoltes", "2026-09-29T10:00:00.000Z"), f("y", "negyzetes", "gep", "2026-09-30T10:00:00.000Z")])).toEqual(["negyzetes"]);
  });
});

describe("a névlogó tárolása és újrakészítése (R-16 K6)", () => {
  let sutik: string;
  let nezoSutik: string;
  let szervezetId: string;
  let fiokId: string;

  beforeAll(async () => {
    const email = veletlenEmail();
    expect((await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev: "Cipó Anna", email, jelszo } })).statusz).toBe(201);
    const b = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo } });
    sutik = `km_munkamenet=${sutiKinyer(b.sutik, "km_munkamenet")}`;
    const sz = await keres<{ id: string }>("/api/szervezet", { modszer: "POST", torzs: { nev: "Cipó Pékség" }, sutik });
    expect(sz.statusz).toBe(201);
    szervezetId = sz.torzs.id;
    fiokId = (await sql<{ id: string }>("SELECT id FROM fiok WHERE email = $1", [email]))[0]!.id;
    const p = await keres("/api/onboarding/piszkozat", {
      modszer: "PUT", sutik,
      torzs: {
        bemutatkozas: { nev: "Cipó Pékség", osszefoglalo: "Pékség a Kossuth utcában: kovászos kenyér, kalács, pogácsa és friss kifli minden reggel.", osszefoglalo_forras: "sajat", forras_tipus: "leiras", leiras: "pékség" },
        kommunikacio: { celkozonseg: "a környék családjai", celkozonseg_forras: "sajat", cel: "", cel_forras: "sajat", cel_kesobb: true, nyelvek: ["hu"], nyelvek_forras: "sajat", hangnem_leiras: "", hangnem_minta: "", hangnem_nyelv: "hu", hangnem_forras: "sajat" },
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

  it("gépi hely nélkül az újrakészítés nem ír semmit (és nem hívja a készítőt)", async () => {
    const naplo: NevlogoBemenet[] = [];
    expect(await regeneral(szervezetId, fiokId, "Cipó Pékség", hamis(naplo))).toEqual([]);
    expect(naplo).toEqual([]);
    expect(await sorok(szervezetId)).toEqual([]);
  });

  it("„Ez legyen” (kor): 8 új sor, eredet gep, helyenként PNG + SVG; a stílus jóváhagyva; a pillanatkép logói az új PNG-k", async () => {
    const naplo: NevlogoBemenet[] = [];
    const m = await nevlogoMent(szervezetId, fiokId, "Cipó Pékség", "kor", hamis(naplo));
    expect(m.ok).toBe(true);
    if (!m.ok) return;
    // a készítő a munkatér színeit és cím-betűjét kapta: pékség → Meleg szett, Gelasio (tervezet nélkül az alapszett, TERV §4 14.)
    expect(naplo).toHaveLength(1);
    expect(naplo[0]).toMatchObject({ nev: "Cipó Pékség", stilus: "kor", szinek: { fo: "#a4471f", masodik: "#e3a857", hatter: "#fbf3e8" }, betu: "gelasio" });
    const s = await sorok(szervezetId);
    expect(s).toHaveLength(8);
    expect(s.every((x) => x.cel === "logo" && x.eredet === "gep")).toBe(true);
    for (const h of ["vilagos", "sotet", "egyszinu", "negyzetes"]) {
      expect(s.filter((x) => x.logo_valtozat === h).map((x) => x.tipus).sort(), h).toEqual(["png", "svg"]);
      expect(s.find((x) => x.logo_valtozat === h && x.tipus === "png")!.id).toBe(m.logok[h as keyof typeof m.logok]);
    }
    // az elemzés: átlátszó (a kép a sötét háttéren fehérre színezheti az egyszínűt)
    expect(s.find((x) => x.logo_valtozat === "egyszinu" && x.tipus === "png")!.elemzes).toMatchObject({ atlatszo: true, vilagossag: 0 });
    const a = (await profilTar.betolt(szervezetId))!.arculat;
    expect(a.allapot).toBe("jovahagyott");
    expect(a.tervezet?.nevlogo_stilus).toBe("kor");
    const v = a.verziok[String(a.jovahagyott_verzio)]!;
    expect(v.nevlogo_stilus).toBe("kor");
    expect(v.logok).toEqual(m.logok);
    // a képek ugyanezt használják (A5 szabály, fajl-core hasznaltLogok): az SVG sosem, a PNG igen
    expect(hasznaltLogok(await fajlTar.lista(szervezetId, "logo"), null)).toEqual(m.logok);
  });

  it("a gép-írta SVG kiszolgálása: image/svg+xml, szigorú CSP, nosniff; a PNG image/png", async () => {
    const s = await sorok(szervezetId);
    const svg = s.find((x) => x.tipus === "svg")!;
    const g = await fetch(`${PROBA_CIM}/api/arculat/fajl/${svg.id}`, { headers: { cookie: sutik } });
    expect(g.status).toBe(200);
    expect(g.headers.get("content-type")).toBe("image/svg+xml");
    expect(g.headers.get("content-security-policy")).toBe("default-src 'none'; style-src 'unsafe-inline'");
    expect(g.headers.get("x-content-type-options")).toBe("nosniff");
    expect(await g.text()).toContain("<path ");
    const p = await fetch(`${PROBA_CIM}/api/arculat/fajl/${s.find((x) => x.tipus === "png")!.id}`, { headers: { cookie: sutik } });
    expect(p.headers.get("content-type")).toBe("image/png");
    expect(p.headers.get("content-security-policy")).toBeNull();
  });

  it("SVG feltöltése továbbra is 415, és semmi nem kerül a táblába", async () => {
    const elotte = (await sorok(szervezetId)).length;
    const v = await feltolt(sutik, "logo.svg", new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), { "x-fajl-cel": "logo", "x-logo-valtozat": "vilagos" });
    expect(v.statusz).toBe(415);
    expect((await sorok(szervezetId)).length).toBe(elotte);
  });

  it("feltöltött világos logó után az újrakészítés csak a három gépi helyre ír; a feltöltött sor érintetlen és a képen az marad", async () => {
    const f = await feltolt(sutik, "Cipó Pékség – kész logó ő ű.png", PNG, { "x-fajl-cel": "logo", "x-logo-valtozat": "vilagos" });
    expect(f.statusz).toBe(201);
    const sajatId = f.torzs.fajl!.id;
    const elotte = await sorok(szervezetId);
    const sajatSor = elotte.find((x) => x.id === sajatId)!;
    expect(sajatSor).toMatchObject({ eredet: "feltoltes", logo_valtozat: "vilagos" });

    const naplo: NevlogoBemenet[] = [];
    const irt = await regeneral(szervezetId, fiokId, "Cipó Pékség", hamis(naplo));
    expect(irt).toEqual(["sotet", "egyszinu", "negyzetes"]);
    expect(naplo[0]?.stilus).toBe("kor"); // a mentett stílus
    const utana = await sorok(szervezetId);
    expect(utana).toHaveLength(elotte.length + 6); // 3 hely × PNG + SVG — csak beszúrás
    for (const r of elotte) expect(utana.find((x) => x.id === r.id), r.nev).toEqual(r); // semmi nem módosult, semmi nem tűnt el
    const uj = utana.filter((x) => !elotte.some((r) => r.id === x.id));
    expect(uj.every((x) => x.eredet === "gep" && x.logo_valtozat !== "vilagos")).toBe(true);
    const most = hasznaltLogok(await fajlTar.lista(szervezetId, "logo"), null);
    expect(most.vilagos).toBe(sajatId);
    for (const h of ["sotet", "egyszinu", "negyzetes"] as const) expect(uj.find((x) => x.id === most[h])?.tipus, h).toBe("png");
    // a feltöltött fájl a Latin-1-en kívüli névvel (ő ű) is kiszolgálható (javított fejléc)
    const g = await fetch(`${PROBA_CIM}/api/arculat/fajl/${sajatId}`, { headers: { cookie: sutik } });
    expect(g.status).toBe(200);
    expect(g.headers.get("content-disposition")).toContain("filename*=UTF-8''");
  });

  it("a végpont: a néző 403; ismeretlen stílus / ismeretlen mező 400; semmi nem íródik", async () => {
    const elotte = (await sorok(szervezetId)).length;
    const n = await keres<{ hiba: string }>("/api/arculat/nevlogo", { modszer: "POST", torzs: { stilus: "nev" }, sutik: nezoSutik });
    expect(n.statusz).toBe(403);
    for (const torzs of [{ stilus: "kep" }, {}, { stilus: "nev", szinek: { fo: "#000000" } }]) {
      const v = await keres<{ hiba: string }>("/api/arculat/nevlogo", { modszer: "POST", torzs, sutik });
      expect(v.statusz, JSON.stringify(torzs)).toBe(400);
    }
    expect((await keres("/api/arculat/nevlogo/kep", { sutik })).statusz).toBe(404);
    expect((await sorok(szervezetId)).length).toBe(elotte);
  });
});
