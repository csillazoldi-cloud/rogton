import { kapu } from "../../../_kapu";
import { veglegesit, veglegesitestVisszavon } from "../../../../../poszt";
import { cellaCim, posztHibaValasz, torzset, valasz } from "../../_kozos";

export const dynamic = "force-dynamic";

// POST — „Ez a végleges": egy felületre és egy nyelvre (P-1). Piros jelzéssel is megy (A-6).
export async function POST(keres: Request, kontextus: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const { id } = await kontextus.params;
    const cim = cellaCim(keres, e.szervezet.id, id, await torzset(keres), e.fiok.id);
    if (cim instanceof Response) return cim;
    return valasz({ munka: await veglegesit(cim) });
  } catch (h) {
    return posztHibaValasz(h, "veglegesites");
  }
}

// DELETE — „Mégis szerkesztem": a véglegesítés visszavonása ugyanazon a cellán.
export async function DELETE(keres: Request, kontextus: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const { id } = await kontextus.params;
    const cim = cellaCim(keres, e.szervezet.id, id, await torzset(keres), e.fiok.id);
    if (cim instanceof Response) return cim;
    return valasz({ munka: await veglegesitestVisszavon(cim) });
  } catch (h) {
    return posztHibaValasz(h, "veglegesites visszavonasa");
  }
}
