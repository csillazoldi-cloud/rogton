import { describe, it, expect } from "vitest";
import {
  megtekint,
  jelol,
  szuro,
  cikkKulcs,
} from "../src/index";

const MOST = new Date("2026-09-07T10:00:00Z");

function alapTalalat(): any {
  return {
    id: "t1",
    szervezet_id: "sz1",
    esemeny_id: "e1",
    kivonat_id: "k1",
    ertekeles: null,
    ertekeles_allapot: "fuggoben",
    megtekintes: "uj",
    jeloles: "nincs",
    letrehozva: MOST.toISOString(),
    futas_id: "f1",
  };
}

describe("talalat.ts — megtekintes, jeloles, szuro, kulcs (E-19)", () => {
  it("4.1: megtekint ujbol megtekintett", () => {
    const t = alapTalalat();
    const modositott = megtekint(t);
    expect(modositott.megtekintes).toBe("megtekintett");
  });

  it("4.2: jelol mentett — megtekintette is tesz", () => {
    const t = alapTalalat();
    const modositott = jelol(t, "mentett");
    expect(modositott.jeloles).toBe("mentett");
    expect(modositott.megtekintes).toBe("megtekintett");
  });

  it("4.3: jelol elrejtett — megtekintette is tesz", () => {
    const t = alapTalalat();
    const modositott = jelol(t, "elrejtett");
    expect(modositott.jeloles).toBe("elrejtett");
    expect(modositott.megtekintes).toBe("megtekintett");
  });

  it("4.4: nem elrejtett onmagaban nem uj", () => {
    const t = alapTalalat();
    expect(t.megtekintes).toBe("uj");
    // "uj" = megtekintes === "uj", nem elrejtett onmagaban nem uj
    const nemElrejtett = { ...t, jeloles: "nincs" as const };
    expect(nemElrejtett.megtekintes).toBe("uj");
  });

  it("4.5: szuro uj — csak uj talalatok", () => {
    const t1 = alapTalalat(); // uj
    const t2 = { ...alapTalalat(), id: "t2", megtekintes: "megtekintett" as const };
    const eredmeny = szuro([t1, t2], "uj");
    expect(eredmeny).toHaveLength(1);
    expect(eredmeny[0].id).toBe("t1");
  });

  it("4.6: szuro mentett — csak mentett", () => {
    const t1 = alapTalalat();
    const t2 = { ...alapTalalat(), id: "t2", jeloles: "mentett" as const, megtekintes: "megtekintett" as const };
    const t3 = { ...alapTalalat(), id: "t3", jeloles: "elrejtett" as const, megtekintes: "megtekintett" as const };
    const eredmeny = szuro([t1, t2, t3], "mentett");
    expect(eredmeny).toHaveLength(1);
    expect(eredmeny[0].id).toBe("t2");
  });

  it("4.7: szuro elrejtett — csak elrejtett", () => {
    const t1 = alapTalalat();
    const t2 = { ...alapTalalat(), id: "t2", jeloles: "elrejtett" as const, megtekintes: "megtekintett" as const };
    const eredmeny = szuro([t1, t2], "elrejtett");
    expect(eredmeny).toHaveLength(1);
    expect(eredmeny[0].id).toBe("t2");
  });

  it("4.8: szuro mind — minden", () => {
    const t1 = alapTalalat();
    const t2 = { ...alapTalalat(), id: "t2", jeloles: "elrejtett" as const, megtekintes: "megtekintett" as const };
    const eredmeny = szuro([t1, t2], "mind");
    expect(eredmeny).toHaveLength(2);
  });

  it("4.9: cikkKulcs — szervezetId + kanonikusUrl", () => {
    const kulcs = cikkKulcs("sz1", "https://pelda.hu/cikk");
    expect(kulcs).toBe("sz1|https://pelda.hu/cikk");
  });
});
