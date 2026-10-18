// A kép minden betűhivatkozása létező fájlra mutat (a képgyártó minden fájlt beolvas: hiányzó fájl = 500 minden képre).
// Mérve 2026-09-30 (R-16 K2): a Space Grotesk és az IBM Plex Sans 800-as súlyát kérte a kép, fájl nélkül.
import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { BETUK, HelyzetArculat, HelyzetTartalom, MINTA, helyzetHtml } from "../src/index.ts";

const MAPPA = join(import.meta.dirname, "../../../tools/vizual/referencia/betuk-munkater");

describe("a kép betűfájljai", () => {
  for (const kulcs of Object.keys(BETUK)) {
    it(`${kulcs}: minden hivatkozott fájl megvan`, () => {
      const kert: string[] = [];
      helyzetHtml("akcio", "poszt", HelyzetTartalom.parse(MINTA["hu"]!["akcio"]), HelyzetArculat.parse({ nev: "Próba", betu: kulcs }), {
        betuCim: (f) => (kert.push(f), f), nyelv: "hu", fok: 0,
      });
      expect(kert.length).toBeGreaterThan(0);
      expect(kert.filter((f) => !existsSync(join(MAPPA, f)))).toEqual([]);
    });
  }
});
