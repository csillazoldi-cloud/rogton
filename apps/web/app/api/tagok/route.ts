import { kapu } from "../_kapu";
import { hiba, valasz } from "../tema/_kozos";
import { hozzaferesKornyezet, szerepFordit } from "../../../hozzaferes";
import { tagokLista } from "@km/hozzaferes-core";

export const dynamic = "force-dynamic";

export async function GET(keres: Request): Promise<Response> {
  try {
    const ktx = await kapu(keres, "tag");
    if (ktx instanceof Response) return ktx;
    const k = hozzaferesKornyezet();
    const e = await tagokLista(k, {
      fiok_id: ktx.fiok.id,
      szervezet_id: ktx.szervezet.id,
      szerep: szerepFordit(ktx.szerep),
    });
    if (!e.ok) return hiba({ hiba: e.hiba }, 403);
    return valasz({ hozzaferes: e.ertek });
  } catch (h) {
    console.error("Tagok GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
