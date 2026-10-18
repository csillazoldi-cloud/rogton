import { MODULOK } from "@rogton/contracts";
import { kapu } from "../_kapu";
import { hiba, valasz } from "../tema/_kozos";
import { szervezetCsomag } from "../../../csomag";
import type { CsomagNezet } from "../../../csomag";

export const dynamic = "force-dynamic";

/** F-7a (D-F35): a munkatér csomagja és moduljai — bármely tag olvashatja. Ár és fizetés a pilotban nincs (a mezők null). */
export async function GET(keres: Request): Promise<Response> {
  try {
    const ktx = await kapu(keres, "tag");
    if (ktx instanceof Response) return ktx;
    const csomag = await szervezetCsomag(ktx.szervezet.id);
    const nezet: CsomagNezet = { csomag, modulok: MODULOK.map((m) => ({ modul: m, benne: csomag.modulok.includes(m) })) };
    return valasz(nezet);
  } catch (h) {
    console.error("Csomag GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
