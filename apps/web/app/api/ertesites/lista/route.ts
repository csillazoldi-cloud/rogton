import { kapu } from "../../_kapu";
import { hiba, valasz } from "../../tema/_kozos";
import { ertesitesLista } from "../../../../ertesites";

export const dynamic = "force-dynamic";

export async function GET(keres: Request): Promise<Response> {
  try {
    const ktx = await kapu(keres, "tag");
    if (ktx instanceof Response) return ktx;
    const lista = await ertesitesLista(ktx.fiok);
    return valasz({ lista });
  } catch (h) {
    console.error("Ertesites lista GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
