import { kapu } from "../../../_kapu";
import { letoltesRogzit } from "../../../../../vizual/kozlemeny";
import { kozlemenyHibaValasz } from "../_hiba";

export const dynamic = "force-dynamic";

// POST {sablon, sorszam, jelzesek[]} — VZ-1: a letöltés feljegyzése. A szám lesz a munkatér „utolsó” száma ennél a képnél (a következő
// közlemény ennél eggyel többet kap, kerdesek 8); a kép szabály-jelzései a rendszergazda listájába kerülnek (kerdesek 4). A néző nem ír.
export async function POST(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const torzs = ((await keres.json().catch(() => null)) ?? {}) as Record<string, unknown>;
    const ki = await letoltesRogzit({ szervezetId: e.szervezet.id, fiokId: e.fiok.id }, { sablon: torzs["sablon"], sorszam: torzs["sorszam"], jelzesek: torzs["jelzesek"] });
    return Response.json(ki, { headers: { "cache-control": "no-store" } });
  } catch (h) {
    return kozlemenyHibaValasz(h, "letöltés");
  }
}
