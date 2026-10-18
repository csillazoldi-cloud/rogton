import { describe, it, expect } from "vitest";
import { eredetDarabok, sajatArany } from "../app/poszt/eredet";

// R-11/A · A-4: az eredetjelölés. A végleges szöveget az utolsó AI-javaslathoz mérjük.
// Ez a próba adatbázis és AI nélkül fut.

function osszefuz(darabok: { szoveg: string }[]): string {
  return darabok.map((d) => d.szoveg).join("");
}

describe("eredetjelölés: mit írt át az ember (A-4)", () => {
  it("javaslat nélkül minden a szerzőé", () => {
    const d = eredetDarabok("", "Ezt én írtam.");
    expect(d).toEqual([{ szoveg: "Ezt én írtam.", sajat: true }]);
  });

  it("változatlan szöveg teljes egészében az AI javaslata", () => {
    const sz = "Szombattól kovászos rozskenyér is lesz.";
    expect(eredetDarabok(sz, sz)).toEqual([{ szoveg: sz, sajat: false }]);
  });

  it("a beszúrt szavakat jelöli meg, a többit nem", () => {
    const javaslat = "Szombattól kovászos rozskenyér is lesz a pékségben.";
    const szoveg = "Szombattól friss kovászos rozskenyér is lesz a pékségben.";
    const d = eredetDarabok(javaslat, szoveg);
    expect(d.filter((x) => x.sajat).map((x) => x.szoveg.trim())).toEqual(["friss"]);
  });

  it("a darabokból mindig visszakapjuk az eredeti szöveget", () => {
    const javaslat = "Egy kettő három négy öt.";
    const szoveg = "Egy kettő HÁROM négy hat hét.";
    expect(osszefuz(eredetDarabok(javaslat, szoveg))).toBe(szoveg);
  });

  it("üres szövegre üres lista", () => {
    expect(eredetDarabok("bármi", "")).toEqual([]);
  });

  it("a törlés nem jelöl semmit sajátnak", () => {
    const d = eredetDarabok("Egy kettő három.", "Egy kettő");
    expect(d.some((x) => x.sajat)).toBe(false);
  });

  it("az arány a saját karakterek hányada", () => {
    expect(sajatArany([{ szoveg: "aaaa", sajat: false }, { szoveg: "bbbb", sajat: true }])).toBe(50);
    expect(sajatArany([])).toBe(0);
  });

  it("nagyon hosszú szövegnél nem vet össze szavanként", () => {
    const hosszu = Array.from({ length: 1400 }, (_, i) => `szo${i}`).join(" ");
    const d = eredetDarabok(hosszu, `${hosszu} plusz`);
    expect(d).toHaveLength(1);
    expect(d[0]?.sajat).toBe(true);
  });
});
