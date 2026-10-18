// R-13 (2026-09-22): a kredit-végpontok közös darabjai.
import { maradt } from "../../../kredit/szabaly";

export function hiba(h: { hiba: string }, status: number): Response {
  return Response.json(h, { status, headers: { "cache-control": "no-store" } });
}

export function valasz(torzs: unknown, status = 200): Response {
  return Response.json(torzs, { status, headers: { "cache-control": "no-store" } });
}

/** Ezredből kredit (három tizedesig) — a felület egy tizedesre kerekít. */
export function kr(ezred: number): number {
  return Math.round(ezred) / 1000;
}

export function egyenleg(keret: number, felhasznalt: number): { havi: number; felhasznalt: number; maradt: number } {
  return { havi: kr(keret), felhasznalt: kr(felhasznalt), maradt: kr(maradt({ keret, felhasznalt })) };
}
