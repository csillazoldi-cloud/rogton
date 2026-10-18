import { belepettSzervezet, eredmenyValasz, hiba, kapu, tulajdonos } from "../_kozos";
import { szervezetVisszaallit } from "../../../../tema";

export const dynamic = "force-dynamic";

export async function POST(keres: Request): Promise<Response> {
  try {
    const eredmeny = await kapu(keres, "tulajdonos");
    if (eredmeny instanceof Response) return eredmeny;
    if (!tulajdonos(eredmeny.fiok, eredmeny.szervezet.id)) return hiba({ hiba: "NINCS_JOG" }, 403);
    const be = await keres.json().catch(() => null);
    return eredmenyValasz(await szervezetVisszaallit(eredmeny.szervezet.id, be));
  } catch (h) {
    console.error("Tema visszaallit POST hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
