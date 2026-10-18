// R-13 (2026-09-22): a tulajdonos egy tag havi kreditjét adja meg (szám), vagy visszaállítja „egyenlő részre” (null).
import { z } from "zod";
import { kapu } from "../../../_kapu";
import { tagKreditAllit } from "../../../../../kredit";
import { hiba, valasz } from "../../_kozos";

export const dynamic = "force-dynamic";

const Bemenet = z.object({ havi: z.number().min(0).max(1_000_000).nullable() });

export async function PUT(keres: Request, ctx: { params: Promise<{ fiokId: string }> }): Promise<Response> {
  try {
    const { fiokId } = await ctx.params;
    const e = await kapu(keres, "tulajdonos");
    if (e instanceof Response) return e;
    if (!z.string().uuid().safeParse(fiokId).success) return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    const be = Bemenet.safeParse(await keres.json().catch(() => null));
    if (!be.success) return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    const ok = await tagKreditAllit(e.szervezet.id, fiokId, be.data.havi);
    if (!ok) return hiba({ hiba: "NINCS_ILYEN_TAG" }, 404);
    return valasz({ kredit: { fiok_id: fiokId, havi: be.data.havi } });
  } catch (h) {
    console.error("Kredit tag PUT hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
