import { kapu } from "../../../../_kapu";
import { szerepFordit } from "../../../../../../hozzaferes";
import { posztKepAllit } from "../../../../../../r15/kep";
import { kepHibaValasz } from "../../../kep/_hiba";

export const dynamic = "force-dynamic";

// R-15 · 08c — a poszt képe: { kep_id: "<id>" } csere / hozzáadás, { kep_id: null } „Kép nélkül” (a kép megmarad). Az állapot nem változik.
export async function PUT(keres: Request, kontextus: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const { id } = await kontextus.params;
    const torzs = ((await keres.json().catch(() => null)) ?? {}) as { kep_id?: unknown };
    const kepId = typeof torzs.kep_id === "string" && torzs.kep_id ? torzs.kep_id : null;
    const ktx = { fiok_id: e.fiok.id, szervezet_id: e.szervezet.id, szerep: szerepFordit(e.szerep) };
    await posztKepAllit(ktx, id, kepId);
    return Response.json({ ok: true }, { headers: { "cache-control": "no-store" } });
  } catch (h) {
    return kepHibaValasz(h, "poszt képe");
  }
}
