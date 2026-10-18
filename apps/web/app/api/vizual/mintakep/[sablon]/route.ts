import { kapu } from "../../../_kapu";
import { mintakep } from "../../../../../vizual";
import { hibaValasz } from "../../_kozos";

export const dynamic = "force-dynamic";

// GET — egy sablon mintaképe (PNG). Az 1. körben minden munkatérnek ugyanaz (próba-arculat), ezért gyorsítható.
export async function GET(keres: Request, { params }: { params: Promise<{ sablon: string }> }): Promise<Response> {
  try {
    const e = await kapu(keres, "tag");
    if (e instanceof Response) return e;
    const { sablon } = await params;
    return new Response(await mintakep(sablon), { headers: { "content-type": "image/png", "cache-control": "private, max-age=3600" } });
  } catch (h) {
    return hibaValasz(h, "mintakep");
  }
}
