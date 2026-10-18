import { kapu } from "../../_kapu";
import { hiba, valasz } from "../../tema/_kozos";
import { bevaltoNezet } from "../../../../tagok";

export const dynamic = "force-dynamic";

/** R-2 (D-F30): a meghívó megtekintése a jegyből, belépés előtt is — a beváltó lap (`/meghivo/<jegy>`) adata. Csak a meghívó nevét, a munkatér
 *  nevét és a szerepet adja, és csak élő meghívónál; a jegy nem kerül naplóba. A beváltás maga a `POST /api/meghivo/elfogad`. */
export async function GET(keres: Request, ctx: { params: Promise<{ jegy: string }> }): Promise<Response> {
  try {
    const { jegy } = await ctx.params;
    const ktx = await kapu(keres, "nyilvanos");
    const meghivo = await bevaltoNezet(jegy, ktx.fiok);
    return valasz({ meghivo });
  } catch (h) {
    console.error("Meghivo GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
