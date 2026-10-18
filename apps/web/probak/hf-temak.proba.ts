import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { keres, veletlenEmail, lezar } from "./segedek";
import { temakBont } from "../app/_kozos/kliens";

let sutik = "";

describe("Hírfigyelő V2 — témák és próba élő próbái", () => {
  beforeAll(async () => {
    const email = veletlenEmail();
    const jelszo = "ProbaJelszo123!";
    const regisztracio = await keres("/api/fiok/regisztracio", {
      modszer: "POST",
      torzs: { nev: "Tema Proba", email, jelszo },
    });
    expect(regisztracio.statusz).toBe(201);
    const belepes = await keres("/api/fiok/belepes", {
      modszer: "POST",
      torzs: { email, jelszo },
    });
    expect(belepes.statusz).toBe(200);
    sutik = belepes.sutik.join("; ");
    await keres("/api/szervezet", { modszer: "POST", torzs: { nev: "Tema Proba Szerv" }, sutik });

    const piszkozat = await keres<unknown>("/api/onboarding/piszkozat", {
      modszer: "PUT",
      torzs: {
        bemutatkozas: {
          nev: "Téma Próba Műhely",
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
    expect(piszkozat.statusz).toBe(200);
    const jovahagyas = await keres<unknown>("/api/onboarding/jovahagyas", { modszer: "POST", torzs: {}, sutik });
    expect(jovahagyas.statusz).toBe(200);
  });

  afterAll(async () => {
    await lezar();
  });

  it("a javaslat válasza után a GET beallitas témái tartalmazzák a javasoltakat", async () => {
    const javaslat = await keres<unknown>("/api/hirfigyelo/beallitas/javaslat", {
      modszer: "POST",
      torzs: { szabad_szoveg: "helyi közlekedés" },
      sutik,
    });
    expect(javaslat.statusz).toBe(200);
    const javasolt = (javaslat.torzs as { hirfigyelo: { tervezet: { temak: { nev: string }[] } } }).hirfigyelo.tervezet.temak.map((t) => t.nev);
    expect(javasolt.length).toBeGreaterThan(0);

    const beallitas = await keres<unknown>("/api/hirfigyelo/beallitas", { sutik });
    expect(beallitas.statusz).toBe(200);
    const mentett = (beallitas.torzs as { hirfigyelo: { tervezet: { temak: { nev: string }[] } | null } }).hirfigyelo.tervezet;
    expect(mentett).not.toBeNull();
    const mentettNevek = new Set((mentett?.temak ?? []).map((t) => t.nev));
    for (const nev of javasolt) expect(mentettNevek.has(nev)).toBe(true);
  });

  it("a PUT beallitas egy „a, b; c” témasorból három témát ment", async () => {
    const bontott = temakBont("a, b; c");
    expect(bontott).toEqual(["a", "b", "c"]);

    const mentes = await keres<unknown>("/api/hirfigyelo/beallitas", {
      modszer: "PUT",
      torzs: {
        celok: ["sajat_marka"],
        temak: bontott.map((nev) => ({ nev, nevvaltozatok: [], megkulonboztetes: "" })),
        foldrajzi_fokusz: "",
        nyelvek: [],
        kizarasok: [],
        idozites: { mod: "kezi", ora: 7, perc: 0, idozona: "Europe/Bucharest" },
        szabad_szoveg: "",
      },
      sutik,
    });
    expect(mentes.statusz).toBe(200);

    const beallitas = await keres<unknown>("/api/hirfigyelo/beallitas", { sutik });
    expect(beallitas.statusz).toBe(200);
    const aktiv = (beallitas.torzs as { hirfigyelo: { aktiv: { beallitas: { temak: { nev: string }[] } } | null } }).hirfigyelo.aktiv;
    expect(aktiv).not.toBeNull();
    const nevek = (aktiv?.beallitas.temak ?? []).map((t) => t.nev).sort();
    expect(nevek).toEqual(["a", "b", "c"]);
  });
});
