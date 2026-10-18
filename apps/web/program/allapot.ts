import { PROGRAM_OLVASAS_ELAKAD_MS, type SzervezetProfil } from "@rogton/contracts";

// c30 F6b: a háttér-olvasás állapota — tiszta függvény (probak/c30-f6b-elo-javitasok.proba.ts).
export type ProgramOlvasas = NonNullable<SzervezetProfil["program_olvasas"]>;

/** A futó/utolsó olvasás állapota; a túl régóta „fut” olvasás (újraindult a szerver közben) „hiba / ELAKADT” — így a lap nem vár örökké. */
export function olvasasAllapot(o: ProgramOlvasas | undefined, most = Date.now()): ProgramOlvasas | null {
  if (!o) return null;
  if (o.allapot === "fut" && most - Date.parse(o.kezdve) > PROGRAM_OLVASAS_ELAKAD_MS) return { ...o, allapot: "hiba", hiba: "ELAKADT" };
  return o;
}
