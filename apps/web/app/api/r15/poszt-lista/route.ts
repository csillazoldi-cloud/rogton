import { kapu } from "../../_kapu";
import { r15PosztLista } from "../../../../r15";

export const dynamic = "force-dynamic";

// R-15 · 08c 6. „Melyik poszthoz tegyük?” — a posztok listája (Vár rád · Kész) a Képek lapnak.
export async function GET(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "tag");
    if (e instanceof Response) return e;
    const { lista } = await r15PosztLista(e.szervezet.id);
    return Response.json({ lista }, { headers: { "cache-control": "no-store" } });
  } catch (h) {
    console.error("R15 poszt-lista hiba:", h);
    return Response.json({ hiba: "BELSO_HIBA" }, { status: 500 });
  }
}
