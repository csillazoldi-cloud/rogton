import { kapu } from "../../_kapu";
import { kepValtozatMent } from "../../../../vizual/helyzet";
import { hibaValasz } from "../_kozos";

export const dynamic = "force-dynamic";

// POST {valtozat} — VZ-3: a munkatér megjegyzi a legutóbb választott színváltozatot (a következő kép és a kártyák alapja).
export async function POST(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const torzs = ((await keres.json().catch(() => null)) ?? {}) as Record<string, unknown>;
    await kepValtozatMent(e.szervezet.id, torzs["valtozat"]);
    return Response.json({ ok: true }, { headers: { "cache-control": "no-store" } });
  } catch (h) {
    return hibaValasz(h, "valtozat");
  }
}
