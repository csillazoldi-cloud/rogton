import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { VAN_NYELVVALASZTAS } from "@rogton/design-system";
import { keres, veletlenEmail, PROBA_CIM, lezar } from "./segedek";

let sutik = "";
let szervezetNelkuliSutik = "";
let fiokId = "";
let szervezetId = "";

describe("Hírfigyelő felület élő próbái", () => {
  beforeAll(async () => {
    // Fiók létrehozása szervezettel
    const email = veletlenEmail();
    const jelszo = "ProbaJelszo123!";
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
    sutik = belepes.sutik.join("; ");

    // Fiók azonosító lekérdezése
    const fiokEn = await keres<unknown>("/api/fiok/en", { sutik });
    expect(fiokEn.statusz).toBe(200);
    const fiokTorzs = fiokEn.torzs as { id: string };
    fiokId = fiokTorzs.id;

    const szervezet = await keres("/api/szervezet", {
      modszer: "POST",
      torzs: { nev: "Proba Szervezet" },
      sutik,
    });
    expect(szervezet.statusz).toBe(201);
    const szervezetTorzs = szervezet.torzs as { id: string };
    szervezetId = szervezetTorzs.id;

    // Fiók szervezet nélkül
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
    szervezetNelkuliSutik = belepNelkul.sutik.join("; ");

    // Jóváhagyott profil létrehozása
    const piszkozatMentes = await keres<unknown>("/api/onboarding/piszkozat", {
      modszer: "PUT",
      torzs: {
        bemutatkozas: {
          nev: "Próba Műhely",
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

    const jovahagyas = await keres<unknown>("/api/onboarding/jovahagyas", {
      modszer: "POST",
      torzs: {},
      sutik,
    });
    expect(jovahagyas.statusz).toBe(200);
  });

  afterAll(async () => {
    await lezar();
  });

  it("belépés nélkül GET /hirfigyelo → átirányítás /belepes", async () => {
    const valasz = await fetch(`${PROBA_CIM}/hirfigyelo`, { redirect: "manual" });
    expect(valasz.status).toBe(307);
    expect(valasz.headers.get("location")).toContain("/belepes");
  });

  it("belépés nélkül GET /hirfigyelo/beallitas → átirányítás /belepes", async () => {
    const valasz = await fetch(`${PROBA_CIM}/hirfigyelo/beallitas`, { redirect: "manual" });
    expect(valasz.status).toBe(307);
    expect(valasz.headers.get("location")).toContain("/belepes");
  });

  it("belépve, szervezettel, DE profil nélkül → átirányítás /onboarding/1", async () => {
    // Új fiók szervezettel, profil nélkül
    const email = veletlenEmail();
    const jelszo = "ProbaJelszo123!";
    await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev: "Profil Nelkuli", email, jelszo } });
    const belep = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo } });
    const suti = belep.sutik.join("; ");
    await keres("/api/szervezet", { modszer: "POST", torzs: { nev: "Profil Nelkuli Szerv" }, sutik: suti });

    const valasz = await fetch(`${PROBA_CIM}/hirfigyelo`, {
      headers: { Cookie: suti },
      redirect: "manual",
    });
    expect(valasz.status).toBe(307);
    expect(valasz.headers.get("location")).toContain("/onboarding/1");
  });

  it("jóváhagyott profillal GET /hirfigyelo → 200, magyar cím, első használat", async () => {
    const valasz = await keres<unknown>("/hirfigyelo", { sutik });
    expect(valasz.statusz).toBe(200);
    const torzs = valasz.torzs as string;
    expect(torzs).toContain('data-screen-label="HF-I Áttekintés"');
    expect(torzs).toContain("Hírfigyelő");
    expect(torzs).toContain("Még nincs aktív figyelés.");
  });

  // G3 (Rögtön, 2026-10-18): a felület csak magyar (FELULETI_NYELVEK = ['hu']); ez a többnyelvű FELÜLET viselkedése, amely csak több felületi nyelvnél él. A magyar-only viselkedést a g3-csak-magyar.proba.ts őrzi.
  it.skipIf(!VAN_NYELVVALASZTAS)("km_nyelv=ro sütivel román cím", async () => {
    const valasz = await keres<unknown>("/hirfigyelo", { sutik: `${sutik}; km_nyelv=ro` });
    expect(valasz.statusz).toBe(200);
    const torzs = valasz.torzs as string;
    expect(torzs).toContain("Monitorizare știri");
  });

  // G3 (Rögtön, 2026-10-18): a felület csak magyar (FELULETI_NYELVEK = ['hu']); ez a többnyelvű FELÜLET viselkedése, amely csak több felületi nyelvnél él. A magyar-only viselkedést a g3-csak-magyar.proba.ts őrzi.
  it.skipIf(!VAN_NYELVVALASZTAS)("km_nyelv=en sütivel angol cím", async () => {
    const valasz = await keres<unknown>("/hirfigyelo", { sutik: `${sutik}; km_nyelv=en` });
    expect(valasz.statusz).toBe(200);
    const torzs = valasz.torzs as string;
    expect(torzs).toContain("News monitor");
  });

  it("GET /hirfigyelo/beallitas → 200, HF-II", async () => {
    const valasz = await keres<unknown>("/hirfigyelo/beallitas", { sutik });
    expect(valasz.statusz).toBe(200);
    const torzs = valasz.torzs as string;
    expect(torzs).toContain('data-screen-label="HF-II Figyelés beállítása"');
  });

  it("POST /api/hirfigyelo/beallitas/javaslat → tervezet, majd GET beallitas", async () => {
    const javaslat = await keres<unknown>("/api/hirfigyelo/beallitas/javaslat", {
      modszer: "POST",
      torzs: { szabad_szoveg: "helyi közlekedés" },
      sutik,
    });
    expect(javaslat.statusz).toBe(200);
    const javaslatTorzs = javaslat.torzs as { hirfigyelo: { tervezet: { celok: string[]; temak: { nev: string }[] } } };
    expect(javaslatTorzs.hirfigyelo.tervezet.celok.length).toBeGreaterThan(0);
    expect(javaslatTorzs.hirfigyelo.tervezet.temak[0]?.nev).toBe("Próba Műhely");

    const beallitas = await keres<unknown>("/api/hirfigyelo/beallitas", { sutik });
    expect(beallitas.statusz).toBe(200);
    const beallitasTorzs = beallitas.torzs as { hirfigyelo: { tervezet: unknown; aktiv: unknown } };
    expect(beallitasTorzs.hirfigyelo.tervezet).not.toBeNull();
    expect(beallitasTorzs.hirfigyelo.aktiv).toBeNull();
  });

  it("GET /fiok → tartalmazza a /hirfigyelo linket", async () => {
    const valasz = await keres<unknown>("/fiok", { sutik });
    expect(valasz.statusz).toBe(200);
    const torzs = valasz.torzs as string;
    expect(torzs).toContain('href="/hirfigyelo"');
  });
});
