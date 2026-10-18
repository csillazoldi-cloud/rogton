// R-18 (2026-10-11): a két mód tokenjei — egyetlen lila, a mód kulcsai, a lap fejébe kerülő CSS, a saját betűk.
import { describe, expect, it } from "vitest";
import { AlapTokenek, MOD_KULCSOK, betuCss, modCss, modTokenek, r18BetuFajlok } from "../src/index";
import alapJson from "../src/tema-alap.json";

const alap = AlapTokenek.parse((alapJson as { tokens: unknown }).tokens);

/** Árnyalat (fok) és telítettség egy #rrggbb színre. */
function arnyalat(hex: string): { h: number; s: number } {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d === 0) return { h: 0, s: 0 };
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s: d / (1 - Math.abs(max + min - 1)) };
}

// G5 (Rögtön, 2026-10-18): a re-skin — tinta / neonzöld #d0ff2c / narancs #ff4501, Saira Condensed + Saira (saját kiszolgálás). A régi „egyetlen lila #4b09d8” szabály helyére az új paletta szabálya került; a többi elvárás (a mód kulcsai, a két blokk, a mozgás, a saját betűk Google Fonts nélkül) változatlan.
describe("R-18 módok", () => {
  it("a mód kulcsai a színek, betűk, lekerekítés — a betűméret és a térköz NEM (az a szervezeté marad)", () => {
    for (const k of ["--bg", "--text", "--primary", "--primary-2", "--font-display", "--font-body", "--font-code", "--r-card", "--r-btn", "--keszul", "--olvasatlan"]) {
      expect(MOD_KULCSOK).toContain(k);
    }
    for (const k of ["--fs-base", "--ter-4", "--control-min", "--lista-max"]) expect(MOD_KULCSOK).not.toContain(k);
  });

  it("a paletta: sötétben neon fő szín tintás szöveggel, világosban tinta fő szín neon szöveggel; narancs csak kitöltés; nincs lila", () => {
    const s = modTokenek(alap, "sotet"), v = modTokenek(alap, "vilagos");
    expect([s["--primary"], s["--primary-2"], s["--on-primary"]]).toEqual(["#d0ff2c", "#d0ff2c", "#0a0a0a"]);
    expect([v["--primary"], v["--primary-2"], v["--on-primary"]]).toEqual(["#0a0a0a", "#0a0a0a", "#d0ff2c"]);
    expect(s["--accent"]).toBe("#ff4501");
    expect(v["--accent"]).toBe("#ff4501");
    // narancson soha nincs fehér szöveg: a narancs kitöltésen álló szöveg tokenje mindkét módban tinta
    expect(s["--on-accent"]).toBe("#0a0a0a");
    expect(v["--on-accent"]).toBe("#0a0a0a");
    // világosban a neon nem lehet szöveg: a link, a fókusz és a narancs szöveg sötét
    expect(v["--accent-link"]).toBe("#0a0a0a");
    expect(v["--focus"]).toBe("#0a0a0a");
    expect(v["--accent-text"]).toBe("#b83200");
    for (const mod of ["sotet", "vilagos"] as const) {
      const szoveg = Object.values(modTokenek(alap, mod)).join(" ");
      for (const hex of szoveg.match(/#[0-9a-fA-F]{6}\b/g) ?? []) {
        const { h, s: tel } = arnyalat(hex);
        expect(h >= 245 && h <= 300 && tel > 0.25, `${mod}: lila ${hex}`).toBe(false);
      }
    }
  });

  it("sötét lapon a link és a fókusz neon, a betűk Saira", () => {
    const t = modTokenek(alap, "sotet");
    expect(t["--accent-link"]).toBe("#d0ff2c");
    expect(t["--focus"]).toBe("#d0ff2c");
    expect(t["--font-display"]).toContain("'Saira Condensed'");
    expect(t["--font-body"]).toContain("'Saira'");
  });

  it("a fej CSS-e: két blokk [data-mod] választóval, jelölés nélkül a sötét", () => {
    const css = modCss(alap);
    expect(css).toContain(':root[data-mod="sotet"],:root:not([data-mod]){');
    expect(css).toContain(':root[data-mod="vilagos"]{');
    expect(css).toContain("--bg:#0a0a0a");
    expect(css).toContain("--bg:#ffffff");
    expect(css).toContain("--fs-ui:13px");
    expect(css).not.toMatch(/[<]/);
  });

  it("a mozgás a --motion tokent követi: off → 1 ms", () => {
    expect(modCss({ ...alap, "--motion": "off" })).toContain("--t-mode:1ms");
    expect(modCss(alap)).toContain("--t-mode:250ms");
  });

  it("saját betűk: 16 fájl (Saira 4, Saira Condensed 2, JetBrains Mono 2 vastagság), latin + latin-ext, Google Fonts nélkül", () => {
    expect(r18BetuFajlok()).toHaveLength(16);
    const css = betuCss("/betuk");
    expect(css.match(/@font-face/g)).toHaveLength(16);
    expect(css).toContain("font-family:'Saira Condensed'");
    expect(css).toContain("U+0100-02AF");
    expect(css).not.toContain("googleapis");
  });
});
