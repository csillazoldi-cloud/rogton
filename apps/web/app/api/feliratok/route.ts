import { belepettSzervezet, eredmenyValasz, hiba, kapu, tulajdonos, valasz } from "./_kozos";
import { szervezetAllapot, szervezetTervezetElvet, szervezetTervezetMent } from "../../../szovegek";

export const dynamic = "force-dynamic";

export async function GET(keres: Request): Promise<Response> {
  try {
    const eredmeny = await kapu(keres, "tag");
    if (eredmeny instanceof Response) return eredmeny;
    const feliratok = await szervezetAllapot(eredmeny.szervezet.id);
    return valasz({ feliratok });
  } catch (h) {
    console.error("Feliratok GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}

export async function PUT(keres: Request): Promise<Response> {
  try {
    const eredmeny = await kapu(keres, "tulajdonos");
    if (eredmeny instanceof Response) return eredmeny;
    if (!tulajdonos(eredmeny.fiok, eredmeny.szervezet.id)) return hiba({ hiba: "NINCS_JOG" }, 403);
    const be = await keres.json().catch(() => null);
    return eredmenyValasz(await szervezetTervezetMent(eredmeny.szervezet.id, be));
  } catch (h) {
    console.error("Feliratok PUT hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}

export async function DELETE(keres: Request): Promise<Response> {
  try {
    const eredmeny = await kapu(keres, "tulajdonos");
    if (eredmeny instanceof Response) return eredmeny;
    if (!tulajdonos(eredmeny.fiok, eredmeny.szervezet.id)) return hiba({ hiba: "NINCS_JOG" }, 403);
    return eredmenyValasz(await szervezetTervezetElvet(eredmeny.szervezet.id));
  } catch (h) {
    console.error("Feliratok DELETE hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
