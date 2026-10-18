// Kati 10-11 („a Román változat csak a kép szövegének egy részét fordítja … a többi eredeti nyelven marad”): a kép MINDEN szövegmezője
// (cím, sor, szám, mikor, hol) a második nyelven — egyetlen gép-hívással (1 kredit), mezőnként külön sorban. Tiszta függvények
// (probak/r18-kati-1011.proba.ts); a hívás a vizual/melle.ts kepForditMezok-ban.

export const KEP_MEZOK = ["cim", "sor", "szam", "mikor", "hol"] as const;
export type KepMezo = (typeof KEP_MEZOK)[number];

/** Csak a fordítandó (betűt tartalmazó, nem üres) mezők, a kép sorrendjében, egysorosra szedve. A „−15%”, „100+” szám nem fordul. */
export function forditandoMezok(be: unknown): { kulcsok: KepMezo[]; sorok: string[] } {
  const m = (be ?? {}) as Record<string, unknown>;
  const kulcsok: KepMezo[] = [];
  const sorok: string[] = [];
  for (const k of KEP_MEZOK) {
    const v = typeof m[k] === "string" ? (m[k] as string).replace(/\s+/g, " ").trim().slice(0, 300) : "";
    if (!v || !/\p{L}/u.test(v)) continue;
    kulcsok.push(k);
    sorok.push(v);
  }
  return { kulcsok, sorok };
}

/** A gép válaszából a mezők: soronként, ugyanannyi nem üres sor, ugyanabban a sorrendben — különben null (a hívó mezőnként kér). */
export function mezokVissza(kulcsok: readonly KepMezo[], valasz: string): Partial<Record<KepMezo, string>> | null {
  const sorok = valasz.split(/\r?\n/).map((s) => s.replace(/^\s*(\d+[.)]|[-–•])\s+/, "").trim()).filter(Boolean);
  if (sorok.length !== kulcsok.length) return null;
  const ki: Partial<Record<KepMezo, string>> = {};
  kulcsok.forEach((k, i) => { ki[k] = sorok[i]!.slice(0, 300); });
  return ki;
}
