import { kapu } from "../../../_kapu";
import { kinalatotOlvas } from "../../../../../onboarding/kinalat";

export const dynamic = "force-dynamic";

// R-18 7. kör · 1. lépés: a honlap kínálata (+ a honlapon talált közösségi oldal). Jóváhagyott profil nélkül 409.
export async function POST(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const ki = await kinalatotOlvas({ szervezetId: e.szervezet.id, fiokId: e.fiok.id });
    if (!ki) return Response.json({ hiba: "NINCS_PROFIL" }, { status: 409 });
    return Response.json(ki, { headers: { "cache-control": "no-store" } });
  } catch (h) {
    console.error("Kínálat olvasás hiba:", h);
    return Response.json({ hiba: "BELSO_HIBA" }, { status: 500 });
  }
}
