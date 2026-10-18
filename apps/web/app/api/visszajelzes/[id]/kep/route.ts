import "server-only";
import { kapu } from "../../../_kapu";
import { hiba, valasz } from "../../../hirfigyelo/_kozos";
import { kep } from "../../../../../visszajelzes";

export const dynamic = "force-dynamic";

export async function GET(keres: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const kapuValasz = await kapu(keres, "belepett");
    if (kapuValasz instanceof Response) return kapuValasz;
    const { fiok, szervezet, szerep } = kapuValasz;

    const { id } = await ctx.params;

    let szervezetId: string | null;
    if (fiok.rendszergazda) szervezetId = null;
    else if (szerep === "tulajdonos" && szervezet) szervezetId = szervezet.id;
    else return hiba({ hiba: "NINCS_JOG" }, 403);

    const dataUrl = await kep(id, szervezetId);
    if (dataUrl === null) return hiba({ hiba: "NINCS_ILYEN_VISSZAJELZES" }, 404);
    return valasz({ visszajelzes: { kep: dataUrl } });
  } catch (h) {
    console.error("[visszajelzes/kep] GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
