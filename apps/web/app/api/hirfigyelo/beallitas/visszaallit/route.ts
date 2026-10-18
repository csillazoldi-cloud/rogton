import { z } from "zod";
import { verzioVisszaallit } from "@km/news-monitor-core";
import { belepettSzervezet, eredmenyValasz, hiba, kapu, valasz } from "../../_kozos";
import { hostKontextus, kornyezet } from "../../../../../hirfigyelo";

export const dynamic = "force-dynamic";

const Keres = z.object({ verzio: z.number().int().positive() });

export async function POST(keres: Request): Promise<Response> {
  try {
    const eredmeny = await kapu(keres, "szerkeszto");
    if (eredmeny instanceof Response) return eredmeny;
    const ktx = hostKontextus(eredmeny.fiok, eredmeny.szervezet.id);
    if (!ktx) return hiba({ hiba: "NINCS_JOG" }, 403);
    const be = await keres.json().catch(() => null);
    const e = Keres.safeParse(be);
    if (!e.success) return valasz({ hiba: "ERVENYTELEN_ADAT", hibak: e.error.issues }, 400);
    const k = await kornyezet(eredmeny.szervezet.id);
    return eredmenyValasz(await verzioVisszaallit(k, ktx, e.data.verzio));
  } catch (h) {
    console.error("Hirfigyelo visszaallit POST hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
