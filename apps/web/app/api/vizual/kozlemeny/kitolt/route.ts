import { kapu } from "../../../_kapu";
import { kitoltPosztbol, maIso } from "../../../../../vizual/kozlemeny";
import { kozlemenyHibaValasz } from "../_hiba";

export const dynamic = "force-dynamic";

// POST {poszt, sablon} — VZ-1 gepezet 2: a posztból nyitott közlemény mezői a poszt szövegéből, EGY AI-hívással (a tag kreditjéből).
// Válasz: {urlap (csak a helyes alakú mezők), nev (a poszt rövid neve)}. A néző nem kér; idegen poszt 404 (a munkatér saját posztjai).
export async function POST(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const torzs = ((await keres.json().catch(() => null)) ?? {}) as Record<string, unknown>;
    const ki = await kitoltPosztbol({ szervezetId: e.szervezet.id, fiokId: e.fiok.id }, { poszt: torzs["poszt"], sablon: torzs["sablon"] }, maIso());
    return Response.json(ki, { headers: { "cache-control": "no-store" } });
  } catch (h) {
    return kozlemenyHibaValasz(h, "kitöltés");
  }
}
