// F-8.1 k (T-33, audit 12.) — a forrássor „Cím módosítása" és „Eltávolítás" gombjának gépezete.
// A gomb az R-7b rajz után épül.
import { forrasCimModosit, forrasTorol } from "@rogton/news-monitor-core";
import { z } from "zod";
import { eredmenyValasz, hiba, kapu } from "../../_kozos";
import { hostKontextus, kornyezet } from "../../../../../hirfigyelo";

export const dynamic = "force-dynamic";

const forrasCimModositSchema = z.object({ cim: z.string().min(1) });

export async function PUT(keres: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const { id } = await ctx.params;
    const eredmeny = await kapu(keres, "szerkeszto");
    if (eredmeny instanceof Response) return eredmeny;

    let torzs: unknown;
    try {
      torzs = await keres.json();
    } catch {
      return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    }
    const parsed = forrasCimModositSchema.safeParse(torzs);
    if (!parsed.success) return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);

    const ktx = hostKontextus(eredmeny.fiok, eredmeny.szervezet.id);
    if (!ktx) return hiba({ hiba: "NINCS_JOG" }, 403);
    const k = await kornyezet(eredmeny.szervezet.id);
    return eredmenyValasz(await forrasCimModosit(k, ktx, id, parsed.data.cim));
  } catch (h) {
    console.error("Hirfigyelo forras cim modosit PUT hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}

export async function DELETE(keres: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const { id } = await ctx.params;
    const eredmeny = await kapu(keres, "szerkeszto");
    if (eredmeny instanceof Response) return eredmeny;
    const ktx = hostKontextus(eredmeny.fiok, eredmeny.szervezet.id);
    if (!ktx) return hiba({ hiba: "NINCS_JOG" }, 403);
    const k = await kornyezet(eredmeny.szervezet.id);
    return eredmenyValasz(await forrasTorol(k, ktx, id));
  } catch (h) {
    console.error("Hirfigyelo forras torol DELETE hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
