import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { keres, veletlenEmail, takaritas, lezar, PROBA_CIM } from "./segedek";

type TemaValasz = {
  tema: {
    alap: Record<string, string>;
    hatasos: Record<string, string>;
    tervezet: { felulirasok: Record<string, string> } | null;
  };
};

type HibaValasz = {
  hiba: string;
  tema_hibak: Array<{ token: string; kod: string }>;
};

describe("terkoz-skala a Theme API-n (F-1)", () => {
  let sutik: string;
  let alapKeszlet: Record<string, string>;
  const jelszo = "ProbaJelszo123!";

  beforeAll(async () => {
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
    sutik = belepes.sutik.join("; ");

    const szervezet = await keres("/api/szervezet", {
      modszer: "POST",
      torzs: { nev: "Proba Szervezet" },
      sutik,
    });
    expect(szervezet.statusz).toBe(201);

    const temaValasz = await keres<TemaValasz>("/api/tema", { sutik });
    expect(temaValasz.statusz).toBe(200);
    alapKeszlet = temaValasz.torzs.tema.alap;
  });

  afterAll(async () => {
    await takaritas();
    await lezar();
  });

  it("1. GET /api/tema: alap és hatasos tartalmazza a --ter-0..14 tokeneket, nem tartalmazza a régi kulcsokat", async () => {
    const valasz = await keres<TemaValasz>("/api/tema", { sutik });
    expect(valasz.statusz).toBe(200);

    const { alap, hatasos } = valasz.torzs.tema;

    for (let i = 0; i <= 14; i++) {
      const kulcs = `--ter-${i}`;
      expect(alap[kulcs]).toBeDefined();
      expect(hatasos[kulcs]).toBeDefined();
    }

    expect(alap["--ter-0"]).toBe("0px");
    expect(alap["--ter-4"]).toBe("8px");
    expect(alap["--ter-14"]).toBe("80px");

    expect(alap["--pad-card"]).toBeUndefined();
    expect(alap["--gap"]).toBeUndefined();
    expect(alap["--btn-pad-x"]).toBeUndefined();

    expect(hatasos["--pad-card"]).toBeUndefined();
    expect(hatasos["--gap"]).toBeUndefined();
    expect(hatasos["--btn-pad-x"]).toBeUndefined();
  });

  it("2. PUT nem-monoton terkoz (--ter-3: 14px, --ter-4: 8px) → 400, notMonotonic hiba, tervezet nem változott", async () => {
    const tokens = { ...alapKeszlet, "--ter-3": "14px", "--ter-4": "8px" };
    const valasz = await keres<HibaValasz>("/api/tema", {
      modszer: "PUT",
      sutik,
      torzs: { $schema: "km-theme/2", tokens },
    });
    expect(valasz.statusz).toBe(400);
    expect(valasz.torzs.hiba).toBe("ERVENYTELEN_ADAT");

    const hiba = valasz.torzs.tema_hibak.find((h) => h.token === "--ter-4");
    expect(hiba).toBeDefined();
    expect(hiba?.kod).toBe("notMonotonic");

    const getValasz = await keres<TemaValasz>("/api/tema", { sutik });
    expect(getValasz.statusz).toBe(200);
    expect(getValasz.torzs.tema.tervezet).toBeNull();
  });

  it("3. PUT --ter-0: 4px → 400, hiba a --ter-0 tokenre", async () => {
    const tokens = { ...alapKeszlet, "--ter-0": "4px" };
    const valasz = await keres<HibaValasz>("/api/tema", {
      modszer: "PUT",
      sutik,
      torzs: { $schema: "km-theme/2", tokens },
    });
    expect(valasz.statusz).toBe(400);
    expect(valasz.torzs.hiba).toBe("ERVENYTELEN_ADAT");

    const hiba = valasz.torzs.tema_hibak.find((h) => h.token === "--ter-0");
    expect(hiba).toBeDefined();
  });

  it("4. PUT --ter-5: 30px (tartományon kívül) → 400, outOfRange hiba", async () => {
    const tokens = { ...alapKeszlet, "--ter-5": "30px" };
    const valasz = await keres<HibaValasz>("/api/tema", {
      modszer: "PUT",
      sutik,
      torzs: { $schema: "km-theme/2", tokens },
    });
    expect(valasz.statusz).toBe(400);
    expect(valasz.torzs.hiba).toBe("ERVENYTELEN_ADAT");

    const hiba = valasz.torzs.tema_hibak.find((h) => h.token === "--ter-5");
    expect(hiba).toBeDefined();
    expect(hiba?.kod).toBe("outOfRange");
  });

  it("5. PUT egyenlő szomszédok (--ter-3: 8px, --ter-4: 8px) → 200, felülírások csak az eltérő tokenek", async () => {
    const tokens = { ...alapKeszlet, "--ter-3": "8px", "--ter-4": "8px" };
    const valasz = await keres<TemaValasz>("/api/tema", {
      modszer: "PUT",
      sutik,
      torzs: { $schema: "km-theme/2", tokens },
    });
    expect(valasz.statusz).toBe(200);

    const tervezet = valasz.torzs.tema.tervezet;
    expect(tervezet).not.toBeNull();
    expect(tervezet!.felulirasok["--ter-3"]).toBe("8px");
    // a --ter-4 8px-e az alapérték, tehát NEM felülírás — csak az eltérő token kerül a felülírások közé
    expect(tervezet!.felulirasok["--ter-4"]).toBeUndefined();
    expect(Object.keys(tervezet!.felulirasok)).toHaveLength(1);
  });

  it("6. PUT régi --pad-card kulcs a készletben → 200, a kulcs nem kerül a felülírások közé", async () => {
    const tokens = { ...alapKeszlet, "--pad-card": "12px" };
    const valasz = await keres<TemaValasz>("/api/tema", {
      modszer: "PUT",
      sutik,
      torzs: { $schema: "km-theme/2", tokens },
    });
    expect(valasz.statusz).toBe(200);

    const tervezet = valasz.torzs.tema.tervezet;
    expect(tervezet).not.toBeNull();
    expect(tervezet!.felulirasok["--pad-card"]).toBeUndefined();
    // Mivel csak a --pad-card volt eltérő (és az figyelmen kívül hagyott), a felülírások üresek
    expect(Object.keys(tervezet!.felulirasok)).toHaveLength(0);
  });

  it("7. Vendég (süti nélkül) PUT /api/tema → 401", async () => {
    const valasz = await keres<unknown>("/api/tema", {
      modszer: "PUT",
      torzs: { $schema: "km-theme/2", tokens: { "--ter-4": "9px" } },
    });
    expect(valasz.statusz).toBe(401);
  });

  it("8. Alkalmazás után GET /api/tema hatasos[\"--ter-4\"] = 9px, és a /fiok HTML-je tartalmazza a --ter-4:9px szöveget", async () => {
    // Tervezet létrehozása
    const tokens = { ...alapKeszlet, "--ter-4": "9px" };
    const putValasz = await keres<TemaValasz>("/api/tema", {
      modszer: "PUT",
      sutik,
      torzs: { $schema: "km-theme/2", tokens },
    });
    expect(putValasz.statusz).toBe(200);

    // Alkalmazás
    const alkValasz = await keres<TemaValasz>("/api/tema/alkalmaz", {
      modszer: "POST",
      sutik,
    });
    expect(alkValasz.statusz).toBe(200);

    // GET ellenőrzés
    const getValasz = await keres<TemaValasz>("/api/tema", { sutik });
    expect(getValasz.statusz).toBe(200);
    expect(getValasz.torzs.tema.hatasos["--ter-4"]).toBe("9px");

    // HTML ellenőrzés közvetlen fetch-sel
    const htmlValasz = await fetch(`${PROBA_CIM}/fiok`, {
      headers: { cookie: sutik },
    });
    expect(htmlValasz.status).toBe(200);
    const html = await htmlValasz.text();
    expect(html).toContain("--ter-4:9px");
  });
});
