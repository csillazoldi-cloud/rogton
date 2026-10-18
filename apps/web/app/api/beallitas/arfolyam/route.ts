import { z } from "zod";
import { kapu } from "../../_kapu";
import { hiba, valasz } from "../../tema/_kozos";
import { PENZNEMEK } from "../../../../kezdolap/tipusok";
import { arfolyamAllit, arfolyamok } from "../../../../kezdolap";

export const dynamic = "force-dynamic";

const ArfolyamBe = z.object({
  penznem: z.enum(PENZNEMEK),
  egy_usd: z.number().positive().max(1000000),
});

/** F-2 (R-1 v3): a tárolt árfolyamok olvasása (belepett). */
export async function GET(keres: Request): Promise<Response> {
  try {
    const ktx = await kapu(keres, "belepett");
    if (ktx instanceof Response) return ktx;
    const arfolyam = await arfolyamok();
    return valasz({ arfolyam });
  } catch (h) {
    console.error("Arfolyam GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}

/** F-2 (R-1 v3): egy árfolyam állítása (rendszergazda). */
export async function PUT(keres: Request): Promise<Response> {
  try {
    const ktx = await kapu(keres, "rendszergazda");
    if (ktx instanceof Response) return ktx;
    const p = ArfolyamBe.safeParse(await keres.json().catch(() => null));
    if (!p.success) return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    const arfolyam = await arfolyamAllit(p.data.penznem, p.data.egy_usd);
    return valasz({ arfolyam });
  } catch (h) {
    console.error("Arfolyam PUT hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
