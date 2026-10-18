import "server-only";
import { KozlemenyHiba } from "../../../../vizual/kozlemeny";

/** VZ-1 · Közlemények: a hibakód → HTTP-válasz (400 · 404 · 402 · 502 · 500). */
export function kozlemenyHibaValasz(h: unknown, hol: string): Response {
  const v = (hiba: string, status: number) => Response.json({ hiba }, { status, headers: { "cache-control": "no-store" } });
  if (h instanceof KozlemenyHiba) {
    if (h.kod === "ERVENYTELEN_ADAT") return v(h.kod, 400);
    if (h.kod === "NINCS_ILYEN") return v(h.kod, 404);
    if (h.kod === "AI_KERET_KIMERULT") return v(h.kod, 402);
    return v(h.kod, 502);
  }
  console.error(`Közlemény ${hol} hiba:`, h instanceof Error ? h.message : h);
  return v("BELSO_HIBA", 500);
}
