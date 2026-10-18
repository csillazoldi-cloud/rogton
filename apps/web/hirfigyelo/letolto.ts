// A csomag (@km/letolto) HOST-SEMLEGES, ezért nincs benne `server-only`; a webalkalmazásban ez a bejárat őrzi,
// hogy a letöltő ne kerülhessen böngészőbe (E-29).
import "server-only";
import type { Letolto } from "@km/news-monitor-core";
import { letoltoHiv } from "@km/letolto";

// A hírfigyelő letöltője (E-20): a mag Letolto típusát valósítja meg a közös letöltő CSOMAGON át (E-29).
export const letolto: Letolto = async (forras) => {
  return letoltoHiv(forras);
};
