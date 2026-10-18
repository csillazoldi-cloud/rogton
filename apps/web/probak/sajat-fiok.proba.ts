import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { keres, veletlenEmail, takaritas, lezar } from "./segedek";
import type { KilepValasz } from "../sajatfiok/tipusok";

// F-4b (R-3 v2, D-F34): a Saját fiók lap gépezete a FUTÓ kiszolgáló ellen — a kilépés bármelyik saját munkatérből, a következő aktuális munkatér,
// az utolsó tulajdonos zárt esete, a lap maga. (A név, jelszó, kiléptetés végpontjait a `fiok.proba.ts` már bizonyítja.)

const jelszo = "ProbaJelszo123!";

describe("Saját fiók (F-4b, R-3)", () => {
  let sutikA: string;
  let sutikB: string;
  let szervezetAId: string; // A tulajdonosa
  let szervezetBId: string; // B tulajdonosa, A szerkesztő benne

  beforeAll(async () => {
    const emailA = veletlenEmail();
    expect((await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev: "Proba A", email: emailA, jelszo } })).statusz).toBe(201);
    const belA = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email: emailA, jelszo } });
    sutikA = belA.sutik.join("; ");
    const szA = await keres<{ id: string }>("/api/szervezet", { modszer: "POST", sutik: sutikA, torzs: { nev: "Saját A" } });
    expect(szA.statusz).toBe(201);
    szervezetAId = szA.torzs.id;

    const emailB = veletlenEmail();
    expect((await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev: "Proba B", email: emailB, jelszo } })).statusz).toBe(201);
    const belB = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email: emailB, jelszo } });
    sutikB = belB.sutik.join("; ");
    const szB = await keres<{ id: string }>("/api/szervezet", { modszer: "POST", sutik: sutikB, torzs: { nev: "Demo ügyfél Kft." } });
    expect(szB.statusz).toBe(201);
    szervezetBId = szB.torzs.id;

    // B meghívja A-t szerkesztőnek, A elfogadja — A-nak két munkatere lesz, az aktuális marad a sajátja (A)
    const meghivo = await keres<{ hozzaferes: { jegy: string } }>("/api/tagok/meghivo", { modszer: "POST", sutik: sutikB, torzs: { szerep: "szerkeszto" } });
    expect(meghivo.statusz).toBe(201);
    expect((await keres("/api/meghivo/elfogad", { modszer: "POST", sutik: sutikA, torzs: { jegy: meghivo.torzs.hozzaferes.jegy } })).statusz).toBe(200);
    // az aktuális munkatér A sajátja legyen
    expect((await keres("/api/szervezet/valt", { modszer: "POST", sutik: sutikA, torzs: { szervezet_id: szervezetAId } })).statusz).toBe(200);
  });

  afterAll(async () => {
    await takaritas();
    await lezar();
  });

  it("1. a Saját fiók lap belépve 200, belépés nélkül a belépéshez irányít", async () => {
    const v = await keres<string>("/sajat-fiok", { sutik: sutikA });
    expect(v.statusz).toBe(200);
    expect(v.torzs).toContain("km-sf-");
    const nelkul = await keres<string>("/sajat-fiok");
    expect([200, 302, 307]).toContain(nelkul.statusz);
    expect(String(nelkul.torzs)).not.toContain("km-sf-oldalsav");
  });

  it("2. az egyetlen tulajdonos nem léphet ki a saját munkateréből → 409 UTOLSO_TULAJDONOS", async () => {
    const v = await keres<{ hiba: string }>("/api/tagok/kilep", { modszer: "POST", sutik: sutikA, torzs: { szervezet_id: szervezetAId } });
    expect(v.statusz).toBe(409);
    expect(v.torzs.hiba).toBe("UTOLSO_TULAJDONOS");
  });

  it("3. idegen munkatérből nem lehet kilépni → 403", async () => {
    const v = await keres("/api/tagok/kilep", { modszer: "POST", sutik: sutikB, torzs: { szervezet_id: szervezetAId } });
    expect(v.statusz).toBe(403);
  });

  it("4. kilépés a MÁSIK (nem aktuális) munkatérből: az aktuális marad", async () => {
    const v = await keres<KilepValasz>("/api/tagok/kilep", { modszer: "POST", sutik: sutikA, torzs: { szervezet_id: szervezetBId } });
    expect(v.statusz).toBe(200);
    expect(v.torzs.kovetkezo_szervezet_id).toBe(szervezetAId);
    const en = await keres<{ szervezetek: { id: string }[] }>("/api/fiok/en", { sutik: sutikA });
    expect(en.torzs.szervezetek.map((s) => s.id)).toEqual([szervezetAId]);
  });

  it("5. kilépés az AKTUÁLIS munkatérből: a maradék első lesz az aktuális; ha nem marad, null", async () => {
    // B-t A meghívja a sajátjába szerkesztőnek, B átvált oda, majd kilép belőle → B-nek a sajátja marad
    const meghivo = await keres<{ hozzaferes: { jegy: string } }>("/api/tagok/meghivo", { modszer: "POST", sutik: sutikA, torzs: { szerep: "szerkeszto" } });
    expect((await keres("/api/meghivo/elfogad", { modszer: "POST", sutik: sutikB, torzs: { jegy: meghivo.torzs.hozzaferes.jegy } })).statusz).toBe(200);
    expect((await keres("/api/szervezet/valt", { modszer: "POST", sutik: sutikB, torzs: { szervezet_id: szervezetAId } })).statusz).toBe(200);
    const v = await keres<KilepValasz>("/api/tagok/kilep", { modszer: "POST", sutik: sutikB, torzs: {} });
    expect(v.statusz).toBe(200);
    expect(v.torzs.kovetkezo_szervezet_id).toBe(szervezetBId);
    const lap = await keres<string>("/sajat-fiok", { sutik: sutikB });
    expect(lap.statusz).toBe(200);
  });

  it("6. érvénytelen szervezet-azonosító → 400", async () => {
    expect((await keres("/api/tagok/kilep", { modszer: "POST", sutik: sutikA, torzs: { szervezet_id: "nem-uuid" } })).statusz).toBe(400);
  });
});
