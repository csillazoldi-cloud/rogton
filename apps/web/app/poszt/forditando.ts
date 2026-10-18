// H1 (Kati, hub 10-05: „egy román nyelvű posztban »Marosvásárhely« marad, pedig »Târgu Mureș« kellene”).
// GYÖKÉROK (mérve a kódon): a „Más nyelven” váltás CSAK üres cellánál fordított. Ha a cél nyelv cellája már megvolt (egy korábbi fordítás,
// vagy a magyar szöveg azóta változott), a régi szöveg jött vissza változatlanul — a kiszolgáló elavultnak jelölte (elavult_forditas), de a
// R-15 lap ezt se nem mutatta, se nem használta. Mostantól: az elavult, kézzel NEM írt cellát a váltás újrafordítja (a v3 fordító-prompt
// helynév-szabályával). A kézzel írt (vagy véglegesített) cellához nem nyúlunk: ami az emberé, azt a gép nem írja felül (A-9).
import type { PosztSzoveg } from "@rogton/contracts";

type Cella = Pick<PosztSzoveg, "felulet" | "nyelv" | "szoveg" | "javaslat" | "allapot" | "elavult_forditas">;

/** Kell-e fordítani, amikor a lap erre a nyelvre vált? Üres cella: igen. Elavult, és a gép szövege áll benne: igen. Minden más: nem. */
export function forditasKell(szovegek: readonly Cella[], felulet: string, nyelv: string): boolean {
  const cella = szovegek.find((c) => c.felulet === felulet && c.nyelv === nyelv);
  if (!cella || !cella.szoveg.trim()) return true;
  if (!cella.elavult_forditas) return false;
  // kézzel írt: az állapot „szerkesztve”/„vegleges”, vagy a szöveg eltér a gép utolsó javaslatától
  return cella.allapot === "javaslat" && cella.szoveg.trim() === cella.javaslat.trim();
}
