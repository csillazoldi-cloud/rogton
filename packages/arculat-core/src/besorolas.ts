// R-16 K1 (TERV 1.4 `besorol`, gepezet 3): egyszerre feltöltött logók helyre tétele. Tibor több fájlt választ ki egyszerre;
// a gép dönti el, melyik hova kerül — kérdés nélkül („Mi tudjuk, melyik hova.”).
import type { LogoHely } from "./host";
import { egyszinuLogo, HELY_KUSZOB, javasoltHely, negyzetesLogo, type LogoElemzes } from "./logo-elemzes";

/** Az ütközéskor kipróbált helyek sorrendje (TERV 1.4). */
export const BESOROLAS_SORREND: readonly LogoHely[] = ["vilagos", "sotet", "egyszinu", "negyzetes"];

/**
 * Elmehet-e a logó erre a helyre, ha a természetes helye már foglalt ebben a csomagban (TERV 4. döntés 6.: nem a szó szerinti
 * „következő üres” — különben egy széles színes logó a „Négyzetes” helyre kerülne). A K1-ben a két háttér-helyre is feltétel
 * került (README „Eltérések”): fehér logó nem mehet a világos helyre, fekete nem a sötétre — ott eltűnne.
 */
export function helyreAlkalmas(hely: LogoHely, e: LogoElemzes | null): boolean {
  if (!e) return hely === "vilagos";
  switch (hely) {
    case "vilagos": return e.vilagossag < HELY_KUSZOB.vilagosraMax;
    case "sotet": return e.vilagossag >= HELY_KUSZOB.sotetreMin;
    case "egyszinu": return egyszinuLogo(e);
    case "negyzetes": return negyzetesLogo(e);
  }
}

/**
 * A csomag besorolása feltöltési sorrendben: mindegyik a természetes helyére (`javasoltHely`), ha az ebben a csomagban még üres;
 * ha foglalt, a sorrend szerinti első, ebben a csomagban üres ÉS alkalmas helyre; ha ilyen nincs, mégis a természetes helyére —
 * akkor a csomag korábbi fájlja ott előzmény marad (az újabb nyer, semmi nem törlődik). Elemzés nélkül (PDF) → világos.
 */
export function besorol(elemzesek: readonly (LogoElemzes | null)[]): LogoHely[] {
  const foglalt = new Set<LogoHely>();
  const ki: LogoHely[] = [];
  for (const e of elemzesek) {
    const termeszetes = javasoltHely(e);
    let hely = termeszetes;
    if (foglalt.has(termeszetes)) {
      const masik = BESOROLAS_SORREND.find((h) => !foglalt.has(h) && helyreAlkalmas(h, e));
      if (masik) hely = masik;
    }
    foglalt.add(hely);
    ki.push(hely);
  }
  return ki;
}
