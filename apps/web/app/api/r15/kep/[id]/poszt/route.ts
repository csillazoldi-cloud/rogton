import { kapu } from "../../../../_kapu";
import { szerepFordit } from "../../../../../../hozzaferes";
import { kepbolPoszt } from "../../../../../../r15/kep";
import { kepHibaValasz } from "../../_hiba";

export const dynamic = "force-dynamic";

// R-15 · 08c 6. — „Új poszt ehhez a képhez”: a gép a kép szövegéből ír posztot (a 08 lap írja meg). Törzs: { szoveg }.
export async function POST(keres: Request, kontextus: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const { id } = await kontextus.params;
    const torzs = ((await keres.json().catch(() => null)) ?? {}) as { szoveg?: unknown };
    const ktx = { fiok_id: e.fiok.id, szervezet_id: e.szervezet.id, szerep: szerepFordit(e.szerep) };
    const munkaId = await kepbolPoszt(ktx, id, typeof torzs.szoveg === "string" ? torzs.szoveg : "");
    return Response.json({ munka_id: munkaId }, { headers: { "cache-control": "no-store" } });
  } catch (h) {
    return kepHibaValasz(h, "új poszt");
  }
}
