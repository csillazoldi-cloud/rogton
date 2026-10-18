import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { keres, veletlenEmail, sql, takaritas, lezar } from "./segedek";
import { OsszefoglaloValasz, HibaValasz, MUNKAMENET_SUTI } from "@rogton/contracts";

describe("osszefoglalo API", () => {
  let sutik: string;
  let szervezetId: string;

  beforeAll(async () => {
    // Fiók létrehozása
    const email = veletlenEmail();
    const jelszo = "ProbaJelszo123!";
    const nev = "Proba Felhasznalo";

    const regisztracio = await keres("/api/fiok/regisztracio", {
      modszer: "POST",
      torzs: { nev, email, jelszo },
    });
    expect(regisztracio.statusz).toBe(201);

    // Belépés
    const belepes = await keres("/api/fiok/belepes", {
      modszer: "POST",
      torzs: { email, jelszo },
    });
    expect(belepes.statusz).toBe(200);
    sutik = belepes.sutik.join("; ");

    // Szervezet létrehozása
    const szervezet = await keres("/api/szervezet", {
      modszer: "POST",
      torzs: { nev: "Proba Szervezet" },
      sutik: sutik,
    });
    expect(szervezet.statusz).toBe(201);

    const szervezetTorzs = szervezet.torzs as { id: string };
    szervezetId = szervezetTorzs.id;
  });

  afterAll(async () => {
    await takaritas();
    await lezar();
  });

  it("leirassal keszit osszefoglalot es rogziti az AI hivast", async () => {
    const leiras = "a".repeat(201);

    const valasz = await keres<unknown>("/api/onboarding/osszefoglalo", {
      modszer: "POST",
      torzs: {
        nev: "Proba",
        forras_tipus: "leiras",
        leiras,
      },
      sutik: sutik,
    });

    expect(valasz.statusz).toBe(200);

    const torzs = OsszefoglaloValasz.parse(valasz.torzs);
    expect(torzs.forras).toBe("teszt");
    expect(torzs.osszefoglalo.length).toBeGreaterThan(0);
    expect(torzs.forras_tipus).toBe("leiras");
    expect(torzs.szolgaltato).toBe("teszt");

    // AI hivas ellenorzese
    const hivasok = await sql<{ allapot: string; szolgaltato: string }>(
      "SELECT allapot, szolgaltato FROM ai_hivas WHERE szervezet_id = $1",
      [szervezetId],
    );
    expect(hivasok).toHaveLength(1);
    expect(hivasok[0]?.allapot).toBe("ok");
    expect(hivasok[0]?.szolgaltato).toBe("teszt");

    // Koltseg ellenorzese
    const honap = await sql<{ hivasok: number }>(
      "SELECT hivasok FROM ai_koltseg_honap WHERE honap = to_char(now(), 'YYYY-MM')",
    );
    expect(honap.length).toBeGreaterThan(0);
    expect(honap[0]?.hivasok).toBeGreaterThanOrEqual(1);
  });

  it("tiltott cimmel hibat ad", async () => {
    const valasz = await keres<unknown>("/api/onboarding/osszefoglalo", {
      modszer: "POST",
      torzs: {
        forras_tipus: "weboldal",
        weboldal: "http://192.168.1.1/",
      },
      sutik: sutik,
    });

    expect(valasz.statusz).toBe(400);

    const torzs = HibaValasz.parse(valasz.torzs);
    expect(torzs.hiba).toBe("ERVENYTELEN_ADAT");
    expect(torzs.mezok).toBeDefined();
    expect(torzs.mezok!.weboldal).toBe("FORRAS_TILTOTT_CIM");
  });

  it("nem letezo tartomannyal hibat ad", async () => {
    const valasz = await keres<unknown>("/api/onboarding/osszefoglalo", {
      modszer: "POST",
      torzs: {
        forras_tipus: "weboldal",
        weboldal: "https://nincs-ilyen-tartomany-km-proba.example/",
      },
      sutik: sutik,
    });

    expect(valasz.statusz).toBe(502);

    const torzs = HibaValasz.parse(valasz.torzs);
    expect(torzs.hiba).toBe("FORRAS_NEM_ELERHETO");
  });

  it("ures forrással hibat ad", async () => {
    const valasz = await keres<unknown>("/api/onboarding/osszefoglalo", {
      modszer: "POST",
      torzs: {},
      sutik: sutik,
    });

    expect(valasz.statusz).toBe(400);

    const torzs = HibaValasz.parse(valasz.torzs);
    expect(torzs.hiba).toBe("ERVENYTELEN_ADAT");
    expect(torzs.mezok).toBeDefined();
    expect(torzs.mezok!.forras).toBe("ures");
  });

  it("suti nelkul hibat ad", async () => {
    const valasz = await keres<unknown>("/api/onboarding/osszefoglalo", {
      modszer: "POST",
      torzs: {
        forras_tipus: "leiras",
        leiras: "a".repeat(201),
      },
    });

    expect(valasz.statusz).toBe(401);

    const torzs = HibaValasz.parse(valasz.torzs);
    expect(torzs.hiba).toBe("NINCS_BELEPVE");
  });
});
