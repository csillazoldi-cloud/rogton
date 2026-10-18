import { PosztTipus } from "@rogton/contracts";
import { kapu } from "../../../_kapu";
import { tipustKeszit, tipustTorol } from "../../../../../poszt";
import { cellaCim, posztHibaValasz, torzset, valasz } from "../../_kozos";

export const dynamic = "force-dynamic";

// R-18 7. kör (IRANYOK-round7.md „Post types”): POST {felulet, nyelv, tipus} — a poszt fajtájának kimenete (videó-forgatókönyv,
// szavazás, fotóalbum, Picmess kép, szöveges kártya); ugyanaz a kredit, mint az „Új változat”-é. {tipus: null} = vissza a sima szöveghez (gép nélkül).
export async function POST(keres: Request, kontextus: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const { id } = await kontextus.params;
    const torzs = await torzset(keres);
    if (torzs["tipus"] === null) return valasz({ munka: await tipustTorol(e.szervezet.id, id) });
    const tipus = PosztTipus.safeParse(torzs["tipus"]);
    if (!tipus.success) return Response.json({ hiba: "ERVENYTELEN_ADAT", mezok: { tipus: "ervenytelen" } }, { status: 400 });
    const cim = cellaCim(keres, e.szervezet.id, id, torzs, e.fiok.id);
    if (cim instanceof Response) return cim;
    return valasz({ munka: await tipustKeszit(cim, tipus.data) });
  } catch (h) {
    return posztHibaValasz(h, "tipus");
  }
}
