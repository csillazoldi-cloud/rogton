import { kapu } from "../../../_kapu";
import { hiba, valasz } from "../../../tema/_kozos";
import { hozzaferesKornyezet, szerepFordit } from "../../../../../hozzaferes";
import { meghivoVisszavon } from "@km/hozzaferes-core";

export const dynamic = "force-dynamic";

export async function DELETE(
  keres: Request,
  ctx: { params: Promise<{ id: string }> }, // Next 16: a params ígéret
): Promise<Response> {
  try {
    const { id } = await ctx.params;
    const ktx = await kapu(keres, "szerkeszto");
    if (ktx instanceof Response) return ktx;
    const k = hozzaferesKornyezet();
    const e = await meghivoVisszavon(k, {
      fiok_id: ktx.fiok.id,
      szervezet_id: ktx.szervezet.id,
      szerep: szerepFordit(ktx.szerep),
    }, id);
    if (!e.ok) {
      switch (e.hiba) {
        case "NINCS_JOG":
          return hiba({ hiba: e.hiba }, 403);
        case "NINCS_ILYEN_MEGHIVO":
          return hiba({ hiba: e.hiba }, 404);
        case "MEGHIVO_LEJART":
        case "MEGHIVO_FELHASZNALVA":
        case "MEGHIVO_VISSZAVONVA":
          return hiba({ hiba: e.hiba }, 410);
        default:
          return hiba({ hiba: e.hiba }, 500);
      }
    }
    return valasz({ hozzaferes: e.ertek });
  } catch (h) {
    console.error("Meghivo DELETE hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
