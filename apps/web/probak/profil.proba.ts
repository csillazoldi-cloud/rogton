import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { keres, veletlenEmail, sql, takaritas, lezar } from "./segedek";
import {
  HibaValasz,
  JovahagyasValasz,
  ProfilValasz,
  SzervezetProfil,
  ArculatLepes,
} from "@rogton/contracts";

describe("profil modositas a fiokoldalon (E-10)", () => {
  let sutik: string;
  let szervezetNelkuliSutik: string;
  let szervezetId: string;
  let fiokId: string;
  let jovahagyvaIdopont: string;

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

    // Piszkozat mentése teljes adatokkal
    const piszkozatMentes = await keres<unknown>("/api/onboarding/piszkozat", {
      modszer: "PUT",
      torzs: {
        bemutatkozas: {
          nev: "Próba Műhely",
          osszefoglalo: "Ez egy próba összefoglaló a szervezetről, amely eleg hosszú ahhoz, hogy érvényes legyen.",
          osszefoglalo_forras: "ai",
          forras_tipus: "leiras",
          leiras: "Ez egy részletes leírás a szervezetről, amely eleg hosszú ahhoz, hogy érvényes legyen.",
        },
        kommunikacio: {
          celkozonseg: "családok",
          celkozonseg_forras: "ai",
          cel: "",
          cel_forras: "sajat",
          cel_kesobb: true,
          nyelvek: ["hu"],
          nyelvek_forras: "ai",
          hangnem_leiras: "",
          hangnem_minta: "",
          hangnem_nyelv: "hu",
          hangnem_forras: "sajat",
        },
      },
      sutik: sutik,
    });
    expect(piszkozatMentes.statusz).toBe(200);

    // Jóváhagyás
    const jovahagyas = await keres<unknown>("/api/onboarding/jovahagyas", {
      modszer: "POST",
      torzs: {},
      sutik: sutik,
    });
    expect(jovahagyas.statusz).toBe(200);

    const jovahagyasTorzs = JovahagyasValasz.parse(jovahagyas.torzs);
    jovahagyvaIdopont = jovahagyasTorzs.profil.jovahagyva;
  });

  afterAll(async () => {
    await takaritas();
    await lezar();
  });

  it("PUT /api/profil suti nelkul 401", async () => {
    const valasz = await keres<unknown>("/api/profil", {
      modszer: "PUT",
      torzs: { nev: "X" },
    });

    expect(valasz.statusz).toBe(401);

    const torzs = HibaValasz.parse(valasz.torzs);
    expect(torzs.hiba).toBe("NINCS_BELEPVE");
  });

  it("uj szervezettel, jovahagyott profil NELKUL PUT /api/profil { nev: 'X' } 409 NINCS_SZERVEZET", async () => {
    const valasz = await keres<unknown>("/api/profil", {
      modszer: "PUT",
      torzs: { nev: "X" },
      sutik: szervezetNelkuliSutik,
    });

    expect(valasz.statusz).toBe(409);

    const torzs = HibaValasz.parse(valasz.torzs);
    expect(torzs.hiba).toBe("NINCS_SZERVEZET");
  });

  it("PUT /api/profil { osszefoglalo: 'Javított összefoglaló' } 200, mezok helyesek", async () => {
    const valasz = await keres<unknown>("/api/profil", {
      modszer: "PUT",
      torzs: { osszefoglalo: "Javított összefoglaló" },
      sutik: sutik,
    });

    expect(valasz.statusz).toBe(200);

    const torzs = ProfilValasz.parse(valasz.torzs);
    expect(torzs.profil).not.toBeNull();
    const profil = torzs.profil!;
    expect(profil.osszefoglalo).toBe("Javított összefoglaló");
    expect(profil.osszefoglalo_forras).toBe("ai");
    expect(profil.osszefoglalo_modositva).toBe(true);
    expect(profil.frissitve).toBeDefined();
    expect(profil.frissitve).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    const frissitveDatum = new Date(profil.frissitve!);
    expect(frissitveDatum.toISOString()).toBe(profil.frissitve);

    // Séma ellenőrzés
    const sikertelen = SzervezetProfil.safeParse(profil);
    expect(sikertelen.success).toBe(true);
  });

  it("PUT /api/profil { cel: 'Több érdeklődő' } 200, mezok helyesek", async () => {
    const valasz = await keres<unknown>("/api/profil", {
      modszer: "PUT",
      torzs: { cel: "Több érdeklődő" },
      sutik: sutik,
    });

    expect(valasz.statusz).toBe(200);

    const torzs = ProfilValasz.parse(valasz.torzs);
    expect(torzs.profil).not.toBeNull();
    const profil = torzs.profil!;
    expect(profil.cel).toBe("Több érdeklődő");
    expect(profil.cel_forras).toBe("sajat");
    expect(profil.cel_modositva).toBe(false);
    expect(profil.kesobbre).not.toContain("cel");
    expect(profil.kesobbre).toContain("hangnem");
    expect(profil.kesobbre).toContain("arculat");

    // Séma ellenőrzés
    const sikertelen = SzervezetProfil.safeParse(profil);
    expect(sikertelen.success).toBe(true);
  });

  it("PUT /api/profil { hangnem_leiras: 'közvetlen' } 200, mezok helyesek", async () => {
    const valasz = await keres<unknown>("/api/profil", {
      modszer: "PUT",
      torzs: { hangnem_leiras: "közvetlen" },
      sutik: sutik,
    });

    expect(valasz.statusz).toBe(200);

    const torzs = ProfilValasz.parse(valasz.torzs);
    expect(torzs.profil).not.toBeNull();
    const profil = torzs.profil!;
    expect(profil.hangnem_leiras).toBe("közvetlen");
    expect(profil.hangnem_forras).toBe("sajat");
    expect(profil.hangnem_minta).toBe("");
    expect(profil.kesobbre).not.toContain("hangnem");

    // Séma ellenőrzés
    const sikertelen = SzervezetProfil.safeParse(profil);
    expect(sikertelen.success).toBe(true);
  });

  it("PUT /api/profil { nyelvek: ['hu', 'ro'] } 200, mezok helyesek", async () => {
    const valasz = await keres<unknown>("/api/profil", {
      modszer: "PUT",
      torzs: { nyelvek: ["hu", "ro"] },
      sutik: sutik,
    });

    expect(valasz.statusz).toBe(200);

    const torzs = ProfilValasz.parse(valasz.torzs);
    expect(torzs.profil).not.toBeNull();
    const profil = torzs.profil!;
    expect(profil.nyelvek).toEqual(["hu", "ro"]);
    expect(profil.nyelvek_forras).toBe("sajat");

    // Séma ellenőrzés
    const sikertelen = SzervezetProfil.safeParse(profil);
    expect(sikertelen.success).toBe(true);
  });

  it("PUT /api/profil { nev: '' } 400 ERVENYTELEN_ADAT, mezok.nev letezik", async () => {
    const valasz = await keres<unknown>("/api/profil", {
      modszer: "PUT",
      torzs: { nev: "" },
      sutik: sutik,
    });

    expect(valasz.statusz).toBe(400);

    const torzs = HibaValasz.parse(valasz.torzs);
    expect(torzs.hiba).toBe("ERVENYTELEN_ADAT");
    expect(torzs.mezok).toBeDefined();
    expect(torzs.mezok!.nev).toBeDefined();
  });

  it("PUT /api/profil { nyelvek: ['xx'] } 400 ERVENYTELEN_ADAT", async () => {
    const valasz = await keres<unknown>("/api/profil", {
      modszer: "PUT",
      torzs: { nyelvek: ["xx"] },
      sutik: sutik,
    });

    expect(valasz.statusz).toBe(400);

    const torzs = HibaValasz.parse(valasz.torzs);
    expect(torzs.hiba).toBe("ERVENYTELEN_ADAT");
  });

  it("PUT /api/profil { arculat: kesobb allapot } 200, kesobbre tartalmaz arculat-ot", async () => {
    const arculatLepes: ArculatLepes = {
      allapot: "kesobb",
      tervezet: null,
      verzio: 1,
      jovahagyott_verzio: null,
      verziok: {},
    };

    const valasz = await keres<unknown>("/api/profil", {
      modszer: "PUT",
      torzs: { arculat: arculatLepes },
      sutik: sutik,
    });

    expect(valasz.statusz).toBe(200);

    const torzs = ProfilValasz.parse(valasz.torzs);
    expect(torzs.profil).not.toBeNull();
    const profil = torzs.profil!;
    expect(profil.arculat.allapot).toBe("kesobb");
    expect(profil.kesobbre).toContain("arculat");

    // Séma ellenőrzés
    const sikertelen = SzervezetProfil.safeParse(profil);
    expect(sikertelen.success).toBe(true);
  });

  it("GET /api/profil 200, modositasok megmaradtak", async () => {
    const valasz = await keres<unknown>("/api/profil", {
      sutik: sutik,
    });

    expect(valasz.statusz).toBe(200);

    const torzs = ProfilValasz.parse(valasz.torzs);
    expect(torzs.profil).not.toBeNull();
    const profil = torzs.profil!;
    expect(profil.osszefoglalo).toBe("Javított összefoglaló");
    expect(profil.cel).toBe("Több érdeklődő");
    expect(profil.hangnem_leiras).toBe("közvetlen");
    expect(profil.nyelvek).toEqual(["hu", "ro"]);
    expect(profil.arculat.allapot).toBe("kesobb");

    // Séma ellenőrzés
    const sikertelen = SzervezetProfil.safeParse(profil);
    expect(sikertelen.success).toBe(true);
  });

  it("SQL: szervezet_profil.frissitve ujabb, mint jovahagyva", async () => {
    const sorok = await sql<{
      frissitve: string;
      jovahagyva: string;
    }>(
      "SELECT frissitve, jovahagyva FROM szervezet_profil WHERE szervezet_id = $1",
      [szervezetId],
    );

    expect(sorok).toHaveLength(1);
    const sor = sorok[0]!;
    expect(sor.frissitve).toBeDefined();
    expect(sor.jovahagyva).toBeDefined();

    const frissitveDatum = new Date(sor.frissitve);
    const jovahagyvaDatum = new Date(sor.jovahagyva);

    expect(frissitveDatum.getTime()).toBeGreaterThan(jovahagyvaDatum.getTime());
    expect(jovahagyvaDatum.toISOString()).toBe(jovahagyvaIdopont);
  });
});
