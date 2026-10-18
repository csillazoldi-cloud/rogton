import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { keres, lezar, sql, sutiKinyer, takaritas, veletlenEmail } from "./segedek";

// E-50: a Fiókok lap (rendszergazda). Amit bizonyítunk:
//  – a lekérdezés és MIND A NÉGY művelet csak rendszergazdának megy (jogosultsági mátrix);
//  – a felfüggesztés nem díszlet: a felfüggesztett fiók nem tud belépni,
//    ÉS a felfüggesztés pillanatában élő munkamenete azonnal érvényét veszti;
//  – a visszavonás után újra be tud lépni;
//  – az utolsó rendszergazda nem veheti el a saját jelölését (önkizárás);
//  – a belépés írja az „utolsó belépés" mezőt — a listaoszlop nem üres díszlet.

const jelszo = "ProbaJelszo123!";

type Fiok = { sutik: string; fiokId: string; email: string };

async function fiokot_letrehoz(): Promise<Fiok> {
  const email = veletlenEmail();
  const r = await keres<{ id: string }>("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev: "Proba", email, jelszo } });
  expect(r.statusz).toBe(201);
  const b = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo } });
  expect(b.statusz).toBe(200);
  const sutik = `km_munkamenet=${sutiKinyer(b.sutik, "km_munkamenet")}`;
  // munkatér is kell: az élő munkamenetet a `/api/profil` válaszán mérjük, az pedig szervezetet vár
  const sz = await keres("/api/szervezet", { modszer: "POST", torzs: { nev: `Proba munkater ${email.slice(6, 14)}` }, sutik });
  expect(sz.statusz).toBe(201);
  return { sutik, fiokId: r.torzs.id, email };
}

async function belepesiSuti(email: string): Promise<{ statusz: number; sutik: string }> {
  const b = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo } });
  return { statusz: b.statusz, sutik: b.statusz === 200 ? `km_munkamenet=${sutiKinyer(b.sutik, "km_munkamenet")}` : "" };
}

const MUVELETEK = ["felfuggeszt", "visszavon", "jelolest_ad", "jelolest_elvesz"] as const;

describe("Fiokok lap — jog es felfuggesztes (E-50)", () => {
  let gazda: Fiok;
  let tag: Fiok;

  beforeAll(async () => {
    gazda = await fiokot_letrehoz();
    tag = await fiokot_letrehoz();
    // a rendszergazda-jelölés az adatbázisban él (E-13) — a próbához közvetlenül adjuk meg
    await sql("UPDATE fiok SET rendszergazda = true WHERE id = $1", [gazda.fiokId]);
  });

  afterAll(async () => {
    await takaritas();
    await lezar();
  });

  it("belepes nelkul 401, nem rendszergazdakent 403 — a lekerdezesen es mind a negy muveleten", async () => {
    const nyitott = await keres("/api/fiokok");
    expect(nyitott.statusz).toBe(401);
    const idegen = await keres("/api/fiokok", { sutik: tag.sutik });
    expect(idegen.statusz).toBe(403);

    for (const muvelet of MUVELETEK) {
      const nincsBelepve = await keres("/api/fiokok", { modszer: "POST", torzs: { fiok_id: gazda.fiokId, muvelet } });
      expect(nincsBelepve.statusz, `${muvelet} belepes nelkul`).toBe(401);
      const nincsJog = await keres("/api/fiokok", { modszer: "POST", torzs: { fiok_id: gazda.fiokId, muvelet }, sutik: tag.sutik });
      expect(nincsJog.statusz, `${muvelet} nem rendszergazdakent`).toBe(403);
    }
  });

  it("a rendszergazda latja a listat, benne a sajat fiokjaval", async () => {
    const v = await keres<{ fiokok: { fiokok: { id: string; email: string; eredet: string }[]; munkaterek: unknown[]; sajat_fiok_id: string } }>(
      "/api/fiokok",
      { sutik: gazda.sutik },
    );
    expect(v.statusz).toBe(200);
    expect(v.torzs.fiokok.sajat_fiok_id).toBe(gazda.fiokId);
    const sajat = v.torzs.fiokok.fiokok.find((f) => f.id === gazda.fiokId);
    expect(sajat).toBeTruthy();
    // a próba-fiókok címe `…@proba.example`, tehát a migráció szabálya szerint gépi teszt
    expect(sajat?.eredet).toBe("gepi_teszt");
  });

  it("a belepes irja az utolso belepes mezot", async () => {
    const sorok = await sql<{ utolso_belepes: string | null }>("SELECT utolso_belepes FROM fiok WHERE id = $1", [tag.fiokId]);
    expect(sorok[0]?.utolso_belepes).not.toBeNull();
  });

  it("felfuggesztes utan nem lep be, es az ELO munkamenete is meghal", async () => {
    // van élő munkamenete: a saját profilját eléri
    const elotte = await keres("/api/profil", { sutik: tag.sutik });
    expect(elotte.statusz).toBe(200);

    const f = await keres("/api/fiokok", { modszer: "POST", torzs: { fiok_id: tag.fiokId, muvelet: "felfuggeszt" }, sutik: gazda.sutik });
    expect(f.statusz).toBe(200);

    // 1. a régi süti nem ér semmit
    const utana = await keres("/api/profil", { sutik: tag.sutik });
    expect(utana.statusz).toBe(401);

    // 2. új belépés sem megy, és megmondjuk, miért
    const ujra = await keres<{ hiba: string }>("/api/fiok/belepes", { modszer: "POST", torzs: { email: tag.email, jelszo } });
    expect(ujra.statusz).not.toBe(200);
    expect(ujra.torzs.hiba).toBe("FIOK_FELFUGGESZTVE");

    // 3. az adatbázisban tényleg nincs munkamenet-sora
    const sorok = await sql<{ db: string }>("SELECT count(*)::text AS db FROM munkamenet WHERE fiok_id = $1", [tag.fiokId]);
    expect(sorok[0]?.db).toBe("0");
  });

  it("visszavonas utan ujra be tud lepni", async () => {
    const v = await keres("/api/fiokok", { modszer: "POST", torzs: { fiok_id: tag.fiokId, muvelet: "visszavon" }, sutik: gazda.sutik });
    expect(v.statusz).toBe(200);
    const b = await belepesiSuti(tag.email);
    expect(b.statusz).toBe(200);
    tag.sutik = b.sutik;
  });

  it("jeloles adasa es elvetele mukodik, de az UTOLSO rendszergazda nem veheti el a sajatjat", async () => {
    // adjuk meg a tagnak, majd vegyük el — így két rendszergazda van, az elvétel szabályos
    const ad = await keres("/api/fiokok", { modszer: "POST", torzs: { fiok_id: tag.fiokId, muvelet: "jelolest_ad" }, sutik: gazda.sutik });
    expect(ad.statusz).toBe(200);
    const el = await keres("/api/fiokok", { modszer: "POST", torzs: { fiok_id: tag.fiokId, muvelet: "jelolest_elvesz" }, sutik: gazda.sutik });
    expect(el.statusz).toBe(200);

    // Az ÖNKIZÁRÁS zárja: a próba-adatbázisban lehet több rendszergazda is (más próbák hagyhatnak),
    // ezért a feltételt magunk állítjuk elő: a gazdánkon kívül mindenki mást levéve nézzük meg.
    const masok = await sql<{ id: string }>("SELECT id FROM fiok WHERE rendszergazda = true AND id <> $1", [gazda.fiokId]);
    await sql("UPDATE fiok SET rendszergazda = false WHERE rendszergazda = true AND id <> $1", [gazda.fiokId]);
    const onkizaras = await keres<{ hiba: string }>(
      "/api/fiokok",
      { modszer: "POST", torzs: { fiok_id: gazda.fiokId, muvelet: "jelolest_elvesz" }, sutik: gazda.sutik },
    );
    expect(onkizaras.statusz).toBe(409);
    expect(onkizaras.torzs.hiba).toBe("ONKIZARAS");
    // a jelölés tényleg megmaradt
    const meg = await sql<{ rendszergazda: boolean }>("SELECT rendszergazda FROM fiok WHERE id = $1", [gazda.fiokId]);
    expect(meg[0]?.rendszergazda).toBe(true);
    for (const m of masok) await sql("UPDATE fiok SET rendszergazda = true WHERE id = $1", [m.id]);
  });

  it("a rendszergazda a SAJAT fiokjat nem fuggesztheti fel", async () => {
    const v = await keres<{ hiba: string }>(
      "/api/fiokok",
      { modszer: "POST", torzs: { fiok_id: gazda.fiokId, muvelet: "felfuggeszt" }, sutik: gazda.sutik },
    );
    expect(v.statusz).toBe(409);
    expect(v.torzs.hiba).toBe("ONKIZARAS");
    // és tényleg nem lett felfüggesztve: be tud lépni
    const b = await belepesiSuti(gazda.email);
    expect(b.statusz).toBe(200);
  });

  it("nem letezo fiokra 404, ervenytelen muveletre 400", async () => {
    const nincs = await keres<{ hiba: string }>(
      "/api/fiokok",
      { modszer: "POST", torzs: { fiok_id: "00000000-0000-4000-8000-000000000000", muvelet: "felfuggeszt" }, sutik: gazda.sutik },
    );
    expect(nincs.statusz).toBe(404);
    expect(nincs.torzs.hiba).toBe("NINCS_ILYEN_FIOK");

    const rossz = await keres("/api/fiokok", { modszer: "POST", torzs: { fiok_id: gazda.fiokId, muvelet: "torol" }, sutik: gazda.sutik });
    expect(rossz.statusz).toBe(400);
  });
});
