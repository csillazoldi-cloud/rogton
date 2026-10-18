import { kapu } from "../../_kapu";
import { hiba, valasz } from "../../tema/_kozos";
import { esemenyKornyezet } from "../../../../esemeny";

export const dynamic = "force-dynamic";

/** F-5: a szervezet nélküli (fiók- és rendszerszintű) események — csak a rendszergazdának. */
export async function GET(keres: Request): Promise<Response> {
  try {
    const ktx = await kapu(keres, "rendszergazda");
    if (ktx instanceof Response) return ktx;
    const nyersLimit = new URL(keres.url).searchParams.get("limit");
    const limit = nyersLimit === null ? undefined : Number(nyersLimit);
    if (limit !== undefined && (!Number.isInteger(limit) || limit < 1 || limit > 500)) return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    const k = await esemenyKornyezet();
    return valasz({ esemeny: await k.tar.rendszerLista(limit !== undefined ? { limit } : undefined) });
  } catch (h) {
    console.error("Rendszer-esemenyek GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
