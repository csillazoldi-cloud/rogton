import { belepettSzervezet, eredmenyValasz, hiba, kapu } from "../_kozos";
import { hostKontextus, kornyezet } from "../../../../hirfigyelo";
import { osszkepTarolt } from "../../../../hirfigyelo/osszkep";

export const dynamic = "force-dynamic";

export async function GET(keres: Request): Promise<Response> {
  try {
    const eredmeny = await kapu(keres, "tag");
    if (eredmeny instanceof Response) return eredmeny;
    const ktx = hostKontextus(eredmeny.fiok, eredmeny.szervezet.id);
    if (!ktx) return hiba({ hiba: "NINCS_JOG" }, 403);
    const k = await kornyezet(eredmeny.szervezet.id, undefined, eredmeny.fiok.id, { fizeto: eredmeny.fiok.id }); // R-13: a néző szemével, az ő kreditjéből
    return eredmenyValasz(await osszkepTarolt(k, ktx));
  } catch (h) {
    console.error("Hirfigyelo osszkep GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
