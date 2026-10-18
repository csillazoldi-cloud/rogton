// R-17 D (Kati 10-02; 17-ny1/ny2): a nyitólap nyelve az első látogatáskor. A böngésző nyelve dönt, ha magyar, román vagy angol; a választott
// nyelv (km_nyelv süti) mindig nyer; ha egyik sem dönt, a háromnyelvű választó jön. Tiszta rész + élő rész (PROBA_CIM).
import { describe, expect, it } from "vitest";
import { nyelvDontes, nyelvKeresbol } from "../nyelv";
import { PROBA_CIM } from "./segedek";

describe("a nyelv eldöntése", () => {
  it("a választott nyelv (süti) mindig nyer", () => {
    expect(nyelvDontes("ro", "hu-HU,hu;q=0.9")).toEqual({ nyelv: "ro", eldontve: true });
  });
  it("süti nélkül a böngésző első HU/RO/EN nyelve dönt (régióval is)", () => {
    expect(nyelvDontes(undefined, "ro-RO,ro;q=0.9,en;q=0.8")).toEqual({ nyelv: "ro", eldontve: true });
    expect(nyelvDontes(undefined, "de-DE,de;q=0.9,en-GB;q=0.7")).toEqual({ nyelv: "en", eldontve: true });
    expect(nyelvDontes(undefined, "HU")).toEqual({ nyelv: "hu", eldontve: true });
  });
  it("ha egyik sem dönt: az alapnyelv (angol, D-11), eldontve = false (ilyenkor jön a választó)", () => {
    expect(nyelvDontes(undefined, "de-DE,de;q=0.9,fr;q=0.8")).toEqual({ nyelv: "en", eldontve: false });
    expect(nyelvDontes(undefined, null)).toEqual({ nyelv: "en", eldontve: false });
    expect(nyelvDontes("xx", "")).toEqual({ nyelv: "en", eldontve: false });
  });
  it("a régi nyelvKeresbol ugyanazt a nyelvet adja", () => {
    expect(nyelvKeresbol(undefined, "de-DE,en;q=0.5")).toBe("en");
    expect(nyelvKeresbol(undefined, "de")).toBe("en");
  });
});

describe("a nyitólap (élő)", () => {
  const lap = async (fejlecek: Record<string, string>) => (await fetch(`${PROBA_CIM}/`, { headers: fejlecek })).text();
  it("német böngésző, süti nélkül: a háromnyelvű választó a fejléc alatt, mindhárom gomb a saját nyelvén", async () => {
    const h = await lap({ "accept-language": "de-DE,de;q=0.9" });
    expect(h).toContain("km-ny-nyelvsav");
    for (const s of ["Nyelv", "Limba", "Language", "Magyar", "Română", "English"]) expect(h).toContain(s);
  });
  it("román böngésző: nincs választó, a lap románul", async () => {
    const h = await lap({ "accept-language": "ro-RO,ro;q=0.9" });
    expect(h).not.toContain("km-ny-nyelvsav");
    expect(h).toMatch(/lang="ro"/);
  });
  it("választott nyelv (süti): nincs választó, akkor sem, ha a böngésző német", async () => {
    const h = await lap({ "accept-language": "de-DE", cookie: "km_nyelv=en" });
    expect(h).not.toContain("km-ny-nyelvsav");
    expect(h).toMatch(/lang="en"/);
  });
});
