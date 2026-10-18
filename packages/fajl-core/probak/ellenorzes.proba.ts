// c) fajlEllenoriz: üres → URES; 10 MB + 1 → TUL_NAGY; svg → SVG_NEM_ENGEDETT; gif → TIPUS_NEM_ENGEDETT; png → ok "png";
// d) a NÉV nem számít: "logo.png" tartalommal svg → SVG_NEM_ENGEDETT; i) egyedi méretkorlát a korlat-tal.
import { describe, expect, it } from "vitest";
import { fajlEllenoriz, MAX_MERET_BAJT } from "../src/index.js";
import { gifFej, pngFej, svgSzoveg } from "./segedek";

describe("fajlEllenoriz", () => {
  it("üres → URES", () => {
    const r = fajlEllenoriz({ meret: 0, fej: new Uint8Array() });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.hiba).toBe("URES");
  });

  it("10 MB + 1 → TUL_NAGY", () => {
    const r = fajlEllenoriz({ meret: MAX_MERET_BAJT + 1, fej: pngFej() });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.hiba).toBe("TUL_NAGY");
  });

  it("svg → SVG_NEM_ENGEDETT", () => {
    const r = fajlEllenoriz({ meret: 100, fej: svgSzoveg() });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.hiba).toBe("SVG_NEM_ENGEDETT");
  });

  it("gif → TIPUS_NEM_ENGEDETT", () => {
    const r = fajlEllenoriz({ meret: 100, fej: gifFej() });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.hiba).toBe("TIPUS_NEM_ENGEDETT");
  });

  it("png → ok png", () => {
    const r = fajlEllenoriz({ meret: 100, fej: pngFej() });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.ertek.tipus).toBe("png");
  });

  it("a NÉV nem számít: svg tartalom 'logo.png' névvel → SVG_NEM_ENGEDETT", () => {
    const r = fajlEllenoriz({ meret: 100, fej: svgSzoveg() });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.hiba).toBe("SVG_NEM_ENGEDETT");
  });

  it("egyedi méretkorlát: 100 bájtos korlát, 200 bájt → TUL_NAGY", () => {
    const r = fajlEllenoriz(
      { meret: 200, fej: pngFej() },
      { maxMeret: 100 },
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.hiba).toBe("TUL_NAGY");
  });

  it("egyedi méretkorlát: 100 bájtos korlát, 50 bájt → ok", () => {
    const r = fajlEllenoriz(
      { meret: 50, fej: pngFej() },
      { maxMeret: 100 },
    );
    expect(r.ok).toBe(true);
  });
});

// R-16 K6 (TERV 1.6): az `svg` típus a GÉP írásaihoz van (névlogó) — feltöltésben semmilyen céllal nem mehet át, és képre sem kerül.
import { CEL_TIPUSOK, FajlCel, FajlTipus, KITERJESZTES, MIME, kepreAlkalmasLogo } from "../src/index.js";
describe("svg: csak gépi írás (R-16 K6)", () => {
  it("a típus létezik (kiterjesztés, MIME), de egyetlen cél sem fogadja el feltöltésben", () => {
    expect(FajlTipus.safeParse("svg").success).toBe(true);
    expect(KITERJESZTES.svg).toBe("svg");
    expect(MIME.svg).toBe("image/svg+xml");
    for (const cel of FajlCel.options) {
      expect(CEL_TIPUSOK[cel]).not.toContain("svg");
      const r = fajlEllenoriz({ meret: 100, fej: svgSzoveg() }, { cel });
      expect(r.ok, cel).toBe(false);
      if (!r.ok) expect(r.hiba).toBe("SVG_NEM_ENGEDETT");
    }
  });
  it("a gép-írta SVG logó nem kerül képre (a PNG párja igen)", () => {
    expect(kepreAlkalmasLogo({ cel: "logo", tipus: "svg", meret: 20_000 })).toBe(false);
    expect(kepreAlkalmasLogo({ cel: "logo", tipus: "png", meret: 20_000 })).toBe(true);
  });
});
