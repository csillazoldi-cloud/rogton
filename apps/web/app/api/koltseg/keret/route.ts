import { kapu } from "../../_kapu";
import { z } from "zod";
import { belepettSzervezet, hiba, valasz } from "../../hirfigyelo/_kozos";
import { gazdaNezet, honapVagyMost, keretetAllit } from "../../../../koltseg";

export const dynamic = "force-dynamic";

const keretSchema = z.object({
  keretek: z.array(z.object({
    szervezet_id: z.string().uuid(),
    keret_usd: z.number().min(0).max(100000).nullable(),
  })).min(1).max(200),
});

/** A szervezetek havi keretének beállítása (E-39) — csak rendszergazdának. */
export async function PUT(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "rendszergazda");
    if (e instanceof Response) return e;
    if (!e.fiok.rendszergazda) return hiba({ hiba: "NINCS_JOG" }, 403);
    const be = await keres.json().catch(() => null);
    const ell = keretSchema.safeParse(be);
    if (!ell.success) return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    for (const k of ell.data.keretek) await keretetAllit(k.szervezet_id, k.keret_usd);
    return valasz({ koltseg: await gazdaNezet(honapVagyMost(null)) });
  } catch (h) {
    console.error("Koltseg keret PUT hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
