import { belepettSzervezet, hiba, kapu, valasz } from "../../../_kozos";
import { hostKontextus } from "../../../../../../hirfigyelo";
import { sorTetel } from "../../../../../../hirfigyelo/sor";

export const dynamic = "force-dynamic";

export async function GET(keres: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const { id } = await params;
    const eredmeny = await kapu(keres, "tag");
    if (eredmeny instanceof Response) return eredmeny;
    const ktx = hostKontextus(eredmeny.fiok, eredmeny.szervezet.id);
    if (!ktx) return hiba({ hiba: "NINCS_JOG" }, 403);
    const sor = await sorTetel(id);
    if (!sor || sor.szervezetId !== eredmeny.szervezet.id) return hiba({ hiba: "NINCS_ILYEN_SOR" }, 404);
    return valasz({ hirfigyelo: { sor } });
  } catch (h) {
    console.error("Hirfigyelo futas sor GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
