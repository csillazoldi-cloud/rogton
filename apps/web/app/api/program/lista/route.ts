import { kapu } from "../../_kapu";
import { programLista } from "../../../../program";
import { hibaValasz, valasz } from "../_kozos";

export const dynamic = "force-dynamic";

// c30 F5 — GET: a szervezet programja (nem törölt tételek; a tag, a néző is látja). A szervezet a munkamenetből jön, a sorok a saját
// szervezet szabályán át (A-11).
export async function GET(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "tag");
    if (e instanceof Response) return e;
    return valasz({ tetelek: await programLista(e.szervezet.id) });
  } catch (h) {
    return hibaValasz(h, "lista");
  }
}
