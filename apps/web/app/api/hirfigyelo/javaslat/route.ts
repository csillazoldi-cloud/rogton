import { javaslatKer } from "@km/news-monitor-core";
import { belepettSzervezet, eredmenyValasz, hiba, kapu } from "../_kozos";
import { hostKontextus, kornyezet } from "../../../../hirfigyelo";

export const dynamic = "force-dynamic";

export async function POST(keres: Request): Promise<Response> {
  try {
    const eredmeny = await kapu(keres, "szerkeszto");
    if (eredmeny instanceof Response) return eredmeny;
    const ktx = hostKontextus(eredmeny.fiok, eredmeny.szervezet.id);
    if (!ktx) return hiba({ hiba: "NINCS_JOG" }, 403);
    const k = await kornyezet(eredmeny.szervezet.id, undefined, eredmeny.fiok.id, { fizeto: eredmeny.fiok.id }); // R-13: a kérő kreditjéből
    return eredmenyValasz(await javaslatKer(k, ktx));
  } catch (h) {
    console.error("Hirfigyelo javaslat POST hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
