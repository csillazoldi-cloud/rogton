import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { keres, veletlenEmail, sql, takaritas, lezar, PROBA_CIM } from "./segedek";

describe("hibautak probai (E-11)", () => {
  let sutik: string;
  let szervezetId: string;
  let elozoAiKoltseg: { honap: string; becsult_usd: number; hivasok: number } | null = null;
  let jovoPiszkozatFrissitve: string | null = null;

  beforeAll(async () => {
    const email = veletlenEmail();
    const jelszo = "ProbaJelszo123!";

    const regisztracio = await keres("/api/fiok/regisztracio", {
      modszer: "POST",
      torzs: { nev: "Proba Felhasznalo", email, jelszo },
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

    // AI koltseg elozo ertekenek mentese
    const honap = new Date().toISOString().slice(0, 7);
    const elozoSorok = await sql<{ honap: string; becsult_usd: number; hivasok: number }>(
      "SELECT honap, becsult_usd, hivasok FROM ai_koltseg_honap WHERE honap = $1",
      [honap],
    );
    if (elozoSorok.length > 0) {
      elozoAiKoltseg = elozoSorok[0] ?? null;
    }
  });

  afterAll(async () => {
    // AI koltseg visszaallitasa
    if (elozoAiKoltseg === null) {
      const honap = new Date().toISOString().slice(0, 7);
      await sql("DELETE FROM ai_koltseg_honap WHERE honap = $1", [honap]);
    } else if (elozoAiKoltseg !== null) {
      await sql(
        "UPDATE ai_koltseg_honap SET becsult_usd = $1, hivasok = $2 WHERE honap = $3",
        [elozoAiKoltseg.becsult_usd, elozoAiKoltseg.hivasok, elozoAiKoltseg.honap],
      );
    }

    await takaritas();
    await lezar();
  });

  describe("A) Mentes hiba — ervenytelen piszkozat nem irja felul a jot", () => {
    it("piszkozat mentese jo adattal → 200", async () => {
      const valasz = await keres("/api/onboarding/piszkozat", {
        modszer: "PUT",
        torzs: {
          bemutatkozas: {
            nev: "Proba Muhely",
            leiras: "Ez egy reszletes leiras a szervezetrol, amely eleg hosszu aihoz, hogy ervenyes legyen.",
          },
        },
        sutik: sutik,
      });

      expect(valasz.statusz).toBe(200);

      const torzs = valasz.torzs as { piszkozat: { bemutatkozas: { nev: string } }; frissitve: string | null };
      expect(torzs.piszkozat.bemutatkozas.nev).toBe("Proba Muhely");
      jovoPiszkozatFrissitve = torzs.frissitve;
    });

    it("PUT hibas torzzsel → 400 ERVENYTELEN_ADAT, mezok.lepes letezik", async () => {
      const valasz = await keres("/api/onboarding/piszkozat", {
        modszer: "PUT",
        torzs: { verzio: 1, lepes: 9 },
        sutik: sutik,
      });

      expect(valasz.statusz).toBe(400);

      const torzs = valasz.torzs as { hiba: string; mezok?: { lepes?: string } };
      expect(torzs.hiba).toBe("ERVENYTELEN_ADAT");
      expect(torzs.mezok?.lepes).toBeDefined();
    });

    it("PUT nem JSON torzzsel → 400", async () => {
      const valasz = await fetch(`${PROBA_CIM}/api/onboarding/piszkozat`, {
        method: "PUT",
        headers: {
          "Content-Type": "text/plain",
          Cookie: sutik,
        },
        body: "nem json",
      });

      expect(valasz.status).toBe(400);
    });

    it("GET → nev tovabbra is Proba Muhely, frissitve ugyanaz", async () => {
      const valasz = await keres("/api/onboarding/piszkozat", {
        sutik: sutik,
      });

      expect(valasz.statusz).toBe(200);

      const torzs = valasz.torzs as { piszkozat: { bemutatkozas: { nev: string } }; frissitve: string | null };
      expect(torzs.piszkozat.bemutatkozas.nev).toBe("Proba Muhely");
      expect(torzs.frissitve).toBe(jovoPiszkozatFrissitve);
    });
  });

  describe("B) Forrashiba — a forras nem erheto el, a piszkozat marad", () => {
    it("POST osszefoglalo nem elerheto weboldallal → 502 FORRAS_NEM_ELERHETO", async () => {
      const valasz = await keres("/api/onboarding/osszefoglalo", {
        modszer: "POST",
        torzs: {
          forras_tipus: "weboldal",
          weboldal: "nincs-ilyen-tartomany-e11.example",
        },
        sutik: sutik,
      });

      expect(valasz.statusz).toBe(502);

      const torzs = valasz.torzs as { hiba: string };
      expect(torzs.hiba).toBe("FORRAS_NEM_ELERHETO");
    });

    it("POST osszefoglalo tiltott cimmel → 400 ERVENYTELEN_ADAT, mezok.weboldal === FORRAS_TILTOTT_CIM", async () => {
      const valasz = await keres("/api/onboarding/osszefoglalo", {
        modszer: "POST",
        torzs: {
          forras_tipus: "weboldal",
          weboldal: "http://127.0.0.1:8400/",
        },
        sutik: sutik,
      });

      expect(valasz.statusz).toBe(400);

      const torzs = valasz.torzs as { hiba: string; mezok?: { weboldal?: string } };
      expect(torzs.hiba).toBe("ERVENYTELEN_ADAT");
      expect(torzs.mezok?.weboldal).toBe("FORRAS_TILTOTT_CIM");
    });

    it("GET piszkozat → valtozatlan, osszefoglalo ures", async () => {
      const valasz = await keres("/api/onboarding/piszkozat", {
        sutik: sutik,
      });

      expect(valasz.statusz).toBe(200);

      const torzs = valasz.torzs as {
        piszkozat: {
          bemutatkozas: { nev: string; osszefoglalo: string };
        };
      };
      expect(torzs.piszkozat.bemutatkozas.nev).toBe("Proba Muhely");
      expect(torzs.piszkozat.bemutatkozas.osszefoglalo).toBe("");
    });

    it("hibas forras-kiserlet NEM kerul ai_hivas tablaba AI-hibakent", async () => {
      const hivasok = await sql<{
        allapot: string;
        feladat: string;
        szervezet_id: string;
      }>(
        "SELECT allapot, feladat, szervezet_id FROM ai_hivas WHERE szervezet_id = $1 AND feladat = 'osszefoglalo' AND allapot = 'hiba'",
        [szervezetId],
      );

      expect(hivasok.length, `Elvart: 0 hiba sor, valos: ${hivasok.length} sor az ai_hivas tablaban osszefoglalo/hiba allapottal`).toBe(0);
    });
  });

  describe("C) AI-kieses — a havi keret kimerult, kezi uton folytathato", () => {
    beforeAll(async () => {
      const honap = new Date().toISOString().slice(0, 7);
      await sql(
        "INSERT INTO ai_koltseg_honap (honap, becsult_usd, hivasok) VALUES ($1, 999, 1) ON CONFLICT (honap) DO UPDATE SET becsult_usd = 999",
        [honap],
      );
    });

    it("POST osszefoglalo leirasbol → 429 AI_KERET_KIMERULT", async () => {
      const valasz = await keres("/api/onboarding/osszefoglalo", {
        modszer: "POST",
        torzs: {
          forras_tipus: "leiras",
          leiras: "Kezmuves pekseg Marosvasarhelyen.",
        },
        sutik: sutik,
      });

      expect(valasz.statusz).toBe(429);

      const torzs = valasz.torzs as { hiba: string };
      expect(torzs.hiba).toBe("AI_KERET_KIMERULT");
    });

    it("POST javaslatok → 429 AI_KERET_KIMERULT", async () => {
      const valasz = await keres("/api/onboarding/javaslatok", {
        modszer: "POST",
        torzs: {},
        sutik: sutik,
      });

      expect(valasz.statusz).toBe(429);

      const torzs = valasz.torzs as { hiba: string };
      expect(torzs.hiba).toBe("AI_KERET_KIMERULT");
    });

    it("POST hangnem finomitas → 429 AI_KERET_KIMERULT", async () => {
      const valasz = await keres("/api/onboarding/hangnem", {
        modszer: "POST",
        torzs: {
          irany: "kozvetlenebb",
          hangnem_leiras: "kozvetlen",
          hangnem_minta: "Minta.",
          tartalomnyelv: "hu",
        },
        sutik: sutik,
      });

      expect(valasz.statusz).toBe(429);

      const torzs = valasz.torzs as { hiba: string };
      expect(torzs.hiba).toBe("AI_KERET_KIMERULT");
    });

    it("kezi folytatas: PUT piszkozat osszefoglalo sajat forrassal → 200, GET → megvan", async () => {
      const putValasz = await keres("/api/onboarding/piszkozat", {
        modszer: "PUT",
        torzs: {
          bemutatkozas: {
            osszefoglalo: "Sajat osszefoglalo",
            osszefoglalo_forras: "sajat",
          },
        },
        sutik: sutik,
      });

      expect(putValasz.statusz).toBe(200);

      const getValasz = await keres("/api/onboarding/piszkozat", {
        sutik: sutik,
      });

      expect(getValasz.statusz).toBe(200);

      const torzs = getValasz.torzs as {
        piszkozat: {
          bemutatkozas: { osszefoglalo: string; osszefoglalo_forras: string };
        };
      };
      expect(torzs.piszkozat.bemutatkozas.osszefoglalo).toBe("Sajat osszefoglalo");
      expect(torzs.piszkozat.bemutatkozas.osszefoglalo_forras).toBe("sajat");
    });

    it("keret visszaallitasa utan POST osszefoglalo leirasbol → 200", async () => {
      // Keret visszaallitasa: toroljuk a teszt adatot, vagy visszaallitjuk az eredetit
      const honap = new Date().toISOString().slice(0, 7);
      if (elozoAiKoltseg === null) {
        await sql("DELETE FROM ai_koltseg_honap WHERE honap = $1", [honap]);
      } else {
        await sql(
          "UPDATE ai_koltseg_honap SET becsult_usd = $1, hivasok = $2 WHERE honap = $3",
          [elozoAiKoltseg.becsult_usd, elozoAiKoltseg.hivasok, elozoAiKoltseg.honap],
        );
      }

      const valasz = await keres("/api/onboarding/osszefoglalo", {
        modszer: "POST",
        torzs: {
          forras_tipus: "leiras",
          leiras: "Kezmuves pekseg Marosvasarhelyen.",
        },
        sutik: sutik,
      });

      expect(valasz.statusz).toBe(200);

      const torzs = valasz.torzs as { osszefoglalo: string };
      expect(typeof torzs.osszefoglalo).toBe("string");
      expect(torzs.osszefoglalo.length).toBeGreaterThan(0);
    });
  });

  describe("D) Nincs hamis siker — a jovahagyas hibaja nem torli a piszkozatot", () => {
    it("PUT piszkozat nev ures, osszefoglalo kitoltve → 200", async () => {
      const valasz = await keres("/api/onboarding/piszkozat", {
        modszer: "PUT",
        torzs: {
          bemutatkozas: {
            nev: "",
            osszefoglalo: "Sajat osszefoglalo",
            osszefoglalo_forras: "sajat",
          },
        },
        sutik: sutik,
      });

      expect(valasz.statusz).toBe(200);
    });

    it("POST jovahagyas → 400 HIANYOS_PROFIL, mezok.nev === ures", async () => {
      const valasz = await keres("/api/onboarding/jovahagyas", {
        modszer: "POST",
        torzs: {},
        sutik: sutik,
      });

      expect(valasz.statusz).toBe(400);

      const torzs = valasz.torzs as { hiba: string; mezok?: { nev?: string } };
      expect(torzs.hiba).toBe("HIANYOS_PROFIL");
      expect(torzs.mezok?.nev).toBe("ures");
    });

    it("GET piszkozat → megvan, osszefoglalo kitoltve, frissitve nem null", async () => {
      const valasz = await keres("/api/onboarding/piszkozat", {
        sutik: sutik,
      });

      expect(valasz.statusz).toBe(200);

      const torzs = valasz.torzs as {
        piszkozat: {
          bemutatkozas: { nev: string; osszefoglalo: string };
        };
        frissitve: string | null;
      };
      expect(torzs.piszkozat.bemutatkozas.nev).toBe("");
      expect(torzs.piszkozat.bemutatkozas.osszefoglalo).toBe("Sajat osszefoglalo");
      expect(torzs.frissitve).not.toBeNull();
    });

    it("GET profil → profil === null", async () => {
      const valasz = await keres("/api/profil", {
        sutik: sutik,
      });

      expect(valasz.statusz).toBe(200);

      const torzs = valasz.torzs as { profil: unknown };
      expect(torzs.profil).toBeNull();
    });
  });
});
