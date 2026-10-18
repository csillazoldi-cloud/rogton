// R-18 3. kör (Csilla 10-11, „1 posts done”): a feliratsablon kitöltése EGY helyen — a kliens (nyelv/kliens.tsx), a kiszolgáló (nyelv/index.ts
// `felirat`) és az eseménynapló feliratozója (esemeny/index.ts) is ezt hívja. Tiszta függvény (se server-only, se React).
//
// A sima helyőrző: {nev}. Többes szám (ICU-részhalmaz): {n, plural, one {# poszt} few {# postări} other {# de postări}} — a # helyére a szám
// kerül, a formák belsejében nincs további kapcsos zárójel. Az alak nyelvfüggetlenül választható, mert a három nyelvünkre ez a szabály pontos:
//   =N (pontos szám) → one (n = 1) → few, ha van ilyen forma (román: 0 és 2–19, illetve a 100-on felüli …01–…19) → other.
// Angolban csak one/other van, a magyar sablonok nem használnak többes alakot („1 poszt”, „2 poszt”).

const TOBBES = /\{(\w+),\s*plural,((?:\s*(?:=\d+|zero|one|two|few|many|other)\s*\{[^{}]*\})+)\s*\}/g;
const FORMA = /(=\d+|zero|one|two|few|many|other)\s*\{([^{}]*)\}/g;

/** Melyik többes alak illik egy számhoz (a fenti szabály; a `formak` a sablonban megadott alakok nevei). */
export function tobbesAlak(n: number, formak: ReadonlySet<string>): string {
  if (formak.has(`=${n}`)) return `=${n}`;
  if (n === 1 && formak.has("one")) return "one";
  const m = Math.abs(Math.trunc(n)) % 100;
  if (formak.has("few") && Number.isInteger(n) && (n === 0 || (n !== 1 && m >= 1 && m <= 19))) return "few";
  return "other";
}

export function sablonKitolt(sablon: string, ertekek?: Record<string, string | number>): string {
  if (!ertekek) return sablon;
  const tobbes = sablon.replace(TOBBES, (egesz, nev: string, formakSzoveg: string) => {
    const ertek = ertekek[nev];
    if (ertek === undefined) return egesz;
    // a hívó néha már formázott számot ad („1 234”) — abból nem dönthető el az alak: akkor a többes („other”) forma
    const n = typeof ertek === "number" ? ertek : /^-?\d+(\.\d+)?$/.test(String(ertek).trim()) ? Number(ertek) : NaN;
    const formak = new Map<string, string>();
    for (const f of formakSzoveg.matchAll(FORMA)) formak.set(f[1]!, f[2]!);
    const alak = Number.isFinite(n) ? tobbesAlak(n, new Set(formak.keys())) : "other";
    const valasztott = formak.get(alak) ?? formak.get("other") ?? "";
    return valasztott.replace(/#/g, String(ertek));
  });
  return tobbes.replace(/\{([^}]+)\}/g, (egesz, nev: string) => {
    const ertek = ertekek[nev];
    return ertek !== undefined ? String(ertek) : egesz;
  });
}
