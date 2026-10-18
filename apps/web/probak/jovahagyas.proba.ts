import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { keres, veletlenEmail, sql, takaritas, lezar } from "./segedek";
import {
  HibaValasz,
  ArculatJavaslatValasz,
  JovahagyasValasz,
  PiszkozatValasz,
  ProfilValasz,
  OnboardingPiszkozat,
  ArculatLepes,
} from "@km/contracts";

describe("arculat javaslat es profil jovahagyas (E-9)", () => {
  let sutik: string;
  let szervezetNelkuliSutik: string;
  let szervezetId: string;
  let fiokId: string;
  let arculatTervezet: unknown;

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

    // Fiók azonosító lekérdezése
    const fiokEn = await keres<unknown>("/api/fiok/en", {
      sutik: sutik,
    });
    expect(fiokEn.statusz).toBe(200);
    const fiokTorzs = fiokEn.torzs as { id: string };
    fiokId = fiokTorzs.id;

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

  it("POST /api/onboarding/arculat suti nelkul 401", async () => {
    const valasz = await keres<unknown>("/api/onboarding/arculat", {
      modszer: "POST",
      torzs: {},
    });

    expect(valasz.statusz).toBe(401);

    const torzs = HibaValasz.parse(valasz.torzs);
    expect(torzs.hiba).toBe("NINCS_BELEPVE");
  });

  it("POST /api/onboarding/jovahagyas es GET /api/profil suti nelkul 401", async () => {
    const jovahagyasValasz = await keres<unknown>("/api/onboarding/jovahagyas", {
      modszer: "POST",
      torzs: {},
    });
    expect(jovahagyasValasz.statusz).toBe(401);
    const jovahagyasTorzs = HibaValasz.parse(jovahagyasValasz.torzs);
    expect(jovahagyasTorzs.hiba).toBe("NINCS_BELEPVE");

    const profilValasz = await keres<unknown>("/api/profil", {});
    expect(profilValasz.statusz).toBe(401);
    const profilTorzs = HibaValasz.parse(profilValasz.torzs);
    expect(profilTorzs.hiba).toBe("NINCS_BELEPVE");
  });

  it("szervezet nelkuli fiokkal POST /api/onboarding/jovahagyas 409 NINCS_SZERVEZET", async () => {
    const valasz = await keres<unknown>("/api/onboarding/jovahagyas", {
      modszer: "POST",
      torzs: {},
      sutik: szervezetNelkuliSutik,
    });

    expect(valasz.statusz).toBe(409);

    const torzs = HibaValasz.parse(valasz.torzs);
    expect(torzs.hiba).toBe("NINCS_SZERVEZET");
  });

  it("uj szervezettel, piszkozat nelkul POST /api/onboarding/jovahagyas 409 NINCS_PISZKOZAT", async () => {
    const valasz = await keres<unknown>("/api/onboarding/jovahagyas", {
      modszer: "POST",
      torzs: {},
      sutik: sutik,
    });

    expect(valasz.statusz).toBe(409);

    const torzs = HibaValasz.parse(valasz.torzs);
    expect(torzs.hiba).toBe("NINCS_PISZKOZAT");
  });

  it("ures piszkozattal POST /api/onboarding/arculat 400 ERVENYTELEN_ADAT, mezok.forras === ures", async () => {
    const valasz = await keres<unknown>("/api/onboarding/arculat", {
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

  it("piszkozat mentese utan hianyos profil: POST /api/onboarding/jovahagyas 400 HIANYOS_PROFIL, mezok.nev === ures", async () => {
    // Piszkozat mentése: nev ÜRES, osszefoglalo kitöltve, forras_tipus "leiras", leiras kitöltve
    const piszkozatMentes = await keres<unknown>("/api/onboarding/piszkozat", {
      modszer: "PUT",
      torzs: {
        bemutatkozas: {
          nev: "",
          osszefoglalo: "Proba osszefoglalo a szervezetrol.",
          forras_tipus: "leiras",
          leiras: "Ez egy reszletes leiras a szervezetrol, amely eleg hosszu aihoz, hogy ervenyes legyen.",
        },
      },
      sutik: sutik,
    });

    expect(piszkozatMentes.statusz).toBe(200);

    const valasz = await keres<unknown>("/api/onboarding/jovahagyas", {
      modszer: "POST",
      torzs: {},
      sutik: sutik,
    });

    expect(valasz.statusz).toBe(400);

    const torzs = HibaValasz.parse(valasz.torzs);
    expect(torzs.hiba).toBe("HIANYOS_PROFIL");
    expect(torzs.mezok).toBeDefined();
    expect(torzs.mezok!.nev).toBe("ures");
  });

  it("POST /api/onboarding/arculat sikeres, tervezet helyes, ai_hivas rogzult", async () => {
    const valasz = await keres<unknown>("/api/onboarding/arculat", {
      modszer: "POST",
      torzs: {},
      sutik: sutik,
    });

    expect(valasz.statusz).toBe(200);

    const torzs = ArculatJavaslatValasz.parse(valasz.torzs);
    expect(torzs.tervezet.elsodleges).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(torzs.tervezet.hatter).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(torzs.tervezet.lekerekites).toBeGreaterThanOrEqual(0);
    expect(torzs.tervezet.lekerekites).toBeLessThanOrEqual(24);
    expect(Number.isInteger(torzs.tervezet.lekerekites)).toBe(true);
    expect(torzs.tervezet.eredet).toBe("ai");
    expect(torzs.tervezet.nyelv).toBe("hu");
    expect(torzs.forras).toBe("teszt");

    arculatTervezet = torzs.tervezet;

    // AI hívás ellenőrzése
    const hivasok = await sql<{
      feladat: string;
      allapot: string;
      szervezet_id: string;
    }>(
      "SELECT feladat, allapot, szervezet_id FROM ai_hivas WHERE szervezet_id = $1 AND feladat = 'arculat_javaslat'",
      [szervezetId],
    );
    expect(hivasok).toHaveLength(1);
    expect(hivasok[0]?.feladat).toBe("arculat_javaslat");
    expect(hivasok[0]?.allapot).toBe("ok");
    expect(hivasok[0]?.szervezet_id).toBe(szervezetId);
  });

  it("piszkozat frissitese teljes adatokkal, PUT 200", async () => {
    const arculatLepes: ArculatLepes = {
      allapot: "tervezet",
      tervezet: arculatTervezet as ArculatLepes["tervezet"],
      verzio: 1,
      jovahagyott_verzio: null,
      verziok: {},
    };

    const valasz = await keres<unknown>("/api/onboarding/piszkozat", {
      modszer: "PUT",
      torzs: {
        bemutatkozas: {
          nev: "Proba Muhely",
          osszefoglalo: "Proba osszefoglalo a szervezetrol.",
          forras_tipus: "leiras",
          leiras: "Ez egy reszletes leiras a szervezetrol, amely eleg hosszu aihoz, hogy ervenyes legyen.",
        },
        kommunikacio: {
          celkozonseg: "csaladok",
          celkozonseg_forras: "sajat",
          cel: "",
          cel_forras: "sajat",
          cel_kesobb: true,
          nyelvek: ["hu", "ro"],
          nyelvek_forras: "sajat",
          // a hangnem üres marad → a „későbbre” listába kerül
        },
        arculat: arculatLepes,
      },
      sutik: sutik,
    });

    expect(valasz.statusz).toBe(200);
  });

  it("POST /api/onboarding/jovahagyas sikeres, profil helyes", async () => {
    const valasz = await keres<unknown>("/api/onboarding/jovahagyas", {
      modszer: "POST",
      torzs: {},
      sutik: sutik,
    });

    expect(valasz.statusz).toBe(200);

    const torzs = JovahagyasValasz.parse(valasz.torzs);
    expect(torzs.profil.nev).toBe("Proba Muhely");
    expect(torzs.profil.osszefoglalo.length).toBeGreaterThan(0);
    expect(torzs.profil.celkozonseg).toBe("csaladok");
    expect(torzs.profil.cel).toBe("");
    expect(torzs.profil.nyelvek).toEqual(["hu", "ro"]);
    expect(torzs.profil.kesobbre).toContain("cel");
    expect(torzs.profil.kesobbre).toContain("hangnem");
    expect(torzs.profil.kesobbre).toContain("arculat");
    expect(torzs.profil.kesobbre).not.toContain("celkozonseg");
    expect(torzs.profil.kesobbre).not.toContain("nyelvek");
    expect(torzs.profil.arculat.allapot).toBe("tervezet");
    expect(torzs.profil.jovahagyva).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // jovahagyva ISO dátum ellenőrzése
    const jovahagyvaDatum = new Date(torzs.profil.jovahagyva);
    expect(jovahagyvaDatum.toISOString()).toBe(torzs.profil.jovahagyva);
  });

  it("GET /api/onboarding/piszkozat jovahagyas utan ures", async () => {
    const valasz = await keres<unknown>("/api/onboarding/piszkozat", {
      modszer: "GET",
      sutik: sutik,
    });

    expect(valasz.statusz).toBe(200);

    const torzs = PiszkozatValasz.parse(valasz.torzs);
    expect(torzs.piszkozat.bemutatkozas.nev).toBe("");
    expect(torzs.frissitve).toBeNull();
  });

  it("GET /api/profil jovahagyas utan elerheto", async () => {
    const valasz = await keres<unknown>("/api/profil", {
      sutik: sutik,
    });

    expect(valasz.statusz).toBe(200);

    const torzs = ProfilValasz.parse(valasz.torzs);
    expect(torzs.profil).not.toBeNull();
    expect(torzs.profil!.nev).toBe("Proba Muhely");
  });

  it("SQL: szervezet_profil tablaban pontosan egy sor, jovahagyta = fiok id", async () => {
    const sorok = await sql<{
      jovahagyta: string;
      szervezet_id: string;
    }>(
      "SELECT jovahagyta, szervezet_id FROM szervezet_profil WHERE szervezet_id = $1",
      [szervezetId],
    );

    expect(sorok).toHaveLength(1);
    expect(sorok[0]?.jovahagyta).toBe(fiokId);
    expect(sorok[0]?.szervezet_id).toBe(szervezetId);
  });

  it("ismetelt POST /api/onboarding/jovahagyas 409 NINCS_PISZKOZAT", async () => {
    const valasz = await keres<unknown>("/api/onboarding/jovahagyas", {
      modszer: "POST",
      torzs: {},
      sutik: sutik,
    });

    expect(valasz.statusz).toBe(409);

    const torzs = HibaValasz.parse(valasz.torzs);
    expect(torzs.hiba).toBe("NINCS_PISZKOZAT");
  });
});
