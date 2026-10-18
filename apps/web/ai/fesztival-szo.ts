// c30 F12 (Csilla 10-17): egy fesztivál AI-hívásaiban a rendszerprompt nem „a cég”-ről beszél, hanem „a fesztivál”-ról. Tiszta,
// szóhatáros csere (a magyar ékezetes betűkre is): a cég → a fesztivál a promptokban előforduló alakokkal; a „cég szakmája” → „a fesztivál
// témája”. Csak fesztiválnál fut (ai/index.ts `prompt(…, "fesztival")`); a cég promptja bájtra ugyanaz. Próba: probak/c30-f12-fesztival.proba.ts.
const CSERE: [RegExp, string][] = [
  [/(?<!\p{L})cég szakmáj/gu, "fesztivál témáj"],
  [/(?<!\p{L})CÉG(?!\p{L})/gu, "FESZTIVÁL"],
  [/(?<!\p{L})Cég(?=-)/gu, "Fesztivál"],
  [/(?<!\p{L})cégről(?!\p{L})/gu, "fesztiválról"],
  [/(?<!\p{L})cégnek(?!\p{L})/gu, "fesztiválnak"],
  [/(?<!\p{L})cégnél(?!\p{L})/gu, "fesztiválnál"],
  [/(?<!\p{L})céget(?!\p{L})/gu, "fesztivált"],
  [/(?<!\p{L})Cég(?!\p{L})/gu, "Fesztivál"],
  [/(?<!\p{L})cég(?!\p{L})/gu, "fesztivál"],
];

export function fesztivalPrompt(szoveg: string): string {
  let s = szoveg;
  for (const [m, uj] of CSERE) s = s.replace(m, uj);
  return s;
}

/** Ezek a promptok kapják a cserét (a tématerv a fesztivált már maga kezeli; a hírfigyelőé más cégekről beszél). */
export const FESZTIVAL_PROMPTOK: ReadonlySet<string> = new Set([
  "poszt_szoveg", "poszt_cikk", "poszt_tipus", "poszt_atiras", "poszt_forditas", "poszt_nyelvre_szabas", "poszt_osszhang", "kep_peldak", "iranytu_javaslat",
]);

/** A gép saját bemeneti mondatai, amik „a cég”-et mondják (poszt/bemenet.ts, poszt/index.ts, poszt/tipus.ts) — fesztiválnál a fesztivál.
 *  CSAK ezek a pontos mondatrészek cserélődnek: a felhasználó és a hír szövege (amiben más cégek is szerepelhetnek) érintetlen. */
const GEPI: [string, string][] = [
  ["amivel a cég foglalkozik (a profil szerint)", "amivel a fesztivál foglalkozik (a profil szerint)"],
  ["(a cég adta meg, NEM kész mondat)", "(a fesztivál adta meg, NEM kész mondat)"],
  ["A cég iránytűje:\n", "A fesztivál iránytűje:\n"],
  ["(a cég kérte)", "(a fesztivál kérte)"],
];
export function fesztivalBemenet(szoveg: string): string {
  let s = szoveg;
  for (const [regi, uj] of GEPI) s = s.split(regi).join(uj);
  return s;
}
