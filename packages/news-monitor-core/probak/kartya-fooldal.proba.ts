import { describe, it, expect } from "vitest";
import { fooldalUrl, kartyakEpitReszletes as kartyakEpit } from "../src/index";

// V3 (2026-09-18, Vilmos 4. pont): a főoldal-találatból nincs kártya; egy cikkből van.

const MOST = "2026-09-18T10:00:00.000Z";

function esemeny(id: string, foTalalatId: string, talalatIds: string[]) {
  return {
    id,
    szervezet_id: "sz1",
    fo_talalat_id: foTalalatId,
    talalat_ids: talalatIds,
    letrehozva: MOST,
  } as unknown as Parameters<typeof kartyakEpit>[0]["esemenyek"][number];
}

function talalat(id: string, kivonatId: string) {
  return {
    id,
    kivonat_id: kivonatId,
    ertekeles_allapot: "kesz" as const,
    megtekintes: "uj" as const,
    jeloles: "nincs" as const,
    ertekeles: null,
    tartalomotlet: null,
  } as unknown as Parameters<typeof kartyakEpit>[0]["talalatok"][number];
}

function kivonat(id: string, forrasId: string, url: string) {
  return {
    id,
    forras_id: forrasId,
    url,
    cim: "Cím",
    szoveg: "Szöveg.",
    megjelenes: MOST,
    nyelv: "hu",
  } as unknown as Parameters<typeof kartyakEpit>[0]["kivonatok"][number];
}

function forras(id: string, cim: string) {
  return {
    id,
    cim,
    tipus: "rss",
    eredet: "kezi",
    allapot: "hasznalhato",
    ellenorzott: true,
    utolso_sikeres: MOST,
    hiba_ok: null,
  } as unknown as Parameters<typeof kartyakEpit>[0]["forrasok"][number];
}

describe("fooldalUrl — a forrás gyökere (főoldal) felismerése", () => {
  it("https://pelda.hu/ → főoldal", () => {
    expect(fooldalUrl("https://pelda.hu/")).toBe(true);
  });

  it("https://pelda.hu → főoldal (üres pathname)", () => {
    expect(fooldalUrl("https://pelda.hu")).toBe(true);
  });

  it("https://pelda.hu/?x=1 → NEM főoldal (van query)", () => {
    expect(fooldalUrl("https://pelda.hu/?x=1")).toBe(false);
  });

  it("https://pelda.hu/cikk → NEM főoldal", () => {
    expect(fooldalUrl("https://pelda.hu/cikk")).toBe(false);
  });

  it("https://pelda.hu/2026/09/18/hir/ → NEM főoldal", () => {
    expect(fooldalUrl("https://pelda.hu/2026/09/18/hir/")).toBe(false);
  });

  it("értelmezhetetlen URL → NEM főoldal", () => {
    expect(fooldalUrl("nem url")).toBe(false);
  });
});

describe("kartyakEpit — főoldal-találatból nincs kártya (V3)", () => {
  it("főoldal-találat: nincs kártya, kihagyott_fooldal = 1", () => {
    const eredmeny = kartyakEpit({
      esemenyek: [esemeny("e1", "t1", ["t1"])],
      talalatok: [talalat("t1", "k1")],
      kivonatok: [kivonat("k1", "f1", "https://bbc.com/")],
      forrasok: [forras("f1", "https://bbc.com/")],
    });
    expect(eredmeny.kartyak).toHaveLength(0);
    expect(eredmeny.kihagyott_fooldal).toBe(1);
  });

  it("cikk-találat: van kártya, kihagyott_fooldal = 0", () => {
    const eredmeny = kartyakEpit({
      esemenyek: [esemeny("e1", "t1", ["t1"])],
      talalatok: [talalat("t1", "k1")],
      kivonatok: [kivonat("k1", "f1", "https://bbc.com/news/12345")],
      forrasok: [forras("f1", "https://bbc.com/")],
    });
    expect(eredmeny.kartyak).toHaveLength(1);
    expect(eredmeny.kihagyott_fooldal).toBe(0);
  });

  it("két esemény: az egyik főoldal, a másik cikk → 1 kártya, 1 kihagyott", () => {
    const eredmeny = kartyakEpit({
      esemenyek: [esemeny("e1", "t1", ["t1"]), esemeny("e2", "t2", ["t2"])],
      talalatok: [talalat("t1", "k1"), talalat("t2", "k2")],
      kivonatok: [kivonat("k1", "f1", "https://bbc.com/"), kivonat("k2", "f1", "https://bbc.com/news/12345")],
      forrasok: [forras("f1", "https://bbc.com/")],
    });
    expect(eredmeny.kartyak).toHaveLength(1);
    expect(eredmeny.kihagyott_fooldal).toBe(1);
  });
});
