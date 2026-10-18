import { kapu } from "../_kapu";
import { hiba, valasz } from "../tema/_kozos";
import { gephazNezet } from "../../../kezdolap";

export const dynamic = "force-dynamic";

/** F-2 (R-1 v3): a Gépház adata. Tulajdonos vagy rendszergazda; szervezet nélkül 409, jog nélkül 403. */
export async function GET(keres: Request): Promise<Response> {
  try {
    const ktx = await kapu(keres, "belepett");
    if (ktx instanceof Response) return ktx;
    if (!ktx.szervezet) return hiba({ hiba: "NINCS_SZERVEZET" }, 409);
    const szerep = ktx.szerep ?? "nezo";
    const gephaz = await gephazNezet(ktx.fiok, ktx.szervezet, szerep);
    if (gephaz === null) return hiba({ hiba: "NINCS_JOG" }, 403);
    return valasz({ gephaz });
  } catch (h) {
    console.error("Gephaz GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
