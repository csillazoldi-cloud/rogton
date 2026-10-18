import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { keres, veletlenEmail, sql, takaritas, lezar } from "./segedek";
import {
  HibaValasz,
  JavaslatokValasz,
  HangnemFinomitasValasz,
  PiszkozatValasz,
  MUNKAMENET_SUTI,
} from "@rogton/contracts";

describe("javaslatok API (2. lepes)", () => {
  let sutik: string;
  let szervezetNelkuliSutik: string;
  let szervezetId: string;

  beforeAll(async () => {
    // Fiók létrehozása szervezettel
    const email = veletlenEmail();
    const jelszo = "ProbaJelszo123!";
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
      sutik: sutik,
    });
    expect(szervezet.statusz).toBe(201);

    const szervezetTorzs = szervezet.torzs as { id: string };
    szervezetId = szervezetTorzs.id;

    // Fiók létrehozása szervezet nélkül
    const emailNelkul = veletlenEmail();
    const regNelkul = await keres("/api/fiok/regisztracio", {
      modszer: "POST",
      torzs: { nev: "Proba Nelkuli", email: emailNelkul, jelszo },
    });
    expect(regNelkul.statusz).toBe(201);

    const belepNelkul = await keres("/api/fiok/belepes", {
      modszer: "POST",
      torzs: { email: emailNelkul, jelszo },
    });
    expect(belepNelkul.statusz).toBe(200);
    szervezetNelkuliSutik = belepNelkul.sutik.join("; ");
  });

  afterAll(async () => {
    await takaritas();
    await lezar();
  });

  it("suti nelkul 401-et ad", async () => {
    const valasz = await keres<unknown>("/api/onboarding/javaslatok", {
      modszer: "POST",
      torzs: {},
    });

    expect(valasz.statusz).toBe(401);

    const torzs = HibaValasz.parse(valasz.torzs);
    expect(torzs.hiba).toBe("NINCS_BELEPVE");
  });

  it("szervezet nelkuli fiokkal 409 NINCS_SZERVEZET", async () => {
    const valasz = await keres<unknown>("/api/onboarding/javaslatok", {
      modszer: "POST",
      torzs: {},
      sutik: szervezetNelkuliSutik,
    });

    expect(valasz.statusz).toBe(409);

    const torzs = HibaValasz.parse(valasz.torzs);
    expect(torzs.hiba).toBe("NINCS_SZERVEZET");
  });

  it("ures piszkozattal 400 ERVENYTELEN_ADAT", async () => {
    const valasz = await keres<unknown>("/api/onboarding/javaslatok", {
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

  it("piszkozat mentese utan sikeres javaslat", async () => {
    // Piszkozat mentése 1. lépés mezőkkel
    const piszkozatMentes = await keres<unknown>("/api/onboarding/piszkozat", {
      modszer: "PUT",
      torzs: {
        bemutatkozas: {
          osszefoglalo: "Proba osszefoglalo a szervezetrol.",
          forras_tipus: "leiras",
          leiras: "Ez egy reszletes leiras a szervezetrol, amely eleg hosszu aihoz, hogy ervenyes legyen.",
        },
      },
      sutik: sutik,
    });

    expect(piszkozatMentes.statusz).toBe(200);

    // Javaslatok lekérése
    const valasz = await keres<unknown>("/api/onboarding/javaslatok", {
      modszer: "POST",
      torzs: {},
      sutik: sutik,
    });

    expect(valasz.statusz).toBe(200);

    const torzs = JavaslatokValasz.parse(valasz.torzs);
    expect(torzs.celkozonseg.length).toBeGreaterThan(0);
    expect(torzs.cel.length).toBeGreaterThan(0);
    expect(torzs.hangnem_leiras.length).toBeGreaterThan(0);
    expect(torzs.hangnem_minta.length).toBeGreaterThan(0);
    expect(torzs.nyelvek.length).toBeGreaterThan(0);
    expect(torzs.nyelvek.every((nyelv) => typeof nyelv === "string" && nyelv.length === 2)).toBe(true);
    expect(torzs.tartalomnyelv).toBe("hu");
    expect(torzs.forras).toBe("teszt");

    // AI hívás ellenőrzése
    const hivasok = await sql<{
      feladat: string;
      allapot: string;
      szervezet_id: string;
    }>(
      "SELECT feladat, allapot, szervezet_id FROM ai_hivas WHERE szervezet_id = $1 AND feladat = 'javaslatok'",
      [szervezetId],
    );
    expect(hivasok).toHaveLength(1);
    expect(hivasok[0]?.feladat).toBe("javaslatok");
    expect(hivasok[0]?.allapot).toBe("ok");
    expect(hivasok[0]?.szervezet_id).toBe(szervezetId);
  });

  it("hangnem finomitas sikeres", async () => {
    const valasz = await keres<unknown>("/api/onboarding/hangnem", {
      modszer: "POST",
      torzs: {
        irany: "kozvetlenebb",
        hangnem_leiras: "közvetlen",
        hangnem_minta: "Minta.",
        tartalomnyelv: "hu",
      },
      sutik: sutik,
    });

    expect(valasz.statusz).toBe(200);

    const torzs = HangnemFinomitasValasz.parse(valasz.torzs);
    expect(torzs.hangnem_leiras.length).toBeGreaterThan(0);
    expect(torzs.hangnem_minta.length).toBeGreaterThan(0);
    expect(torzs.forras).toBe("teszt");
  });

  it("hibas irannyal 400 ERVENYTELEN_ADAT", async () => {
    const valasz = await keres<unknown>("/api/onboarding/hangnem", {
      modszer: "POST",
      torzs: {
        irany: "valami",
        hangnem_leiras: "közvetlen",
        hangnem_minta: "Minta.",
        tartalomnyelv: "hu",
      },
      sutik: sutik,
    });

    expect(valasz.statusz).toBe(400);

    const torzs = HibaValasz.parse(valasz.torzs);
    expect(torzs.hiba).toBe("ERVENYTELEN_ADAT");
    expect(torzs.mezok).toBeDefined();
    expect(torzs.mezok!.irany).toBeDefined();
  });

  it("piszkozat GET-je a 2. lepes mezoivel", async () => {
    const valasz = await keres<unknown>("/api/onboarding/piszkozat", {
      modszer: "GET",
      sutik: sutik,
    });

    expect(valasz.statusz).toBe(200);

    const torzs = PiszkozatValasz.parse(valasz.torzs);
    expect(torzs.piszkozat.kommunikacio.nyelvek).toEqual([]);
    expect(torzs.piszkozat.kommunikacio.javaslatok_kerve).toBe(false);
  });
});
