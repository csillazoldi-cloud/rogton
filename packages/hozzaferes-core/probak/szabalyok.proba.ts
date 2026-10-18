import { describe, expect, it } from "vitest";
import { dont, MUVELET_SZEREP, type HostKontextus, type Tag } from "../src/index";

const SZ = "sz-1";

function ktx(fiok_id: string, szerep: HostKontextus["szerep"]): HostKontextus {
  return { fiok_id, szervezet_id: SZ, szerep };
}

describe("dont — a döntő", () => {
  it("a néző nem hívhat meg (NINCS_JOG)", () => {
    const d = dont(ktx("n1", "nezo"), "tag_meghiv", { szerep: "nezo" });
    expect(d).toEqual({ szabad: false, indok: "NINCS_JOG" });
  });

  it("a szerkesztő nem adhat tulajdonos szerepet (NAGYOBB_SZEREP), nézőt igen", () => {
    const d1 = dont(ktx("s1", "szerkeszto"), "tag_meghiv", {
      szerep: "tulajdonos",
    });
    expect(d1).toEqual({ szabad: false, indok: "NAGYOBB_SZEREP" });

    const d2 = dont(ktx("s1", "szerkeszto"), "tag_meghiv", { szerep: "nezo" });
    expect(d2).toEqual({ szabad: true });
  });

  it("az egyetlen tulajdonos nem fokozható le, nem távolítható el, nem léphet ki (UTOLSO_TULAJDONOS)", () => {
    const tagok: Tag[] = [
      { fiok_id: "t1", szerep: "tulajdonos", csatlakozott: "2026-01-01T00:00:00.000Z" },
      { fiok_id: "s1", szerep: "szerkeszto", csatlakozott: "2026-01-01T00:00:00.000Z" },
    ];
    // a saját fiókra a (2) MAGAT_NEM szabály előbb szól, mint a (4) — az utolsó tulajdonos így sem fokozhatja le magát
    const d1 = dont(ktx("t1", "tulajdonos"), "szerep_allit", {
      fiok_id: "t1",
      szerep: "szerkeszto",
      tagok,
    });
    expect(d1).toEqual({ szabad: false, indok: "MAGAT_NEM" });

    const d2 = dont(ktx("t1", "tulajdonos"), "tag_eltavolit", {
      fiok_id: "t1",
      tagok,
    });
    expect(d2).toEqual({ szabad: false, indok: "MAGAT_NEM" });

    const d3 = dont(ktx("t1", "tulajdonos"), "kilep", { tagok });
    expect(d3).toEqual({ szabad: false, indok: "UTOLSO_TULAJDONOS" });
  });

  it("két tulajdonosnál a lefokozás és a kilépés szabad", () => {
    const tagok: Tag[] = [
      { fiok_id: "t1", szerep: "tulajdonos", csatlakozott: "2026-01-01T00:00:00.000Z" },
      { fiok_id: "t2", szerep: "tulajdonos", csatlakozott: "2026-01-01T00:00:00.000Z" },
    ];
    const d1 = dont(ktx("t1", "tulajdonos"), "szerep_allit", {
      fiok_id: "t2",
      szerep: "szerkeszto",
      tagok,
    });
    expect(d1).toEqual({ szabad: true });

    const d2 = dont(ktx("t1", "tulajdonos"), "kilep", { tagok });
    expect(d2).toEqual({ szabad: true });
  });

  it("saját magát nem állíthatja át és nem távolíthatja el (MAGAT_NEM)", () => {
    const tagok: Tag[] = [
      { fiok_id: "t1", szerep: "tulajdonos", csatlakozott: "2026-01-01T00:00:00.000Z" },
      { fiok_id: "t2", szerep: "tulajdonos", csatlakozott: "2026-01-01T00:00:00.000Z" },
    ];
    const d1 = dont(ktx("t1", "tulajdonos"), "szerep_allit", {
      fiok_id: "t1",
      szerep: "szerkeszto",
      tagok,
    });
    expect(d1).toEqual({ szabad: false, indok: "MAGAT_NEM" });

    const d2 = dont(ktx("t1", "tulajdonos"), "tag_eltavolit", {
      fiok_id: "t1",
      tagok,
    });
    expect(d2).toEqual({ szabad: false, indok: "MAGAT_NEM" });
  });

  it("a dont() tiszta: ugyanarra a bemenetre ugyanaz a válasz, tár nélkül", () => {
    const be = ktx("s1", "szerkeszto");
    const a = dont(be, "tag_meghiv", { szerep: "nezo" });
    const b = dont(be, "tag_meghiv", { szerep: "nezo" });
    expect(a).toEqual(b);
    expect(a).toEqual({ szabad: true });
  });

  it("a MUVELET_SZEREP tábla minden műveletet lefed", () => {
    expect(Object.keys(MUVELET_SZEREP).sort()).toEqual(
      [
        "kilep",
        "meghivo_elfogad",
        "meghivo_visszavon",
        "szerep_allit",
        "tag_eltavolit",
        "tag_meghiv",
        "tagok_nez",
      ].sort(),
    );
  });
});
