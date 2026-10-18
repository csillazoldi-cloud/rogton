import { talalatJelol } from "@km/news-monitor-core";
import { z } from "zod";
import { belepettSzervezet, eredmenyValasz, hiba, kapu } from "../../../_kozos";
import { hostKontextus, kornyezet } from "../../../../../../hirfigyelo";

export const dynamic = "force-dynamic";

const jelolSchema = z.object({
  jeloles: z.enum(["nincs", "mentett", "elrejtett"]),
});

export async function POST(keres: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const { id } = await ctx.params;
    const eredmeny = await kapu(keres, "szerkeszto");
    if (eredmeny instanceof Response) return eredmeny;
    const ktx = hostKontextus(eredmeny.fiok, eredmeny.szervezet.id);
    if (!ktx) return hiba({ hiba: "NINCS_JOG" }, 403);
    const be = await keres.json().catch(() => null);
    const ell = jelolSchema.safeParse(be);
    if (!ell.success) return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    const k = await kornyezet(eredmeny.szervezet.id);
    return eredmenyValasz(await talalatJelol(k, ktx, id, ell.data.jeloles));
  } catch (h) {
    console.error("Hirfigyelo talalat jelol POST hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
