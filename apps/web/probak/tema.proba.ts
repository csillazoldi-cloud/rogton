import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { keres, veletlenEmail, sql, takaritas, lezar } from "./segedek";
import {
  SzervezetTemaAllapot,
  KozosTemaAllapot,
  TemaHiba,
  TOKEN_KULCSOK,
} from "@km/design-system";


/** A válasz `{ tema }` burka. */
function temaBol(torzs: unknown): unknown {
  return typeof torzs === "object" && torzs !== null && "tema" in torzs ? (torzs as { tema: unknown }).tema : torzs;
}

describe("tema ket szintje — kozos alap + szervezeti feluliras (E-13)", () => {
  let aSutik: string;
  let aEmail: string;
  let aFiokId: string;
  let aSzervezetId: string;

  let bSutik: string;
  let bSzervezetId: string;

  let cSutik: string;
  let cSzervezetId: string;

  let szerkesztoSutik: string;
  let szerkesztoFiokId: string;

  let alapBgErtek: string;
  let alapPrimaryErtek: string;

  const jelszo = "ProbaJelszo123!";

  async function fiokLetrehozas(): Promise<{ sutik: string; fiokId: string; szervezetId: string; email: string }> {
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

    return { sutik, fiokId, szervezetId, email };
  }

  beforeAll(async () => {
    // A fiók és szervezet
    const a = await fiokLetrehozas();
    aSutik = a.sutik;
    aFiokId = a.fiokId;
    aSzervezetId = a.szervezetId;
    aEmail = a.email;

    // B fiók és szervezet
    const b = await fiokLetrehozas();
    bSutik = b.sutik;
    bSzervezetId = b.szervezetId;

    // C fiók és szervezet
    const c = await fiokLetrehozas();
    cSutik = c.sutik;
    cSzervezetId = c.szervezetId;

    // Szerkesztő fiók (saját szervezet nélkül, aztán A-ba szerkesztőként)
    const szerkesztoEmail = veletlenEmail();
    const szerkesztoReg = await keres("/api/fiok/regisztracio", {
      modszer: "POST",
      torzs: { nev: "Proba Szerkeszto", email: szerkesztoEmail, jelszo },
    });
    expect(szerkesztoReg.statusz).toBe(201);

    const szerkesztoBelepes = await keres("/api/fiok/belepes", {
      modszer: "POST",
      torzs: { email: szerkesztoEmail, jelszo },
    });
    expect(szerkesztoBelepes.statusz).toBe(200);
    szerkesztoSutik = szerkesztoBelepes.sutik.join("; ");

    const szerkesztoEn = await keres<unknown>("/api/fiok/en", { sutik: szerkesztoSutik });
    expect(szerkesztoEn.statusz).toBe(200);
    const szerkesztoTorzs = szerkesztoEn.torzs as { id: string };
    szerkesztoFiokId = szerkesztoTorzs.id;

    // Szerkesztő az A szervezetbe
    await sql(
      "INSERT INTO tagsag (szervezet_id, fiok_id, szerep) VALUES ($1, $2, 'szerkeszto')",
      [aSzervezetId, szerkesztoFiokId],
    );

    // Alap értékek lekérdezése C-vel (még nincs felülírás)
    const temaC = await keres<unknown>("/api/tema", { sutik: cSutik });
    expect(temaC.statusz).toBe(200);
    const cTema = SzervezetTemaAllapot.parse(temaBol(temaC.torzs));
    alapBgErtek = cTema.alap["--bg"];
    alapPrimaryErtek = cTema.alap["--primary"];
  });

  afterAll(async () => {
    // Ellenőrzés: a tema táblában pontosan egy 'alkalmazott' maradt, és az eredeti --bg él
    const temaSorok = await sql<{ allapot: string; definicio: { tokens: Record<string, string> } }>(
      "SELECT allapot, definicio FROM tema WHERE allapot = 'alkalmazott'",
    );
    expect(temaSorok).toHaveLength(1);
    expect(temaSorok[0]!.definicio.tokens["--bg"]).toBe(alapBgErtek);

    await takaritas();
    await lezar();
  });

  it("1. GET /api/tema suti nelkul 401; szervezet nelkuli fiokkal 409", async () => {
    const sutiNelkul = await keres<unknown>("/api/tema");
    expect(sutiNelkul.statusz).toBe(401);

    // Szervezet nélküli fiók létrehozása
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
    const nelkuliSutik = belepNelkul.sutik.join("; ");

    const szervezetNelkuli = await keres<unknown>("/api/tema", { sutik: nelkuliSutik });
    expect(szervezetNelkuli.statusz).toBe(409);
  });

  it("2. A: GET /api/tema → 200, alap minden token, nincs alkalmazott/tervezet, hatasos = alap", async () => {
    const valasz = await keres<unknown>("/api/tema", { sutik: aSutik });
    expect(valasz.statusz).toBe(200);

    const tema = SzervezetTemaAllapot.parse(temaBol(valasz.torzs));
    expect(Object.keys(tema.alap)).toHaveLength(TOKEN_KULCSOK.length);
    expect(tema.alkalmazott).toBeNull();
    expect(tema.tervezet).toBeNull();
    expect(tema.verziok).toHaveLength(0);
    expect(tema.hatasos).toEqual(tema.alap);
  });

  it("3. A: PUT tervezet reszleges + ismeretlen → 200, felulirasok csak az eltero, figyelmen_kivul, hatasos meg alap", async () => {
    const elsoTema = await keres<unknown>("/api/tema", { sutik: aSutik });
    const alap = SzervezetTemaAllapot.parse(temaBol(elsoTema.torzs)).alap;

    const valasz = await keres<unknown>("/api/tema", {
      modszer: "PUT",
      sutik: aSutik,
      torzs: {
        $schema: "km-theme/2",
        tokens: {
          "--primary": "#ff0000",
          "--r-btn": "0px",
          "--bg": alap["--bg"],
          "--nincs-ilyen": "x",
        },
      },
    });
    expect(valasz.statusz).toBe(200);

    const tema = SzervezetTemaAllapot.parse(temaBol(valasz.torzs));
    expect(tema.tervezet).not.toBeNull();
    expect(tema.tervezet!.verzio).toBe(1);
    expect(tema.tervezet!.felulirasok).toEqual({
      "--primary": "#ff0000",
      "--r-btn": "0px",
    });
    expect(tema.alkalmazott).toBeNull();
    expect(tema.hatasos["--primary"]).toBe(alap["--primary"]);

    // figyelmen_kivul ellenőrzése a válaszban (nem része a sémának, de a válaszban kell legyen)
    const nyers = temaBol(valasz.torzs) as { figyelmen_kivul?: string[] };
    expect(nyers.figyelmen_kivul).toEqual(["--nincs-ilyen"]);
  });

  it("4. A: PUT masodszor uj primary → 200, felulirasok csak az uj, verzio 1 (felulirta)", async () => {
    const valasz = await keres<unknown>("/api/tema", {
      modszer: "PUT",
      sutik: aSutik,
      torzs: {
        $schema: "km-theme/2",
        tokens: { "--primary": "#00ff00" },
      },
    });
    expect(valasz.statusz).toBe(200);

    const tema = SzervezetTemaAllapot.parse(temaBol(valasz.torzs));
    expect(tema.tervezet!.verzio).toBe(1);
    expect(tema.tervezet!.felulirasok).toEqual({ "--primary": "#00ff00" });
    expect(tema.tervezet!.felulirasok).not.toHaveProperty("--r-btn");
  });

  it("5. A: PUT hibas → 400 ERVENYTELEN_ADAT, 3 hiba; GET utan tervezet nem valtozott", async () => {
    const valasz = await keres<unknown>("/api/tema", {
      modszer: "PUT",
      sutik: aSutik,
      torzs: {
        $schema: "km-theme/2",
        tokens: {
          "--primary": "piros",
          "--fs-base": "99px",
          "--motion": "gyors",
        },
      },
    });
    expect(valasz.statusz).toBe(400);

    const nyers = valasz.torzs as { hiba: string; tema_hibak: unknown[]; figyelmen_kivul?: string[] };
    expect(nyers.hiba).toBe("ERVENYTELEN_ADAT");
    expect(nyers.tema_hibak).toHaveLength(3);

    const hibak = nyers.tema_hibak.map((h) => TemaHiba.parse(h));
    const primaryHiba = hibak.find((h) => h.token === "--primary");
    const fsBaseHiba = hibak.find((h) => h.token === "--fs-base");
    const motionHiba = hibak.find((h) => h.token === "--motion");

    expect(primaryHiba?.kod).toBe("badColor");
    expect(fsBaseHiba?.kod).toBe("outOfRange");
    expect(fsBaseHiba?.parameterek.min).toBe(12);
    expect(fsBaseHiba?.parameterek.max).toBe(20);
    expect(motionHiba?.kod).toBe("badEnum");

    // GET ellenőrzés: tervezet nem változott
    const getValasz = await keres<unknown>("/api/tema", { sutik: aSutik });
    expect(getValasz.statusz).toBe(200);
    const getTema = SzervezetTemaAllapot.parse(temaBol(getValasz.torzs));
    expect(getTema.tervezet!.felulirasok).toEqual({ "--primary": "#00ff00" });
  });

  it("6. A: PUT rossz sema → 400 badVersion; PUT nem-JSON → 400", async () => {
    const rosszSema = await keres<unknown>("/api/tema", {
      modszer: "PUT",
      sutik: aSutik,
      torzs: {
        $schema: "km-theme/1",
        tokens: {},
      },
    });
    expect(rosszSema.statusz).toBe(400);
    const rosszNyers = rosszSema.torzs as { tema_hibak: unknown[] };
    const rosszHibak = rosszNyers.tema_hibak.map((h) => TemaHiba.parse(h));
    expect(rosszHibak[0]!.kod).toBe("badVersion");

    const nemJson = await keres<unknown>("/api/tema", {
      modszer: "PUT",
      sutik: aSutik,
      torzs: "nem json",
    });
    expect(nemJson.statusz).toBe(400);
  });

  it("7. Szerkeszto: GET 200, PUT 403, alkalmaz 403", async () => {
    const getValasz = await keres<unknown>("/api/tema", { sutik: szerkesztoSutik });
    expect(getValasz.statusz).toBe(200);

    const putValasz = await keres<unknown>("/api/tema", {
      modszer: "PUT",
      sutik: szerkesztoSutik,
      torzs: { $schema: "km-theme/2", tokens: { "--primary": "#ff0000" } },
    });
    expect(putValasz.statusz).toBe(403);
    const putNyers = putValasz.torzs as { hiba: string };
    expect(putNyers.hiba).toBe("NINCS_JOG");

    const alkalmazValasz = await keres<unknown>("/api/tema/alkalmaz", {
      modszer: "POST",
      sutik: szerkesztoSutik,
    });
    expect(alkalmazValasz.statusz).toBe(403);
    const alkNyers = alkalmazValasz.torzs as { hiba: string };
    expect(alkNyers.hiba).toBe("NINCS_JOG");
  });

  it("8. B: alkalmaz tervezet nelkul 409; DELETE tervezet nelkul 409", async () => {
    const alkalmazValasz = await keres<unknown>("/api/tema/alkalmaz", {
      modszer: "POST",
      sutik: bSutik,
    });
    expect(alkalmazValasz.statusz).toBe(409);
    const alkNyers = alkalmazValasz.torzs as { hiba: string };
    expect(alkNyers.hiba).toBe("NINCS_TERVEZET");

    const deleteValasz = await keres<unknown>("/api/tema", {
      modszer: "DELETE",
      sutik: bSutik,
    });
    expect(deleteValasz.statusz).toBe(409);
  });

  it("9. A: alkalmaz → 200, alkalmazott.verzio 1, hatasos primary zold, verziok 1 elem, SQL ellenorzes", async () => {
    const alkalmazValasz = await keres<unknown>("/api/tema/alkalmaz", {
      modszer: "POST",
      sutik: aSutik,
    });
    expect(alkalmazValasz.statusz).toBe(200);

    const tema = SzervezetTemaAllapot.parse(temaBol(alkalmazValasz.torzs));
    expect(tema.alkalmazott).not.toBeNull();
    expect(tema.alkalmazott!.verzio).toBe(1);
    expect(tema.alkalmazott!.felulirasok["--primary"]).toBe("#00ff00");
    expect(tema.tervezet).toBeNull();
    expect(tema.hatasos["--primary"]).toBe("#00ff00");
    expect(tema.hatasos["--bg"]).toBe(tema.alap["--bg"]);
    expect(tema.verziok).toHaveLength(1);
    expect(tema.verziok[0]!.allapot).toBe("alkalmazott");
    expect(tema.verziok[0]!.alkalmazva).not.toBeNull();
    expect(typeof tema.verziok[0]!.alkalmazva).toBe("string");

    // SQL ellenőrzés
    const sorok = await sql<{ allapot: string; verzio: number }>(
      "SELECT allapot, verzio FROM szervezet_tema WHERE szervezet_id = $1",
      [aSzervezetId],
    );
    expect(sorok).toHaveLength(1);
    expect(sorok[0]!.allapot).toBe("alkalmazott");
    expect(sorok[0]!.verzio).toBe(1);
  });

  it("10. B: kulonbozo feluliras, elvalasztas A/B/C kozott", async () => {
    // B tervezet és alkalmazás
    const bPut = await keres<unknown>("/api/tema", {
      modszer: "PUT",
      sutik: bSutik,
      torzs: { $schema: "km-theme/2", tokens: { "--primary": "#0000ff" } },
    });
    expect(bPut.statusz).toBe(200);

    const bAlkalmaz = await keres<unknown>("/api/tema/alkalmaz", {
      modszer: "POST",
      sutik: bSutik,
    });
    expect(bAlkalmaz.statusz).toBe(200);

    // A ellenőrzés
    const aTemaValasz = await keres<unknown>("/api/tema", { sutik: aSutik });
    const aTema = SzervezetTemaAllapot.parse(temaBol(aTemaValasz.torzs));
    expect(aTema.hatasos["--primary"]).toBe("#00ff00");

    // B ellenőrzés
    const bTemaValasz = await keres<unknown>("/api/tema", { sutik: bSutik });
    const bTema = SzervezetTemaAllapot.parse(temaBol(bTemaValasz.torzs));
    expect(bTema.hatasos["--primary"]).toBe("#0000ff");

    // C ellenőrzés (nincs felülírás)
    const cTemaValasz = await keres<unknown>("/api/tema", { sutik: cSutik });
    const cTema = SzervezetTemaAllapot.parse(temaBol(cTemaValasz.torzs));
    expect(cTema.alkalmazott).toBeNull();
    expect(cTema.hatasos["--primary"]).toBe(cTema.alap["--primary"]);
  });

  function primaryKinyer(html: string): string | null {
    const m = /<style id="km-tokenek">([^<]*)<\/style>/.exec(html);
    if (!m) return null;
    const stilus = m[1]!;
    const pm = /--primary:\s*([^;]+)/.exec(stilus);
    return pm ? pm[1]!.trim() : null;
  }

  it("11. Lap feje: HTML-ben a hatasos tokenek", async () => {
    // A sütijével /fiok
    const aFiokHtml = await keres<string>("/fiok", { sutik: aSutik });
    expect(aFiokHtml.statusz).toBe(200);
    expect(primaryKinyer(aFiokHtml.torzs)).toBe("#00ff00");

    // B sütijével /fiok
    const bFiokHtml = await keres<string>("/fiok", { sutik: bSutik });
    expect(bFiokHtml.statusz).toBe(200);
    expect(primaryKinyer(bFiokHtml.torzs)).toBe("#0000ff");

    // C sütijével /fiok
    const cFiokHtml = await keres<string>("/fiok", { sutik: cSutik });
    expect(cFiokHtml.statusz).toBe(200);
    expect(primaryKinyer(cFiokHtml.torzs)).toBe(alapPrimaryErtek);

    // Süti nélkül /belepes
    const belepesHtml = await keres<string>("/belepes");
    expect(belepesHtml.statusz).toBe(200);
    expect(primaryKinyer(belepesHtml.torzs)).toBe(alapPrimaryErtek);
  });

  it("12. A: masodik tervezet + alkalmaz, visszaallitas, ujra alkalmaz, hibas visszaallitas", async () => {
    // Második tervezet
    const put2 = await keres<unknown>("/api/tema", {
      modszer: "PUT",
      sutik: aSutik,
      torzs: { $schema: "km-theme/2", tokens: { "--primary": "#123456" } },
    });
    expect(put2.statusz).toBe(200);

    // Alkalmazás
    const alk2 = await keres<unknown>("/api/tema/alkalmaz", {
      modszer: "POST",
      sutik: aSutik,
    });
    expect(alk2.statusz).toBe(200);
    const tema2 = SzervezetTemaAllapot.parse(temaBol(alk2.torzs));
    expect(tema2.alkalmazott!.verzio).toBe(2);
    expect(tema2.verziok).toHaveLength(2);
    const v1Fej = tema2.verziok.find((v) => v.verzio === 1);
    expect(v1Fej?.allapot).toBe("korabbi");
    const v2Fej = tema2.verziok.find((v) => v.verzio === 2);
    expect(v2Fej?.allapot).toBe("alkalmazott");

    // Visszaállítás verzió 1-re
    const vissza1 = await keres<unknown>("/api/tema/visszaallit", {
      modszer: "POST",
      sutik: aSutik,
      torzs: { verzio: 1 },
    });
    expect(vissza1.statusz).toBe(200);
    const visszaTema = SzervezetTemaAllapot.parse(temaBol(vissza1.torzs));
    expect(visszaTema.tervezet!.verzio).toBe(3);
    expect(visszaTema.tervezet!.felulirasok["--primary"]).toBe("#00ff00");
    expect(visszaTema.alkalmazott!.verzio).toBe(2); // nem változott

    // Alkalmazás: verzió 3 lesz éles
    const alk3 = await keres<unknown>("/api/tema/alkalmaz", {
      modszer: "POST",
      sutik: aSutik,
    });
    expect(alk3.statusz).toBe(200);
    const tema3 = SzervezetTemaAllapot.parse(temaBol(alk3.torzs));
    expect(tema3.alkalmazott!.verzio).toBe(3);
    expect(tema3.hatasos["--primary"]).toBe("#00ff00");

    // Hibás visszaállítások
    const nincsIlyen = await keres<unknown>("/api/tema/visszaallit", {
      modszer: "POST",
      sutik: aSutik,
      torzs: { verzio: 99 },
    });
    expect(nincsIlyen.statusz).toBe(404);
    const nincsNyers = nincsIlyen.torzs as { hiba: string };
    expect(nincsNyers.hiba).toBe("NINCS_ILYEN_VERZIO");

    const rosszTipus = await keres<unknown>("/api/tema/visszaallit", {
      modszer: "POST",
      sutik: aSutik,
      torzs: { verzio: "x" },
    });
    expect(rosszTipus.statusz).toBe(400);
  });

  it("13. A: PUT tervezet, DELETE → tervezet torlodik, alkalmazott valtozatlan, SQL korabbi", async () => {
    const putTerv = await keres<unknown>("/api/tema", {
      modszer: "PUT",
      sutik: aSutik,
      torzs: { $schema: "km-theme/2", tokens: { "--accent": "#abcdef" } },
    });
    expect(putTerv.statusz).toBe(200);

    const torles = await keres<unknown>("/api/tema", {
      modszer: "DELETE",
      sutik: aSutik,
    });
    expect(torles.statusz).toBe(200);
    const torlesTema = SzervezetTemaAllapot.parse(temaBol(torles.torzs));
    expect(torlesTema.tervezet).toBeNull();
    expect(torlesTema.alkalmazott!.verzio).toBe(3);

    // SQL: a sor állapota 'korabbi' (nem törlődött)
    const sorok = await sql<{ allapot: string }>(
      "SELECT allapot FROM szervezet_tema WHERE szervezet_id = $1 ORDER BY verzio DESC",
      [aSzervezetId],
    );
    // A legfrissebb verzió (3) alkalmazott, a korábbiak korabbi
    const korabbiSorok = sorok.filter((s) => s.allapot === "korabbi");
    expect(korabbiSorok.length).toBeGreaterThanOrEqual(1);
  });

  it("14. A: PUT alap keszlettel → felulirasok ures, alkalmaz utan hatasos = alap", async () => {
    const elsoTema = await keres<unknown>("/api/tema", { sutik: aSutik });
    const alap = SzervezetTemaAllapot.parse(temaBol(elsoTema.torzs)).alap;

    const putAlap = await keres<unknown>("/api/tema", {
      modszer: "PUT",
      sutik: aSutik,
      torzs: { $schema: "km-theme/2", tokens: alap },
    });
    expect(putAlap.statusz).toBe(200);
    const putTema = SzervezetTemaAllapot.parse(temaBol(putAlap.torzs));
    expect(putTema.tervezet!.felulirasok).toEqual({});

    const alkalmazAlap = await keres<unknown>("/api/tema/alkalmaz", {
      modszer: "POST",
      sutik: aSutik,
    });
    expect(alkalmazAlap.statusz).toBe(200);
    const alkTema = SzervezetTemaAllapot.parse(temaBol(alkalmazAlap.torzs));
    expect(alkTema.hatasos).toEqual(alap);
  });

  it("15. Kozos alap: nem rendszergazda 403, rendszergazda GET/PUT/alkalmaz, C-nel uj alap", async () => {
    // Nem rendszergazda próbák
    const nemRgGet = await keres<unknown>("/api/tema/kozos", { sutik: aSutik });
    expect(nemRgGet.statusz).toBe(403);

    const nemRgPut = await keres<unknown>("/api/tema/kozos", {
      modszer: "PUT",
      sutik: aSutik,
      torzs: { $schema: "km-theme/2", tokens: { "--bg": "#101010" } },
    });
    expect(nemRgPut.statusz).toBe(403);

    // Rendszergazdává tétel
    await sql("UPDATE fiok SET rendszergazda = true WHERE email = $1", [aEmail]);

    // GET
    const rgGet = await keres<unknown>("/api/tema/kozos", { sutik: aSutik });
    expect(rgGet.statusz).toBe(200);
    const kozosTema = KozosTemaAllapot.parse(temaBol(rgGet.torzs));
    expect(kozosTema.alkalmazott.verzio).toBeGreaterThanOrEqual(1);
    expect(Object.keys(kozosTema.alkalmazott.tokenek)).toHaveLength(TOKEN_KULCSOK.length);
    expect(kozosTema.tervezet).toBeNull();

    // PUT (részleges)
    const rgPut = await keres<unknown>("/api/tema/kozos", {
      modszer: "PUT",
      sutik: aSutik,
      torzs: { $schema: "km-theme/2", tokens: { "--bg": "#101010" } },
    });
    expect(rgPut.statusz).toBe(200);
    const putKozos = KozosTemaAllapot.parse(temaBol(rgPut.torzs));
    expect(putKozos.tervezet!.tokenek["--bg"]).toBe("#101010");
    expect(Object.keys(putKozos.tervezet!.tokenek)).toHaveLength(TOKEN_KULCSOK.length);

    // Alkalmazás
    const rgAlkalmaz = await keres<unknown>("/api/tema/kozos/alkalmaz", {
      modszer: "POST",
      sutik: aSutik,
    });
    expect(rgAlkalmaz.statusz).toBe(200);
    const alkKozos = KozosTemaAllapot.parse(temaBol(rgAlkalmaz.torzs));
    expect(alkKozos.alkalmazott.tokenek["--bg"]).toBe("#101010");
    expect(alkKozos.verziok.some((v) => v.allapot === "korabbi")).toBe(true);

    // SQL: pontosan egy 'alkalmazott' a tema táblában
    const temaSorok = await sql<{ allapot: string }>(
      "SELECT allapot FROM tema WHERE allapot = 'alkalmazott'",
    );
    expect(temaSorok).toHaveLength(1);

    // C-nél az új alap érvényes, de A saját felülírása megmaradt
    const cTemaValasz = await keres<unknown>("/api/tema", { sutik: cSutik });
    const cTema = SzervezetTemaAllapot.parse(temaBol(cTemaValasz.torzs));
    expect(cTema.alap["--bg"]).toBe("#101010");
    expect(cTema.hatasos["--bg"]).toBe("#101010");

    const aTemaValasz = await keres<unknown>("/api/tema", { sutik: aSutik });
    const aTema = SzervezetTemaAllapot.parse(temaBol(aTemaValasz.torzs));
    // A-nak nincs érvényes felülírása (az alap készletet alkalmaztuk az előzőben)
    // De az alap változott
    expect(aTema.hatasos["--bg"]).toBe("#101010");
  });

  it("16. Kozos visszaallitas: eredeti verzio vissza, alkalmaz, rendszergazda visszavetel", async () => {
    // Eredeti alkalmazott verzió megtalálása
    const rgGet = await keres<unknown>("/api/tema/kozos", { sutik: aSutik });
    const kozosTema = KozosTemaAllapot.parse(temaBol(rgGet.torzs));
    const eredetiVerzio = kozosTema.alkalmazott.verzio;

    // Keressük meg az eredeti verziót (az első alkalmazottat, ami nem a mostani)
    // A visszaállítás az eredeti --bg-hez (a beforeAll-ban lekérdezett alapBgErtek)
    // Mivel az eredeti verzió a 15. lépés előtti, a verziok listában keressük
    const korabbiVerzio = kozosTema.verziok
      .filter((v) => v.allapot === "korabbi")
      .map((v) => v.verzio)
      .sort((a, b) => a - b)[0];

    expect(korabbiVerzio).toBeDefined();

    const visszaallit = await keres<unknown>("/api/tema/kozos/visszaallit", {
      modszer: "POST",
      sutik: aSutik,
      torzs: { verzio: korabbiVerzio },
    });
    expect(visszaallit.statusz).toBe(200);
    const visszaKozos = KozosTemaAllapot.parse(temaBol(visszaallit.torzs));
    expect(visszaKozos.tervezet).not.toBeNull();

    // Alkalmazás az eredetire
    const alkEredeti = await keres<unknown>("/api/tema/kozos/alkalmaz", {
      modszer: "POST",
      sutik: aSutik,
    });
    expect(alkEredeti.statusz).toBe(200);
    const eredetiKozos = KozosTemaAllapot.parse(temaBol(alkEredeti.torzs));
    expect(eredetiKozos.alkalmazott.tokenek["--bg"]).toBe(alapBgErtek);

    // Rendszergazda visszavétel
    await sql("UPDATE fiok SET rendszergazda = false WHERE email = $1", [aEmail]);
  });
});
