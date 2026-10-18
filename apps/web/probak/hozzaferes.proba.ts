import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { keres, veletlenEmail, takaritas, lezar } from "./segedek";

describe("tagsag es meghivo a webalkalmazasban (F-3)", () => {
  const jelszo = "ProbaJelszo123!";

  let aSutik: string;
  let aFiokId: string;
  let aSzervezetId: string;

  let bSutik: string;
  let bFiokId: string;

  let cSutik: string;
  let cFiokId: string;

  let dSutik: string;
  let dFiokId: string;

  let jegySzerkeszto: string;
  let jegyNezo: string;
  let meghivoId: string;

  async function fiokLetrehozas(szervezet: boolean): Promise<{ sutik: string; fiokId: string; szervezetId?: string }> {
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

    const fiokEn = await keres<unknown>("/api/fiok/en", { sutik });
    expect(fiokEn.statusz).toBe(200);
    const fiokTorzs = fiokEn.torzs as { id: string };
    const fiokId = fiokTorzs.id;

    let szervezetId = ""; // üres, ha nem hozunk létre szervezetet
    if (szervezet) {
      const szervezet = await keres("/api/szervezet", {
        modszer: "POST",
        torzs: { nev: "Proba Szervezet" },
        sutik,
      });
      expect(szervezet.statusz).toBe(201);
      const szervezetTorzs = szervezet.torzs as { id: string };
      szervezetId = szervezetTorzs.id;
    }

    return { sutik, fiokId, szervezetId };
  }

  beforeAll(async () => {
    const a = await fiokLetrehozas(true);
    aSutik = a.sutik;
    aFiokId = a.fiokId;
    aSzervezetId = a.szervezetId!;

    const b = await fiokLetrehozas(false);
    bSutik = b.sutik;
    bFiokId = b.fiokId;

    const c = await fiokLetrehozas(false);
    cSutik = c.sutik;
    cFiokId = c.fiokId;

    const d = await fiokLetrehozas(false);
    dSutik = d.sutik;
    dFiokId = d.fiokId;
  });

  afterAll(async () => {
    await takaritas();
    await lezar();
  });

  it("1. A GET /api/tagok → 1 tag, A tulajdonos", async () => {
    const valasz = await keres<unknown>("/api/tagok", { sutik: aSutik });
    expect(valasz.statusz).toBe(200);
    const torzs = valasz.torzs as { hozzaferes: Array<{ fiok_id: string; szerep: string; csatlakozott: boolean }> };
    expect(torzs.hozzaferes).toHaveLength(1);
    expect(torzs.hozzaferes[0]?.fiok_id).toBe(aFiokId);
    expect(torzs.hozzaferes[0]?.szerep).toBe("tulajdonos");
  });

  it("2. A meghív szerkesztőt → 201, jegy ≥ 32, allapot kiadott; GET lista 1 elem", async () => {
    const meghivo = await keres<unknown>("/api/tagok/meghivo", {
      modszer: "POST",
      sutik: aSutik,
      torzs: { szerep: "szerkeszto" },
    });
    expect(meghivo.statusz).toBe(201);
    const meghivoTorzs = meghivo.torzs as {
      hozzaferes: {
        meghivo: { id: string; szerep: string; allapot: string; lejar: string };
        jegy: string;
        link: string;
      };
    };
    expect(meghivoTorzs.hozzaferes.meghivo.allapot).toBe("kiadott");
    expect(meghivoTorzs.hozzaferes.jegy.length).toBeGreaterThanOrEqual(32);
    jegySzerkeszto = meghivoTorzs.hozzaferes.jegy;
    meghivoId = meghivoTorzs.hozzaferes.meghivo.id;

    const lista = await keres<unknown>("/api/tagok/meghivo", { sutik: aSutik });
    expect(lista.statusz).toBe(200);
    const listaTorzs = lista.torzs as { hozzaferes: Array<{ allapot_most: string }> };
    expect(listaTorzs.hozzaferes).toHaveLength(1);
    expect(listaTorzs.hozzaferes[0]?.allapot_most).toBe("kiadott");
  });

  it("3. B beváltja → 200, szerep szerkeszto; A GET /api/tagok → 2 tag", async () => {
    const elfogad = await keres<unknown>("/api/meghivo/elfogad", {
      modszer: "POST",
      sutik: bSutik,
      torzs: { jegy: jegySzerkeszto },
    });
    expect(elfogad.statusz).toBe(200);
    const elfogadTorzs = elfogad.torzs as { hozzaferes: { szervezet_id: string; szerep: string } };
    expect(elfogadTorzs.hozzaferes.szerep).toBe("szerkeszto");
    expect(elfogadTorzs.hozzaferes.szervezet_id).toBe(aSzervezetId);

    const tagok = await keres<unknown>("/api/tagok", { sutik: aSutik });
    expect(tagok.statusz).toBe(200);
    const tagokTorzs = tagok.torzs as { hozzaferes: Array<{ fiok_id: string }> };
    expect(tagokTorzs.hozzaferes).toHaveLength(2);
  });

  it("4. B (szerkeszto) meghív tulajdonost → 403 NAGYOBB_SZEREP; nézőt → 201", async () => {
    const tulajdonosMeghivo = await keres<unknown>("/api/tagok/meghivo", {
      modszer: "POST",
      sutik: bSutik,
      torzs: { szerep: "tulajdonos" },
    });
    expect(tulajdonosMeghivo.statusz).toBe(403);
    const tulajdonosHiba = tulajdonosMeghivo.torzs as { hiba: string };
    expect(tulajdonosHiba.hiba).toBe("NAGYOBB_SZEREP");

    const nezoMeghivo = await keres<unknown>("/api/tagok/meghivo", {
      modszer: "POST",
      sutik: bSutik,
      torzs: { szerep: "nezo" },
    });
    expect(nezoMeghivo.statusz).toBe(201);
    const nezoTorzs = nezoMeghivo.torzs as {
      hozzaferes: {
        meghivo: { id: string; szerep: string; allapot: string; lejar: string };
        jegy: string;
        link: string;
      };
    };
    expect(nezoTorzs.hozzaferes.meghivo.allapot).toBe("kiadott");
    jegyNezo = nezoTorzs.hozzaferes.jegy;
  });

  it("5. C beváltja B nézői meghívóját → 200; C GET /api/tagok → 3 tag; C (néző) POST meghivo → 403 NINCS_JOG", async () => {
    const elfogad = await keres<unknown>("/api/meghivo/elfogad", {
      modszer: "POST",
      sutik: cSutik,
      torzs: { jegy: jegyNezo },
    });
    expect(elfogad.statusz).toBe(200);
    const elfogadTorzs = elfogad.torzs as { hozzaferes: { szervezet_id: string; szerep: string } };
    expect(elfogadTorzs.hozzaferes.szerep).toBe("nezo");

    const tagok = await keres<unknown>("/api/tagok", { sutik: cSutik });
    expect(tagok.statusz).toBe(200);
    const tagokTorzs = tagok.torzs as { hozzaferes: Array<{ fiok_id: string }> };
    expect(tagokTorzs.hozzaferes).toHaveLength(3);

    const cMeghivo = await keres<unknown>("/api/tagok/meghivo", {
      modszer: "POST",
      sutik: cSutik,
      torzs: { szerep: "nezo" },
    });
    expect(cMeghivo.statusz).toBe(403);
    const cHiba = cMeghivo.torzs as { hiba: string };
    expect(cHiba.hiba).toBe("NINCS_JOG");
  });

  it("6. B (már tag) bevált egy FRISS jegyet → 409 MAR_TAG; ismeretlen jegy → 404", async () => {
    // a B nézői jegyét az 5. esetben C már beváltotta — arra 410 MEGHIVO_FELHASZNALVA járna; a MAR_TAG-hoz friss jegy kell
    const friss = await keres<unknown>("/api/tagok/meghivo", { modszer: "POST", sutik: aSutik, torzs: { szerep: "nezo" } });
    expect(friss.statusz).toBe(201);
    const frissJegy = (friss.torzs as { hozzaferes: { jegy: string } }).hozzaferes.jegy;
    const marTag = await keres<unknown>("/api/meghivo/elfogad", {
      modszer: "POST",
      sutik: bSutik,
      torzs: { jegy: frissJegy },
    });
    expect(marTag.statusz).toBe(409);
    const marTagHiba = marTag.torzs as { hiba: string };
    expect(marTagHiba.hiba).toBe("MAR_TAG");

    const ismeretlen = await keres<unknown>("/api/meghivo/elfogad", {
      modszer: "POST",
      sutik: bSutik,
      torzs: { jegy: "ismeretlen-jegy-123456789012345678901234567890" },
    });
    expect(ismeretlen.statusz).toBe(404);
    const ismeretlenHiba = ismeretlen.torzs as { hiba: string };
    expect(ismeretlenHiba.hiba).toBe("NINCS_ILYEN_MEGHIVO");
  });

  it("7. A átállítja B-t nézőre → 200; B PUT C-re → 403 NINCS_JOG; A PUT saját fiókra → 409 MAGAT_NEM", async () => {
    const atallit = await keres<unknown>(`/api/tagok/${bFiokId}`, {
      modszer: "PUT",
      sutik: aSutik,
      torzs: { szerep: "nezo" },
    });
    expect(atallit.statusz).toBe(200);

    const bPut = await keres<unknown>(`/api/tagok/${cFiokId}`, {
      modszer: "PUT",
      sutik: bSutik,
      torzs: { szerep: "nezo" },
    });
    expect(bPut.statusz).toBe(403);
    const bPutHiba = bPut.torzs as { hiba: string };
    expect(bPutHiba.hiba).toBe("NINCS_JOG");

    const aPutSajat = await keres<unknown>(`/api/tagok/${aFiokId}`, {
      modszer: "PUT",
      sutik: aSutik,
      torzs: { szerep: "nezo" },
    });
    expect(aPutSajat.statusz).toBe(409);
    const aPutHiba = aPutSajat.torzs as { hiba: string };
    expect(aPutHiba.hiba).toBe("MAGAT_NEM");
  });

  it("8. A meghív még egyet, DELETE → 200; D beváltja → 410 MEGHIVO_VISSZAVONVA", async () => {
    const ujMeghivo = await keres<unknown>("/api/tagok/meghivo", {
      modszer: "POST",
      sutik: aSutik,
      torzs: { szerep: "nezo" },
    });
    expect(ujMeghivo.statusz).toBe(201);
    const ujTorzs = ujMeghivo.torzs as {
      hozzaferes: {
        meghivo: { id: string; szerep: string; allapot: string; lejar: string };
        jegy: string;
        link: string;
      };
    };
    const ujJegy = ujTorzs.hozzaferes.jegy;
    const ujId = ujTorzs.hozzaferes.meghivo.id;

    const torles = await keres<unknown>(`/api/tagok/meghivo/${ujId}`, {
      modszer: "DELETE",
      sutik: aSutik,
    });
    expect(torles.statusz).toBe(200);

    const dElfogad = await keres<unknown>("/api/meghivo/elfogad", {
      modszer: "POST",
      sutik: dSutik,
      torzs: { jegy: ujJegy },
    });
    expect(dElfogad.statusz).toBe(410);
    const dHiba = dElfogad.torzs as { hiba: string };
    expect(dHiba.hiba).toBe("MEGHIVO_VISSZAVONVA");
  });

  it("9. A POST /api/tagok/kilep → 409 UTOLSO_TULAJDONOS; C kilép → 200; A GET /api/tagok → 2 tag", async () => {
    const aKilep = await keres<unknown>("/api/tagok/kilep", {
      modszer: "POST",
      sutik: aSutik,
    });
    expect(aKilep.statusz).toBe(409);
    const aKilepHiba = aKilep.torzs as { hiba: string };
    expect(aKilepHiba.hiba).toBe("UTOLSO_TULAJDONOS");

    const cKilep = await keres<unknown>("/api/tagok/kilep", {
      modszer: "POST",
      sutik: cSutik,
    });
    expect(cKilep.statusz).toBe(200);

    const tagok = await keres<unknown>("/api/tagok", { sutik: aSutik });
    expect(tagok.statusz).toBe(200);
    const tagokTorzs = tagok.torzs as { hozzaferes: Array<{ fiok_id: string }> };
    expect(tagokTorzs.hozzaferes).toHaveLength(2);
  });

  it("10. A eltávolítja B-t → 200; GET /api/tagok → 1 tag; A DELETE saját fiókra → 409 MAGAT_NEM", async () => {
    const torles = await keres<unknown>(`/api/tagok/${bFiokId}`, {
      modszer: "DELETE",
      sutik: aSutik,
    });
    expect(torles.statusz).toBe(200);

    const tagok = await keres<unknown>("/api/tagok", { sutik: aSutik });
    expect(tagok.statusz).toBe(200);
    const tagokTorzs = tagok.torzs as { hozzaferes: Array<{ fiok_id: string }> };
    expect(tagokTorzs.hozzaferes).toHaveLength(1);

    const aTorlesSajat = await keres<unknown>(`/api/tagok/${aFiokId}`, {
      modszer: "DELETE",
      sutik: aSutik,
    });
    expect(aTorlesSajat.statusz).toBe(409);
    const aTorlesHiba = aTorlesSajat.torzs as { hiba: string };
    expect(aTorlesHiba.hiba).toBe("MAGAT_NEM");
  });

  it("11. Süti nélkül POST /api/tagok/meghivo → 401", async () => {
    const valasz = await keres<unknown>("/api/tagok/meghivo", {
      modszer: "POST",
      torzs: { szerep: "nezo" },
    });
    expect(valasz.statusz).toBe(401);
  });
});
