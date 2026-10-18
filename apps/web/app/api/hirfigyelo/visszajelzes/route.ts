import { visszajelzesRogzit } from "@km/news-monitor-core";
import { z } from "zod";
import { belepettSzervezet, eredmenyValasz, hiba, kapu } from "../_kozos";
import { hostKontextus, kornyezet } from "../../../../hirfigyelo";

export const dynamic = "force-dynamic";

const visszajelzesSchema = z.object({
  talalat_id: z.string().min(1),
  fajta: z.enum(["fontos", "nem_relevans"]),
  okok: z.array(z.enum(["masik_ceg", "nem_ez_a_tema", "tul_altalanos", "ismetlodo"])).max(4).default([]),
  sajat_indok: z.string().trim().max(300).default(""),
});

export async function POST(keres: Request): Promise<Response> {
  try {
    const eredmeny = await kapu(keres, "szerkeszto");
    if (eredmeny instanceof Response) return eredmeny;
    const ktx = hostKontextus(eredmeny.fiok, eredmeny.szervezet.id);
    if (!ktx) return hiba({ hiba: "NINCS_JOG" }, 403);
    const be = await keres.json().catch(() => null);
    const ell = visszajelzesSchema.safeParse(be);
    if (!ell.success) return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    const k = await kornyezet(eredmeny.szervezet.id);
    const visszajelzes = {
      id: crypto.randomUUID(),
      ...ell.data,
      letrehozva: new Date().toISOString(),
    };
    return eredmenyValasz(await visszajelzesRogzit(k, ktx, visszajelzes));
  } catch (h) {
    console.error("Hirfigyelo visszajelzes POST hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
