import { belepettSzervezet, eredmenyValasz, hiba, kapu, tulajdonos } from "../_kozos";
import { szervezetAlkalmaz } from "../../../../szovegek";

export const dynamic = "force-dynamic";

export async function POST(keres: Request): Promise<Response> {
  try {
    const eredmeny = await kapu(keres, "tulajdonos");
    if (eredmeny instanceof Response) return eredmeny;
    if (!tulajdonos(eredmeny.fiok, eredmeny.szervezet.id)) return hiba({ hiba: "NINCS_JOG" }, 403);
    return eredmenyValasz(await szervezetAlkalmaz(eredmeny.szervezet.id));
  } catch (h) {
    console.error("Feliratok alkalmaz POST hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
