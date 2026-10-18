import "server-only";
import { kapu } from "../../_kapu";
import { hiba, valasz } from "../../hirfigyelo/_kozos";
import { allapotValt } from "../../../../visszajelzes";
import { VisszajelzesAllapot } from "@km/visszajelzes-core";

export const dynamic = "force-dynamic";

export async function PATCH(keres: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const kapuValasz = await kapu(keres, "belepett");
    if (kapuValasz instanceof Response) return kapuValasz;
    const { fiok, szervezet, szerep } = kapuValasz;

    let szervezetId: string | null;
    if (fiok.rendszergazda) szervezetId = null;
    else if (szerep === "tulajdonos" && szervezet) szervezetId = szervezet.id;
    else return hiba({ hiba: "NINCS_JOG" }, 403);

    let torzs: unknown;
    try {
      torzs = await keres.json();
    } catch {
      return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    }
    const p = VisszajelzesAllapot.safeParse((torzs as { allapot?: unknown })?.allapot);
    if (!p.success) return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);

    const { id } = await ctx.params;
    const ok = await allapotValt(id, p.data, szervezetId);
    if (!ok) return hiba({ hiba: "NINCS_ILYEN_VISSZAJELZES" }, 404);
    return valasz({ visszajelzes: { ok: true } });
  } catch (h) {
    console.error("[visszajelzes/id] PATCH hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
