// c30 F12 (Csilla 10-17 19:26): egy fesztivál soha nem lát „cég / company / firmă” szót. A feliratoknak lehet FESZTIVÁL-VÁLTOZATA:
// a `<kulcs>@fesztival` sor (a `@` nem kulcs-betű: nem ütközhet egy valódi kulccsal, pl. a meglévő `c30.tipus.fesztival`-lal) (HU/RO/EN, 0180). A lap szótára (`lapFeliratai`) fesztiválnál a változatot teszi a kulcs helyére — így MINDEN
// hely (szerver és kliens, `t("iranytu.cim")`) egyetlen kódváltozás nélkül a fesztivál szövegét kapja. A szervezet saját felülírása
// (Feliratok lap) erősebb: amit a szervezet maga írt át, azt a változat nem írja felül. A `@fesztival` kulcsok magukban soha nem
// kerülnek a lapra (mindenkinél lekerülnek) — egy cég szótára így bájtra ugyanaz, mint eddig. Tiszta: probak/c30-f12-fesztival.proba.ts.
import type { FeliratSzotar } from "@rogton/design-system";

export const FESZTIVAL_UTOTAG = "@fesztival";

export function tipusValtozat(szotar: FeliratSzotar, fesztival: boolean, sajatFelulirt: ReadonlySet<string> = new Set()): FeliratSzotar {
  const ki: FeliratSzotar = {};
  for (const [k, v] of Object.entries(szotar)) if (!k.endsWith(FESZTIVAL_UTOTAG)) ki[k] = v;
  if (!fesztival) return ki;
  for (const [k, v] of Object.entries(szotar)) {
    if (!k.endsWith(FESZTIVAL_UTOTAG)) continue;
    const alap = k.slice(0, -FESZTIVAL_UTOTAG.length);
    if (alap && !sajatFelulirt.has(alap) && v) ki[alap] = v;
  }
  return ki;
}
