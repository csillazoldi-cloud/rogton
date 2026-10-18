import { z } from "zod";
import { kapu } from "../../_kapu";
import { hiba, valasz } from "../../tema/_kozos";
import { hozzaferesKornyezet, szerepFordit } from "../../../../hozzaferes";
import { szerepAllit, tagEltavolit, Szerep } from "@rogton/hozzaferes-core";

export const dynamic = "force-dynamic";

const SzerepBe = z.object({ szerep: Szerep });

export async function PUT(
  keres: Request,
  ctx: { params: Promise<{ fiokId: string }> }, // Next 16: a params ígéret
): Promise<Response> {
  try {
    const { fiokId } = await ctx.params;
    const ktx = await kapu(keres, "tulajdonos");
    if (ktx instanceof Response) return ktx;
    const nyers = await keres.json().catch(() => null);
    const p = SzerepBe.safeParse(nyers);
    if (!p.success) return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    const k = hozzaferesKornyezet();
    const e = await szerepAllit(k, {
      fiok_id: ktx.fiok.id,
      szervezet_id: ktx.szervezet.id,
      szerep: szerepFordit(ktx.szerep),
    }, fiokId, p.data.szerep);
    if (!e.ok) {
      switch (e.hiba) {
        case "NINCS_JOG":
        case "NAGYOBB_SZEREP":
          return hiba({ hiba: e.hiba }, 403);
        case "UTOLSO_TULAJDONOS":
        case "MAGAT_NEM":
          return hiba({ hiba: e.hiba }, 409);
        case "NINCS_ILYEN_TAG":
          return hiba({ hiba: e.hiba }, 404);
        case "ERVENYTELEN_ADAT":
          return hiba({ hiba: e.hiba }, 400);
        default:
          return hiba({ hiba: e.hiba }, 500);
      }
    }
    return valasz({ hozzaferes: e.ertek });
  } catch (h) {
    console.error("Tag PUT hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}

export async function DELETE(
  keres: Request,
  ctx: { params: Promise<{ fiokId: string }> }, // Next 16: a params ígéret
): Promise<Response> {
  try {
    const { fiokId } = await ctx.params;
    const ktx = await kapu(keres, "tulajdonos");
    if (ktx instanceof Response) return ktx;
    const k = hozzaferesKornyezet();
    const e = await tagEltavolit(k, {
      fiok_id: ktx.fiok.id,
      szervezet_id: ktx.szervezet.id,
      szerep: szerepFordit(ktx.szerep),
    }, fiokId);
    if (!e.ok) {
      switch (e.hiba) {
        case "NINCS_JOG":
          return hiba({ hiba: e.hiba }, 403);
        case "UTOLSO_TULAJDONOS":
        case "MAGAT_NEM":
          return hiba({ hiba: e.hiba }, 409);
        case "NINCS_ILYEN_TAG":
          return hiba({ hiba: e.hiba }, 404);
        default:
          return hiba({ hiba: e.hiba }, 500);
      }
    }
    return valasz({ hozzaferes: e.ertek });
  } catch (h) {
    console.error("Tag DELETE hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
