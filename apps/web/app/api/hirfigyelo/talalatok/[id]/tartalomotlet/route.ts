import { tartalomotletKer } from "@km/news-monitor-core";
import { belepettSzervezet, eredmenyValasz, hiba, kapu, valasz } from "../../../_kozos";
import { hostKontextus, kornyezet } from "../../../../../../hirfigyelo";

export const dynamic = "force-dynamic";

export async function POST(keres: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const { id } = await ctx.params;
    const eredmeny = await kapu(keres, "szerkeszto");
    if (eredmeny instanceof Response) return eredmeny;
    const ktx = hostKontextus(eredmeny.fiok, eredmeny.szervezet.id);
    if (!ktx) return hiba({ hiba: "NINCS_JOG" }, 403);
    const k = await kornyezet(eredmeny.szervezet.id, undefined, eredmeny.fiok.id, { fizeto: eredmeny.fiok.id }); // R-13: a kérő kreditjéből
    return eredmenyValasz(await tartalomotletKer(k, ktx, id));
  } catch (h) {
    console.error("Hirfigyelo talalat tartalomotlet POST hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}

export async function GET(keres: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const { id } = await ctx.params;
    const eredmeny = await kapu(keres, "tag");
    if (eredmeny instanceof Response) return eredmeny;
    const ktx = hostKontextus(eredmeny.fiok, eredmeny.szervezet.id);
    if (!ktx) return hiba({ hiba: "NINCS_JOG" }, 403);
    const k = await kornyezet(eredmeny.szervezet.id, undefined, eredmeny.fiok.id, { fizeto: eredmeny.fiok.id }); // R-13: a kérő kreditjéből
    const talalatok = await k.tar.talalatok(eredmeny.szervezet.id);
    const talalat = talalatok.find((t) => t.id === id);
    if (!talalat) return hiba({ hiba: "NINCS_ILYEN_TALALAT" }, 404);
    return valasz({ hirfigyelo: { talalat } });
  } catch (h) {
    console.error("Hirfigyelo talalat tartalomotlet GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
