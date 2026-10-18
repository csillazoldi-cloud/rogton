import { belepettSzervezet, eredmenyValasz, hiba, kapu, tulajdonos, valasz } from "./_kozos";
import { szervezetTemaAllapot, szervezetTervezetElvet, szervezetTervezetMent } from "../../../tema";

export const dynamic = "force-dynamic";

export async function GET(keres: Request): Promise<Response> {
  try {
    const eredmeny = await kapu(keres, "tag");
    if (eredmeny instanceof Response) return eredmeny;
    const tema = await szervezetTemaAllapot(eredmeny.szervezet.id);
    return valasz({ tema });
  } catch (h) {
    console.error("Tema GET hiba:", h);
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
    console.error("Tema PUT hiba:", h);
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
    console.error("Tema DELETE hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
