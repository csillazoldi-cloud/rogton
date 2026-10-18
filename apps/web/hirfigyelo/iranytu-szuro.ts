import type { IranytuSema } from "@km/contracts";

// 2026-09-22 (Vilmos: „sokkal szigorúbb és személyre szabottabb szűrés”): a hírszűrő az Iránytűt is látja —
// a célokat, amit tolni kell, és amiről a szervezet nem beszél. Csak a JÓVÁHAGYOTT iránytű számít (a tervezet nem).
// Tiszta függvény: probak/iranytu-szuro.proba.ts.

export type IranytuSzuronek = {
  celok: string[];
  tolni: string[];
  kerulendo_temak: string[];
};

/** A jóváhagyott iránytűből a szűrőnek szóló rövid kivonat; üres iránytűnél null (ilyenkor nem kerül a profilba). */
export function iranytuSzuronek(iranytu: IranytuSema | null | undefined): IranytuSzuronek | null {
  if (!iranytu) return null;
  const celok = iranytu.celok.map((c) => (c.miert.trim() ? `${c.nev.trim()} — ${c.miert.trim()}` : c.nev.trim())).filter(Boolean);
  const tolni = iranytu.tolni.map((t) => t.nev.trim()).filter(Boolean);
  const kerulendo_temak = iranytu.kerulendo_temak.map((t) => t.trim()).filter(Boolean);
  if (celok.length + tolni.length + kerulendo_temak.length === 0) return null;
  return { celok, tolni, kerulendo_temak };
}
