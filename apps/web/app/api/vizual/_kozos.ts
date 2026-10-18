import "server-only";
import { KepgyarHiba } from "../../../vizual";

export function hibaValasz(h: unknown, hol: string): Response {
  const v = (hiba: string, status: number, extra: Record<string, unknown> = {}) =>
    Response.json({ hiba, ...extra }, { status, headers: { "cache-control": "no-store" } });
  if (h instanceof KepgyarHiba) {
    if (h.kod === "ERVENYTELEN_ADAT") return v("ERVENYTELEN_ADAT", 400, { reszlet: h.reszlet ?? null });
    if (h.kod === "NINCS_ILYEN") return v("NINCS_ILYEN", 404);
    return v("KEPGYAR_NEM_VALASZOL", 502);
  }
  console.error(`Vizuál ${hol} hiba:`, h instanceof Error ? h.message : h);
  return v("BELSO_HIBA", 500);
}
