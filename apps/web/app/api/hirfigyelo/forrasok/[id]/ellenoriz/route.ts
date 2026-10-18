import { forrasEllenoriz } from "@km/news-monitor-core";
import { belepettSzervezet, eredmenyValasz, hiba, kapu } from "../../../_kozos";
import { hostKontextus, kornyezet } from "../../../../../../hirfigyelo";

export const dynamic = "force-dynamic";

export async function POST(keres: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const { id } = await ctx.params;
    const eredmeny = await kapu(keres, "szerkeszto");
    if (eredmeny instanceof Response) return eredmeny;
    const ktx = hostKontextus(eredmeny.fiok, eredmeny.szervezet.id);
    if (!ktx) return hiba({ hiba: "NINCS_JOG" }, 403);
    const k = await kornyezet(eredmeny.szervezet.id);
    return eredmenyValasz(await forrasEllenoriz(k, ktx, id));
  } catch (h) {
    console.error("Hirfigyelo forras ellenoriz POST hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
