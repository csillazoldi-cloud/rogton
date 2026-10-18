// Kati #9 (10-02): „több font fájlt is ki lehetne jelölni egyszerre” — a 12e (Milyen betűtípus illik hozzátok?) „Saját betűm van”
// fájlválasztója `multiple`; a fájlok EGYMÁS UTÁN mennek fel (a logóoldal mintája: nem terheljük párhuzamosan a kiszolgálót, és a
// sorrend a kijelölés sorrendje). Tiszta segéd, hogy próbával mérhető legyen (probak/r16-betu-tobb-fajl.proba.ts).

export type FeltoltesEredmeny<S> = { sor: S } | { hiba: string };

/**
 * A fájlok feltöltése sorban. Egy hibás fájl nem állítja meg a többit.
 * Vissza: az ELSŐ sikeres sor (ez lesz kiválasztva) és az UTOLSÓ hiba kódja (ezt mutatja a lap), ha volt.
 */
export async function egymasUtan<F, S>(fajlok: readonly F[], egyet: (f: F) => Promise<FeltoltesEredmeny<S>>): Promise<{ elso: S | null; hiba: string | null; db: number }> {
  let elso: S | null = null;
  let hiba: string | null = null;
  let db = 0;
  for (const f of fajlok) {
    const e = await egyet(f);
    if ("sor" in e) {
      db++;
      if (elso === null) elso = e.sor;
    } else hiba = e.hiba;
  }
  return { elso, hiba, db };
}
