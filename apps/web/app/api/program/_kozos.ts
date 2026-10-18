import { ProgramHiba } from "../../../program";

// c30 F5: a program-végpontok közös hibaválasza (ProgramHiba kód → HTTP-állapot).
const ALLAPOT: Record<ProgramHiba["kod"], number> = {
  ERVENYTELEN_ADAT: 400, NINCS_SZOVEG: 422, SERULT: 422, NEM_DOCX: 415, TILTOTT_XML: 415, TUL_NAGY: 413, TOMORITESI_BOMBA: 413,
  AI_NEM_ELERHETO: 502, AI_KERET_KIMERULT: 402, TUL_SOK: 409, NINCS_ILYEN: 404,
};
export const valasz = (adat: unknown, status = 200) => Response.json(adat, { status, headers: { "cache-control": "no-store" } });
export function hibaValasz(h: unknown, hol: string): Response {
  if (h instanceof ProgramHiba) return valasz({ hiba: h.kod }, ALLAPOT[h.kod]);
  console.error(`Program ${hol} hiba:`, h);
  return valasz({ hiba: "BELSO_HIBA" }, 500);
}
