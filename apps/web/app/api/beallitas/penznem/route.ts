import { z } from "zod";
import { kapu } from "../../_kapu";
import { hiba, valasz } from "../../tema/_kozos";
import { PENZNEMEK } from "../../../../kezdolap/tipusok";
import { penznemAllit } from "../../../../kezdolap";

export const dynamic = "force-dynamic";

const PenznemBe = z.object({ penznem: z.enum(PENZNEMEK) });

/** F-2 (R-1 v3): a munkatér pénznemének beállítása (tulajdonos). */
export async function PUT(keres: Request): Promise<Response> {
  try {
    const ktx = await kapu(keres, "tulajdonos");
    if (ktx instanceof Response) return ktx;
    const p = PenznemBe.safeParse(await keres.json().catch(() => null));
    if (!p.success) return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    await penznemAllit(ktx.szervezet.id, p.data.penznem);
    return valasz({ penznem: p.data.penznem });
  } catch (h) {
    console.error("Penznem PUT hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
