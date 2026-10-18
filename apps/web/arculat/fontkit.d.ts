// R-16 K5 (TERV §2-K5, §4 18.): a fontkit 2.0.4 (MIT) nem hoz típusleírást — csak amit az ékezet-vizsgálat használ (apps/web/arculat/betu.ts).
declare module "fontkit" {
  export interface Font {
    readonly familyName: string | null;
    hasGlyphForCodePoint(kodpont: number): boolean;
  }
  export interface FontCollection {
    readonly fonts: Font[];
  }
  export function create(bajtok: Buffer | Uint8Array, postscriptNev?: string): Font | FontCollection;
}
