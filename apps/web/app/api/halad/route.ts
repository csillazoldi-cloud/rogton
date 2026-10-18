import { z } from "zod";
import { kapu } from "../_kapu";
import { hetiHalad, kepLetoltesFeljegyez } from "../../../halad";

export const dynamic = "force-dynamic";

// GET — a heti haladás számlálója. A tag is láthatja.
export async function GET(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "tag");
    if (e instanceof Response) return e;
    return Response.json({ halad: await hetiHalad(e.szervezet.id) }, { headers: { "cache-control": "no-store" } });
  } catch (h) {
    console.error("halad GET hiba:", h instanceof Error ? h.message : h);
    return Response.json({ hiba: "BELSO_HIBA" }, { status: 500, headers: { "cache-control": "no-store" } });
  }
}

const Torzs = z.object({ fajta: z.literal("kep_letoltve") });

// POST — egy kép letöltésének feljegyzése. Csak szerkesztő.
export async function POST(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const nyers = await keres.json().catch(() => null);
    const t = Torzs.safeParse(nyers);
    if (!t.success) {
      return Response.json({ hiba: "ERVENYTELEN_ADAT" }, { status: 400, headers: { "cache-control": "no-store" } });
    }
    await kepLetoltesFeljegyez(e.szervezet.id);
    return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
  } catch (h) {
    console.error("halad POST hiba:", h instanceof Error ? h.message : h);
    return Response.json({ hiba: "BELSO_HIBA" }, { status: 500, headers: { "cache-control": "no-store" } });
  }
}
