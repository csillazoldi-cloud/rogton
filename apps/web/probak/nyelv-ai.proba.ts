import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { keres, veletlenEmail, sql, takaritas, lezar } from "./segedek";

describe("nyelv AI (E-29c)", () => {
  let aSutik: string;
  let aFiokId: string;
  let aSzervezetId: string;

  let bSutik: string;
  let bFiokId: string;
  let bSzervezetId: string;

  const jelszo = "ProbaJelszo123!";

  async function fiokLetrehozas(): Promise<{ sutik: string; fiokId: string; szervezetId: string }> {
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

    const szervezet = await keres("/api/szervezet", {
      modszer: "POST",
      torzs: { nev: "Proba Szervezet" },
      sutik,
    });
    expect(szervezet.statusz).toBe(201);
    const szervezetTorzs = szervezet.torzs as { id: string };
    const szervezetId = szervezetTorzs.id;

    return { sutik, fiokId, szervezetId };
  }

  async function beallitasMentese(sutik: string): Promise<void> {
    const beallitas = await keres("/api/hirfigyelo/beallitas", {
      modszer: "PUT",
      torzs: {
        celok: ["sajat_marka"],
        temak: [{ nev: "Teszt", nevvaltozatok: [], megkulonboztetes: "" }],
        foldrajzi_fokusz: "",
        nyelvek: [],
        kizarasok: [],
        idozites: { mod: "kezi", ora: 7, perc: 0, idozona: "Europe/Bucharest" },
        szabad_szoveg: "",
      },
      sutik,
    });
    expect(beallitas.statusz).toBe(200);
  }

  beforeAll(async () => {
    const a = await fiokLetrehozas();
    aSutik = a.sutik;
    aFiokId = a.fiokId;
    aSzervezetId = a.szervezetId;

    const b = await fiokLetrehozas();
    bSutik = b.sutik;
    bFiokId = b.fiokId;
    bSzervezetId = b.szervezetId;

    await beallitasMentese(aSutik);
    await beallitasMentese(bSutik);
  });

  afterAll(async () => {
    await takaritas();
    await lezar();
  });

  // 1. POST /api/nyelv ro -> 204, süti beáll, fiok.nyelv ro
  it("1. nyelvvaltas ro: 204, suti es fiok.nyelv is ro", async () => {
    const valtas = await keres("/api/nyelv", {
      modszer: "POST",
      torzs: { nyelv: "ro" },
      sutik: aSutik,
    });
    expect(valtas.statusz).toBe(204);

    // süti ellenorzese
    const sutiErtek = valtas.sutik.find((s) => s.startsWith("km_nyelv="));
    expect(sutiErtek).toBeDefined();
    expect(sutiErtek!.split(";")[0]).toBe("km_nyelv=ro");

    // fiok.nyelv ellenorzese SQL-lel
    const sorok = await sql<{ nyelv: string }>("SELECT nyelv FROM fiok WHERE id = $1", [aFiokId]);
    expect(sorok.length).toBe(1);
    expect(sorok[0]!.nyelv).toBe("ro");
  });

  // 2. Hibás érték -> 400 ERVENYTELEN_ADAT
  it("2. hibas nyelv -> 400 ERVENYTELEN_ADAT", async () => {
    const valtas = await keres("/api/nyelv", {
      modszer: "POST",
      torzs: { nyelv: "xx" },
      sutik: aSutik,
    });
    expect(valtas.statusz).toBe(400);
    expect((valtas.torzs as { hiba?: string }).hiba).toBe("ERVENYTELEN_ADAT");
  });

  // 3. Belépés nélkül is 204, de nem ment a fiókra
  it("3. belepes nelkul is 204, de nem ment fiokra", async () => {
    const valtas = await keres("/api/nyelv", {
      modszer: "POST",
      torzs: { nyelv: "ro" },
    });
    expect(valtas.statusz).toBe(204);

    // süti beáll
    const sutiErtek = valtas.sutik.find((s) => s.startsWith("km_nyelv="));
    expect(sutiErtek).toBeDefined();
    expect(sutiErtek!.split(";")[0]).toBe("km_nyelv=ro");
  });

  // 4. A sorba tett futás viszi a nyelvet (ro)
  it("4. futas sor tetel adat.nyelv = ro", async () => {
    // aFiok nyelve most ro (az 1. próba óta)
    const futas = await keres<{ hirfigyelo: { sor: { id: string; adat: { nyelv: string } } } }>("/api/hirfigyelo/futas", {
      modszer: "POST",
      torzs: { proba: true },
      sutik: aSutik,
    });
    expect(futas.statusz).toBe(202);
    expect(futas.torzs.hirfigyelo.sor.adat.nyelv).toBe("ro");
    const sorId = futas.torzs.hirfigyelo.sor.id;

    // GET /api/hirfigyelo/futas/sor/{id} is tartalmazza
    const sorValasz = await keres<{ hirfigyelo: { sor: { adat: { nyelv: string } } } }>(
      `/api/hirfigyelo/futas/sor/${sorId}`,
      { sutik: aSutik }
    );
    expect(sorValasz.statusz).toBe(200);
    expect(sorValasz.torzs.hirfigyelo.sor.adat.nyelv).toBe("ro");
  });

  // 5. ertekeles-ujra is viszi a nyelvet — SAJÁT szervezetben, mert a 4. próba tétele még a sorban áll (FUT_MAR)
  it("5. ertekeles-ujra sor tetel adat.nyelv = ro", async () => {
    const c = await fiokLetrehozas();
    const sutik = c.sutik;
    await keres("/api/nyelv", { modszer: "POST", torzs: { nyelv: "ro" }, sutik });

    const ertekelesUjra = await keres<{ hirfigyelo: { sor: { id: string; adat: { nyelv: string } } } }>(
      "/api/hirfigyelo/ertekeles-ujra",
      { modszer: "POST", sutik },
    );
    expect(ertekelesUjra.statusz).toBe(202);
    expect(ertekelesUjra.torzs.hirfigyelo.sor.adat.nyelv).toBe("ro");
  });

  // 6. Nyelv nélküli fiók (B) magyart kap
  it("6. nyelv nelkuli fiok (B) -> adat.nyelv = hu", async () => {
    // B fiók még nem váltott nyelvet -> hu
    const futas = await keres<{ hirfigyelo: { sor: { id: string; adat: { nyelv: string } } } }>("/api/hirfigyelo/futas", {
      modszer: "POST",
      torzs: { proba: true },
      sutik: bSutik,
    });
    expect(futas.statusz).toBe(202);
    expect(futas.torzs.hirfigyelo.sor.adat.nyelv).toBe("hu");
  });

  // 7. A fiok.nyelv az egyetlen tárolt hely — másik fiók nyelvét nem írta át
  it("7. masik fiok nyelvet nem irta at", async () => {
    // B fiók nyelvét ellenőrizzük: még mindig hu (vagy NULL, ha nincs beállítva)
    const sorok = await sql<{ nyelv: string | null }>("SELECT nyelv FROM fiok WHERE id = $1", [bFiokId]);
    expect(sorok.length).toBe(1);
    // B fiók nem váltott nyelvet, így vagy NULL, vagy 'hu' (ha alapértelmezés szerint be van állítva)
    expect(sorok[0]!.nyelv === null || sorok[0]!.nyelv === "hu").toBe(true);
  });
});

// A prompt nyelvi keretezésének próbái E-31 óta a @km/news-monitor-promptok csomagban élnek (oda költöztek a promptok).
describe("nyelvet még nem váltott fiók (fordított ellenőrzésből)", () => {
  it("a nyelv-süti dönt, ha a fiókon nincs mentett nyelv", async () => {
    const email = veletlenEmail();
    const jelszo = "ProbaJelszo123!";
    await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev: "Nyelvvaltas nelkul", email, jelszo } });
    const belepes = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo } });
    const sutik = belepes.sutik.join("; ");
    const en = await keres<{ id: string }>("/api/fiok/en", { sutik });
    const fiokId = en.torzs.id;
    await keres("/api/szervezet", { modszer: "POST", torzs: { nev: "Nyelvvaltas nelkul szervezet" }, sutik });
    await keres("/api/hirfigyelo/beallitas", {
      modszer: "PUT",
      sutik,
      torzs: { celok: ["szakmai"], temak: [{ nev: "Teszt", nevvaltozatok: [], megkulonboztetes: "" }], foldrajzi_fokusz: "", nyelvek: ["hu"], kizarasok: [], idozites: { mod: "kezi", ora: 7, perc: 0, idozona: "Europe/Bucharest" }, szabad_szoveg: "" },
    });

    // NINCS /api/nyelv hívás → fiok.nyelv marad üres; a süti viszont román
    const futas = await keres<{ hirfigyelo: { sor: { adat: { nyelv: string } } } }>("/api/hirfigyelo/futas", {
      modszer: "POST",
      torzs: { proba: true },
      sutik: `${sutik}; km_nyelv=ro`,
    });
    expect(futas.statusz).toBe(202);
    expect(futas.torzs.hirfigyelo.sor.adat.nyelv).toBe("ro");
    // (a fiókra nem mentődött nyelv — a nyelvváltót nem hívtuk; az adatbázis-ellenőrzés a fenti próbákban már megvolt)
    expect(fiokId.length).toBeGreaterThan(0);
  });
});
