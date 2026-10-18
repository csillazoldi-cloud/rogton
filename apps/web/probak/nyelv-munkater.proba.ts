import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { VAN_NYELVVALASZTAS } from "@rogton/design-system";
import { keres, veletlenEmail, takaritas, lezar, sutiKinyer } from "./segedek";
import { NYELV_SUTI } from "@rogton/design-system";

describe("V1: a munkater nyelve visz mindent", () => {
  const jelszo = "ProbaJelszo123!";

  let sutik: string;
  let email: string;

  beforeAll(async () => {
    email = veletlenEmail();
    const regisztracio = await keres("/api/fiok/regisztracio", {
      modszer: "POST",
      torzs: { nev: "Proba Nyelv", email, jelszo },
    });
    expect(regisztracio.statusz).toBe(201);

    const belepes = await keres("/api/fiok/belepes", {
      modszer: "POST",
      torzs: { email, jelszo },
    });
    expect(belepes.statusz).toBe(200);
    sutik = belepes.sutik.join("; ");

    const szervezet = await keres("/api/szervezet", {
      modszer: "POST",
      torzs: { nev: "Proba Nyelv Szervezet" },
      sutik,
    });
    expect(szervezet.statusz).toBe(201);

    // Piszkozat mentése a nyelvekkel, majd jóváhagyás — a profil nyelvei ["hu","ro"] lesznek.
    const piszkozat = await keres<unknown>("/api/onboarding/piszkozat", {
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
          nyelvek: ["hu", "ro"],
          nyelvek_forras: "sajat",
          hangnem_leiras: "",
          hangnem_minta: "",
          hangnem_nyelv: "hu",
          hangnem_forras: "sajat",
        },
      },
      sutik,
    });
    expect(piszkozat.statusz).toBe(200);

    const jovahagyas = await keres<unknown>("/api/onboarding/jovahagyas", {
      modszer: "POST",
      torzs: {},
      sutik,
    });
    expect(jovahagyas.statusz).toBe(200);
  });

  afterAll(async () => {
    await takaritas();
    await lezar();
  });

  it("uj fiok + munkater (nyelvek hu,ro), belepes → suti hu, /kezdolap lang=hu", async () => {
    const belepes = await keres("/api/fiok/belepes", {
      modszer: "POST",
      torzs: { email, jelszo },
    });
    expect(belepes.statusz).toBe(200);

    const sutiErtek = sutiKinyer(belepes.sutik, NYELV_SUTI);
    expect(sutiErtek).toBe("hu");

    const kezdolap = await keres<string>("/kezdolap", { sutik: belepes.sutik.join("; ") });
    expect(kezdolap.statusz).toBe(200);
    expect(kezdolap.torzs).toContain('lang="hu"');
  });

  // G3 (Rögtön, 2026-10-18): a felület csak magyar (FELULETI_NYELVEK = ['hu']); ez a többnyelvű FELÜLET viselkedése, amely csak több felületi nyelvnél él. A magyar-only viselkedést a g3-csak-magyar.proba.ts őrzi.
  it.skipIf(!VAN_NYELVVALASZTAS)("a fiok a Sajat fiokon en-t valaszt → belepes utan a suti en (a fiok valasztasa nyer)", async () => {
    const valtas = await keres("/api/nyelv", {
      modszer: "POST",
      torzs: { nyelv: "en" },
      sutik,
    });
    expect(valtas.statusz).toBe(204);

    const belepes = await keres("/api/fiok/belepes", {
      modszer: "POST",
      torzs: { email, jelszo },
    });
    expect(belepes.statusz).toBe(200);

    const sutiErtek = sutiKinyer(belepes.sutik, NYELV_SUTI);
    expect(sutiErtek).toBe("en");
  });
});
