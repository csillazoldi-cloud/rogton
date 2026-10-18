// E-31: a Hírfigyelő AI-utasításai KÖZÖSEK — mindkét host ugyanazt küldi a modellnek.
import type { HfFeladat } from "@km/news-monitor-core";
import { describe, expect, it } from "vitest";
import { NYELVEK, nyelvfuggo, nyersPrompt, prompt } from "../src/index.js";

const FELADATOK: HfFeladat[] = [
  "hf_relevancia", "hf_osszkep", "hf_ugyanaz_az_esemeny", "hf_szabaly_javaslat", "hf_tartalomotlet", "hf_beallitas_javaslat",
];

describe("hirfigyelo promptok", () => {
  it("mind a hat feladatnak van utasítása, és egyik sem üres", () => {
    for (const f of FELADATOK) expect(nyersPrompt(f).trim().length).toBeGreaterThan(200);
  });

  it("minden utasításban benne van az ADAT-védelem (a cikkbe rejtett parancsok ellen)", () => {
    for (const f of FELADATOK) {
      const p = nyersPrompt(f);
      expect(p).toContain("<<ADAT");
      expect(p.toLowerCase()).toContain("utasítás");
    }
  });

  it("a nyelvfüggő utasítások célnyelvi keretet kapnak, a magyar nem", () => {
    for (const f of FELADATOK) {
      if (!nyelvfuggo(f)) continue;
      expect(prompt(f, "hu").startsWith("Scrie")).toBe(false);
      expect(prompt(f, "ro").startsWith("Scrie TOATE câmpurile text ale răspunsului în limba ROMÂNĂ.")).toBe(true);
      expect(prompt(f, "ro").trimEnd().endsWith("Scrie TOATE câmpurile text ale răspunsului în limba ROMÂNĂ.")).toBe(true);
      expect(prompt(f, "en").startsWith("Write ALL text fields of the answer in ENGLISH.")).toBe(true);
    }
  });

  it("a beállítás-javaslat NEM nyelvfüggő (a válasza nem próza, hanem beállítás-szerkezet)", () => {
    expect(nyelvfuggo("hf_beallitas_javaslat")).toBe(false);
    expect(prompt("hf_beallitas_javaslat", "ro").startsWith("Scrie")).toBe(false);
  });

  it("a {{nyelv}} hely mindhárom nyelven kitöltődik, nem marad benne helyőrző", () => {
    for (const f of FELADATOK) {
      for (const ny of NYELVEK) expect(prompt(f, ny)).not.toContain("{{nyelv}}");
    }
    expect(prompt("hf_relevancia", "ro")).toContain("román nyelven írd");
    expect(prompt("hf_relevancia", "en")).toContain("angol nyelven írd");
  });
});
