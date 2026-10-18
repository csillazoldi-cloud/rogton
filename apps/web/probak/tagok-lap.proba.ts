import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { keres, veletlenEmail, takaritas, lezar } from "./segedek";

interface BevaltoNezet {
  allapot: "kiadott" | "elfogadott" | "visszavont" | "lejart" | "nincs";
  meghivo_nev: string | null;
  szervezet_nev: string | null;
  szerep: string | null;
  lejar: string | null;
  belepve: boolean;
  fiok_email: string | null;
  mar_tag: boolean;
}

describe("tagok lap, bevalto lap, jegy-megtekintes (F-3e)", () => {
  let sutikA: string;
  let sutikB: string;
  let jegy1: string;
  let jegy2: string;
  let meghivoId2: string;
  const jelszo = "ProbaJelszo123!";
  const emailB = veletlenEmail();

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

    // A szervezet létrehozása
    const szA = await keres("/api/szervezet", {
      modszer: "POST",
      sutik: sutikA,
      torzs: { nev: "Proba Munkater" },
    });
    expect(szA.statusz).toBe(201);

    // B fiók létrehozása (szervezet nélkül)
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

    // A kiad egy nézői meghívót (jegy1)
    const meghivo1 = await keres("/api/tagok/meghivo", {
      modszer: "POST",
      sutik: sutikA,
      torzs: { szerep: "nezo" },
    });
    expect(meghivo1.statusz).toBe(201);
    jegy1 = (meghivo1.torzs as { hozzaferes: { jegy: string } }).hozzaferes.jegy;

    // A kiad egy szerkesztői meghívót (jegy2)
    const meghivo2 = await keres("/api/tagok/meghivo", {
      modszer: "POST",
      sutik: sutikA,
      torzs: { szerep: "szerkeszto" },
    });
    expect(meghivo2.statusz).toBe(201);
    const meghivo2Torzs = meghivo2.torzs as { hozzaferes: { meghivo: { id: string }; jegy: string } };
    jegy2 = meghivo2Torzs.hozzaferes.jegy;
    meghivoId2 = meghivo2Torzs.hozzaferes.meghivo.id;
  });

  afterAll(async () => {
    await takaritas();
    await lezar();
  });

  it("1. GET /api/meghivo/{jegy1} süti nélkül → 200; allapot kiadott; nevek megvannak", async () => {
    const valasz = await keres<{ meghivo: BevaltoNezet }>(`/api/meghivo/${jegy1}`);
    expect(valasz.statusz).toBe(200);
    const meghivo = valasz.torzs.meghivo;
    expect(meghivo.allapot).toBe("kiadott");
    expect(meghivo.szervezet_nev).toBe("Proba Munkater");
    expect(meghivo.meghivo_nev).toBe("Proba A");
    expect(meghivo.szerep).toBe("nezo");
    expect(meghivo.belepve).toBe(false);
    expect(meghivo.mar_tag).toBe(false);
    expect(meghivo.lejar).not.toBeNull();
  });

  it("2. GET /api/meghivo/{jegy1} B sütijével → belepve true, fiok_email B, mar_tag false", async () => {
    const valasz = await keres<{ meghivo: BevaltoNezet }>(`/api/meghivo/${jegy1}`, { sutik: sutikB });
    expect(valasz.statusz).toBe(200);
    const meghivo = valasz.torzs.meghivo;
    expect(meghivo.belepve).toBe(true);
    expect(meghivo.fiok_email).toBe(emailB);
    expect(meghivo.mar_tag).toBe(false);
  });

  it("3. GET /api/meghivo/nincs-ilyen-jegy → 200, allapot nincs, minden név null", async () => {
    const valasz = await keres<{ meghivo: BevaltoNezet }>("/api/meghivo/nincs-ilyen-jegy");
    expect(valasz.statusz).toBe(200);
    const meghivo = valasz.torzs.meghivo;
    expect(meghivo.allapot).toBe("nincs");
    expect(meghivo.meghivo_nev).toBeNull();
    expect(meghivo.szervezet_nev).toBeNull();
    expect(meghivo.szerep).toBeNull();
  });

  it("4. B beváltja jegy1-et → 200; utána allapot elfogadott, nevek null; B sütijével mar_tag true", async () => {
    const elfogad = await keres("/api/meghivo/elfogad", {
      modszer: "POST",
      sutik: sutikB,
      torzs: { jegy: jegy1 },
    });
    expect(elfogad.statusz).toBe(200);

    const valasz = await keres<{ meghivo: BevaltoNezet }>(`/api/meghivo/${jegy1}`);
    expect(valasz.statusz).toBe(200);
    const meghivo = valasz.torzs.meghivo;
    expect(meghivo.allapot).toBe("elfogadott");
    expect(meghivo.meghivo_nev).toBeNull();
    expect(meghivo.szervezet_nev).toBeNull();
    expect(meghivo.szerep).toBeNull();

    const valaszB = await keres<{ meghivo: BevaltoNezet }>(`/api/meghivo/${jegy1}`, { sutik: sutikB });
    expect(valaszB.statusz).toBe(200);
    expect(valaszB.torzs.meghivo.mar_tag).toBe(true);
  });

  it("5. A visszavonja jegy2-t → 200; GET /api/meghivo/{jegy2} → allapot visszavont", async () => {
    const visszavon = await keres(`/api/tagok/meghivo/${meghivoId2}`, {
      modszer: "DELETE",
      sutik: sutikA,
    });
    expect(visszavon.statusz).toBe(200);

    const valasz = await keres<{ meghivo: BevaltoNezet }>(`/api/meghivo/${jegy2}`);
    expect(valasz.statusz).toBe(200);
    expect(valasz.torzs.meghivo.allapot).toBe("visszavont");
  });

  it("6. GET /tagok lap: A (tulajdonos) → km-tg- és km-sav; B (néző) → km-kp-; süti nélkül → belépőlap", async () => {
    const lapA = await keres<string>("/tagok", { sutik: sutikA });
    expect(lapA.statusz).toBe(200);
    expect(lapA.torzs).toContain("km-tg-");
    expect(lapA.torzs).toContain("km-sav");

    const lapB = await keres<string>("/tagok", { sutik: sutikB });
    expect(lapB.statusz).toBe(200);
    expect(lapB.torzs).not.toContain("km-tg-");
    expect(lapB.torzs).toContain("km-kp-");

    const lapNelkul = await keres<string>("/tagok");
    expect(lapNelkul.statusz).toBe(200);
    expect(lapNelkul.torzs).not.toContain("km-tg-");
  });

  it("7. GET /meghivo/{jegy1} lap süti nélkül → 200, tartalmazza km-bv-, NEM tartalmazza km-sav", async () => {
    const lap = await keres<string>(`/meghivo/${jegy1}`);
    expect(lap.statusz).toBe(200);
    expect(lap.torzs).toContain("km-bv-");
    expect(lap.torzs).not.toContain("km-sav");
  });

  it("8. GET /belepes?vissza=... → 200 (érvényes és érvénytelen)", async () => {
    const valasz1 = await keres<string>("/belepes?vissza=/meghivo/abc");
    expect(valasz1.statusz).toBe(200);

    const valasz2 = await keres<string>("/belepes?vissza=//gonosz.example");
    expect(valasz2.statusz).toBe(200);
  });
});
