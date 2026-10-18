// A HOST ütemezési csatlakozója: mikor esedékes a napi figyelés.
// A mag nem ütemez — csak az aktív beállítás `idozites` mezőjét adja; a döntés a hosté.
import { aktivVerzio, type HirfigyeloTar } from "@km/news-monitor-core";

/** A megadott pillanat naptári napja és perce az időzónában (nincs kézi eltolás, nincs új függőség). */
function helyiIdo(mikor: Date, idozona: string): { nap: string; percek: number } {
  const reszek = new Intl.DateTimeFormat("en-CA", {
    timeZone: idozona,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23", // éjfélkor „00”, nem „24”
  }).formatToParts(mikor);
  const ertek = new Map<string, string>();
  for (const resz of reszek) {
    if (resz.type !== "literal") ertek.set(resz.type, resz.value);
  }
  return {
    nap: `${ertek.get("year") ?? ""}-${ertek.get("month") ?? ""}-${ertek.get("day") ?? ""}`,
    percek: Number(ertek.get("hour") ?? "0") * 60 + Number(ertek.get("minute") ?? "0"),
  };
}

/**
 * Esedékes-e ma a napi figyelés? Üres tömb = nem. (A referencia-host egy szervezetet szolgál ki,
 * ezért a válasz vagy üres, vagy az egyetlen szervezet azonosítója — a webalkalmazás ugyanezt sok szervezetre teszi.)
 */
export async function napiEsedekes(
  tar: HirfigyeloTar,
  szervezetId: string,
  most: () => Date,
  utolsoNapiFutas: (sz: string) => string | null,
): Promise<string[]> {
  const aktiv = aktivVerzio(await tar.verziok(szervezetId));
  if (!aktiv) return [];
  const idozites = aktiv.beallitas.idozites;
  if (idozites.mod !== "napi") return [];

  const mostHelyi = helyiIdo(most(), idozites.idozona);
  if (mostHelyi.percek < idozites.ora * 60 + idozites.perc) return []; // ma még nem jött el az idő

  const utolso = utolsoNapiFutas(szervezetId);
  if (utolso && helyiIdo(new Date(utolso), idozites.idozona).nap === mostHelyi.nap) return []; // ma már futott

  return [szervezetId];
}
