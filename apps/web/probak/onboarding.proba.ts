import { describe, expect, it, beforeAll, afterAll } from "vitest";
import {
  keres,
  veletlenEmail,
  sql,
  takaritas,
  sutiErtek,
  PROBA_CIM,
} from "./segedek";

interface FiokValasz {
  id: string;
  email: string;
  nev: string;
  szervezetek: Array<{ id: string; nev: string; szerep: string }>;
}

interface PiszkozatValasz {
  piszkozat: {
    verzio: number;
    lepes: number;
    bemutatkozas: {
      nev: string;
      forras_tipus: string;
      weboldal: string;
      leiras: string;
      dokumentum_nev: string;
      arculat_forrasok: {
        logo: boolean;
        kezikonyv: boolean;
        referenciak: boolean;
        weboldal_is: boolean;
      };
      osszefoglalo: string;
    };
  };
  frissitve: string | null;
}

interface HibaValasz {
  hiba: string;
  mezok?: Record<string, string>;
}

interface OsszefoglaloValasz {
  forras: string;
  osszefoglalo: string;
}

async function fiokLetrehozas(): Promise<{ email: string; jelszo: string; sutik: string }> {
  const email = veletlenEmail();
  const jelszo = "ProbaJelszo123!";
  
  const regisztracio = await keres<unknown>("/api/fiok/regisztracio", {
    modszer: "POST",
    torzs: { nev: "Proba Felhasznalo", email, jelszo },
  });
  expect(regisztracio.statusz).toBe(201);

  const belepes = await keres<unknown>("/api/fiok/belepes", {
    modszer: "POST",
    torzs: { email, jelszo },
  });
  expect(belepes.statusz).toBe(200);

  const sutik = belepes.sutik.join("; ");
  return { email, jelszo, sutik };
}

async function szervezetLetrehozas(sutik: string): Promise<string> {
  const valasz = await keres<unknown>("/api/szervezet", {
    modszer: "POST",
    torzs: { nev: "Proba Szervezet" },
    sutik,
  });
  expect(valasz.statusz).toBe(201);

  const torzs = valasz.torzs as { id: string };
  return torzs.id;
}

describe("E-6: Onboarding-piszkozat", () => {
  beforeAll(async () => {
    await takaritas();
  });

  afterAll(async () => {
    await takaritas();
  });

  it("piszkozat sutik nelkul → GET 401 NINCS_BELEPVE", async () => {
    const valasz = await keres<unknown>("/api/onboarding/piszkozat");
    expect(valasz.statusz).toBe(401);

    const torzs = valasz.torzs as HibaValasz;
    expect(torzs.hiba).toBe("NINCS_BELEPVE");
  });

  it("uj fiok szervezet nelkul → GET 409 NINCS_SZERVEZET", async () => {
    const { sutik } = await fiokLetrehozas();

    const valasz = await keres<unknown>("/api/onboarding/piszkozat", {
      sutik,
    });
    expect(valasz.statusz).toBe(409);

    const torzs = valasz.torzs as HibaValasz;
    expect(torzs.hiba).toBe("NINCS_SZERVEZET");
  });

  it("szervezet letrehozasa utan → GET 200, verzio 1, lepes 1, frissitve null", async () => {
    const { sutik } = await fiokLetrehozas();
    await szervezetLetrehozas(sutik);

    const valasz = await keres<unknown>("/api/onboarding/piszkozat", {
      sutik,
    });
    expect(valasz.statusz).toBe(200);

    const torzs = valasz.torzs as PiszkozatValasz;
    expect(torzs.piszkozat.verzio).toBe(1);
    expect(torzs.piszkozat.lepes).toBe(1);
    expect(torzs.frissitve).toBeNull();
  });

  it("PUT kitoltott piszkozattal → 200, frissitve ISO-datum", async () => {
    const { sutik } = await fiokLetrehozas();
    await szervezetLetrehozas(sutik);

    const piszkozat = {
      verzio: 1,
      lepes: 1,
      bemutatkozas: {
        nev: "Teszt Szervezet",
        forras_tipus: "weboldal",
        weboldal: "https://teszt.example",
        leiras: "",
        dokumentum_nev: "",
        arculat_forrasok: {
          logo: true,
          kezikonyv: false,
          referenciak: true,
          weboldal_is: true,
        },
        osszefoglalo: "",
      },
    };

    const valasz = await keres<unknown>("/api/onboarding/piszkozat", {
      modszer: "PUT",
      torzs: piszkozat,
      sutik,
    });
    expect(valasz.statusz).toBe(200);

    const torzs = valasz.torzs as PiszkozatValasz;
    expect(torzs.frissitve).not.toBeNull();
    expect(() => new Date(torzs.frissitve!)).not.toThrow();
    expect(new Date(torzs.frissitve!).toISOString()).toBe(torzs.frissitve);
  });

  it("kilepes, ujra belepes → GET visszaadja ugyanazt a tartalmat", async () => {
    const { email, jelszo, sutik: elsoSutik } = await fiokLetrehozas();
    await szervezetLetrehozas(elsoSutik);

    const piszkozat = {
      verzio: 1,
      lepes: 1,
      bemutatkozas: {
        nev: "Mentett Szervezet",
        forras_tipus: "weboldal",
        weboldal: "https://mentett.example",
        leiras: "",
        dokumentum_nev: "",
        arculat_forrasok: {
          logo: false,
          kezikonyv: false,
          referenciak: false,
          weboldal_is: true,
        },
        osszefoglalo: "",
      },
    };

    const mentes = await keres<unknown>("/api/onboarding/piszkozat", {
      modszer: "PUT",
      torzs: piszkozat,
      sutik: elsoSutik,
    });
    expect(mentes.statusz).toBe(200);

    const ujBelepes = await keres<unknown>("/api/fiok/belepes", {
      modszer: "POST",
      torzs: { email, jelszo },
    });
    expect(ujBelepes.statusz).toBe(200);
    const ujSutik = ujBelepes.sutik.join("; ");

    const lekerdezes = await keres<unknown>("/api/onboarding/piszkozat", {
      sutik: ujSutik,
    });
    expect(lekerdezes.statusz).toBe(200);

    const torzs = lekerdezes.torzs as PiszkozatValasz;
    expect(torzs.piszkozat.bemutatkozas.nev).toBe("Mentett Szervezet");
    expect(torzs.piszkozat.bemutatkozas.weboldal).toBe("https://mentett.example");
  });

  it("PUT hibas torzzsel (lepes: 9) → 400 ERVENYTELEN_ADAT, mezok.lepes letezik", async () => {
    const { sutik } = await fiokLetrehozas();
    await szervezetLetrehozas(sutik);

    const valasz = await keres<unknown>("/api/onboarding/piszkozat", {
      modszer: "PUT",
      torzs: { verzio: 1, lepes: 9, bemutatkozas: {} },
      sutik,
    });
    expect(valasz.statusz).toBe(400);

    const torzs = valasz.torzs as HibaValasz;
    expect(torzs.hiba).toBe("ERVENYTELEN_ADAT");
    expect(torzs.mezok).toBeDefined();
    expect(torzs.mezok!.lepes).toBeDefined();
  });

  it("PUT ismetelten → tovabbra is EGY sor van az onboarding_piszkozat tablaban", async () => {
    const { sutik } = await fiokLetrehozas();
    const szervezetId = await szervezetLetrehozas(sutik);

    const piszkozat1 = {
      verzio: 1,
      lepes: 1,
      bemutatkozas: {
        nev: "Elso",
        forras_tipus: "weboldal" as const,
        weboldal: "https://elso.example",
        leiras: "",
        dokumentum_nev: "",
        arculat_forrasok: {
          logo: false,
          kezikonyv: false,
          referenciak: false,
          weboldal_is: true,
        },
        osszefoglalo: "",
      },
    };

    const valasz1 = await keres<unknown>("/api/onboarding/piszkozat", {
      modszer: "PUT",
      torzs: piszkozat1,
      sutik,
    });
    expect(valasz1.statusz).toBe(200);

    const piszkozat2 = {
      verzio: 1,
      lepes: 1,
      bemutatkozas: {
        nev: "Masodik",
        forras_tipus: "weboldal" as const,
        weboldal: "https://masodik.example",
        leiras: "",
        dokumentum_nev: "",
        arculat_forrasok: {
          logo: true,
          kezikonyv: false,
          referenciak: false,
          weboldal_is: true,
        },
        osszefoglalo: "",
      },
    };

    const valasz2 = await keres<unknown>("/api/onboarding/piszkozat", {
      modszer: "PUT",
      torzs: piszkozat2,
      sutik,
    });
    expect(valasz2.statusz).toBe(200);

    const sorok = await sql<{ szam: number }>(
      "SELECT COUNT(*)::int as szam FROM onboarding_piszkozat WHERE szervezet_id = $1",
      [szervezetId]
    );
    expect(sorok[0]?.szam).toBe(1);
  });

  it("ket kulon fiok, ket kulon szervezet, ket kulonbozo piszkozat → mindketto csak a sajatjat kapja vissza", async () => {
    const fiok1 = await fiokLetrehozas();
    const szervezet1 = await szervezetLetrehozas(fiok1.sutik);

    const fiok2 = await fiokLetrehozas();
    const szervezet2 = await szervezetLetrehozas(fiok2.sutik);

    const piszkozat1 = {
      verzio: 1,
      lepes: 1,
      bemutatkozas: {
        nev: "Első Szervezet Neve",
        forras_tipus: "weboldal" as const,
        weboldal: "https://elso-szervezet.example",
        leiras: "",
        dokumentum_nev: "",
        arculat_forrasok: {
          logo: false,
          kezikonyv: false,
          referenciak: false,
          weboldal_is: true,
        },
        osszefoglalo: "",
      },
    };

    const piszkozat2 = {
      verzio: 1,
      lepes: 1,
      bemutatkozas: {
        nev: "Második Szervezet Neve",
        forras_tipus: "weboldal" as const,
        weboldal: "https://masodik-szervezet.example",
        leiras: "",
        dokumentum_nev: "",
        arculat_forrasok: {
          logo: true,
          kezikonyv: true,
          referenciak: false,
          weboldal_is: false,
        },
        osszefoglalo: "",
      },
    };

    const mentes1 = await keres<unknown>("/api/onboarding/piszkozat", {
      modszer: "PUT",
      torzs: piszkozat1,
      sutik: fiok1.sutik,
    });
    expect(mentes1.statusz).toBe(200);

    const mentes2 = await keres<unknown>("/api/onboarding/piszkozat", {
      modszer: "PUT",
      torzs: piszkozat2,
      sutik: fiok2.sutik,
    });
    expect(mentes2.statusz).toBe(200);

    const lekerdezes1 = await keres<unknown>("/api/onboarding/piszkozat", {
      sutik: fiok1.sutik,
    });
    expect(lekerdezes1.statusz).toBe(200);
    const torzs1 = lekerdezes1.torzs as PiszkozatValasz;
    expect(torzs1.piszkozat.bemutatkozas.nev).toBe("Első Szervezet Neve");
    expect(torzs1.piszkozat.bemutatkozas.weboldal).toBe("https://elso-szervezet.example");

    const lekerdezes2 = await keres<unknown>("/api/onboarding/piszkozat", {
      sutik: fiok2.sutik,
    });
    expect(lekerdezes2.statusz).toBe(200);
    const torzs2 = lekerdezes2.torzs as PiszkozatValasz;
    expect(torzs2.piszkozat.bemutatkozas.nev).toBe("Második Szervezet Neve");
    expect(torzs2.piszkozat.bemutatkozas.weboldal).toBe("https://masodik-szervezet.example");
  });

  it("POST /api/onboarding/osszefoglalo leirassal → 200, forras 'teszt', osszefoglalo tartalmazza a nevet", async () => {
    const { sutik } = await fiokLetrehozas();
    await szervezetLetrehozas(sutik);

    const valasz = await keres<unknown>("/api/onboarding/osszefoglalo", {
      modszer: "POST",
      torzs: {
        nev: "Teszt Ceg",
        forras_tipus: "leiras",
        leiras: "Kézműves pékség Marosvásárhelyen, családoknak és irodáknak sütünk kovászos kenyeret.",
      },
      sutik,
    });
    expect(valasz.statusz).toBe(200);

    const torzs = valasz.torzs as OsszefoglaloValasz;
    expect(torzs.forras).toBe("teszt");
    expect(torzs.osszefoglalo.toLowerCase()).toContain("teszt ceg");
  });

  it("POST /api/onboarding/osszefoglalo ures forrassal → 400 ERVENYTELEN_ADAT", async () => {
    const { sutik } = await fiokLetrehozas();
    await szervezetLetrehozas(sutik);

    const valasz = await keres<unknown>("/api/onboarding/osszefoglalo", {
      modszer: "POST",
      torzs: {
        nev: "",
        weboldal: "",
      },
      sutik,
    });
    expect(valasz.statusz).toBe(400);

    const torzs = valasz.torzs as HibaValasz;
    expect(torzs.hiba).toBe("ERVENYTELEN_ADAT");
  });

  it("takaritas a vegen → fiokok torlodnek, piszkozat cascade-dal megy", async () => {
    const { sutik, email } = await fiokLetrehozas();
    const szervezetId = await szervezetLetrehozas(sutik);

    const piszkozat = {
      verzio: 1,
      lepes: 1,
      bemutatkozas: {
        nev: "Takaritando",
        forras_tipus: "weboldal" as const,
        weboldal: "https://takaritando.example",
        leiras: "",
        dokumentum_nev: "",
        arculat_forrasok: {
          logo: false,
          kezikonyv: false,
          referenciak: false,
          weboldal_is: true,
        },
        osszefoglalo: "",
      },
    };

    const mentes = await keres<unknown>("/api/onboarding/piszkozat", {
      modszer: "PUT",
      torzs: piszkozat,
      sutik,
    });
    expect(mentes.statusz).toBe(200);

    const elotteSorok = await sql<{ szam: number }>(
      "SELECT COUNT(*)::int as szam FROM onboarding_piszkozat WHERE szervezet_id = $1",
      [szervezetId]
    );
    expect(elotteSorok[0]?.szam).toBe(1);

    await takaritas();

    const utanaFiok = await sql<{ szam: number }>(
      "SELECT COUNT(*)::int as szam FROM fiok WHERE email = $1",
      [email]
    );
    expect(utanaFiok[0]?.szam).toBe(0);

    const utanaPiszkozat = await sql<{ szam: number }>(
      "SELECT COUNT(*)::int as szam FROM onboarding_piszkozat WHERE szervezet_id = $1",
      [szervezetId]
    );
    expect(utanaPiszkozat[0]?.szam).toBe(0);
  });
});
