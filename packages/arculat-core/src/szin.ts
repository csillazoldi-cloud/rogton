// Színtani segédek (tiszta számítás). A hex-szín mindig kisbetűs „#rrggbb”; a literálokat szándékosan kerüljük (tokenőr).

export type Rgb = [number, number, number];

const HEX = /^#([0-9a-fA-F]{6})$/;

export function hexbol(hex: string): Rgb | null {
  const m = HEX.exec(hex);
  if (!m) return null;
  const n = parseInt(m[1]!, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function hexbe(rgb: Rgb): string {
  return "#" + rgb.map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0")).join("");
}

/** WCAG relatív világosság (0–1). */
export function relativVilagossag([r, g, b]: Rgb): number {
  const l = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * l(r) + 0.7152 * l(g) + 0.0722 * l(b);
}

export function tavolsag(a: Rgb, b: Rgb): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/** HSL telítettség és világosság (0–1) — a „nem márkaszín” szabályhoz (fehér, fekete, szürke). */
export function telitettsegVilagossag([r0, g0, b0]: Rgb): { s: number; l: number } {
  const r = r0 / 255, g = g0 / 255, b = b0 / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : l > 0.5 ? d / (2 - max - min) : d / (max + min);
  return { s, l };
}

/** Ugyanaz a szabály, mint a honlap-színeknél (apps/web onboarding/szinek.ts `nemMarkaszín`): fehér, fekete, szürke nem márkaszín. */
export function nemMarkaszin(rgb: Rgb): boolean {
  const { s, l } = telitettsegVilagossag(rgb);
  return s < 0.18 || l > 0.92 || l < 0.08;
}

/** A SÖTÉT HÁTTÉR próbája a 12f-en (TERV 2-K1: „sötét = a sötétített fő szín”): a fő szín árnyalatát megtartva addig sötétít,
 *  amíg a relatív világossága a `cel` alá nem ér. A már elég sötét színt nem bántja. Érvénytelen bemenetre null. */
export function sotetitve(hex: string, cel = 0.1): string | null {
  const rgb = hexbol(hex);
  if (!rgb) return null;
  if (relativVilagossag(rgb) <= cel) return hexbe(rgb);
  let lo = 0, hi = 1;
  for (let i = 0; i < 24; i++) {
    const k = (lo + hi) / 2;
    if (relativVilagossag([rgb[0] * k, rgb[1] * k, rgb[2] * k]) > cel) hi = k; else lo = k;
  }
  return hexbe([rgb[0] * lo, rgb[1] * lo, rgb[2] * lo]);
}
