// R-16 K6 (TERV §2-K6, §4 18.): a fontkit 2.0.4 (MIT) nem hoz típusleírást — csak amit a betű-útvonal (betu-utvonal.ts) használ.
declare module "fontkit" {
  export interface BBox {
    readonly minX: number;
    readonly minY: number;
    readonly maxX: number;
    readonly maxY: number;
  }
  export interface Path {
    readonly commands: readonly { command: string; args: number[] }[];
    readonly bbox: BBox;
    /** x' = a·x + c·y + e, y' = b·x + d·y + f */
    transform(a: number, b: number, c: number, d: number, e: number, f: number): Path;
    translate(x: number, y: number): Path;
    toSVG(): string;
  }
  export interface Glyph {
    readonly id: number;
    readonly name: string;
    readonly path: Path;
    readonly advanceWidth: number;
  }
  export interface GlyphPosition {
    readonly xAdvance: number;
    readonly yAdvance: number;
    readonly xOffset: number;
    readonly yOffset: number;
  }
  export interface GlyphRun {
    readonly glyphs: Glyph[];
    readonly positions: GlyphPosition[];
  }
  export interface Font {
    readonly familyName: string | null;
    readonly unitsPerEm: number;
    glyphForCodePoint(kodpont: number): Glyph;
    layout(szoveg: string): GlyphRun;
  }
  export interface FontCollection {
    readonly fonts: Font[];
  }
  export function create(bajtok: Buffer | Uint8Array, postscriptNev?: string): Font | FontCollection;
}
