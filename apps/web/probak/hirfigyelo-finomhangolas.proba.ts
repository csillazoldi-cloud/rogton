import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { keres, veletlenEmail, lezar, sql } from "./segedek";

let sutik = "";
let nezoSutik = "";
let szervezetId = "";
let mintaId = "";
let mintaTalalatIds: string[] = [];
let elsoJavaslatId = "";
let masodikJavaslatId = "";

type FinomhangolasValasz = {
  hirfigyelo: {
    minta: { id: string; szabaly_verzio: number; talalat_ids: string[]; letrehozva: string; lejar: string } | null;
    mintaLejart: boolean;
    tetelek: { talalat_id: string; cim: string; forras_id: string; forras_cim: string; megjelenes: string | null; fontossag: string | null; ertekeles_allapot: string }[];
    visszajelzesek: { id: string; talalat_id: string; fajta: string; okok: string[]; sajat_indok: string; letrehozva: string }[];
    javaslatok: { id: string; szabaly_verzio: number; javasolt: unknown; mi_alapjan: string[]; indoklas: string; varhato_hatas: string; profil_erintett: boolean; allapot: string; minta_id: string | null; letrehozva: string }[];
    verziok: { verzio: number; beallitas: unknown; letrehozva: string; eredet: string; allapot: string }[];
  };
};

type BeallitasValasz = {
  hirfigyelo: {
    verziok: { verzio: number; beallitas: unknown; letrehozva: string; eredet: string; allapot: string }[];
    aktiv: { verzio: number; beallitas: unknown; letrehozva: string; eredet: string; allapot: string } | null;
    tervezet: unknown;
  };
};

async function varjFutasKeszre(sorId: string): Promise<void> {
  for (let i = 0; i < 20; i++) {
    const valasz = await keres<{ hirfigyelo: { sor: { id: string; allapot: string } } }>(`/api/hirfigyelo/futas/sor/${sorId}`, { sutik });
    expect(valasz.statusz).toBe(200);
    const allapot = valasz.torzs.hirfigyelo.sor.allapot;
    if (allapot === "kesz" || allapot === "hiba" || allapot === "reszleges") {
      return;
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error("A futas nem ert veget 60 masodpercen belul");
}

describe("Hírfigyelő finomhangolás élő próbái", () => {
  beforeAll(async () => {
    // Fiók + szervezet + jóváhagyott profil (a minta szerint)
    const email = veletlenEmail();
    const jelszo = "ProbaJelszo123!";
    const nev = "Proba Finomhangolo";

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

    const szervezet = await keres<{ hirfigyelo?: unknown; id?: string }>("/api/szervezet", {
      modszer: "POST",
      torzs: { nev: "Proba Finomhangolo Szervezet" },
      sutik,
    });
    expect(szervezet.statusz).toBe(201);
    const szervezetTorzs = szervezet.torzs as { id: string };
    szervezetId = szervezetTorzs.id;

    const piszkozatMentes = await keres("/api/onboarding/piszkozat", {
      modszer: "PUT",
      torzs: {
        bemutatkozas: {
          nev: "Próba Finomhangoló Műhely",
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
      sutik,
    });
    expect(piszkozatMentes.statusz).toBe(200);

    const jovahagyas = await keres("/api/onboarding/jovahagyas", {
      modszer: "POST",
      torzs: {},
      sutik,
    });
    expect(jovahagyas.statusz).toBe(200);

    // Néző fiók
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

    // Néző meghívása a szervezetbe
    const nezoEn = await keres<{ hirfigyelo?: unknown; id?: string }>("/api/fiok/en", { sutik: nezoSutik });
    const nezoId = (nezoEn.torzs as { id: string }).id;
    // Tagság beszúrása SQL-lel (nincs meghívó API — mint a hirfigyelo.proba.ts-ben)
    await sql("INSERT INTO tagsag (szervezet_id, fiok_id, szerep) VALUES ($1, $2, 'nezo') ON CONFLICT DO NOTHING", [szervezetId, nezoId]);

    // Aktív beállítás (témák: „Marosvasarhely”)
    const beallitas = await keres<BeallitasValasz>("/api/hirfigyelo/beallitas", {
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
      sutik,
    });
    expect(beallitas.statusz).toBe(200);

    // RSS-forrás
    const forras = await keres<{ hirfigyelo?: unknown }>("/api/hirfigyelo/forrasok", {
      modszer: "POST",
      torzs: { cim: process.env["PROBA_RSS"] ?? "https://marosvasarhelyiek.ro/feed" },
      sutik,
    });
    expect(forras.statusz).toBe(200);
    const forrasTorzs = forras.torzs as { hirfigyelo: { forras: { id: string } } };
    const forrasId = forrasTorzs.hirfigyelo.forras.id;

    const ellenoriz = await keres<{ hirfigyelo?: unknown }>(`/api/hirfigyelo/forrasok/${forrasId}/ellenoriz`, {
      modszer: "POST",
      torzs: {},
      sutik,
    });
    expect(ellenoriz.statusz).toBe(200);
    const ellenorizTorzs = ellenoriz.torzs as { hirfigyelo: { forras: { allapot: string } } };
    expect(ellenorizTorzs.hirfigyelo.forras.allapot).toBe("hasznalhato");

    // Próbafutás indítása
    const futas = await keres<{ hirfigyelo: { sor: { id: string } } }>("/api/hirfigyelo/futas", {
      modszer: "POST",
      torzs: { proba: true },
      sutik,
    });
    expect(futas.statusz).toBe(202);
    const sorId = futas.torzs.hirfigyelo.sor.id;
    await varjFutasKeszre(sorId);
  }, 120_000);

  afterAll(async () => {
    await lezar();
  });

  it("1. GET finomhangolas → minta és tételek", async () => {
    const valasz = await keres<FinomhangolasValasz>("/api/hirfigyelo/finomhangolas", { sutik });
    expect(valasz.statusz).toBe(200);
    const fh = valasz.torzs.hirfigyelo;
    expect(fh.minta).not.toBeNull();
    expect(fh.minta!.szabaly_verzio).toBe(1);
    expect(fh.mintaLejart).toBe(false);
    expect(fh.tetelek.length).toBe(fh.minta!.talalat_ids.length);
    expect(fh.tetelek.length).toBeGreaterThan(0);
    for (const tetel of fh.tetelek) {
      expect(tetel.cim.length).toBeGreaterThan(0);
    }
    expect(fh.visszajelzesek.length).toBe(0);
    expect(fh.javaslatok.length).toBe(0);
    expect(fh.verziok.length).toBe(1);
    mintaId = fh.minta!.id;
    mintaTalalatIds = fh.minta!.talalat_ids;
  });

  it("2. Visszajelzések küldése", async () => {
    const elsoTalalat = mintaTalalatIds[0]!;
    const masodikTalalat = mintaTalalatIds[1]!;

    const v1 = await keres("/api/hirfigyelo/visszajelzes", {
      modszer: "POST",
      torzs: { talalat_id: elsoTalalat, fajta: "fontos" },
      sutik,
    });
    expect(v1.statusz).toBe(200);

    const v2 = await keres("/api/hirfigyelo/visszajelzes", {
      modszer: "POST",
      torzs: { talalat_id: masodikTalalat, fajta: "nem_relevans", okok: ["nem_ez_a_tema"] },
      sutik,
    });
    expect(v2.statusz).toBe(200);

    // Néző → 403
    const v3 = await keres("/api/hirfigyelo/visszajelzes", {
      modszer: "POST",
      torzs: { talalat_id: elsoTalalat, fajta: "fontos" },
      sutik: nezoSutik,
    });
    expect(v3.statusz).toBe(403);

    const valasz = await keres<FinomhangolasValasz>("/api/hirfigyelo/finomhangolas", { sutik });
    expect(valasz.statusz).toBe(200);
    expect(valasz.torzs.hirfigyelo.visszajelzesek.length).toBe(2);
  });

  it("3. Javaslat kérése", async () => {
    const valasz = await keres<{ hirfigyelo: { javaslat: { id: string; allapot: string; szabaly_verzio: number; mi_alapjan: string[] } } }>("/api/hirfigyelo/javaslat", {
      modszer: "POST",
      torzs: {},
      sutik,
    });
    expect(valasz.statusz).toBe(200);
    const javaslat = valasz.torzs.hirfigyelo.javaslat;
    expect(javaslat.allapot).toBe("fuggo");
    expect(javaslat.szabaly_verzio).toBe(1);
    expect(javaslat.mi_alapjan.length).toBe(2);
    elsoJavaslatId = javaslat.id;

    // Másodszor → 400 (nincs új visszajelzés)
    const masodik = await keres<{ hirfigyelo?: unknown; hiba?: string }>("/api/hirfigyelo/javaslat", {
      modszer: "POST",
      torzs: {},
      sutik,
    });
    expect(masodik.statusz).toBe(400);
    const hibak = (masodik.torzs as { hibak?: string }).hibak;
    expect(hibak).toBe("nincs_visszajelzes");
  });

  it("4. Javaslat kipróbálása", async () => {
    // A kipróbálás a háttérben megy (E-22 sor): 202 + tétel, az eredmény a tétel eredmény-ében
    const valasz = await keres<{ hirfigyelo: { sor: { id: string } } }>(`/api/hirfigyelo/javaslat/${elsoJavaslatId}/kiprobal`, {
      modszer: "POST",
      torzs: {},
      sutik,
    });
    expect(valasz.statusz).toBe(202);
    await varjFutasKeszre(valasz.torzs.hirfigyelo.sor.id);
    const tetel = await keres<{ hirfigyelo: { sor: { allapot: string; eredmeny: { osszehasonlitas: { talalat_id: string; valtozas: string }[] } | null } } }>(`/api/hirfigyelo/futas/sor/${valasz.torzs.hirfigyelo.sor.id}`, { sutik });
    expect(tetel.torzs.hirfigyelo.sor.allapot).toBe("kesz");
    const osszehasonlitas = tetel.torzs.hirfigyelo.sor.eredmeny!.osszehasonlitas;
    expect(osszehasonlitas.length).toBeGreaterThan(0);
    for (const elem of osszehasonlitas) {
      expect(mintaTalalatIds).toContain(elem.talalat_id);
      expect(["elorebb", "hatrebb", "valtozatlan"]).toContain(elem.valtozas);
    }

    const fh = await keres<FinomhangolasValasz>("/api/hirfigyelo/finomhangolas", { sutik });
    const javaslat = fh.torzs.hirfigyelo.javaslatok.find((j) => j.id === elsoJavaslatId);
    expect(javaslat).toBeDefined();
    expect(javaslat!.allapot).toBe("kiprobalt");
    expect(javaslat!.minta_id).toBe(mintaId);

    // Nem létező javaslat → 404
    const nemLetezo = await keres(`/api/hirfigyelo/javaslat/nem-letezo-id/kiprobal`, {
      modszer: "POST",
      torzs: {},
      sutik,
    });
    expect(nemLetezo.statusz).toBe(404);
  });

  it("5. Javaslat elfogadása", async () => {
    const valasz = await keres<{ hirfigyelo: { javaslat: { allapot: string }; ujVerzio: { verzio: number; eredet: string } | null } }>(`/api/hirfigyelo/javaslat/${elsoJavaslatId}/dont`, {
      modszer: "POST",
      torzs: { dontes: "elfogad" },
      sutik,
    });
    expect(valasz.statusz).toBe(200);
    expect(valasz.torzs.hirfigyelo.javaslat.allapot).toBe("elfogadva");
    expect(valasz.torzs.hirfigyelo.ujVerzio!.verzio).toBe(2);
    expect(valasz.torzs.hirfigyelo.ujVerzio!.eredet).toBe("ai_javaslat");

    const beallitas = await keres<BeallitasValasz>("/api/hirfigyelo/beallitas", { sutik });
    expect(beallitas.torzs.hirfigyelo.aktiv!.verzio).toBe(2);

    const fh = await keres<FinomhangolasValasz>("/api/hirfigyelo/finomhangolas", { sutik });
    expect(fh.torzs.hirfigyelo.verziok.length).toBe(2);
    const javaslat = fh.torzs.hirfigyelo.javaslatok.find((j) => j.id === elsoJavaslatId);
    expect(javaslat!.allapot).toBe("elfogadva");

    // Újra dont → 409 vagy 400
    const ujra = await keres(`/api/hirfigyelo/javaslat/${elsoJavaslatId}/dont`, {
      modszer: "POST",
      torzs: { dontes: "elfogad" },
      sutik,
    });
    expect([409, 400]).toContain(ujra.statusz);
    console.log(`Újra dont státusz: ${ujra.statusz}`);
  });

  it("6. Visszaállítás 1-es verzióra", async () => {
    const valasz = await keres<{ hirfigyelo: { uj: { verzio: number; eredet: string } } }>("/api/hirfigyelo/beallitas/visszaallit", {
      modszer: "POST",
      torzs: { verzio: 1 },
      sutik,
    });
    expect(valasz.statusz).toBe(200);
    expect(valasz.torzs.hirfigyelo.uj.verzio).toBe(3);
    expect(valasz.torzs.hirfigyelo.uj.eredet).toBe("visszaallitas");

    const beallitas = await keres<BeallitasValasz>("/api/hirfigyelo/beallitas", { sutik });
    expect(beallitas.torzs.hirfigyelo.aktiv!.verzio).toBe(3);

    // Néző → 403
    const nezo = await keres("/api/hirfigyelo/beallitas/visszaallit", {
      modszer: "POST",
      torzs: { verzio: 1 },
      sutik: nezoSutik,
    });
    expect(nezo.statusz).toBe(403);

    // Nem létező verzió → 404
    const nemLetezo = await keres("/api/hirfigyelo/beallitas/visszaallit", {
      modszer: "POST",
      torzs: { verzio: 99 },
      sutik,
    });
    expect(nemLetezo.statusz).toBe(404);
  });

  it("7. A lap elérése", async () => {
    const belerve = await keres<unknown>("/hirfigyelo/finomhangolas", { sutik });
    expect(belerve.statusz).toBe(200);
    const torzs = belerve.torzs as string;
    expect(torzs).toContain('data-screen-label="HF-III Finomhangolás"');

    const belepNelkul = await fetch(`${process.env["PROBA_CIM"] ?? "http://127.0.0.1:3000"}/hirfigyelo/finomhangolas`, { redirect: "manual" });
    expect(belepNelkul.status).toBe(307);
    expect(belepNelkul.headers.get("location")).toContain("/belepes");
  });

  it("8. Elvetés", async () => {
    const harmadikTalalat = mintaTalalatIds[2]!;
    const negyedikTalalat = mintaTalalatIds[3]!;

    const v1 = await keres("/api/hirfigyelo/visszajelzes", {
      modszer: "POST",
      torzs: { talalat_id: harmadikTalalat, fajta: "nem_relevans", okok: ["ismetlodo"] },
      sutik,
    });
    expect(v1.statusz).toBe(200);

    const v2 = await keres("/api/hirfigyelo/visszajelzes", {
      modszer: "POST",
      torzs: { talalat_id: negyedikTalalat, fajta: "fontos" },
      sutik,
    });
    expect(v2.statusz).toBe(200);

    const javaslat = await keres<{ hirfigyelo: { javaslat: { id: string } } }>("/api/hirfigyelo/javaslat", {
      modszer: "POST",
      torzs: {},
      sutik,
    });
    expect(javaslat.statusz).toBe(200);
    masodikJavaslatId = javaslat.torzs.hirfigyelo.javaslat.id;

    const dont = await keres<{ hirfigyelo: { javaslat: { allapot: string }; ujVerzio: unknown } }>(`/api/hirfigyelo/javaslat/${masodikJavaslatId}/dont`, {
      modszer: "POST",
      torzs: { dontes: "elvet" },
      sutik,
    });
    expect(dont.statusz).toBe(200);
    expect(dont.torzs.hirfigyelo.javaslat.allapot).toBe("elvetve");
    expect(dont.torzs.hirfigyelo.ujVerzio).toBeNull();

    const beallitas = await keres<BeallitasValasz>("/api/hirfigyelo/beallitas", { sutik });
    expect(beallitas.torzs.hirfigyelo.aktiv!.verzio).toBe(3);
  });
});
