// R-18 6. kör (Kati E): az emoji a szövegmező kurzorához kerül (a kijelölést lecseréli). Tiszta függvény (probak/r18-kor6.proba.ts).
/** Beszúrás egy szövegmező kurzorához: az új szöveg és az új kurzorhely (tiszta függvény). */
export function kurzorhozSzur(szoveg: string, kezd: number, veg: number, e: string): { szoveg: string; kurzor: number } {
  const a = Math.max(0, Math.min(kezd, szoveg.length)), b = Math.max(a, Math.min(veg, szoveg.length));
  return { szoveg: szoveg.slice(0, a) + e + szoveg.slice(b), kurzor: a + e.length };
}
