import { javaslatDont } from "@rogton/news-monitor-core";
import { z } from "zod";
import { belepettSzervezet, eredmenyValasz, hiba, kapu } from "../../../_kozos";
import { hostKontextus, kornyezet } from "../../../../../../hirfigyelo";

export const dynamic = "force-dynamic";

const dontesSchema = z.object({
  dontes: z.enum(["elfogad", "elvet"]),
});

export async function POST(keres: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const { id } = await ctx.params;
    const eredmeny = await kapu(keres, "szerkeszto");
    if (eredmeny instanceof Response) return eredmeny;
    const ktx = hostKontextus(eredmeny.fiok, eredmeny.szervezet.id);
    if (!ktx) return hiba({ hiba: "NINCS_JOG" }, 403);
    const be = await keres.json().catch(() => null);
    const ell = dontesSchema.safeParse(be);
    if (!ell.success) return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    const k = await kornyezet(eredmeny.szervezet.id);
    return eredmenyValasz(await javaslatDont(k, ktx, id, ell.data.dontes));
  } catch (h) {
    console.error("Hirfigyelo javaslat dont POST hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
