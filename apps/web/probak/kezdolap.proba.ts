import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { keres, veletlenEmail, takaritas, lezar, sql } from "./segedek";
import type { KezdolapNezet, GephazNezet } from "../kezdolap/tipusok";

describe("kezdolap, gephaz, penznem, munkater-valtas (F-2)", () => {
  let sutikA: string;
  let sutikB: string;
  let sutikC: string;
  let szervezetA1Id: string;
  let szervezetA2Id: string;
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
    const szA1 = await keres("/api/szervezet", {
      modszer: "POST",
      sutik: sutikA,
      torzs: { nev: "Szervezet A1" },
    });
    expect(szA1.statusz).toBe(201);
    szervezetA1Id = (szA1.torzs as { id: string }).id;

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

    // A meghívja B-t nézőnek az első szervezetbe
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

    // C fiók létrehozása (szervezet nélkül)
    const emailC = veletlenEmail();
    const regC = await keres("/api/fiok/regisztracio", {
      modszer: "POST",
      torzs: { nev: "Proba C", email: emailC, jelszo },
    });
    expect(regC.statusz).toBe(201);

    const belC = await keres("/api/fiok/belepes", {
      modszer: "POST",
      torzs: { email: emailC, jelszo },
    });
    expect(belC.statusz).toBe(200);
    sutikC = belC.sutik.join("; ");

  });

  afterAll(async () => {
    await takaritas();
    await lezar();
  });

  it("1. GET /api/kezdolap (A, tulajdonos) → 200, alapértékek", async () => {
    const valasz = await keres("/api/kezdolap", { sutik: sutikA });
    expect(valasz.statusz).toBe(200);
    const torzs = valasz.torzs as { kezdolap: KezdolapNezet };
    const kezdo = torzs.kezdolap;

    expect(kezdo.munkater.id).toBe(szervezetA1Id);
    expect(kezdo.munkater.penznem).toBe("EUR");
    expect(kezdo.szerep).toBe("tulajdonos");
    expect(kezdo.elso_hasznalat).toBe(true);
    expect(kezdo.hirfigyelo).toBeNull();
    expect(kezdo.profil).toBeNull();
    expect(kezdo.arculat).toBe("nincs");
    
    expect(kezdo.forrasok.osszes).toBe(0);
    expect(kezdo.koltseg.becsult.usd).toBe(0);
    expect(kezdo.koltseg.becsult.penznem).toBe("EUR");
    expect(kezdo.koltseg.keret.usd).toBeGreaterThan(0);
    expect(kezdo.koltseg.maradt.ertek).toBeGreaterThanOrEqual(0);
    expect(kezdo.tervezet.tema).toBe(false);
    expect(kezdo.tervezet.feliratok).toBe(false);
  });

  it("2. GET /api/gephaz (A, tulajdonos) → 200, nezet tulajdonos", async () => {
    const valasz = await keres("/api/gephaz", { sutik: sutikA });
    expect(valasz.statusz).toBe(200);
    const torzs = valasz.torzs as { gephaz: GephazNezet };
    const gephaz = torzs.gephaz;

    expect(gephaz.nezet).toBe("tulajdonos");
    expect(gephaz.koltseg).toBeNull();
    expect(gephaz.fiokok).toBeNull();
    expect(gephaz.tema.tervezet).toBe(false);
    expect(gephaz.tema.felulirt).toBe(0);
  });

  it("3. GET /api/gephaz (B, néző) → 403 NINCS_JOG", async () => {
    const valasz = await keres("/api/gephaz", { sutik: sutikB });
    expect(valasz.statusz).toBe(403);
    const torzs = valasz.torzs as { hiba: string };
    expect(torzs.hiba).toBe("NINCS_JOG");
  });

  it("4. GET /api/gephaz (C, szervezet nélkül) → 409 NINCS_SZERVEZET", async () => {
    const valasz = await keres("/api/gephaz", { sutik: sutikC });
    expect(valasz.statusz).toBe(409);
    const torzs = valasz.torzs as { hiba: string };
    expect(torzs.hiba).toBe("NINCS_SZERVEZET");
  });

  it("5. PUT /api/beallitas/penznem (A) → RON → 200, majd kezdolap RON", async () => {
    const valasz = await keres("/api/beallitas/penznem", {
      modszer: "PUT",
      sutik: sutikA,
      torzs: { penznem: "RON" },
    });
    expect(valasz.statusz).toBe(200);
    const torzs = valasz.torzs as { penznem: string };
    expect(torzs.penznem).toBe("RON");

    const kezdoValasz = await keres("/api/kezdolap", { sutik: sutikA });
    expect(kezdoValasz.statusz).toBe(200);
    const kezdo = (kezdoValasz.torzs as { kezdolap: KezdolapNezet }).kezdolap;
    expect(kezdo.munkater.penznem).toBe("RON");
    expect(kezdo.koltseg.keret.penznem).toBe("RON");
  });

  it("6. PUT /api/beallitas/penznem (A) → GBP → 400 ERVENYTELEN_ADAT", async () => {
    const valasz = await keres("/api/beallitas/penznem", {
      modszer: "PUT",
      sutik: sutikA,
      torzs: { penznem: "GBP" },
    });
    expect(valasz.statusz).toBe(400);
    const torzs = valasz.torzs as { hiba: string };
    expect(torzs.hiba).toBe("ERVENYTELEN_ADAT");
  });

  it("7. PUT /api/beallitas/penznem (B, néző) → 403 NINCS_JOG", async () => {
    const valasz = await keres("/api/beallitas/penznem", {
      modszer: "PUT",
      sutik: sutikB,
      torzs: { penznem: "EUR" },
    });
    expect(valasz.statusz).toBe(403);
    const torzs = valasz.torzs as { hiba: string };
    expect(torzs.hiba).toBe("NINCS_JOG");
  });

  it("8. GET /api/beallitas/arfolyam (A) → 200, USD=1, mind > 0", async () => {
    const valasz = await keres("/api/beallitas/arfolyam", { sutik: sutikA });
    expect(valasz.statusz).toBe(200);
    const torzs = valasz.torzs as { arfolyam: { EUR: number; USD: number; HUF: number; RON: number } };
    const arf = torzs.arfolyam;
    expect(arf.USD).toBe(1);
    expect(arf.EUR).toBeGreaterThan(0);
    expect(arf.HUF).toBeGreaterThan(0);
    expect(arf.RON).toBeGreaterThan(0);
  });

  it("9. PUT /api/beallitas/arfolyam (A, nem rendszergazda) → 403 NINCS_JOG", async () => {
    const valasz = await keres("/api/beallitas/arfolyam", {
      modszer: "PUT",
      sutik: sutikA,
      torzs: { penznem: "HUF", egy_usd: 360 },
    });
    expect(valasz.statusz).toBe(403);
    const torzs = valasz.torzs as { hiba: string };
    expect(torzs.hiba).toBe("NINCS_JOG");
  });

  it("10. POST /api/szervezet/valt (A) → A2 → 200, majd kezdolap A2; idegen → 403; hibás → 400", async () => {
    // A második szervezete (tulajdonos) — itt jön létre, hogy az 1–9. eset munkatere biztosan az A1 legyen
    const szA2 = await keres("/api/szervezet", { modszer: "POST", sutik: sutikA, torzs: { nev: "Szervezet A2" } });
    expect(szA2.statusz).toBe(201);
    szervezetA2Id = (szA2.torzs as { id: string }).id;
    // Váltás A2-re
    const valtA2 = await keres("/api/szervezet/valt", {
      modszer: "POST",
      sutik: sutikA,
      torzs: { szervezet_id: szervezetA2Id },
    });
    expect(valtA2.statusz).toBe(200);
    const valtA2Torzs = valtA2.torzs as { szervezet: { id: string; nev: string } };
    expect(valtA2Torzs.szervezet.id).toBe(szervezetA2Id);

    const kezdoA2 = await keres("/api/kezdolap", { sutik: sutikA });
    expect(kezdoA2.statusz).toBe(200);
    const kezdoA2Nezet = (kezdoA2.torzs as { kezdolap: KezdolapNezet }).kezdolap;
    expect(kezdoA2Nezet.munkater.id).toBe(szervezetA2Id);

    // Vissza A1-re
    const valtA1 = await keres("/api/szervezet/valt", {
      modszer: "POST",
      sutik: sutikA,
      torzs: { szervezet_id: szervezetA1Id },
    });
    expect(valtA1.statusz).toBe(200);

    // B próbálkozik A2-re (nem tag)
    const valtB = await keres("/api/szervezet/valt", {
      modszer: "POST",
      sutik: sutikB,
      torzs: { szervezet_id: szervezetA2Id },
    });
    expect(valtB.statusz).toBe(403);
    const valtBTorzs = valtB.torzs as { hiba: string };
    expect(valtBTorzs.hiba).toBe("NINCS_JOG");

    // Süti nélkül
    const valtNelkul = await keres("/api/szervezet/valt", { modszer: "POST", torzs: { szervezet_id: szervezetA1Id } });
    expect(valtNelkul.statusz).toBe(401);

    // Hibás uuid
    const valtHibas = await keres("/api/szervezet/valt", {
      modszer: "POST",
      sutik: sutikA,
      torzs: { szervezet_id: "nem-uuid" },
    });
    expect(valtHibas.statusz).toBe(400);
  });
  it("11. GET /kezdolap lap: sütivel a felső sáv és a kezdőképernyő; süti nélkül a belépőlap (átirányítás után)", async () => {
    const lap = await keres<string>("/kezdolap", { sutik: sutikA });
    expect(lap.statusz).toBe(200);
    expect(lap.torzs).toContain("km-sav");
    expect(lap.torzs).toContain("km-kp-");
    // az A1 a jóváhagyott profil nélkül az első-használat kártyát kapja
    expect(lap.torzs).toContain("km-kp-elso");
    const nelkul = await keres<string>("/kezdolap");
    expect(nelkul.statusz).toBe(200);
    expect(nelkul.torzs).not.toContain("km-sav");
    expect(nelkul.torzs).toMatch(/belép|sign in|autentificare/i); // a belépőlap
  });

  it("12. GET /gephaz lap: tulajdonosnak a tulajdonos nézet; nézőnek a kezdőlap (átirányítás után)", async () => {
    const tulaj = await keres<string>("/gephaz", { sutik: sutikA });
    expect(tulaj.statusz).toBe(200);
    expect(tulaj.torzs).toContain("km-gh-");
    // R-7c 01 (D-F43): a tulajdonos Gépháza sorlista lett, az „Ami itt nincs" blokk (km-gh-tulaj-nincs) a rajz szerint elmaradt — a sorlista sora a jel
    expect(tulaj.torzs).toContain("km-gh-sor");
    const nezo = await keres<string>("/gephaz", { sutik: sutikB });
    expect(nezo.statusz).toBe(200);
    expect(nezo.torzs).not.toContain("km-gh-");
    expect(nezo.torzs).toContain("km-kp-");
  });
  it("13. PUT /api/beallitas/arfolyam rendszergazdaként → 200, a GET az új értéket adja; utána visszaállítva", async () => {
    // C-t rendszergazdának jelöljük (a jelölést csak SQL vagy egy másik rendszergazda adja — E-13)
    const cFiok = await keres<{ id: string }>("/api/fiok/en", { sutik: sutikC });
    expect(cFiok.statusz).toBe(200);
    await sql("UPDATE fiok SET rendszergazda = true WHERE id = $1", [cFiok.torzs.id]);
    const elotte = (await keres<{ arfolyam: { HUF: number } }>("/api/beallitas/arfolyam", { sutik: sutikA })).torzs.arfolyam.HUF;
    const allit = await keres<{ arfolyam: { HUF: number } }>("/api/beallitas/arfolyam", { modszer: "PUT", sutik: sutikC, torzs: { penznem: "HUF", egy_usd: 361 } });
    expect(allit.statusz).toBe(200);
    expect(allit.torzs.arfolyam.HUF).toBe(361);
    const utana = await keres<{ arfolyam: { HUF: number } }>("/api/beallitas/arfolyam", { sutik: sutikA });
    expect(utana.torzs.arfolyam.HUF).toBe(361);
    const vissza = await keres("/api/beallitas/arfolyam", { modszer: "PUT", sutik: sutikC, torzs: { penznem: "HUF", egy_usd: elotte } });
    expect(vissza.statusz).toBe(200);
    const rossz = await keres<{ hiba: string }>("/api/beallitas/arfolyam", { modszer: "PUT", sutik: sutikC, torzs: { penznem: "HUF", egy_usd: -1 } });
    expect(rossz.statusz).toBe(400);
  });
  it("14. R-1 v4: a felső sáv a régi lapokon is (Ügyfélprofil, Hírfigyelő, Theme, Feliratok, Költség), a Fiókok a nem rendszergazdát a kezdőlapra küldi", async () => {
    // A-nak nincs jóváhagyott profilja → a /fiok és a /hirfigyelo az onboardingra irányít; a sáv a /tema, /feliratok, /koltseg lapon mérhető
    for (const ut of ["/tema", "/feliratok", "/koltseg"]) {
      const lap = await keres<string>(ut, { sutik: sutikA });
      expect(lap.statusz, ut).toBe(200);
      expect(lap.torzs, `${ut}: a felső sáv`).toContain("km-sav");
      expect(lap.torzs, `${ut}: a régi négyes váltó nincs`).not.toContain("km-gnav");
    }
    const fiokok = await keres<string>("/fiokok", { sutik: sutikA });
    expect(fiokok.statusz).toBe(200);
    expect(fiokok.torzs).toContain("km-kp-"); // a kezdőlapra irányított (nem rendszergazda)
  });

  it("15. R-1 v4: a Gépház tulajdonos nézetén a pénznem-vezérlő; a rendszergazda nézetén nincs", async () => {
    const tulaj = await keres<string>("/gephaz", { sutik: sutikA });
    expect(tulaj.statusz).toBe(200);
    // R-15 c5 2. kör (kerdesek-5 · 10, Csilla 2026-10-10 18:08): a tulajdonos nézetén a pénznem-vezérlő a „Haladó ▾” MÖGÖTT van
    // (kliens-oldali lenyitás) — ezért a kiszolgáló HTML-jében a Haladó kapcsoló van, maga a választó csak lenyitva jelenik meg.
    // Az elvárás ezért változott (régen: a választó azonnal a lapon). A vezérlő és a PUT /api/beallitas/penznem változatlan.
    expect(tulaj.torzs).toContain("r15be-halado");
    expect(tulaj.torzs).not.toContain("km-gh-penznem-valaszto");
    // C rendszergazda (a 13. eset jelölte) — nála a Munkatér csempe nincs
    const rg = await keres<string>("/gephaz", { sutik: sutikC });
    if (rg.torzs.includes("km-gh-")) expect(rg.torzs).not.toContain("km-gh-penznem-valaszto");
  });
});
