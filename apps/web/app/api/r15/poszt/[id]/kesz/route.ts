import { kapu } from "../../../../_kapu";
import { keszJelol } from "../../../../../../r15";
import { cellaCim, posztHibaValasz, torzset, valasz } from "../../../../poszt/_kozos";

export const dynamic = "force-dynamic";

// R-15 · 08 „Kész, másolom” — a másolás a böngészőben történik; itt: Kész állapot + heti sorszám + a következő váró poszt (gepezet 3).
export async function POST(keres: Request, kontextus: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const { id } = await kontextus.params;
    const cim = cellaCim(keres, e.szervezet.id, id, await torzset(keres), e.fiok.id);
    if (cim instanceof Response) return cim;
    return valasz(await keszJelol(cim));
  } catch (h) {
    return posztHibaValasz(h, "kesz");
  }
}
