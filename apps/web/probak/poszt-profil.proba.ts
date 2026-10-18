import { describe, it, expect } from "vitest";
import { profilSorok } from "../poszt/profil-blokk";

// 2026-09-21: a Posztszöveg eddig nem kapta meg a cég profilját (hangnem, minta, célközönség).
// Ez a próba őrzi, hogy a profil minden kitöltött része bekerül az AI-bemenetbe.

const PROFIL = {
  nev: "Portik Vilmos",
  osszefoglalo: "Személyes közéleti és technológiai tartalmi platform.",
  celkozonseg: "Elsősorban erdélyi magyaroknak.",
  cel: "Érthetővé tenni a világ gyors változásait.",
  hangnem_leiras: "Személyes, intelligens hang. Rövid bekezdések. Ne használjon „összességében” típusú közhelyeket. ".repeat(12).trim(),
  hangnem_minta: "Friss hír: a napokban módosult egy helyi szabályozás.",
};

describe("Posztszöveg: a cég profilja az AI-bemenetben", () => {
  it("minden kitöltött rész bekerül, a hosszú hangnem csonkítás nélkül", () => {
    const sorok = profilSorok(PROFIL).join("\n");
    expect(sorok).toContain("Portik Vilmos");
    expect(sorok).toContain("Elsősorban erdélyi magyaroknak.");
    expect(sorok).toContain("Érthetővé tenni");
    expect(sorok).toContain(PROFIL.hangnem_leiras);
    expect(sorok).toContain(PROFIL.hangnem_minta);
    expect(sorok).toContain("HOGYAN ÍRJUNK");
  });

  it("az üres mező kimarad", () => {
    const sorok = profilSorok({ ...PROFIL, cel: "  ", hangnem_minta: "" }).join("\n");
    expect(sorok).not.toContain("Mit szeretne elérni");
    expect(sorok).not.toContain("Minta mondat");
  });

  it("profil nélkül nincs blokk", () => {
    expect(profilSorok(null)).toEqual([]);
    expect(profilSorok({ nev: "", osszefoglalo: "", celkozonseg: "", cel: "", hangnem_leiras: "", hangnem_minta: "" })).toEqual([]);
  });
});
