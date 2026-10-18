import { kapu } from "../../_kapu";
import { naptarBetolt } from "../../../../poszt";
import { posztHibaValasz, valasz } from "../_kozos";

export const dynamic = "force-dynamic";

// R-18 3. kör · Naptár: GET — a kész posztok napjai (a hiányzó javaslatokat a gép most adja meg). A tag is láthatja.
export async function GET(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "tag");
    if (e instanceof Response) return e;
    return valasz(await naptarBetolt(e.szervezet.id));
  } catch (h) {
    return posztHibaValasz(h, "naptar");
  }
}
