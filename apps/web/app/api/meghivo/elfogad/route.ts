import { z } from "zod";
import { kapu } from "../../_kapu";
import { hiba, valasz } from "../../tema/_kozos";
import { hozzaferesKornyezet } from "../../../../hozzaferes";
import { meghivoElfogad } from "@km/hozzaferes-core";

export const dynamic = "force-dynamic";

const ElfogadBe = z.object({ jegy: z.string().min(1) });

export async function POST(keres: Request): Promise<Response> {
  try {
    const ktx = await kapu(keres, "belepett");
    if (ktx instanceof Response) return ktx;
    const nyers = await keres.json().catch(() => null);
    const p = ElfogadBe.safeParse(nyers);
    if (!p.success) return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    const k = hozzaferesKornyezet();
    const e = await meghivoElfogad(k, { fiok_id: ktx.fiok.id }, p.data.jegy);
    if (!e.ok) {
      switch (e.hiba) {
        case "NINCS_ILYEN_MEGHIVO":
          return hiba({ hiba: e.hiba }, 404);
        case "MAR_TAG":
          return hiba({ hiba: e.hiba }, 409);
        case "MEGHIVO_LEJART":
        case "MEGHIVO_FELHASZNALVA":
        case "MEGHIVO_VISSZAVONVA":
          return hiba({ hiba: e.hiba }, 410);
        case "ERVENYTELEN_ADAT":
          return hiba({ hiba: e.hiba }, 400);
        default:
          return hiba({ hiba: e.hiba }, 500);
      }
    }
    return valasz({ hozzaferes: e.ertek });
  } catch (h) {
    console.error("Meghivo elfogad hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
