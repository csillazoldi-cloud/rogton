import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  keres,
  veletlenEmail,
  sql,
  takaritas,
  sutiErtek,
  sutiTulajdonsagEllenoriz,
  lezar,
} from "./segedek";
import { MUNKAMENET_SUTI } from "@rogton/contracts";

type IdValasz = { id: string };
type HibaValaszTipus = { hiba: string; mezok?: Record<string, string> };
type FiokNezetTipus = {
  id: string;
  email: string;
  nev: string;
  szervezetek: Array<{ id: string; nev: string; szerep: string }>;
};

function isIdValasz(t: unknown): t is IdValasz {
  return typeof t === "object" && t !== null && "id" in t && typeof (t as Record<string, unknown>).id === "string";
}

function isHibaValasz(t: unknown): t is HibaValaszTipus {
  return typeof t === "object" && t !== null && "hiba" in t && typeof (t as Record<string, unknown>).hiba === "string";
}

function isFiokNezet(t: unknown): t is FiokNezetTipus {
  if (typeof t !== "object" || t === null) return false;
  const o = t as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.email === "string" &&
    typeof o.nev === "string" &&
    Array.isArray(o.szervezetek)
  );
}

beforeAll(async () => {
  await takaritas();
});

afterAll(async () => {
  await takaritas();
  await lezar();
});

describe("fiok es belepes", () => {
  it("regisztracio rendben → 201, { id } uuid", async () => {
    const email = veletlenEmail();
    const valasz = await keres<unknown>("/api/fiok/regisztracio", {
      modszer: "POST",
      torzs: { nev: "Teszt Elek", email, jelszo: "nagyonerosjelszo123" },
    });

    expect(valasz.statusz).toBe(201);
    expect(isIdValasz(valasz.torzs)).toBe(true);
    if (isIdValasz(valasz.torzs)) {
      expect(valasz.torzs.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    }
  });

  it("ugyanazzal az e-maillel ujra → 409 EMAIL_FOGLALT", async () => {
    const email = veletlenEmail();
    await keres("/api/fiok/regisztracio", {
      modszer: "POST",
      torzs: { nev: "Teszt Elek", email, jelszo: "nagyonerosjelszo123" },
    });

    const valasz = await keres<unknown>("/api/fiok/regisztracio", {
      modszer: "POST",
      torzs: { nev: "Masik Nev", email, jelszo: "masikerosjelszo456" },
    });

    expect(valasz.statusz).toBe(409);
    expect(isHibaValasz(valasz.torzs)).toBe(true);
    if (isHibaValasz(valasz.torzs)) {
      expect(valasz.torzs.hiba).toBe("EMAIL_FOGLALT");
    }
  });

  it("e-mail NAGYBETUVEL es szokozzel regisztralva, kisbetuvel belepve → mukodik", async () => {
    const alapEmail = veletlenEmail();
    const nagybetusEmail = `  ${alapEmail.toUpperCase()}  `;
    const kisbetusEmail = alapEmail.toLowerCase().trim();

    const regValasz = await keres<unknown>("/api/fiok/regisztracio", {
      modszer: "POST",
      torzs: { nev: "Teszt Elek", email: nagybetusEmail, jelszo: "nagyonerosjelszo123" },
    });
    expect(regValasz.statusz).toBe(201);

    const belepValasz = await keres<unknown>("/api/fiok/belepes", {
      modszer: "POST",
      torzs: { email: kisbetusEmail, jelszo: "nagyonerosjelszo123" },
    });
    expect(belepValasz.statusz).toBe(200);
    expect(isIdValasz(belepValasz.torzs)).toBe(true);
  });

  it("9 karakteres jelszo → 400 GYENGE_JELSZO", async () => {
    const email = veletlenEmail();
    const valasz = await keres<unknown>("/api/fiok/regisztracio", {
      modszer: "POST",
      torzs: { nev: "Teszt Elek", email, jelszo: "rovid1234" },
    });

    expect(valasz.statusz).toBe(400);
    expect(isHibaValasz(valasz.torzs)).toBe(true);
    if (isHibaValasz(valasz.torzs)) {
      expect(valasz.torzs.hiba).toBe("GYENGE_JELSZO");
    }
  });

  it("hibas JSON-torzs → 400 ERVENYTELEN_ADAT", async () => {
    const url = `${process.env.PROBA_CIM ?? "http://127.0.0.1:3000"}/api/fiok/regisztracio`;
    const valasz = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ez nem json",
    });
    const torzs = await valasz.json() as unknown;

    expect(valasz.status).toBe(400);
    expect(isHibaValasz(torzs)).toBe(true);
    if (isHibaValasz(torzs)) {
      expect(torzs.hiba).toBe("ERVENYTELEN_ADAT");
    }
  });

  it("rossz jelszo → 401 ROSSZ_BELEPES", async () => {
    const email = veletlenEmail();
    await keres("/api/fiok/regisztracio", {
      modszer: "POST",
      torzs: { nev: "Teszt Elek", email, jelszo: "nagyonerosjelszo123" },
    });

    const valasz = await keres<unknown>("/api/fiok/belepes", {
      modszer: "POST",
      torzs: { email, jelszo: "teljesenmasjelszo999" },
    });

    expect(valasz.statusz).toBe(401);
    expect(isHibaValasz(valasz.torzs)).toBe(true);
    if (isHibaValasz(valasz.torzs)) {
      expect(valasz.torzs.hiba).toBe("ROSSZ_BELEPES");
    }
  });

  it("nem letezo e-mail → 401 ROSSZ_BELEPES", async () => {
    const valasz = await keres<unknown>("/api/fiok/belepes", {
      modszer: "POST",
      torzs: { email: "nemletezik@proba.example", jelszo: "nagyonerosjelszo123" },
    });

    expect(valasz.statusz).toBe(401);
    expect(isHibaValasz(valasz.torzs)).toBe(true);
    if (isHibaValasz(valasz.torzs)) {
      expect(valasz.torzs.hiba).toBe("ROSSZ_BELEPES");
    }
  });

  it("teszt-fiok ures jelszo-lenyomattal → 401 ROSSZ_BELEPES", async () => {
    const email = "anna@teszt-a.example";
    // Ellenőrizzük, hogy létezik-e a teszt-fiók, ha nem, létrehozzuk üres hash-sel
    const letezo = await sql<{ id: string }>("SELECT id FROM fiok WHERE email = $1", [email]);
    if (letezo.length === 0) {
      await sql(
        "INSERT INTO fiok (id, email, nev, jelszo_hash, letrehozva) VALUES (gen_random_uuid(), $1, 'Anna Teszt', '', NOW())",
        [email]
      );
    } else {
      await sql("UPDATE fiok SET jelszo_hash = '' WHERE email = $1", [email]);
    }

    const valasz = await keres<unknown>("/api/fiok/belepes", {
      modszer: "POST",
      torzs: { email, jelszo: "barmilyenjelszo12345" },
    });

    expect(valasz.statusz).toBe(401);
    expect(isHibaValasz(valasz.torzs)).toBe(true);
    if (isHibaValasz(valasz.torzs)) {
      expect(valasz.torzs.hiba).toBe("ROSSZ_BELEPES");
    }
  });

  it("/api/fiok/en sutik nelkul → 401 NINCS_BELEPVE", async () => {
    const valasz = await keres<unknown>("/api/fiok/en");

    expect(valasz.statusz).toBe(401);
    expect(isHibaValasz(valasz.torzs)).toBe(true);
    if (isHibaValasz(valasz.torzs)) {
      expect(valasz.torzs.hiba).toBe("NINCS_BELEPVE");
    }
  });

  it("/api/fiok/en jo sutikival → 200, email, nev, szervezetek: []", async () => {
    const email = veletlenEmail();
    const regValasz = await keres<unknown>("/api/fiok/regisztracio", {
      modszer: "POST",
      torzs: { nev: "Teszt Elek", email, jelszo: "nagyonerosjelszo123" },
    });
    expect(regValasz.statusz).toBe(201);

    const belepValasz = await keres<unknown>("/api/fiok/belepes", {
      modszer: "POST",
      torzs: { email, jelszo: "nagyonerosjelszo123" },
    });
    expect(belepValasz.statusz).toBe(200);

    const sutiFejlec = belepValasz.sutik;
    const sutiErtekStr = sutiErtek(sutiFejlec, MUNKAMENET_SUTI);
    expect(sutiErtekStr).toBeDefined();

    const enValasz = await keres<unknown>("/api/fiok/en", {
      sutik: `${MUNKAMENET_SUTI}=${sutiErtekStr}`,
    });

    expect(enValasz.statusz).toBe(200);
    expect(isFiokNezet(enValasz.torzs)).toBe(true);
    if (isFiokNezet(enValasz.torzs)) {
      expect(enValasz.torzs.email).toBe(email);
      expect(enValasz.torzs.nev).toBe("Teszt Elek");
      expect(enValasz.torzs.szervezetek).toEqual([]);
    }
  });

  it("a suti HttpOnly es SameSite=Lax, Path=/", async () => {
    const email = veletlenEmail();
    const belepValasz = await keres<unknown>("/api/fiok/belepes", {
      modszer: "POST",
      torzs: { email, jelszo: "nagyonerosjelszo123" },
    });
    // Először regisztrálnunk kell
    if (belepValasz.statusz === 401) {
      await keres("/api/fiok/regisztracio", {
        modszer: "POST",
        torzs: { nev: "Teszt Elek", email, jelszo: "nagyonerosjelszo123" },
      });
      const ujBelep = await keres<unknown>("/api/fiok/belepes", {
        modszer: "POST",
        torzs: { email, jelszo: "nagyonerosjelszo123" },
      });
      expect(ujBelep.statusz).toBe(200);
      const sutiFejlec = ujBelep.sutik;
      expect(sutiTulajdonsagEllenoriz(sutiFejlec, MUNKAMENET_SUTI, "HttpOnly")).toBe(true);
      expect(sutiTulajdonsagEllenoriz(sutiFejlec, MUNKAMENET_SUTI, "SameSite=Lax")).toBe(true);
      expect(sutiTulajdonsagEllenoriz(sutiFejlec, MUNKAMENET_SUTI, "Path=/")).toBe(true);
    } else {
      const sutiFejlec = belepValasz.sutik;
      expect(sutiTulajdonsagEllenoriz(sutiFejlec, MUNKAMENET_SUTI, "HttpOnly")).toBe(true);
      expect(sutiTulajdonsagEllenoriz(sutiFejlec, MUNKAMENET_SUTI, "SameSite=Lax")).toBe(true);
      expect(sutiTulajdonsagEllenoriz(sutiFejlec, MUNKAMENET_SUTI, "Path=/")).toBe(true);
    }
  });

  it("szervezet letrehozasa sutik nelkul → 401", async () => {
    const valasz = await keres<unknown>("/api/szervezet", {
      modszer: "POST",
      torzs: { nev: "Teszt Szervezet" },
    });

    expect(valasz.statusz).toBe(401);
    expect(isHibaValasz(valasz.torzs)).toBe(true);
    if (isHibaValasz(valasz.torzs)) {
      expect(valasz.torzs.hiba).toBe("NINCS_BELEPVE");
    }
  });

  it("szervezet letrehozasa sutikival → 201 { id }, utana /api/fiok/en mutatja tulajdonos szereppel", async () => {
    const email = veletlenEmail();
    await keres("/api/fiok/regisztracio", {
      modszer: "POST",
      torzs: { nev: "Teszt Elek", email, jelszo: "nagyonerosjelszo123" },
    });

    const belepValasz = await keres<unknown>("/api/fiok/belepes", {
      modszer: "POST",
      torzs: { email, jelszo: "nagyonerosjelszo123" },
    });
    expect(belepValasz.statusz).toBe(200);
    const sutiFejlec = belepValasz.sutik;
    const sutiErtekStr = sutiErtek(sutiFejlec, MUNKAMENET_SUTI);
    expect(sutiErtekStr).toBeDefined();

    const szervValasz = await keres<unknown>("/api/szervezet", {
      modszer: "POST",
      torzs: { nev: "En Szervezetem" },
      sutik: `${MUNKAMENET_SUTI}=${sutiErtekStr}`,
    });

    expect(szervValasz.statusz).toBe(201);
    expect(isIdValasz(szervValasz.torzs)).toBe(true);
    let szervezetId = "";
    if (isIdValasz(szervValasz.torzs)) {
      szervezetId = szervValasz.torzs.id;
    }

    const enValasz = await keres<unknown>("/api/fiok/en", {
      sutik: `${MUNKAMENET_SUTI}=${sutiErtekStr}`,
    });

    expect(enValasz.statusz).toBe(200);
    expect(isFiokNezet(enValasz.torzs)).toBe(true);
    if (isFiokNezet(enValasz.torzs)) {
      expect(enValasz.torzs.szervezetek.length).toBe(1);
      expect(enValasz.torzs.szervezetek[0]?.id).toBe(szervezetId);
      expect(enValasz.torzs.szervezetek[0]?.nev).toBe("En Szervezetem");
      expect(enValasz.torzs.szervezetek[0]?.szerep).toBe("tulajdonos");
    }
  });

  it("ket kulon fiok ket kulon szervezetet hoz letre → egyik sem latja a masikat", async () => {
    const email1 = veletlenEmail();
    const email2 = veletlenEmail();

    // Első fiók
    await keres("/api/fiok/regisztracio", {
      modszer: "POST",
      torzs: { nev: "Elso Fiok", email: email1, jelszo: "nagyonerosjelszo123" },
    });
    const belep1 = await keres<unknown>("/api/fiok/belepes", {
      modszer: "POST",
      torzs: { email: email1, jelszo: "nagyonerosjelszo123" },
    });
    const suti1 = sutiErtek(belep1.sutik, MUNKAMENET_SUTI);

    // Második fiók
    await keres("/api/fiok/regisztracio", {
      modszer: "POST",
      torzs: { nev: "Masodik Fiok", email: email2, jelszo: "nagyonerosjelszo456" },
    });
    const belep2 = await keres<unknown>("/api/fiok/belepes", {
      modszer: "POST",
      torzs: { email: email2, jelszo: "nagyonerosjelszo456" },
    });
    const suti2 = sutiErtek(belep2.sutik, MUNKAMENET_SUTI);

    // Szervezetek létrehozása
    await keres("/api/szervezet", {
      modszer: "POST",
      torzs: { nev: "Elso Szervezet" },
      sutik: `${MUNKAMENET_SUTI}=${suti1}`,
    });
    await keres("/api/szervezet", {
      modszer: "POST",
      torzs: { nev: "Masodik Szervezet" },
      sutik: `${MUNKAMENET_SUTI}=${suti2}`,
    });

    // Ellenőrzés
    const en1 = await keres<unknown>("/api/fiok/en", {
      sutik: `${MUNKAMENET_SUTI}=${suti1}`,
    });
    const en2 = await keres<unknown>("/api/fiok/en", {
      sutik: `${MUNKAMENET_SUTI}=${suti2}`,
    });

    expect(en1.statusz).toBe(200);
    expect(en2.statusz).toBe(200);
    if (isFiokNezet(en1.torzs) && isFiokNezet(en2.torzs)) {
      expect(en1.torzs.szervezetek.length).toBe(1);
      expect(en2.torzs.szervezetek.length).toBe(1);
      expect(en1.torzs.szervezetek[0]?.nev).toBe("Elso Szervezet");
      expect(en2.torzs.szervezetek[0]?.nev).toBe("Masodik Szervezet");
    }
  });

  it("kilepes → 204, utana a regi sutikival /api/fiok/en → 401", async () => {
    const email = veletlenEmail();
    await keres("/api/fiok/regisztracio", {
      modszer: "POST",
      torzs: { nev: "Teszt Elek", email, jelszo: "nagyonerosjelszo123" },
    });
    const belepValasz = await keres<unknown>("/api/fiok/belepes", {
      modszer: "POST",
      torzs: { email, jelszo: "nagyonerosjelszo123" },
    });
    const sutiErtekStr = sutiErtek(belepValasz.sutik, MUNKAMENET_SUTI);

    const kilepValasz = await keres<unknown>("/api/fiok/kilepes", {
      modszer: "POST",
      sutik: `${MUNKAMENET_SUTI}=${sutiErtekStr}`,
    });
    expect(kilepValasz.statusz).toBe(204);

    const enValasz = await keres<unknown>("/api/fiok/en", {
      sutik: `${MUNKAMENET_SUTI}=${sutiErtekStr}`,
    });
    expect(enValasz.statusz).toBe(401);
    expect(isHibaValasz(enValasz.torzs)).toBe(true);
    if (isHibaValasz(enValasz.torzs)) {
      expect(enValasz.torzs.hiba).toBe("NINCS_BELEPVE");
    }
  });

  it("lejart munkamenet: kozvetlenul beszurt multbeli lejar-uu sor → 401, es a sor torlodott", async () => {
    const email = veletlenEmail();
    await keres("/api/fiok/regisztracio", {
      modszer: "POST",
      torzs: { nev: "Teszt Elek", email, jelszo: "nagyonerosjelszo123" },
    });

    const fiokSor = await sql<{ id: string }>("SELECT id FROM fiok WHERE email = $1", [email]);
    const fiokId = fiokSor[0]?.id;
    if (!fiokId) throw new Error("Fiok nem talalhato");

    const token = "teszt-token-12345";
    // SHA-256 hash a tokenből
    const crypto = await import("node:crypto");
    const tokenLenyomat = crypto.createHash("sha256").update(token).digest("hex");

    const multbeli = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 napja lejárt
    await sql(
      "INSERT INTO munkamenet (id, fiok_id, token_lenyomat, lejar, letrehozva) VALUES (gen_random_uuid(), $1, $2, $3, NOW())",
      [fiokId, tokenLenyomat, multbeli]
    );

    const munkamenetSorokElotte = await sql<{ id: string }>("SELECT id FROM munkamenet WHERE token_lenyomat = $1", [tokenLenyomat]);
    expect(munkamenetSorokElotte.length).toBe(1);

    const enValasz = await keres<unknown>("/api/fiok/en", {
      sutik: `${MUNKAMENET_SUTI}=${token}`,
    });

    expect(enValasz.statusz).toBe(401);
    expect(isHibaValasz(enValasz.torzs)).toBe(true);
    if (isHibaValasz(enValasz.torzs)) {
      expect(enValasz.torzs.hiba).toBe("NINCS_BELEPVE");
    }

    const munkamenetSorokUtana = await sql<{ id: string }>("SELECT id FROM munkamenet WHERE token_lenyomat = $1", [tokenLenyomat]);
    expect(munkamenetSorokUtana.length).toBe(0);
  });
});
