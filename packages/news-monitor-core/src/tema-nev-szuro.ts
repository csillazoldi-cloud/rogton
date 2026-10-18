// J-1 (2026-09-25, mérve): az AI a témajavaslatnál a cég nevéből csinált témákat („Tibor Térkő márka”, „… vélemény”) —
// ezekre egy cikk sem illett, a munkatér 0 hírt kapott. Determinisztikus őr az AI után: a cég nevét tartalmazó téma kiesik.
// (A cég saját említéseit a rendszer külön figyeli — „Kit figyeljünk” —, ahhoz nem kell téma.)
import type { Beallitas } from "./beallitas";

/** Kisbetű, ékezet nélkül, csak betű/szám és szóköz. */
export function temaNormal(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

/** Igaz, ha a téma neve a szervezet nevét tartalmazza (legalább 3 betűs névnél). */
export function temaCegnevbol(temaNev: string, szervezetNev: string): boolean {
  const n = temaNormal(szervezetNev);
  if (n.length < 3) return false;
  const t = ` ${temaNormal(temaNev)} `;
  return t.includes(` ${n} `);
}

/** A cég nevét tartalmazó témák elhagyása. Visszaadja az új listát és hogy hány téma esett ki. */
export function cegnevTemakNelkul(temak: Beallitas["temak"], szervezetNev: string): { temak: Beallitas["temak"]; kiesett: number } {
  const marad = temak.filter((t) => !temaCegnevbol(t.nev, szervezetNev));
  return { temak: marad, kiesett: temak.length - marad.length };
}
