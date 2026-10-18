/**
 * 2026-09-21: az AI-javaslat MINDIG belefér a mezők határába — különben a mentés és a jóváhagyás elbukik
 * (Vilmos munkatere: a „Mikorra” hosszabb lett a határnál). Szóhatáron vágunk, három ponttal.
 */
export function vag(t: string, max: number): string {
  if (t.length <= max) return t;
  const ele = t.slice(0, max - 1);
  const szokoz = ele.lastIndexOf(" ");
  return `${(szokoz > max * 0.6 ? ele.slice(0, szokoz) : ele).trimEnd()}…`;
}
