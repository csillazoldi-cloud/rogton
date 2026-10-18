import "server-only";
import { KepHiba } from "../../../../r15/kep";

// R-15 · 08c: a képes végpontok hibái egységes válaszokká.
export function kepHibaValasz(h: unknown, hol: string): Response {
  if (h instanceof KepHiba) {
    const http = h.kod === "NINCS_JOG" ? 403 : h.kod === "NINCS_ILYEN_FAJL" || h.kod === "NINCS_ILYEN_POSZT" ? 404
      : h.kod === "TUL_NAGY" ? 413 : h.kod === "TIPUS_NEM_ENGEDETT" || h.kod === "SVG_NEM_ENGEDETT" ? 415 : 400;
    return Response.json({ hiba: h.kod }, { status: http, headers: { "cache-control": "no-store" } });
  }
  console.error(`R15 kép ${hol} hiba:`, h instanceof Error ? h.message : h);
  return Response.json({ hiba: "BELSO_HIBA" }, { status: 500 });
}
