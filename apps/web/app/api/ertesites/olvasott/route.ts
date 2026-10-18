import { kapu } from "../../_kapu";
import { hiba, valasz } from "../../tema/_kozos";
import { ertesitesLista, mindOlvasott, olvasottJelol } from "../../../../ertesites";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(keres: Request): Promise<Response> {
  try {
    const ktx = await kapu(keres, "tag");
    if (ktx instanceof Response) return ktx;
    const torzs = (await keres.json().catch(() => null)) as
      | { mind?: unknown; esemeny_id?: unknown }
      | null;
    if (!torzs || typeof torzs !== "object") return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);

    if (torzs.mind === true) {
      await mindOlvasott(ktx.fiok.id);
    } else if (typeof torzs.esemeny_id === "string" && UUID_RE.test(torzs.esemeny_id)) {
      await olvasottJelol(ktx.fiok.id, torzs.esemeny_id);
    } else {
      return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    }

    const lista = await ertesitesLista(ktx.fiok);
    return valasz({ lista });
  } catch (h) {
    console.error("Ertesites olvasott POST hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
