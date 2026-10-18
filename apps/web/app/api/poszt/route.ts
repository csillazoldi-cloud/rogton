import { kapu } from "../_kapu";
import { munkakatListaz, munkatLetrehoz } from "../../../poszt";
import { posztHibaValasz, torzset, valasz } from "./_kozos";

export const dynamic = "force-dynamic";

// GET — a szervezet posztmunkái, legutóbb módosított elöl. A tag is láthatja.
export async function GET(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "tag");
    if (e instanceof Response) return e;
    return valasz({ munkak: await munkakatListaz(e.szervezet.id) });
  } catch (h) {
    return posztHibaValasz(h, "lista");
  }
}

// POST — új munka egy kiváltóból (hír · terv · belső infó · saját gondolat).
// A-8: ugyanabból a hírből ugyanaz a munka nyílik meg, nem új.
export async function POST(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const torzs = await torzset(keres);
    return valasz({ munka: await munkatLetrehoz(e.szervezet.id, e.fiok.id, torzs) });
  } catch (h) {
    return posztHibaValasz(h, "letrehozas");
  }
}
