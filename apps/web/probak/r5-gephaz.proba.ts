import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { keres, veletlenEmail, takaritas, lezar } from "./segedek";

describe("R-5 — Gépház csempék, AI-kapcsoló, Kimenő lap (F-7b)", () => {
  let sutikA: string;
  let sutikB: string;
  const jelszo = "ProbaJelszo123!";

  beforeAll(async () => {
    // A fiók létrehozása és belépése
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

    // A első szervezete (tulajdonos)
    const szA = await keres("/api/szervezet", {
      modszer: "POST",
      sutik: sutikA,
      torzs: { nev: "Szervezet A" },
    });
    expect(szA.statusz).toBe(201);

    // B fiók létrehozása (szervezet nélkül)
    const emailB = veletlenEmail();
    const regB = await keres("/api/fiok/regisztracio", {
      modszer: "POST",
      torzs: { nev: "Proba B", email: emailB, jelszo },
    });
    expect(regB.statusz).toBe(201);

    const belB = await keres("/api/fiok/belepes", {
      modszer: "POST",
      torzs: { email: emailB, jelszo },
    });
    expect(belB.statusz).toBe(200);
    sutikB = belB.sutik.join("; ");

    // A meghívja B-t nézőnek
    const meghivo = await keres("/api/tagok/meghivo", {
      modszer: "POST",
      sutik: sutikA,
      torzs: { szerep: "nezo" },
    });
    expect(meghivo.statusz).toBe(201);
    const jegy = (meghivo.torzs as { hozzaferes: { jegy: string } }).hozzaferes.jegy;

    // B beváltja a meghívót
    const elfogad = await keres("/api/meghivo/elfogad", {
      modszer: "POST",
      sutik: sutikB,
      torzs: { jegy },
    });
    expect(elfogad.statusz).toBe(200);
  });

  afterAll(async () => {
    await takaritas();
    await lezar();
  });

  it("1. Gépház csomag-mezője pilot, a modul benne", async () => {
    const valasz = await keres("/api/gephaz", { sutik: sutikA });
    expect(valasz.statusz).toBe(200);
    const torzs = valasz.torzs as { gephaz: { csomag: { kod: string; modulok: { modul: string; benne: boolean }[] } } };
    const gephaz = torzs.gephaz;
    expect(gephaz.csomag.kod).toBe("radar"); // F9-A9
    const hirfigyeloModul = gephaz.csomag.modulok.find((m) => m.modul === "hirfigyelo");
    expect(hirfigyeloModul).toBeDefined();
    expect(hirfigyeloModul?.benne).toBe(true);
  });

  it("2. kimeno_szam 0 → felülírás után 1 → visszaállítva 0", async () => {
    // Kezdeti állapot ellenőrzése
    const valasz0 = await keres("/api/gephaz", { sutik: sutikA });
    expect(valasz0.statusz).toBe(200);
    const torzs0 = valasz0.torzs as { gephaz: { kimeno: { bekotve: boolean; kimeno_szam: number } } };
    expect(torzs0.gephaz.kimeno.kimeno_szam).toBe(0);

    // Felülírás
    const ertesites = await keres("/api/ertesites", {
      modszer: "PUT",
      sutik: sutikA,
      torzs: { futas_hiba: "kimeno" },
    });
    expect(ertesites.statusz).toBe(200);

    const valasz1 = await keres("/api/gephaz", { sutik: sutikA });
    expect(valasz1.statusz).toBe(200);
    const torzs1 = valasz1.torzs as { gephaz: { kimeno: { kimeno_szam: number } } };
    expect(torzs1.gephaz.kimeno.kimeno_szam).toBe(1);

    // Visszaállítás
    const vissza = await keres("/api/ertesites", {
      modszer: "PUT",
      sutik: sutikA,
      torzs: {},
    });
    expect(vissza.statusz).toBe(200);

    const valasz2 = await keres("/api/gephaz", { sutik: sutikA });
    expect(valasz2.statusz).toBe(200);
    const torzs2 = valasz2.torzs as { gephaz: { kimeno: { kimeno_szam: number } } };
    expect(torzs2.gephaz.kimeno.kimeno_szam).toBe(0);
  });

  it("3. Az áttekintő ai_engedelyezve true", async () => {
    const valasz = await keres("/api/hirfigyelo/attekintes", { sutik: sutikB });
    expect(valasz.statusz).toBe(200);
    const torzs = valasz.torzs as { hirfigyelo: { ai_engedelyezve: boolean } };
    expect(torzs.hirfigyelo.ai_engedelyezve).toBe(true);
  });

  it("4. AI kikapcsolva → false, visszakapcsolva → true", async () => {
    // Kikapcsolás
    const kikapcsol = await keres("/api/beallitas/ai", {
      modszer: "PUT",
      sutik: sutikA,
      torzs: { engedelyezve: false },
    });
    expect(kikapcsol.statusz).toBe(200);

    const valaszFalse = await keres("/api/hirfigyelo/attekintes", { sutik: sutikB });
    expect(valaszFalse.statusz).toBe(200);
    const torzsFalse = valaszFalse.torzs as { hirfigyelo: { ai_engedelyezve: boolean } };
    expect(torzsFalse.hirfigyelo.ai_engedelyezve).toBe(false);

    // Visszakapcsolás
    const visszakapcsol = await keres("/api/beallitas/ai", {
      modszer: "PUT",
      sutik: sutikA,
      torzs: { engedelyezve: true },
    });
    expect(visszakapcsol.statusz).toBe(200);

    const valaszTrue = await keres("/api/hirfigyelo/attekintes", { sutik: sutikB });
    expect(valaszTrue.statusz).toBe(200);
    const torzsTrue = valaszTrue.torzs as { hirfigyelo: { ai_engedelyezve: boolean } };
    expect(torzsTrue.hirfigyelo.ai_engedelyezve).toBe(true);
  });

  it("5. A Kimenő lap tulajdonosnak 200 és km-ki-", async () => {
    const lap = await keres<string>("/gephaz/kimeno", { sutik: sutikA });
    expect(lap.statusz).toBe(200);
    expect(lap.torzs).toContain("km-ki-");
  });

  it("6. Belépés nélkül nincs km-ki-", async () => {
    const lap = await keres<string>("/gephaz/kimeno");
    expect(lap.statusz).toBe(200);
    expect(lap.torzs).not.toContain("km-ki-");
  });

  it("7. Néző: a lapon nincs km-ki-, és a két PUT 403", async () => {
    // Néző a Kimenő lapon
    const lap = await keres<string>("/gephaz/kimeno", { sutik: sutikB });
    expect(lap.statusz).toBe(200);
    expect(lap.torzs).not.toContain("km-ki-");

    // Néző PUT /api/beallitas/ai → 403
    const aiPut = await keres("/api/beallitas/ai", {
      modszer: "PUT",
      sutik: sutikB,
      torzs: { engedelyezve: false },
    });
    expect(aiPut.statusz).toBe(403);

    // Néző PUT /api/ertesites → 403
    const ertesitesPut = await keres("/api/ertesites", {
      modszer: "PUT",
      sutik: sutikB,
      torzs: { futas_hiba: "kimeno" },
    });
    expect(ertesitesPut.statusz).toBe(403);
  });
});
