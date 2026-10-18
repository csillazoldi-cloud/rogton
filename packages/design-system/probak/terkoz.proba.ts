// F-1: a térköz-skála próbái — a tizenöt fok, a származtatott régi tokenek és a monotonitás-ellenőrzés.
import { describe, expect, it } from "vitest";
import { AlapTokenek, TemaDefinicio } from "../src/tokenek";
import { TOKEN_KULCSOK, temaEllenoriz } from "../src/tema-szintek";
import { cssValtozok, teljesTokenek } from "../src/index";
import temaAlap from "../src/tema-alap.json";

const REGI = ["--gap", "--pad-card", "--pad-block", "--pad-field-y", "--pad-field-x", "--btn-pad-y", "--btn-pad-x"] as const;

describe("F-1 térköz-skála", () => {
  it("a) TOKEN_KULCSOK tartalmazza mind a 15 --ter-* kulcsot, és nem a hét régit", () => {
    for (let i = 0; i <= 14; i++) {
      expect(TOKEN_KULCSOK).toContain(`--ter-${i}`);
    }
    for (const k of REGI) {
      expect(TOKEN_KULCSOK).not.toContain(k);
    }
  });

  it("b) a tema-alap.json átmegy a TemaDefinicio.parse-on", () => {
    const t = TemaDefinicio.parse(temaAlap);
    expect(t.$schema).toBe("km-theme/2");
    expect(t.tokens["--ter-0"]).toBe("0px");
  });

  it("c) nem monoton lépcső: --ter-3:14px, --ter-4:8px → notMonotonic a --ter-4-en", () => {
    const r = temaEllenoriz({ $schema: "km-theme/2", tokens: { "--ter-3": "14px", "--ter-4": "8px" } });
    expect(r.ok).toBe(false);
    const h = r.hibak.filter((x) => x.kod === "notMonotonic");
    expect(h).toHaveLength(1);
    expect(h[0]!.token).toBe("--ter-4");
  });

  it("d) egyenlő szomszédok megengedettek", () => {
    const r = temaEllenoriz({ $schema: "km-theme/2", tokens: { "--ter-3": "8px", "--ter-4": "8px" } });
    expect(r.ok).toBe(true);
    expect(r.hibak).toHaveLength(0);
  });

  it("e) --ter-0: 4px → hiba", () => {
    const r = temaEllenoriz({ $schema: "km-theme/2", tokens: { "--ter-0": "4px" } });
    expect(r.ok).toBe(false);
    expect(r.hibak.length).toBeGreaterThan(0);
  });

  it("f) a származtatott --gap és --pad-card a skálára mutat", () => {
    const alap = AlapTokenek.parse(temaAlap.tokens);
    const teljes = teljesTokenek(alap);
    expect(teljes["--gap"]).toBe("var(--ter-6)");
    expect(teljes["--pad-card"]).toBe("var(--ter-11)");
  });

  it("g) a cssValtozok tartalmazza a --ter-4:8px és a --gap:var(--ter-6) szöveget", () => {
    const alap = AlapTokenek.parse(temaAlap.tokens);
    const css = cssValtozok(alap);
    expect(css).toContain("--ter-4:8px");
    expect(css).toContain("--gap:var(--ter-6)");
  });

  it("h) a régi --pad-card kulcs a figyelmenKivul listába kerül, nem hiba", () => {
    const r = temaEllenoriz({ $schema: "km-theme/2", tokens: { "--pad-card": "36px" } });
    expect(r.ok).toBe(true);
    expect(r.figyelmenKivul).toContain("--pad-card");
    expect(r.hibak).toHaveLength(0);
  });
});
