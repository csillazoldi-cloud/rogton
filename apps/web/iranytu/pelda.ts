// c5 · 11a (Csilla 10-10 14:09 B + 14:24 Q13): a még üres Iránytű halvány PÉLDÁJA a cég szakmája szerint. A szakma a c15 zárt listája
// (vizual/minta-kategoria.ts — a Képek „Kész munka” mintafotója ugyanezt használja; új AI-hívás nincs). Az „epites” szöveg a rajzé
// (r15.ir.pelda_kampany / _tolni / _cel), a többi szakmáé r15.ir.pelda_<mi>_<szakma>. Tiszta függvény.
import { mintaKategoria, type MintaKategoria } from "../vizual/minta-kategoria";

export const PELDA_SOROK = ["kampany", "tolni", "cel"] as const;

export function iranytuPeldaKulcsok(kategoria: unknown): { kategoria: MintaKategoria; kulcsok: string[] } {
  const k = mintaKategoria(kategoria);
  return { kategoria: k, kulcsok: PELDA_SOROK.map((mi) => (k === "epites" ? `r15.ir.pelda_${mi}` : `r15.ir.pelda_${mi}_${k}`)) };
}
