// R-13 (2026-09-22): a rendszergazda egy munkatér havi kreditjét állítja (null = az alap).
import { z } from "zod";
import { kapu } from "../../../_kapu";
import { munkaterKreditAllit } from "../../../../../kredit";
import { hiba, valasz } from "../../_kozos";

export const dynamic = "force-dynamic";

const Bemenet = z.object({ havi: z.number().int().min(0).max(10_000_000).nullable() });

export async function PUT(keres: Request, ctx: { params: Promise<{ szervezetId: string }> }): Promise<Response> {
  try {
    const { szervezetId } = await ctx.params;
    const e = await kapu(keres, "rendszergazda");
    if (e instanceof Response) return e;
    if (!e.fiok.rendszergazda) return hiba({ hiba: "NINCS_JOG" }, 403);
    if (!z.string().uuid().safeParse(szervezetId).success) return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    const be = Bemenet.safeParse(await keres.json().catch(() => null));
    if (!be.success) return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    await munkaterKreditAllit(szervezetId, be.data.havi);
    return valasz({ kredit: { szervezet_id: szervezetId, havi: be.data.havi } });
  } catch (h) {
    console.error("Kredit munkater PUT hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
