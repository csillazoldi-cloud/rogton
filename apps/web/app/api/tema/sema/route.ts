import { eredmenyValasz, hiba, kapu, tulajdonos } from "../_kozos";
import { szervezetSemaValt } from "../../../../tema";

export const dynamic = "force-dynamic";

export async function PUT(keres: Request): Promise<Response> {
  try {
    const eredmeny = await kapu(keres, "tulajdonos");
    if (eredmeny instanceof Response) return eredmeny;
    if (!tulajdonos(eredmeny.fiok, eredmeny.szervezet.id)) return hiba({ hiba: "NINCS_JOG" }, 403);
    const torzs = await keres.json().catch(() => null);
    return eredmenyValasz(await szervezetSemaValt(eredmeny.szervezet.id, torzs));
  } catch (h) {
    console.error("Tema sema PUT hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
