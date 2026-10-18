// R-15 (gepezet 9): „ma” · „tegnap” · „N napja” — óra és „futás” szó nélkül.
export function IdoSzo(t: (kulcs: string, ertekek?: Record<string, string | number>) => string, nap: number): string {
  if (nap <= 0) return t("r15.ido.ma");
  if (nap === 1) return t("r15.ido.tegnap");
  return t("r15.ido.napja", { n: nap });
}

/** A magyar határozott névelő egy szám elé: „az 1”, „az 5”, „az 50”, „az 1000”, különben „a”. */
export function nevelo(n: number): string {
  const s = String(Math.abs(Math.trunc(n)));
  return s === "1" || s.startsWith("5") || (s.length === 4 && s.startsWith("1")) ? "az" : "a";
}
