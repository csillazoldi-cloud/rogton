// E-29: a Hírfigyelő feliratai — teljesség, alak, helyőrzők. (Az adatbázissal való egyezést az apps/web próbája őrzi.)
import { describe, expect, it } from "vitest";
import { felirat, feliratKitolt, feliratok, kulcsok, NYELVEK } from "../src/index.js";

const helyorzok = (szoveg: string): string[] => [...szoveg.matchAll(/\{(\w+)\}/g)].map((m) => m[1] ?? "").sort();

describe("hirfigyelo feliratok", () => {
  it("mind a három nyelv teljes", () => {
    const huKulcsok = kulcsok();
    expect(huKulcsok.length).toBeGreaterThan(100);
    for (const nyelv of NYELVEK) {
      const szotar = feliratok(nyelv);
      expect({ nyelv, hianyzo: huKulcsok.filter((k) => szotar[k] === undefined) }).toEqual({ nyelv, hianyzo: [] });
    }
  });

  it("minden kulcs `hf.` előtagú, egyik szöveg sem üres", () => {
    for (const nyelv of NYELVEK) {
      for (const [kulcs, szoveg] of Object.entries(feliratok(nyelv))) {
        expect(kulcs.startsWith("hf.")).toBe(true);
        expect(szoveg.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("a helyőrzők mindhárom nyelven ugyanazok", () => {
    for (const kulcs of kulcsok()) {
      const alap = helyorzok(feliratok("hu")[kulcs] ?? "");
      for (const nyelv of NYELVEK) {
        expect({ kulcs, nyelv, h: helyorzok(feliratok(nyelv)[kulcs] ?? "") }).toEqual({ kulcs, nyelv, h: alap });
      }
    }
  });

  it("ismeretlen nyelvi hiány esetén a magyar a tartalék, ismeretlen kulcsnál maga a kulcs", () => {
    expect(felirat("ro", "hf.modTitle").length).toBeGreaterThan(0);
    expect(felirat("en", "hf.nincs.ilyen.kulcs")).toBe("hf.nincs.ilyen.kulcs");
  });

  it("a helyőrzőket kitölti, a hiányzót békén hagyja", () => {
    expect(feliratKitolt("hu", "hf.profileNote", { name: "Minta Műhely" })).toContain("Minta Műhely");
    expect(feliratKitolt("hu", "hf.stNextRun", {})).toContain("{t}");
  });
});
