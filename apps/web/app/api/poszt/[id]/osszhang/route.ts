import { kapu } from "../../../_kapu";
import { osszhangotVizsgal } from "../../../../../poszt";
import { cellaCim, posztHibaValasz, torzset, valasz } from "../../_kozos";

export const dynamic = "force-dynamic";

// POST — „Vizsgáld meg újra": a szöveg mérése a cég jóváhagyott iránytűjéhez.
// A vizsgálat maga sosem dob AI-hibát: ilyenkor a jelzés „nem futott" lesz.
export async function POST(keres: Request, kontextus: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const { id } = await kontextus.params;
    const cim = cellaCim(keres, e.szervezet.id, id, await torzset(keres), e.fiok.id);
    if (cim instanceof Response) return cim;
    return valasz({ munka: await osszhangotVizsgal(cim) });
  } catch (h) {
    return posztHibaValasz(h, "osszhangvizsgalat");
  }
}
