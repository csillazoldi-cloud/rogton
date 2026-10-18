// c5 · 11c (design/R15/rajz/R15-lapok-4.dc.html 11c; gepezet-4 · 4; kerdesek-4 · 7–8 — Csilla 10-10: jóváhagyva, Vilmos utólag nézi):
// a jóváhagyott iránytűből legfeljebb 3 posztötlet — sorrend: a MA futó kampány(ok) → „Amit tolni kell” a saját sorrendjében → célok.
// Tiszta függvény (nincs adatbázis, nincs hálózat): a kliens és a próba is ezt hívja (probak/c5-iranytu-otletek.proba.ts).

export type IranytuOtletForras = {
  celok: { id: string; nev: string; miert?: string }[];
  tolni: { id: string; nev: string }[];
  idoszakok: { id: string; nev: string; mettol: string; meddig: string; mit?: string }[];
};

export type IranytuOtlet = {
  id: string;
  fajta: "kampany" | "tolni" | "cel";
  cim: string;
  /** a kampány „mit szeretnétek” sora / a cél „miért”-je — a kártya halk második sora (asztalon) */
  alatta: string;
  mettol: string;
  meddig: string;
};

export const OTLET_MAX = 3;

/** `ma`: ÉÉÉÉ-HH-NN. Egy időszak akkor fut, ha mettol ≤ ma ≤ meddig (az üres határ nyitott). Üres nevű tétel nem ötlet. */
export function iranytuOtletek(ir: IranytuOtletForras | null | undefined, ma: string): IranytuOtlet[] {
  if (!ir) return [];
  const ki: IranytuOtlet[] = [];
  const fut = (i: { mettol: string; meddig: string }) => (!i.mettol || i.mettol <= ma) && (!i.meddig || ma <= i.meddig);
  for (const i of ir.idoszakok ?? []) {
    if (!i.nev.trim() || !fut(i)) continue;
    ki.push({ id: i.id, fajta: "kampany", cim: i.nev.trim(), alatta: (i.mit ?? "").trim(), mettol: i.mettol, meddig: i.meddig });
  }
  for (const t of ir.tolni ?? []) if (t.nev.trim()) ki.push({ id: t.id, fajta: "tolni", cim: t.nev.trim(), alatta: "", mettol: "", meddig: "" });
  for (const c of ir.celok ?? []) if (c.nev.trim()) ki.push({ id: c.id, fajta: "cel", cim: c.nev.trim(), alatta: (c.miert ?? "").trim(), mettol: "", meddig: "" });
  return ki.slice(0, OTLET_MAX);
}

/** A posztmunka kiváltója (POST /api/poszt `forras`): tipus "terv" (a PosztForras szerződésében mérve), azonosító = a tétel id-ja —
 *  így a második kattintás UGYANAZT a munkát nyitja (A-8, munkatLetrehoz), nem újat. */
export function otletForras(o: IranytuOtlet): { tipus: "terv"; azonosito: string; cim: string; url: string; szoveg: string } {
  const szoveg = [o.cim, o.alatta, o.mettol || o.meddig ? `Időszak: ${o.mettol || "…"} – ${o.meddig || "…"}` : ""].filter(Boolean).join("\n");
  return { tipus: "terv", azonosito: o.id, cim: o.cim.slice(0, 200), url: "", szoveg: szoveg.slice(0, 4000) };
}
