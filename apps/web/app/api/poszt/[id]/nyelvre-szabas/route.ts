import { kapu } from "../../../_kapu";
import { nyelvreSzab } from "../../../../../poszt";
import { cellaCim, posztHibaValasz, torzset, valasz } from "../../_kozos";

export const dynamic = "force-dynamic";

// POST — nyelvre szabás: a lefordított szöveg helyi fordulatokra igazítása. Kérésre fut, nem magától.
export async function POST(keres: Request, kontextus: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const { id } = await kontextus.params;
    const cim = cellaCim(keres, e.szervezet.id, id, await torzset(keres), e.fiok.id);
    if (cim instanceof Response) return cim;
    return valasz({ munka: await nyelvreSzab(cim) });
  } catch (h) {
    return posztHibaValasz(h, "nyelvre szabas");
  }
}
