import { kapu } from "../../_kapu";
import { sablonLista } from "../../../../vizual/sablonok";
import { hibaValasz } from "../_kozos";

export const dynamic = "force-dynamic";

// GET — a sablonok a szerkesztő űrlapjához (a munkatér saját adataiból, nem a képgyártóból). A tag is láthatja.
export async function GET(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "tag");
    if (e instanceof Response) return e;
    return Response.json({ sablonok: sablonLista() }, { headers: { "cache-control": "no-store" } });
  } catch (h) {
    return hibaValasz(h, "sablonok");
  }
}
