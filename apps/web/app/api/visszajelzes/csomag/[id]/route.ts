import "server-only";
import { JavitoTetelAllapot } from "@rogton/visszajelzes-core";
import { kapu } from "../../../_kapu";
import { hiba, valasz } from "../../../hirfigyelo/_kozos";
import { csomagTetelAllapot } from "../../../../../visszajelzes";

export const dynamic = "force-dynamic";

export async function PATCH(
  keres: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const kapuValasz = await kapu(keres, "rendszergazda");
    if (kapuValasz instanceof Response) return kapuValasz;

    const { id } = await ctx.params;

    let torzs: unknown = null;
    try {
      torzs = await keres.json();
    } catch {
      return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    }

    const ellenorzott = JavitoTetelAllapot.safeParse(
      (torzs as { allapot?: unknown } | null)?.allapot,
    );
    if (!ellenorzott.success) return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);

    const tetelId = (torzs as { tetel_id?: unknown } | null)?.tetel_id;
    if (typeof tetelId !== "string" || tetelId.length === 0) {
      return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    }

    const siker = await csomagTetelAllapot(id, tetelId, ellenorzott.data);
    if (!siker) return hiba({ hiba: "NINCS_ILYEN_VISSZAJELZES" }, 404);

    return valasz({ visszajelzes: { ok: true } });
  } catch (h) {
    console.error("[visszajelzes/csomag/[id]] PATCH hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
