import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { keres, veletlenEmail, sql, takaritas, lezar } from "./segedek";

const PROBA_RSS = process.env.PROBA_RSS ?? "https://marosvasarhelyiek.ro/feed";

describe("hirfigyelo API (E-22)", () => {
  let aSutik: string;
  let aFiokId: string;
  let aSzervezetId: string;

  let bSutik: string;
  let bSzervezetId: string;

  let nezoSutik: string;
  let nezoFiokId: string;

  let szervezetNelkuliSutik: string;

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

  async function varjMeg(sorId: string, sutik: string): Promise<{ allapot: string; eredmeny?: { futas_id?: string } }> {
    const hatarido = Date.now() + 90000;
    while (Date.now() < hatarido) {
      const valasz = await keres<{ hirfigyelo: { sor: { allapot: string; eredmeny?: { futas_id?: string } } } }>(
        `/api/hirfigyelo/futas/sor/${sorId}`,
        { sutik }
      );
      expect(valasz.statusz).toBe(200);
      const sor = valasz.torzs.hirfigyelo.sor;
      if (sor.allapot === "kesz" || sor.allapot === "hiba") {
        return sor;
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    throw new Error("Időtúllépés: a sor nem ért véget 90 mp alatt");
  }

  beforeAll(async () => {
    // A szervezet (tulajdonos)
    const a = await fiokLetrehozas();
    aSutik = a.sutik;
    aFiokId = a.fiokId;
    aSzervezetId = a.szervezetId;

    // B szervezet (masik tulajdonos, elvalasztashoz)
    const b = await fiokLetrehozas();
    bSutik = b.sutik;
    bSzervezetId = b.szervezetId;

    // Szervezet nelkuli fiok
    const sznEmail = veletlenEmail();
    const sznReg = await keres("/api/fiok/regisztracio", {
      modszer: "POST",
      torzs: { nev: "Proba SzervezetNelkuli", email: sznEmail, jelszo },
    });
    expect(sznReg.statusz).toBe(201);
    const sznBelepes = await keres("/api/fiok/belepes", {
      modszer: "POST",
      torzs: { email: sznEmail, jelszo },
    });
    expect(sznBelepes.statusz).toBe(200);
    szervezetNelkuliSutik = sznBelepes.sutik.join("; ");

    // Nezo fiok (A szervezet tagja nezo szereppel)
    const nezoEmail = veletlenEmail();
    const nezoReg = await keres("/api/fiok/regisztracio", {
      modszer: "POST",
      torzs: { nev: "Proba Nezo", email: nezoEmail, jelszo },
    });
    expect(nezoReg.statusz).toBe(201);
    const nezoBelepes = await keres("/api/fiok/belepes", {
      modszer: "POST",
      torzs: { email: nezoEmail, jelszo },
    });
    expect(nezoBelepes.statusz).toBe(200);
    nezoSutik = nezoBelepes.sutik.join("; ");

    const nezoFiokEn = await keres<unknown>("/api/fiok/en", { sutik: nezoSutik });
    expect(nezoFiokEn.statusz).toBe(200);
    nezoFiokId = (nezoFiokEn.torzs as { id: string }).id;

    // Tagsag beszurasa SQL-lel (nincs meghivo API)
    await sql(
      "INSERT INTO tagsag (szervezet_id, fiok_id, szerep) VALUES ($1, $2, 'nezo') ON CONFLICT DO NOTHING",
      [aSzervezetId, nezoFiokId]
    );
  });

  afterAll(async () => {
    await takaritas();
    await lezar();
  });

  // 1. suti nelkul 401; szervezet nelkuli fiok 409; nezo PUT beallitas -> 403, GET attekintes -> 200
  it("1. jogosultsagok: suti nelkul, szervezet nelkul, nezo", async () => {
    // suti nelkul
    const sutiNelkul = await keres("/api/hirfigyelo/attekintes");
    expect(sutiNelkul.statusz).toBe(401);
    expect((sutiNelkul.torzs as { hiba?: string }).hiba).toBe("NINCS_BELEPVE");

    // szervezet nelkuli fiok
    const sznAttekintes = await keres("/api/hirfigyelo/attekintes", { sutik: szervezetNelkuliSutik });
    expect(sznAttekintes.statusz).toBe(409);
    expect((sznAttekintes.torzs as { hiba?: string }).hiba).toBe("NINCS_SZERVEZET"); // B-01: szervezet nélkül saját kódot kap — nem a szerep kevés, hanem nincs munkatere

    // nezo PUT beallitas -> 403
    const nezoPut = await keres("/api/hirfigyelo/beallitas", {
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
      sutik: nezoSutik,
    });
    expect(nezoPut.statusz).toBe(403);
    expect((nezoPut.torzs as { hiba?: string }).hiba).toBe("NINCS_JOG");

    // nezo GET attekintes -> 200
    const nezoAttekintes = await keres("/api/hirfigyelo/attekintes", { sutik: nezoSutik });
    expect(nezoAttekintes.statusz).toBe(200);
    expect((nezoAttekintes.torzs as { hirfigyelo?: unknown }).hirfigyelo).toBeDefined();
  });

  // 2. PUT beallitas ervenytelen -> 400 hibak; jo -> uj.verzio 1; ugyanaz ujra -> uj null; modositva -> 2; visszaallit -> 3; 99 -> 404
  it("2. beallitas verziokezeles", async () => {
    // ervenytelen: ures temak
    const ervenytelen = await keres("/api/hirfigyelo/beallitas", {
      modszer: "PUT",
      torzs: {
        celok: ["sajat_marka"],
        temak: [],
        foldrajzi_fokusz: "",
        nyelvek: [],
        kizarasok: [],
        idozites: { mod: "kezi", ora: 7, perc: 0, idozona: "Europe/Bucharest" },
        szabad_szoveg: "",
      },
      sutik: aSutik,
    });
    expect(ervenytelen.statusz).toBe(400);
    const ervTorzs = ervenytelen.torzs as { hiba?: string; hibak?: unknown };
    expect(ervTorzs.hiba).toBe("ERVENYTELEN_ADAT");
    expect(ervTorzs.hibak).toBeDefined();

    // jo beallitas -> verzio 1
    const jo1 = await keres("/api/hirfigyelo/beallitas", {
      modszer: "PUT",
      torzs: {
        celok: ["sajat_marka"],
        temak: [{ nev: "Marosvasarhely", nevvaltozatok: ["Targu Mures"], megkulonboztetes: "" }],
        foldrajzi_fokusz: "Maros megye",
        nyelvek: ["hu"],
        kizarasok: [],
        idozites: { mod: "kezi", ora: 7, perc: 0, idozona: "Europe/Bucharest" },
        szabad_szoveg: "Fontos hirek",
      },
      sutik: aSutik,
    });
    expect(jo1.statusz).toBe(200);
    const jo1Torzs = jo1.torzs as { hirfigyelo: { uj: { verzio: number } | null; verziok: unknown[] } };
    expect(jo1Torzs.hirfigyelo.uj).not.toBeNull();
    expect(jo1Torzs.hirfigyelo.uj!.verzio).toBe(1);
    expect(jo1Torzs.hirfigyelo.verziok.length).toBe(1);

    // ugyanaz ujra -> uj null
    const ugyanaz = await keres("/api/hirfigyelo/beallitas", {
      modszer: "PUT",
      torzs: {
        celok: ["sajat_marka"],
        temak: [{ nev: "Marosvasarhely", nevvaltozatok: ["Targu Mures"], megkulonboztetes: "" }],
        foldrajzi_fokusz: "Maros megye",
        nyelvek: ["hu"],
        kizarasok: [],
        idozites: { mod: "kezi", ora: 7, perc: 0, idozona: "Europe/Bucharest" },
        szabad_szoveg: "Fontos hirek",
      },
      sutik: aSutik,
    });
    expect(ugyanaz.statusz).toBe(200);
    const ugyanazTorzs = ugyanaz.torzs as { hirfigyelo: { uj: { verzio: number } | null } };
    expect(ugyanazTorzs.hirfigyelo.uj).toBeNull();

    // modositva -> verzio 2
    const modositva = await keres("/api/hirfigyelo/beallitas", {
      modszer: "PUT",
      torzs: {
        celok: ["sajat_marka", "szakmai"],
        temak: [{ nev: "Marosvasarhely", nevvaltozatok: ["Targu Mures"], megkulonboztetes: "" }],
        foldrajzi_fokusz: "Maros megye",
        nyelvek: ["hu"],
        kizarasok: [],
        idozites: { mod: "kezi", ora: 7, perc: 0, idozona: "Europe/Bucharest" },
        szabad_szoveg: "Fontos hirek",
      },
      sutik: aSutik,
    });
    expect(modositva.statusz).toBe(200);
    const modTorzs = modositva.torzs as { hirfigyelo: { uj: { verzio: number } | null; verziok: unknown[] } };
    expect(modTorzs.hirfigyelo.uj).not.toBeNull();
    expect(modTorzs.hirfigyelo.uj!.verzio).toBe(2);
    expect(modTorzs.hirfigyelo.verziok.length).toBe(2);

    // visszaallit verzio 1 -> verzio 3
    const visszaallit = await keres("/api/hirfigyelo/beallitas/visszaallit", {
      modszer: "POST",
      torzs: { verzio: 1 },
      sutik: aSutik,
    });
    expect(visszaallit.statusz).toBe(200);
    const visszaTorzs = visszaallit.torzs as { hirfigyelo: { uj: { verzio: number; eredet: string } | null; verziok: unknown[] } };
    expect(visszaTorzs.hirfigyelo.uj).not.toBeNull();
    expect(visszaTorzs.hirfigyelo.uj!.verzio).toBe(3);
    expect(visszaTorzs.hirfigyelo.uj!.eredet).toBe("visszaallitas");
    expect(visszaTorzs.hirfigyelo.verziok.length).toBe(3);

    // nem letezo verzio -> 404
    const nincsVerzio = await keres("/api/hirfigyelo/beallitas/visszaallit", {
      modszer: "POST",
      torzs: { verzio: 99 },
      sutik: aSutik,
    });
    expect(nincsVerzio.statusz).toBe(404);
    expect((nincsVerzio.torzs as { hiba?: string }).hiba).toBe("NINCS_ILYEN_VERZIO");
  });

  // 3. tervezet PUT/DELETE — verziok szama nem valtozik
  it("3. tervezet nem erinti a verziokat", async () => {
    const elotte = await keres("/api/hirfigyelo/beallitas", { sutik: aSutik });
    const elotteVerziokSzama = ((elotte.torzs as { hirfigyelo: { verziok: unknown[] } }).hirfigyelo.verziok).length;

    // tervezet mentes
    const tervezetPut = await keres("/api/hirfigyelo/beallitas/tervezet", {
      modszer: "PUT",
      torzs: {
        celok: ["sajat_marka"],
        temak: [{ nev: "Tervezett", nevvaltozatok: [], megkulonboztetes: "" }],
        foldrajzi_fokusz: "",
        nyelvek: [],
        kizarasok: [],
        idozites: { mod: "kezi", ora: 7, perc: 0, idozona: "Europe/Bucharest" },
        szabad_szoveg: "",
      },
      sutik: aSutik,
    });
    expect(tervezetPut.statusz).toBe(200);

    const tervezetUtan = await keres("/api/hirfigyelo/beallitas", { sutik: aSutik });
    const tervezetUtanVerziok = ((tervezetUtan.torzs as { hirfigyelo: { verziok: unknown[] } }).hirfigyelo.verziok).length;
    expect(tervezetUtanVerziok).toBe(elotteVerziokSzama);

    // tervezet torles
    const tervezetDel = await keres("/api/hirfigyelo/beallitas/tervezet", {
      modszer: "DELETE",
      sutik: aSutik,
    });
    expect(tervezetDel.statusz).toBe(200);

    const torlesUtan = await keres("/api/hirfigyelo/beallitas", { sutik: aSutik });
    const torlesUtanVerziok = ((torlesUtan.torzs as { hirfigyelo: { verziok: unknown[] } }).hirfigyelo.verziok).length;
    expect(torlesUtanVerziok).toBe(elotteVerziokSzama);
  });

  // 4. forras: facebook -> nem_tamogatott; RSS -> ellenorzes_alatt, ellenorzes utan hasznalhato vagy hibas
  it("4. forrasok hozzaadasa es ellenorzese", async () => {
    // facebook -> nem_tamogatott
    const facebook = await keres("/api/hirfigyelo/forrasok", {
      modszer: "POST",
      torzs: { cim: "https://facebook.com/oldal" },
      sutik: aSutik,
    });
    expect(facebook.statusz).toBe(200);
    const fbForras = (facebook.torzs as { hirfigyelo: { forras: { allapot: string; cim: string } } }).hirfigyelo.forras;
    expect(fbForras.allapot).toBe("nem_tamogatott");

    // RSS forras
    const rss = await keres("/api/hirfigyelo/forrasok", {
      modszer: "POST",
      torzs: { cim: PROBA_RSS },
      sutik: aSutik,
    });
    expect(rss.statusz).toBe(200);
    const rssForras = (rss.torzs as { hirfigyelo: { forras: { id: string; allapot: string } } }).hirfigyelo.forras;
    expect(rssForras.allapot).toBe("ellenorzes_alatt");

    // ellenorzes
    const ellenorzes = await keres(`/api/hirfigyelo/forrasok/${rssForras.id}/ellenoriz`, {
      modszer: "POST",
      sutik: aSutik,
    });
    expect(ellenorzes.statusz).toBe(200);
    const ellForras = (ellenorzes.torzs as { hirfigyelo: { forras: { allapot: string; hiba_ok?: string | null } } }).hirfigyelo.forras;
    if (ellForras.allapot === "hibas") {
      console.log("Forras-ellenorzes hibas (valoszinuleg nincs halozat):", ellForras.hiba_ok);
    } else {
      expect(ellForras.allapot).toBe("hasznalhato");
    }
  });

  // 5. futas beallitas nelkul (B szervezet) -> 409 NINCS_BEALLITAS
  it("5. futas beallitas nelkul", async () => {
    const futas = await keres("/api/hirfigyelo/futas", {
      modszer: "POST",
      torzs: { proba: true },
      sutik: bSutik,
    });
    expect(futas.statusz).toBe(409);
    expect((futas.torzs as { hiba?: string }).hiba).toBe("NINCS_BEALLITAS");
  });

  // 6. futas A-nal proba -> 202, sorba kerul; varjMeg; allapot kesz/hiba; uj talalatok uj/kesz; A-10 duplikacio-vedelem
  it("6. futas es duplikacio-vedelem", async () => {
    // elso futas bekuldese -> 202
    const futas1 = await keres("/api/hirfigyelo/futas", {
      modszer: "POST",
      torzs: { proba: true },
      sutik: aSutik,
    });
    expect(futas1.statusz).toBe(202);
    const f1Torzs = futas1.torzs as {
      hirfigyelo: {
        sor: { id: string; allapot: string; fajta: string };
      }
    };
    expect(f1Torzs.hirfigyelo.sor.allapot).toBe("var");
    expect(f1Torzs.hirfigyelo.sor.fajta).toBe("futas");
    const sorId1 = f1Torzs.hirfigyelo.sor.id;

    // attekintes.sorban nem null
    const attekintesBekuldesUtan = await keres("/api/hirfigyelo/attekintes", { sutik: aSutik });
    const sorbanBekuldesUtan = (attekintesBekuldesUtan.torzs as { hirfigyelo: { sorban: unknown } }).hirfigyelo.sorban;
    expect(sorbanBekuldesUtan).not.toBeNull();

    // masodik bekuldes az elso alatt -> 409 FUT_MAR (ha meg var/fut)
    const futas2 = await keres("/api/hirfigyelo/futas", {
      modszer: "POST",
      torzs: { proba: true },
      sutik: aSutik,
    });
    if (futas2.statusz === 409) {
      expect((futas2.torzs as { hiba?: string }).hiba).toBe("FUT_MAR");
    } else {
      // ha mar kesz lett, irjuk ki es hagyjuk ki
      console.log("A masodik bekuldes nem 409-et adott (mar kesz lehetett):", futas2.statusz);
    }

    // varjMeg az elso sorra
    const sor1Vege = await varjMeg(sorId1, aSutik);
    expect(["kesz", "hiba"]).toContain(sor1Vege.allapot);

    // attekintes.sorban null a kesz utan
    const attekintesKeszUtan = await keres("/api/hirfigyelo/attekintes", { sutik: aSutik });
    const sorbanKeszUtan = (attekintesKeszUtan.torzs as { hirfigyelo: { sorban: unknown } }).hirfigyelo.sorban;
    expect(sorbanKeszUtan).toBeNull();

    // futas listabol kikereses
    const futasLista = await keres<{ hirfigyelo: { futasok: Array<{ id: string; allapot: string; uj_talalatok: number }> } }>(
      "/api/hirfigyelo/futas",
      { sutik: aSutik }
    );
    expect(futasLista.statusz).toBe(200);
    const futasId1 = sor1Vege.eredmeny?.futas_id;
    expect(futasId1).toBeDefined();
    const futas1Listaban = futasLista.torzs.hirfigyelo.futasok.find((f) => f.id === futasId1);
    expect(futas1Listaban).toBeDefined();

    // allapotok es talalatok ellenorzese
    const allapotok = ["kesz", "hiba"];
    expect(allapotok).toContain(futas1Listaban!.allapot);

    // talalatok ellenorzese a futasbol
    const futasReszlet = await keres<{ hirfigyelo: { futas: { uj_talalatok: number; talalatok: Array<{ megtekintes: string; ertekeles_allapot: string }> } } }>(
      `/api/hirfigyelo/futas/${futasId1}`,
      { sutik: aSutik }
    );
    if (futasReszlet.statusz === 200) {
      const talalatok = futasReszlet.torzs.hirfigyelo.futas.talalatok;
      const voltUjTalalat = talalatok.length > 0;
      if (voltUjTalalat) {
        for (const t of talalatok) {
          expect(t.megtekintes).toBe("uj");
          expect(t.ertekeles_allapot).toBe("kesz");
        }
      } else {
        console.log("Nincs uj talalat (halozati problema vagy ures RSS)");
      }
    }

    // A-10: masodik bekuldes a kesz utan -> 202 -> megvarni -> uj_talalatok 0
    const attekintesElotte = await keres("/api/hirfigyelo/attekintes", { sutik: aSutik });
    const ujDbElotte = (attekintesElotte.torzs as { hirfigyelo: { ujDb: number } }).hirfigyelo.ujDb;

    const futas3 = await keres("/api/hirfigyelo/futas", {
      modszer: "POST",
      torzs: { proba: true },
      sutik: aSutik,
    });
    expect(futas3.statusz).toBe(202);
    const f3Torzs = futas3.torzs as { hirfigyelo: { sor: { id: string } } };
    const sorId3 = f3Torzs.hirfigyelo.sor.id;

    const sor3Vege = await varjMeg(sorId3, aSutik);
    expect(["kesz", "hiba"]).toContain(sor3Vege.allapot);

    if (sor3Vege.allapot === "kesz") {
      const futasId3 = sor3Vege.eredmeny?.futas_id;
      expect(futasId3).toBeDefined();
      const futas3Reszlet = await keres<{ hirfigyelo: { futas: { uj_talalatok: number } } }>(
        `/api/hirfigyelo/futas/${futasId3}`,
        { sutik: aSutik }
      );
      expect(futas3Reszlet.statusz).toBe(200);
      expect(futas3Reszlet.torzs.hirfigyelo.futas.uj_talalatok).toBe(0);

      const attekintesUtana = await keres("/api/hirfigyelo/attekintes", { sutik: aSutik });
      const ujDbUtana = (attekintesUtana.torzs as { hirfigyelo: { ujDb: number } }).hirfigyelo.ujDb;
      expect(ujDbUtana).toBe(ujDbElotte);
    } else {
      console.log("Masodik futas hibas lett, duplikacio-vedelem nem ellenorizheto");
    }
  });

  // 7. elvalasztas: B 0 talalat, B nem latja A forrasait
  it("7. szervezeti elvalasztas", async () => {
    const bAttekintes = await keres("/api/hirfigyelo/attekintes", { sutik: bSutik });
    expect(bAttekintes.statusz).toBe(200);
    const bTorzs = bAttekintes.torzs as { hirfigyelo: { talalatok: unknown[]; esemenyek: unknown[] } };
    expect(bTorzs.hirfigyelo.talalatok.length).toBe(0);
    expect(bTorzs.hirfigyelo.esemenyek.length).toBe(0);

    // B forrasai ures vagy kulonboznek A-etol
    const bForrasok = await keres("/api/hirfigyelo/forrasok", { sutik: bSutik });
    expect(bForrasok.statusz).toBe(200);
    const bForrasLista = (bForrasok.torzs as { hirfigyelo: { forrasok?: unknown[] } }).hirfigyelo;
    // B-nek nincs beallitasa, igy forrasai sincsenek (vagy ures lista)
    if ("forrasok" in bForrasLista) {
      const aForrasok = await keres("/api/hirfigyelo/forrasok", { sutik: aSutik });
      const aForrasLista = (aForrasok.torzs as { hirfigyelo: { forrasok: { cim: string }[] } }).hirfigyelo.forrasok;
      const bForrasCimek = (bForrasLista as { forrasok: { cim: string }[] }).forrasok.map((f) => f.cim);
      for (const af of aForrasLista) {
        expect(bForrasCimek).not.toContain(af.cim);
      }
    }
  });

  // 8. megtekint -> ujDb csokken; jelol elrejtett -> verziok szama valtozatlan
  it("8. talalat megtekint es jeloles", async () => {
    // szuksegunk van talalatra, amihez futas kell
    const attekintes = await keres("/api/hirfigyelo/attekintes", { sutik: aSutik });
    const atTorzs = attekintes.torzs as { hirfigyelo: { ujDb: number; talalatok: Array<{ id: string; megtekintes: string }> } };
    const ujDbEredeti = atTorzs.hirfigyelo.ujDb;

    if (atTorzs.hirfigyelo.talalatok.length === 0) {
      console.log("Nincs talalat a megtekintes/jeloles teszthez");
      return;
    }

    const talalat = atTorzs.hirfigyelo.talalatok.find((t) => t.megtekintes === "uj");
    if (!talalat) {
      console.log("Nincs uj talalat a megtekintes teszthez");
      return;
    }

    // megtekint
    const megtekint = await keres(`/api/hirfigyelo/talalatok/${talalat.id}/megtekint`, {
      modszer: "POST",
      sutik: aSutik,
    });
    expect(megtekint.statusz).toBe(200);

    const megtekintUtan = await keres("/api/hirfigyelo/attekintes", { sutik: aSutik });
    const megtekintTorzs = megtekintUtan.torzs as { hirfigyelo: { ujDb: number } };
    expect(megtekintTorzs.hirfigyelo.ujDb).toBe(Math.max(0, ujDbEredeti - 1));

    // jelol elrejtett -> verziok szama nem valtozik
    const beallitasElotte = await keres("/api/hirfigyelo/beallitas", { sutik: aSutik });
    const verziokSzamaElotte = ((beallitasElotte.torzs as { hirfigyelo: { verziok: unknown[] } }).hirfigyelo.verziok).length;

    const jelol = await keres(`/api/hirfigyelo/talalatok/${talalat.id}/jelol`, {
      modszer: "POST",
      torzs: { jeloles: "elrejtett" },
      sutik: aSutik,
    });
    expect(jelol.statusz).toBe(200);

    const beallitasUtana = await keres("/api/hirfigyelo/beallitas", { sutik: aSutik });
    const verziokSzamaUtana = ((beallitasUtana.torzs as { hirfigyelo: { verziok: unknown[] } }).hirfigyelo.verziok).length;
    expect(verziokSzamaUtana).toBe(verziokSzamaElotte);
  });

  // 9. visszajelzes + javaslat -> fuggo; kiprobal -> 200 vagy 409; dont elfogad -> ai_javaslat; dont elvet -> elvetve; nem letezo -> 404
  it("9. visszajelzes, javaslat, kiprobalas, dontes", async () => {
    // visszajelzeshez kell talalat
    const attekintes = await keres("/api/hirfigyelo/attekintes", { sutik: aSutik });
    const atTorzs = attekintes.torzs as { hirfigyelo: { talalatok: Array<{ id: string }> } };

    if (atTorzs.hirfigyelo.talalatok.length === 0) {
      console.log("Nincs talalat a visszajelzes teszthez");
      return;
    }

    const talalatId = atTorzs.hirfigyelo.talalatok[0]!.id;

    // visszajelzes
    const visszajelzes = await keres("/api/hirfigyelo/visszajelzes", {
      modszer: "POST",
      torzs: {
        talalat_id: talalatId,
        fajta: "nem_relevans",
        okok: ["nem_ez_a_tema"],
        sajat_indok: "Nem erdekel",
      },
      sutik: aSutik,
    });
    expect(visszajelzes.statusz).toBe(200);

    // javaslat keres
    const javaslat = await keres("/api/hirfigyelo/javaslat", {
      modszer: "POST",
      sutik: aSutik,
    });
    expect(javaslat.statusz).toBe(200);
    const javTorzs = javaslat.torzs as { hirfigyelo: { javaslat: { id: string; allapot: string; minta_id: string | null } } };
    expect(javTorzs.hirfigyelo.javaslat.allapot).toBe("fuggo");
    const javaslatId = javTorzs.hirfigyelo.javaslat.id;

    // kiprobal
    const kiprobal = await keres(`/api/hirfigyelo/javaslat/${javaslatId}/kiprobal`, {
      modszer: "POST",
      sutik: aSutik,
    });
    if (kiprobal.statusz === 409) {
      const kipHiba = (kiprobal.torzs as { hiba?: string }).hiba;
      console.log("Kiprobalas sikertelen:", kipHiba);
      expect(["MINTA_LEJART", "ERVENYTELEN_ADAT"]).toContain(kipHiba);
    } else {
      // E-26: a kipróbálás a háttérben megy — 202 + sor-tétel, megvárjuk
      expect(kiprobal.statusz).toBe(202);
      const kipSor = (kiprobal.torzs as { hirfigyelo: { sor: { id: string } } }).hirfigyelo.sor;
      const kipVege = await varjMeg(kipSor.id, aSutik);
      expect(kipVege.allapot).toBe("kesz");
    }

    // dontes: elfogad -> uj verzio ai_javaslattal
    const elfogad = await keres(`/api/hirfigyelo/javaslat/${javaslatId}/dont`, {
      modszer: "POST",
      torzs: { dontes: "elfogad" },
      sutik: aSutik,
    });
    expect(elfogad.statusz).toBe(200);

    const beallitasElfogad = await keres("/api/hirfigyelo/beallitas", { sutik: aSutik });
    const verziok = (beallitasElfogad.torzs as { hirfigyelo: { verziok: Array<{ eredet: string }> } }).hirfigyelo.verziok;
    const vanAiJavaslat = verziok.some((v) => v.eredet === "ai_javaslat");
    expect(vanAiJavaslat).toBe(true);

    // uj javaslat elvetesehez
    const ujJavaslat = await keres("/api/hirfigyelo/javaslat", {
      modszer: "POST",
      sutik: aSutik,
    });
    if (ujJavaslat.statusz === 200) {
      const ujJavId = (ujJavaslat.torzs as { hirfigyelo: { javaslat: { id: string } } }).hirfigyelo.javaslat.id;

      const elvet = await keres(`/api/hirfigyelo/javaslat/${ujJavId}/dont`, {
        modszer: "POST",
        torzs: { dontes: "elvet" },
        sutik: aSutik,
      });
      expect(elvet.statusz).toBe(200);

      // ellenorizzuk az allapotot
      // (a javaslatok listaja nincs kozvetlenul, de az uj javaslat keresnek nem kellene ugyanazt adnia)
    }

    // nem letezo javaslat -> 404
    const nincsJavaslat = await keres("/api/hirfigyelo/javaslat/nem-letezo-id/dont", {
      modszer: "POST",
      torzs: { dontes: "elfogad" },
      sutik: aSutik,
    });
    expect(nincsJavaslat.statusz).toBe(404);
    expect((nincsJavaslat.torzs as { hiba?: string }).hiba).toBe("NINCS_ILYEN_JAVASLAT");
  });

  // 10. osszkep -> 200 (ha van ertekelt talalat) vagy 400
  it("10. osszkep", async () => {
    const osszkep = await keres("/api/hirfigyelo/osszkep", { sutik: aSutik });
    // 200 vagy 400 mindketto elfogadhato
    expect([200, 400]).toContain(osszkep.statusz);
    if (osszkep.statusz === 400) {
      expect((osszkep.torzs as { hiba?: string }).hiba).toBeDefined();
    } else {
      expect((osszkep.torzs as { hirfigyelo?: unknown }).hirfigyelo).toBeDefined();
    }
  });

  // 11. kártyák: a 6. próba után az áttekintés kártyákat ad
  it("11. attekintes kartyak", async () => {
    const attekintes = await keres<{ hirfigyelo: { kartyak: Array<{ forras_szam: number; forrasok: unknown[]; cim: string; osszefoglalo: string; fontossag: string; szabaly_verzio: number; megtekintes: string }>; talalatok: unknown[] } }>(
      "/api/hirfigyelo/attekintes",
      { sutik: aSutik }
    );
    expect(attekintes.statusz).toBe(200);
    const kartyak = attekintes.torzs.hirfigyelo.kartyak;
    const talalatokSzama = attekintes.torzs.hirfigyelo.talalatok.length;
    expect(kartyak.length).toBeGreaterThan(0);
    expect(kartyak.length).toBeLessThanOrEqual(talalatokSzama);
    for (const kartya of kartyak) {
      expect(kartya.forras_szam).toBeGreaterThanOrEqual(1);
      expect(kartya.forrasok.length).toBe(kartya.forras_szam);
      expect(kartya.cim.length).toBeGreaterThan(0);
      expect(kartya.osszefoglalo.length).toBeGreaterThan(0);
      expect(kartya.osszefoglalo.startsWith("[MINTA]")).toBe(true);
      expect(["fontos", "erdekes", "hatter"]).toContain(kartya.fontossag);
      expect(typeof kartya.szabaly_verzio).toBe("number");
      expect(["uj", "megtekintett"]).toContain(kartya.megtekintes);
    }
  });

  // 12. tartalomötlet csak kérésre
  it("12. tartalomotlet csak keresre", async () => {
    // talalatok listaja
    const attekintes = await keres<{ hirfigyelo: { talalatok: Array<{ id: string }> } }>("/api/hirfigyelo/attekintes", { sutik: aSutik });
    expect(attekintes.statusz).toBe(200);
    const talalatok = attekintes.torzs.hirfigyelo.talalatok;
    expect(talalatok.length).toBeGreaterThan(0);
    const talalatId = talalatok[0]!.id;

    // GET: tartalomotlet null
    const getElotte = await keres<{ hirfigyelo: { talalat: { tartalomotlet: unknown } } }>(
      `/api/hirfigyelo/talalatok/${talalatId}/tartalomotlet`,
      { sutik: aSutik }
    );
    expect(getElotte.statusz).toBe(200);
    expect(getElotte.torzs.hirfigyelo.talalat.tartalomotlet).toBeNull();

    // POST: 200, szoveg nem ures, nyelv hu
    const post1 = await keres<{ hirfigyelo: { talalat: { tartalomotlet: { szoveg: string; nyelv: string; keszult: string } } } }>(
      `/api/hirfigyelo/talalatok/${talalatId}/tartalomotlet`,
      { modszer: "POST", sutik: aSutik }
    );
    expect(post1.statusz).toBe(200);
    const otlet1 = post1.torzs.hirfigyelo.talalat.tartalomotlet;
    expect(otlet1.szoveg.length).toBeGreaterThan(0);
    expect(otlet1.nyelv).toBe("hu");

    // masodik POST: ugyanaz a keszult (nem hiv ujra)
    const post2 = await keres<{ hirfigyelo: { talalat: { tartalomotlet: { keszult: string } } } }>(
      `/api/hirfigyelo/talalatok/${talalatId}/tartalomotlet`,
      { modszer: "POST", sutik: aSutik }
    );
    expect(post2.statusz).toBe(200);
    expect(post2.torzs.hirfigyelo.talalat.tartalomotlet.keszult).toBe(otlet1.keszult);

    // nezo: 403
    const nezoPost = await keres(`/api/hirfigyelo/talalatok/${talalatId}/tartalomotlet`, {
      modszer: "POST",
      sutik: nezoSutik,
    });
    expect(nezoPost.statusz).toBe(403);

    // nem letezo id: 404
    const nemLetezo = await keres(`/api/hirfigyelo/talalatok/nincs-ilyen-id/tartalomotlet`, {
      modszer: "POST",
      sutik: aSutik,
    });
    expect(nemLetezo.statusz).toBe(404);

    // masik szervezet: 404
    const bPost = await keres(`/api/hirfigyelo/talalatok/${talalatId}/tartalomotlet`, {
      modszer: "POST",
      sutik: bSutik,
    });
    expect(bPost.statusz).toBe(404);
  });

});
