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

describe("R-18 módok", () => {
  it("a mód kulcsai a színek, betűk, lekerekítés — a betűméret és a térköz NEM (az a szervezeté marad)", () => {
    for (const k of ["--bg", "--text", "--primary", "--primary-2", "--font-display", "--font-body", "--font-code", "--r-card", "--r-btn", "--keszul", "--olvasatlan"]) {
      expect(MOD_KULCSOK).toContain(k);
    }
    for (const k of ["--fs-base", "--ter-4", "--control-min", "--lista-max"]) expect(MOD_KULCSOK).not.toContain(k);
  });

  it("egyetlen lila: #4b09d8 (és átlátszósága) — más lila árnyalat egyik módban sincs", () => {
    for (const mod of ["sotet", "vilagos"] as const) {
      const t = modTokenek(alap, mod);
      expect(t["--primary"]).toBe("#4b09d8");
      expect(t["--primary-2"]).toBe("#4b09d8");
      const szoveg = Object.values(t).join(" ");
      for (const hex of szoveg.match(/#[0-9a-fA-F]{6}\b/g) ?? []) {
        const { h, s } = arnyalat(hex);
        if (h >= 245 && h <= 300 && s > 0.25) expect(hex.toLowerCase(), `${mod}: ${hex}`).toBe("#4b09d8");
      }
      for (const rgba of szoveg.match(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+/g) ?? []) {
        const [r, g, b] = rgba.replace(/rgba?\(/, "").split(",").map((x) => parseInt(x, 10)) as [number, number, number];
        if (b > r + 40 && b > g + 40) expect(`${r},${g},${b}`, `${mod}: ${rgba}`).toBe("75,9,216");
      }
    }
  });

  it("sötét lapon nincs lila szöveg: a link és a fókusz színe világos", () => {
    const t = modTokenek(alap, "sotet");
    expect(t["--accent-link"]).toBe("#ececec");
    expect(t["--focus"]).toBe("#ececec");
    expect(t["--src-ai"]).not.toBe("#4b09d8");
  });

  it("a fej CSS-e: két blokk [data-mod] választóval, jelölés nélkül a sötét", () => {
    const css = modCss(alap);
    expect(css).toContain(':root[data-mod="sotet"],:root:not([data-mod]){');
    expect(css).toContain(':root[data-mod="vilagos"]{');
    expect(css).toContain("--bg:#0a0a0a");
    expect(css).toContain("--bg:#eceae5");
    expect(css).toContain("--fs-ui:13px");
    expect(css).not.toMatch(/[<]/);
  });

  it("a mozgás a --motion tokent követi: off → 1 ms", () => {
    expect(modCss({ ...alap, "--motion": "off" })).toContain("--t-mode:1ms");
    expect(modCss(alap)).toContain("--t-mode:250ms");
  });

  it("saját betűk: 14 fájl, latin + latin-ext, Google Fonts nélkül", () => {
    expect(r18BetuFajlok()).toHaveLength(14);
    const css = betuCss("/betuk");
    expect(css.match(/@font-face/g)).toHaveLength(14);
    expect(css).toContain("font-family:'Inter Tight'");
    expect(css).toContain("U+0100-02AF");
    expect(css).not.toContain("googleapis");
  });
});
