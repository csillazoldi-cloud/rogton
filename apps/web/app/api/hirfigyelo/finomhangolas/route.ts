import { finomhangolas } from "@km/news-monitor-core";
import { belepettSzervezet, eredmenyValasz, hiba, kapu } from "../_kozos";
import { hostKontextus, kornyezet } from "../../../../hirfigyelo";

export const dynamic = "force-dynamic";

/** A Finomhangolás lap adata (E-26): minta + tételek, visszajelzések, javaslatok, verziók. */
export async function GET(keres: Request): Promise<Response> {
  try {
    const eredmeny = await kapu(keres, "tag");
    if (eredmeny instanceof Response) return eredmeny;
    const ktx = hostKontextus(eredmeny.fiok, eredmeny.szervezet.id);
    if (!ktx) return hiba({ hiba: "NINCS_JOG" }, 403);
    const k = await kornyezet(eredmeny.szervezet.id, undefined, eredmeny.fiok.id); // R-13: a néző szűrő-beállításával
    return eredmenyValasz(await finomhangolas(k, ktx));
  } catch (h) {
    console.error("Hirfigyelo finomhangolas GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
