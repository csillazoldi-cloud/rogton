import { describe, it, expect } from "vitest";
import { HANGNEM_LEIRAS_MAX, ProfilModositas, SzervezetProfil } from "@km/contracts";
import { profilModositasAlkalmaz } from "@km/profile-core";

// Hiba 2026-09-21 (Vilmos): a Szervezet adatai lapon a „Milyen nyelven írjunk?" és a „Hogyan
// fogalmazzunk?" szerkesztése nem mentett. Mérve: a szabad szöveges nyelvmező üres listát mentett
// („magyar és román" → []), a 300 karakternél hosszabb hangnemet a rendszer elutasította, és a minta
// mondatot nem lehetett szerkeszteni. Ez a próba adatbázis nélkül őrzi a javítást.

const ALAP: SzervezetProfil = SzervezetProfil.parse({
  nev: "Próba Pékség",
  osszefoglalo: "Kézműves pékség Marosvásárhelyen.",
  osszefoglalo_forras: "ai",
  celkozonseg: "",
  celkozonseg_forras: "",
  cel: "",
  cel_forras: "",
  nyelvek: ["hu"],
  nyelvek_forras: "ai",
  hangnem_leiras: "barátságos, közvetlen",
  hangnem_minta: "Gyere be egy friss kenyérért!",
  hangnem_nyelv: "hu",
  hangnem_forras: "ai",
  arculat: {},
  kesobbre: [],
  jovahagyva: "2026-09-21T08:00:00.000Z",
  jovahagyta: "00000000-0000-4000-8000-000000000001",
});

describe("Szervezet adatai: nyelvek és hangnem mentése", () => {
  it("üres nyelvlistát a rendszer nem fogad el, mert az a nyelvek törlése volna", () => {
    expect(ProfilModositas.safeParse({ nyelvek: [] }).success).toBe(false);
  });

  it("a kiválasztott nyelvek megmaradnak, és a forrás a sajátod lesz", () => {
    const m = ProfilModositas.parse({ nyelvek: ["hu", "ro"] });
    const p = profilModositasAlkalmaz(ALAP, m);
    expect(p.nyelvek).toEqual(["hu", "ro"]);
    expect(p.nyelvek_forras).toBe("sajat");
  });

  it("a leírás és a minta mondat együtt mentődik", () => {
    const m = ProfilModositas.parse({ hangnem_leiras: "tegező, meleg", hangnem_minta: "Szia! Ma is friss a kenyér." });
    const p = profilModositasAlkalmaz(ALAP, m);
    expect(p.hangnem_leiras).toBe("tegező, meleg");
    expect(p.hangnem_minta).toBe("Szia! Ma is friss a kenyér.");
    expect(p.hangnem_modositva).toBe(true);
  });

  it("csak a minta mondat is szerkeszthető, a leírás marad", () => {
    const m = ProfilModositas.parse({ hangnem_minta: "Új minta mondat." });
    const p = profilModositasAlkalmaz(ALAP, m);
    expect(p.hangnem_leiras).toBe("barátságos, közvetlen");
    expect(p.hangnem_minta).toBe("Új minta mondat.");
  });

  it("a leírás 3000 karakterig mehet (2026-09-21: 300-ról emelve), fölötte a rendszer elutasít", () => {
    expect(HANGNEM_LEIRAS_MAX).toBe(3000);
    expect(ProfilModositas.safeParse({ hangnem_leiras: "a".repeat(1037) }).success).toBe(true);
    expect(ProfilModositas.safeParse({ hangnem_leiras: "a".repeat(3000) }).success).toBe(true);
    expect(ProfilModositas.safeParse({ hangnem_leiras: "a".repeat(3001) }).success).toBe(false);
  });

  it("a hosszú leírás a tárolt profilban is érvényes marad", () => {
    const m = ProfilModositas.parse({ hangnem_leiras: "Személyes, intelligens hang. ".repeat(40).trim() });
    const p = profilModositasAlkalmaz(ALAP, m);
    expect(SzervezetProfil.safeParse(p).success).toBe(true);
  });

  it("a hosszú szöveg a minta mondatba fér (1500 karakterig)", () => {
    expect(ProfilModositas.safeParse({ hangnem_minta: "b".repeat(1500) }).success).toBe(true);
  });
});
