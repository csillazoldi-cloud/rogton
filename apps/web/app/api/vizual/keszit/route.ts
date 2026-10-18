import { kapu } from "../../_kapu";
import { keszit } from "../../../../vizual";
import { hibaValasz } from "../_kozos";

export const dynamic = "force-dynamic";

// POST {sablon, tartalom:{mezok, rovid}} — a kép elkészítése. A néző nem készít képet.
// A válasz: {kep (PNG base64), mezok, lepesek, problemak, kepalairas, jelzesek, tiltott}. Nem ír adatbázisba.
export async function POST(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const torzs = ((await keres.json().catch(() => null)) ?? {}) as Record<string, unknown>;
    return Response.json(await keszit(torzs["sablon"], torzs["tartalom"]), { headers: { "cache-control": "no-store" } });
  } catch (h) {
    return hibaValasz(h, "keszit");
  }
}
