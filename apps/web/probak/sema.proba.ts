import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { keres, veletlenEmail, takaritas, lezar } from "./segedek";

describe("séma váltás élő próbák (R10-P)", () => {
  let tulajdonosSutik: string;
  let nezokSutik: string;
  let szerkesztoSutik: string;
  let alapBgErtek: string;

  const jelszo = "ProbaJelszo123!";

  async function fiokLetrehozas(): Promise<{ sutik: string }> {
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

    // Szervezet létrehozása (a tulajdonosnak kell)
    const szervezet = await keres("/api/szervezet", {
      modszer: "POST",
      torzs: { nev: "Proba Szervezet" },
      sutik,
    });
    expect(szervezet.statusz).toBe(201);

    return { sutik };
  }

  beforeAll(async () => {
    // Tulajdonos fiók
    const tulajdonos = await fiokLetrehozas();
    tulajdonosSutik = tulajdonos.sutik;

    // Néző fiók (saját szervezete van, de más szervezetbe nézőként)
    const nezok = await fiokLetrehozas();
    nezokSutik = nezok.sutik;

    // Szerkesztő fiók (saját szervezete van, de más szervezetbe szerkesztőként)
    const szerkeszto = await fiokLetrehozas();
    szerkesztoSutik = szerkeszto.sutik;

    // Alap érték lekérdezése a tulajdonossal (még nincs váltás)
    const tema = await keres<unknown>("/api/tema", { sutik: tulajdonosSutik });
    expect(tema.statusz).toBe(200);
    const temaTorzs = tema.torzs as { hatasos: Record<string, string> };
    alapBgErtek = temaTorzs.hatasos["--bg"] ?? "";
  });

  afterAll(async () => {
    await takaritas();
    await lezar();
  });

  it("1. belépés nélkül → 401", async () => {
    const valasz = await keres<unknown>("/api/tema/sema", {
      modszer: "PUT",
      torzs: { kod: "vilagos" },
    });
    expect(valasz.statusz).toBe(401);
  });

  it("2. néző → 403; szerkesztő → 403", async () => {
    // Néző
    const nezokValasz = await keres<unknown>("/api/tema/sema", {
      modszer: "PUT",
      sutik: nezokSutik,
      torzs: { kod: "vilagos" },
    });
    expect(nezokValasz.statusz).toBe(403);
    expect((nezokValasz.torzs as { kod: string }).kod).toBe("NINCS_JOG");

    // Szerkesztő
    const szerkesztoValasz = await keres<unknown>("/api/tema/sema", {
      modszer: "PUT",
      sutik: szerkesztoSutik,
      torzs: { kod: "vilagos" },
    });
    expect(szerkesztoValasz.statusz).toBe(403);
    expect((szerkesztoValasz.torzs as { kod: string }).kod).toBe("NINCS_JOG");
  });

  it("3. tulajdonos, vilagos → 200, sema_kod === 'vilagos', hatasos['--bg'] === '#F7F7F5', hatasos['--aurora-opacity'] === '0'; GET /api/tema ugyanezt adja", async () => {
    const valasz = await keres<unknown>("/api/tema/sema", {
      modszer: "PUT",
      sutik: tulajdonosSutik,
      torzs: { kod: "vilagos" },
    });
    expect(valasz.statusz).toBe(200);

    const tema = valasz.torzs as { sema_kod: string; hatasos: Record<string, string> };
    expect(tema.sema_kod).toBe("vilagos");
    expect(tema.hatasos["--bg"]).toBe("#F7F7F5");
    expect(tema.hatasos["--aurora-opacity"]).toBe("0");

    // GET /api/tema ellenőrzése
    const getValasz = await keres<unknown>("/api/tema", { sutik: tulajdonosSutik });
    expect(getValasz.statusz).toBe(200);
    const getTema = getValasz.torzs as { hatasos: Record<string, string> };
    expect(getTema.hatasos["--bg"]).toBe("#F7F7F5");
    expect(getTema.hatasos["--aurora-opacity"]).toBe("0");
  });

  it("4. tulajdonos, sotet → hatasos['--bg'] === '#15161C'; a verzio nagyobb, mint az előző", async () => {
    // Előző verzió lekérdezése
    const elozoTema = await keres<unknown>("/api/tema", { sutik: tulajdonosSutik });
    const elozoVerzio = (elozoTema.torzs as { verzio: number }).verzio;

    const valasz = await keres<unknown>("/api/tema/sema", {
      modszer: "PUT",
      sutik: tulajdonosSutik,
      torzs: { kod: "sotet" },
    });
    expect(valasz.statusz).toBe(200);

    const tema = valasz.torzs as { hatasos: Record<string, string>; verzio: number };
    expect(tema.hatasos["--bg"]).toBe("#15161C");
    expect(tema.verzio).toBeGreaterThan(elozoVerzio);
  });

  it("5. tulajdonos, ejkek → a hatasos['--bg'] egyenlő a belépés utáni ELSŐ GET /api/tema értékével", async () => {
    const valasz = await keres<unknown>("/api/tema/sema", {
      modszer: "PUT",
      sutik: tulajdonosSutik,
      torzs: { kod: "ejkek" },
    });
    expect(valasz.statusz).toBe(200);

    const tema = valasz.torzs as { hatasos: Record<string, string> };
    expect(tema.hatasos["--bg"]).toBe(alapBgErtek);
  });

  it("6. visszaállítás az előző verzióra → a sema_kod az előző séma kódja", async () => {
    // Jelenlegi verzió és séma lekérdezése
    const jelenlegiTema = await keres<unknown>("/api/tema", { sutik: tulajdonosSutik });
    const jelenlegiVerzio = (jelenlegiTema.torzs as { verzio: number }).verzio;
    const jelenlegiSema = (jelenlegiTema.torzs as { sema_kod: string }).sema_kod;

    // Visszaállítás az előző verzióra
    const valasz = await keres<unknown>("/api/tema/visszaallit", {
      modszer: "POST",
      sutik: tulajdonosSutik,
      torzs: { verzio: jelenlegiVerzio - 1 },
    });
    expect(valasz.statusz).toBe(200);

    // Ellenőrzés: a séma kódja az előző séma kódja
    const tema = valasz.torzs as { sema_kod: string };
    // Az előző séma a "sotet" volt (4. esettől)
    expect(tema.sema_kod).toBe("sotet");
  });

  it("7. ismeretlen kód ('lila') → 400 ISMERETLEN_SEMA", async () => {
    const valasz = await keres<unknown>("/api/tema/sema", {
      modszer: "PUT",
      sutik: tulajdonosSutik,
      torzs: { kod: "lila" },
    });
    expect(valasz.statusz).toBe(400);
    expect((valasz.torzs as { kod: string }).kod).toBe("ISMERETLEN_SEMA");
  });

  it("8. a közös végpont tulajdonosként → 403", async () => {
    const valasz = await keres<unknown>("/api/tema/kozos/sema", {
      modszer: "PUT",
      sutik: tulajdonosSutik,
      torzs: { kod: "vilagos" },
    });
    expect(valasz.statusz).toBe(403);
    expect((valasz.torzs as { kod: string }).kod).toBe("NINCS_JOG");
  });
});
