import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { keres, veletlenEmail, takaritas, lezar } from "./segedek";

const jelszo = "ProbaJelszo123!";
const NEM_LETEZO_ID = "00000000-0000-4000-8000-000000000000";

describe("F-8.1 k — forrás címének módosítása és eltávolítása (élő)", () => {
  let aSutik: string;
  let aSzervezetId: string;
  let forrasId: string;

  let nezoSutik: string;

  async function fiokLetrehozas(): Promise<{ sutik: string; fiokId: string; szervezetId: string; email: string }> {
    const email = veletlenEmail();
    const nev = "Proba Felhasznalo";

    const regisztracio = await keres("/api/fiok/regisztracio", {
      modszer: "POST",
      torzs: { nev, email, jelszo },
    });
    expect(regisztracio.statusz).toBe(201);

    const belepes = await keres("/api/fiok/belepes", {
      modszer: "POST",
      torzs: { email, jelszo },
    });
    expect(belepes.statusz).toBe(200);
    const sutik = belepes.sutik.join("; ");

    const fiokEn = await keres<{ id: string }>("/api/fiok/en", { sutik });
    expect(fiokEn.statusz).toBe(200);
    const fiokId = fiokEn.torzs.id;

    const szervezet = await keres<{ id: string }>("/api/szervezet", {
      modszer: "POST",
      torzs: { nev: "Proba Szervezet" },
      sutik,
    });
    expect(szervezet.statusz).toBe(201);
    const szervezetId = szervezet.torzs.id;

    return { sutik, fiokId, szervezetId, email };
  }

  beforeAll(async () => {
    const a = await fiokLetrehozas();
    aSutik = a.sutik;
    aSzervezetId = a.szervezetId;

    // Forras hozzaadasa (facebook -> nem_tamogatott, nem kell halozat)
    const forras = await keres<{ hirfigyelo: { forras: { id: string } } }>("/api/hirfigyelo/forrasok", {
      modszer: "POST",
      torzs: { cim: "https://facebook.com/proba" },
      sutik: aSutik,
    });
    expect(forras.statusz).toBe(200);
    forrasId = forras.torzs.hirfigyelo.forras.id;

    // Nezo fiok letrehozasa es meghivasa
    const nezoEmail = veletlenEmail();
    const nezoReg = await keres("/api/fiok/regisztracio", {
      modszer: "POST",
      torzs: { nev: "Proba Nezo", email: nezoEmail, jelszo },
    });
    expect(nezoReg.statusz).toBe(201);
    const nezoBelepes = await keres("/api/fiok/belepes", {
      modszer: "POST",
      torzs: { email: nezoEmail, jelszo },
    });
    expect(nezoBelepes.statusz).toBe(200);
    nezoSutik = nezoBelepes.sutik.join("; ");

    const meghivo = await keres<{ hozzaferes: { jegy: string } }>("/api/tagok/meghivo", {
      modszer: "POST",
      torzs: { szerep: "nezo" },
      sutik: aSutik,
    });
    expect(meghivo.statusz).toBe(201);
    const jegy = meghivo.torzs.hozzaferes.jegy;

    const elfogad = await keres("/api/meghivo/elfogad", {
      modszer: "POST",
      torzs: { jegy },
      sutik: nezoSutik,
    });
    expect(elfogad.statusz).toBe(200);
  });

  afterAll(async () => {
    await takaritas();
    await lezar();
  });

  it("1. PUT új érvényes címmel → 200, id változatlan, ellenorzott false, allapot ellenorzes_alatt", async () => {
    const valasz = await keres<{
      hirfigyelo: { forras: { id: string; cim: string; ellenorzott: boolean; allapot: string } };
    }>(`/api/hirfigyelo/forrasok/${forrasId}`, {
      modszer: "PUT",
      torzs: { cim: "https://www.zi-de-zi.ro/feed/" },
      sutik: aSutik,
    });
    expect(valasz.statusz).toBe(200);
    const forras = valasz.torzs.hirfigyelo.forras;
    expect(forras.id).toBe(forrasId);
    expect(forras.cim).toBe("https://www.zi-de-zi.ro/feed/");
    expect(forras.ellenorzott).toBe(false);
    expect(forras.allapot).toBe("ellenorzes_alatt");
  }, 20000);

  it("2. PUT érvénytelen címmel → 400, a forrás címe a régi marad", async () => {
    const valasz = await keres(`/api/hirfigyelo/forrasok/${forrasId}`, {
      modszer: "PUT",
      torzs: { cim: "nem cím" },
      sutik: aSutik,
    });
    expect(valasz.statusz).toBe(400);
    expect((valasz.torzs as { hiba?: string }).hiba).toBe("ERVENYTELEN_ADAT");

    const lista = await keres<{ hirfigyelo: { forrasok: Array<{ id: string; cim: string }> } }>(
      "/api/hirfigyelo/forrasok",
      { sutik: aSutik }
    );
    expect(lista.statusz).toBe(200);
    const meg = lista.torzs.hirfigyelo.forrasok.find((f) => f.id === forrasId);
    expect(meg).toBeDefined();
    expect(meg!.cim).toBe("https://www.zi-de-zi.ro/feed/");
  }, 20000);

  it("3. PUT ismeretlen id-vel → 400 (ERVENYTELEN_ADAT)", async () => {
    const valasz = await keres(`/api/hirfigyelo/forrasok/${NEM_LETEZO_ID}`, {
      modszer: "PUT",
      torzs: { cim: "https://pelda.example/feed" },
      sutik: aSutik,
    });
    expect(valasz.statusz).toBe(400);
    expect((valasz.torzs as { hiba?: string }).hiba).toBe("ERVENYTELEN_ADAT");
  }, 20000);

  it("4. DELETE → 200, a GET listában nincs többé", async () => {
    const valasz = await keres(`/api/hirfigyelo/forrasok/${forrasId}`, {
      modszer: "DELETE",
      sutik: aSutik,
    });
    expect(valasz.statusz).toBe(200);

    const lista = await keres<{ hirfigyelo: { forrasok: Array<{ id: string }> } }>(
      "/api/hirfigyelo/forrasok",
      { sutik: aSutik }
    );
    expect(lista.statusz).toBe(200);
    const meg = lista.torzs.hirfigyelo.forrasok.find((f) => f.id === forrasId);
    expect(meg).toBeUndefined();
  }, 20000);

  it("5. DELETE ugyanarra még egyszer → 400", async () => {
    const valasz = await keres(`/api/hirfigyelo/forrasok/${forrasId}`, {
      modszer: "DELETE",
      sutik: aSutik,
    });
    expect(valasz.statusz).toBe(400);
    expect((valasz.torzs as { hiba?: string }).hiba).toBe("ERVENYTELEN_ADAT");
  }, 20000);

  it("6. néző fiók PUT-ja → 403, DELETE-je → 403", async () => {
    const put = await keres(`/api/hirfigyelo/forrasok/${NEM_LETEZO_ID}`, {
      modszer: "PUT",
      torzs: { cim: "https://pelda.example/feed" },
      sutik: nezoSutik,
    });
    expect(put.statusz).toBe(403);
    expect((put.torzs as { hiba?: string }).hiba).toBe("NINCS_JOG");

    const del = await keres(`/api/hirfigyelo/forrasok/${NEM_LETEZO_ID}`, {
      modszer: "DELETE",
      sutik: nezoSutik,
    });
    expect(del.statusz).toBe(403);
    expect((del.torzs as { hiba?: string }).hiba).toBe("NINCS_JOG");
  }, 20000);
});
