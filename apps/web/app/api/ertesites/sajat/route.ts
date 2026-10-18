import { kapu } from "../../_kapu";
import { hiba, valasz } from "../../tema/_kozos";
import { sajatBeallitas, sajatBeallitasMent } from "../../../../ertesites";

export const dynamic = "force-dynamic";

export async function GET(keres: Request): Promise<Response> {
  try {
    const ktx = await kapu(keres, "tag");
    if (ktx instanceof Response) return ktx;
    const beallitas = await sajatBeallitas(ktx.fiok.id);
    return valasz({ beallitas });
  } catch (h) {
    console.error("Ertesites sajat GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}

export async function PUT(keres: Request): Promise<Response> {
  try {
    const ktx = await kapu(keres, "tag");
    if (ktx instanceof Response) return ktx;
    const torzs = await keres.json().catch(() => null);
    const beallitas = await sajatBeallitasMent(ktx.fiok.id, torzs);
    if (beallitas === null) return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    return valasz({ beallitas });
  } catch (h) {
    console.error("Ertesites sajat PUT hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
