// R-11/A · B-7: a tiltott szavakat KÓD nézi, szó szerint — ehhez nem kell AI.
// Tiszta függvény, hogy gépi próba is futhasson rá.

/**
 * Az első tiltott szó, ami a szövegben szerepel — vagy null, ha egyik sem.
 * Egy szóból álló tiltás: szóhatáron, teljes egyezéssel. Több szóból álló: egyszerű tartalmazás.
 */
export function tiltottSzavakEllenorzes(szoveg: string, tiltottak: string[]): string | null {
  if (tiltottak.length === 0) return null;
  const kicsi = szoveg.toLowerCase();
  const szavak = kicsi.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  for (const t of tiltottak) {
    const szo = t.trim().toLowerCase();
    if (!szo) continue;
    const talalat = szo.includes(" ") ? kicsi.includes(szo) : szavak.includes(szo);
    if (talalat) return t;
  }
  return null;
}
