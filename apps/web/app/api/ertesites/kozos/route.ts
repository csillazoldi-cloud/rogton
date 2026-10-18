import { kapu } from "../../_kapu";
import { hiba, valasz } from "../../tema/_kozos";
import { esemenyKornyezet, ertesitesKozosMent } from "../../../../esemeny";

export const dynamic = "force-dynamic";

/** F-5: a KÖZÖS értesítési alap — csak a rendszergazda állítja. */
export async function PUT(keres: Request): Promise<Response> {
  try {
    const ktx = await kapu(keres, "rendszergazda");
    if (ktx instanceof Response) return ktx;
    const torzs = await keres.json().catch(() => null);
    const k = await esemenyKornyezet();
    const e = await ertesitesKozosMent(k, torzs);
    if (!e.ok) return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    return valasz({ beallitas: e.ertek });
  } catch (h) {
    console.error("Ertesites kozos PUT hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
