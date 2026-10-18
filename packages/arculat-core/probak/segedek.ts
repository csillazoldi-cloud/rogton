// Próba-segédek: szintetikus RGBA képek (a böngésző canvas getImageData-jának alakjában).
import type { Kepadat } from "../src/index.js";

export type Rgba = [number, number, number, number];

/** w × h kép, képpontonként a `szin(x, y)` adja az RGBA-t. */
export function kep(w: number, h: number, szin: (x: number, y: number) => Rgba): Kepadat {
  const rgba = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) rgba.set(szin(x, y), (y * w + x) * 4);
  return { rgba, szelesseg: w, magassag: h };
}

export const ATLATSZO: Rgba = [0, 0, 0, 0];

/** Egy téglalap belül-e (a logó „tintája”). */
export const benne = (x: number, y: number, x0: number, y0: number, x1: number, y1: number) => x >= x0 && x < x1 && y >= y0 && y < y1;
