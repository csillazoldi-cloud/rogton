import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { keres, veletlenEmail, takaritas, lezar, sql } from "./segedek";

describe("Csomag és megőrzés (F-7a, F-5c)", () => {
  let sutikA: string;
  let szervezetId: string;
  const jelszo = "ProbaJelszo123!";

  beforeAll(async () => {
    const emailA = veletlenEmail();
    const regA = await keres("/api/fiok/regisztracio", {
      modszer: "POST",
      torzs: { nev: "Proba A", email: emailA, jelszo },
    });
    expect(regA.statusz).toBe(201);

    const belA = await keres("/api/fiok/belepes", {
      modszer: "POST",
      torzs: { email: emailA, jelszo },
    });
    expect(belA.statusz).toBe(200);
    sutikA = belA.sutik.join("; ");

    const szA = await keres("/api/szervezet", {
      modszer: "POST",
      sutik: sutikA,
      torzs: { nev: "Szervezet A" },
    });
    expect(szA.statusz).toBe(201);
    szervezetId = (szA.torzs as { id: string }).id;
  });

  afterAll(async () => {
    // Visszaállítás és takarítás
    await sql("UPDATE szervezet SET csomag_kod = 'pilot' WHERE id = $1", [szervezetId]);
    await sql("DELETE FROM csomag WHERE kod = 'proba-ures'");
    await takaritas();
    await lezar();
  });

  it("1. Új szervezet csomagja radar (F9-A9, volt pilot), a modul benne, forras_max 5", async () => {
    const valasz = await keres("/api/csomag", { sutik: sutikA });
    expect(valasz.statusz).toBe(200);
    const torzs = valasz.torzs as {
      csomag: { kod: string; modulok: string[]; ar_havi: number | null; penznem: string | null };
      modulok: { modul: string; benne: boolean }[];
    };
    expect(torzs.csomag.kod).toBe("radar");
    expect((torzs.csomag as { forras_max?: number | null }).forras_max).toBe(5); // F9-A8
    expect(torzs.csomag.modulok).toContain("hirfigyelo");
    expect(torzs.csomag.ar_havi).toBeNull();
    expect(torzs.csomag.penznem).toBeNull();
    expect(torzs.modulok).toEqual([{ modul: "hirfigyelo", benne: true }]);
  });

  it("2. Belépés nélkül 401", async () => {
    const valasz = await keres("/api/csomag");
    expect(valasz.statusz).toBe(401);
    const torzs = valasz.torzs as { hiba: string };
    expect(torzs.hiba).toBe("NINCS_BELEPVE");
  });

  it("3. A hírfigyelő áttekintője 200 a pilot csomaggal", async () => {
    const valasz = await keres("/api/hirfigyelo/attekintes", { sutik: sutikA });
    expect(valasz.statusz).toBe(200);
  });

  it("4. Üres csomaggal a hírfigyelő 403 MODUL_NEM_ELERHETO, és a GET /api/csomag ekkor modulok: [{ modul: 'hirfigyelo', benne: false }]", async () => {
    // Üres csomag létrehozása és beállítása
    await sql("INSERT INTO csomag (kod, modulok) VALUES ('proba-ures', '{}') ON CONFLICT (kod) DO NOTHING");
    await sql("UPDATE szervezet SET csomag_kod = 'proba-ures' WHERE id = $1", [szervezetId]);

    // Hírfigyelő 403
    const hfValasz = await keres("/api/hirfigyelo/attekintes", { sutik: sutikA });
    expect(hfValasz.statusz).toBe(403);
    const hfTorzs = hfValasz.torzs as { hiba: string };
    expect(hfTorzs.hiba).toBe("MODUL_NEM_ELERHETO");

    // Csomag API ellenőrzése
    const csomagValasz = await keres("/api/csomag", { sutik: sutikA });
    expect(csomagValasz.statusz).toBe(200);
    const csomagTorzs = csomagValasz.torzs as {
      csomag: { kod: string; modulok: string[] };
      modulok: { modul: string; benne: boolean }[];
    };
    expect(csomagTorzs.csomag.kod).toBe("proba-ures");
    expect(csomagTorzs.modulok).toEqual([{ modul: "hirfigyelo", benne: false }]);
  });

  it("5. Visszaállítva újra 200", async () => {
    // Visszaállítás pilot-ra
    await sql("UPDATE szervezet SET csomag_kod = 'pilot' WHERE id = $1", [szervezetId]);

    const valasz = await keres("/api/hirfigyelo/attekintes", { sutik: sutikA });
    expect(valasz.statusz).toBe(200);
  });

  it("6. A takarítás a 40 napos sort törli, az 1 naposat megtartja", async () => {
    // Régi és friss esemény beszúrása
    await sql(
      "INSERT INTO esemeny (szervezet_id, fajta, sulyossag, fiok_id, ido, adat) VALUES ($1, 'futas_kesz', 'info', NULL, now() - interval '40 days', '{}'::jsonb)",
      [szervezetId]
    );
    await sql(
      "INSERT INTO esemeny (szervezet_id, fajta, sulyossag, fiok_id, ido, adat) VALUES ($1, 'futas_kesz', 'info', NULL, now() - interval '1 day', '{}'::jsonb)",
      [szervezetId]
    );

    // Takarítás futtatása
    const takaritasEredmeny = await sql<{ n: number }>("SELECT esemeny_takarit(30) AS n");
    const toroltSzam = takaritasEredmeny[0]!.n;
    expect(toroltSzam).toBeGreaterThanOrEqual(1);

    // Ellenőrzés: csak a friss esemény maradt
    const maradek = await sql<{ n: number }>(
      "SELECT count(*)::int AS n FROM esemeny WHERE szervezet_id = $1",
      [szervezetId]
    );
    expect(maradek[0]!.n).toBe(1);
  });
});
