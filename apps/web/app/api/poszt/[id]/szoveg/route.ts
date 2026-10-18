import { kapu } from "../../../_kapu";
import { szovegetKeszit } from "../../../../../poszt";
import { cellaCim, posztHibaValasz, torzset, valasz } from "../../_kozos";

export const dynamic = "force-dynamic";

// POST — javaslat készítése egy cellába (felület + nyelv). A-1: csak a kért felületre készül szöveg.
export async function POST(keres: Request, kontextus: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const { id } = await kontextus.params;
    const cim = cellaCim(keres, e.szervezet.id, id, await torzset(keres), e.fiok.id);
    if (cim instanceof Response) return cim;
    return valasz({ munka: await szovegetKeszit(cim) });
  } catch (h) {
    return posztHibaValasz(h, "szovegkeszites");
  }
}
