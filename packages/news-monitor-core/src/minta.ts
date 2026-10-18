// Rögzített minta a próbafutáshoz és az összehasonlításhoz.
import { z } from "zod";
import type { Kivonat } from "./kivonat";
import type { Fontossag } from "./talalat";

export const Minta = z.object({
  id: z.string().min(1),
  szervezet_id: z.string().min(1),
  szabaly_verzio: z.number().int().positive(),
  talalat_ids: z.array(z.string()).min(1),
  letrehozva: z.iso.datetime(),
  lejar: z.iso.datetime(),
});
export type Minta = z.infer<typeof Minta>;

/** Minta készítése a megadott találatokból, lejárattal. */
export function mintaKeszit(be: { id: string; szervezet_id: string; szabaly_verzio: number; talalat_ids: string[] }, most: Date): Minta {
  return {
    ...be,
    letrehozva: most.toISOString(),
    lejar: new Date(most.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

/** Lejárt-e a minta. */
export function mintaLejart(m: Minta, most: Date): boolean {
  return new Date(m.lejar) <= most;
}

/** Összehasonlítható-e: nem lejárt és minden kivonat megvan. */
export function osszehasonlithato(m: Minta, kivonatok: Kivonat[], most: Date): { ok: true } | { ok: false; ok_kod: "lejart" | "hianyos" } {
  if (mintaLejart(m, most)) return { ok: false, ok_kod: "lejart" };
  const kivonatIds = new Set(kivonatok.map((k) => k.id));
  if (!m.talalat_ids.every((id) => kivonatIds.has(id))) return { ok: false, ok_kod: "hianyos" };
  return { ok: true };
}

/** Összehasonlítás a fontosság sorrendje szerint (fontos > érdekes > háttér). */
/** Két értékelés-sor összevetése találatonként (talalat_id szerint párosítva) a fontosság sorrendje szerint: fontos > érdekes > háttér.
 *  Az eredmény sorrendje a régi soré; ami az újban nincs, kimarad. */
/** Egy találat értékelése az összehasonlításhoz: a fontossága, és ha van, a találat azonosítója. */
export type ErtekelesSor = { talalat_id?: string; fontossag: Fontossag };

/** Két értékelés-sor összevetése a fontosság sorrendje szerint (fontos > érdekes > háttér). Ha mindkét oldalon van
 *  `talalat_id`, aszerint párosít; különben helyzet szerint (i-edik a i-edikkel), a visszaadott azonosító ekkor `#i`. */
export function osszehasonlitas(regi: ErtekelesSor[], uj: ErtekelesSor[]): { talalat_id: string; valtozas: "elorebb" | "hatrebb" | "valtozatlan" }[] {
  const sorrend: Record<string, number> = { fontos: 3, erdekes: 2, hatter: 1 };
  const idSzerint = regi.every((r) => r.talalat_id) && uj.every((u) => u.talalat_id);
  const ujTerkep = new Map(uj.map((u, i) => [idSzerint ? u.talalat_id! : `#${i}`, u]));
  const ki: { talalat_id: string; valtozas: "elorebb" | "hatrebb" | "valtozatlan" }[] = [];
  regi.forEach((r, i) => {
    const id = idSzerint ? r.talalat_id! : `#${i}`;
    const u = ujTerkep.get(id);
    if (!u) return;
    const rErtek = sorrend[r.fontossag] ?? 0;
    const uErtek = sorrend[u.fontossag] ?? 0;
    ki.push({ talalat_id: id, valtozas: uErtek > rErtek ? "elorebb" : uErtek < rErtek ? "hatrebb" : "valtozatlan" });
  });
  return ki;
}
