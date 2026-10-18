import { kapu } from "../_kapu";
import type { HibaValasz } from "@km/contracts";
import { iranytuAllapot, iranytuTervezetMent, iranytuVerziok } from "../../../iranytu";

export const dynamic = "force-dynamic";

function hiba(h: HibaValasz, status: number): Response {
  return Response.json(h, { status, headers: { "cache-control": "no-store" } });
}

// GET — a szervezet iránytű-állapota (R-11). A tag is láthatja.
export async function GET(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "tag");
    if (e instanceof Response) return e;
    const { szervezet } = e;
    const allapot = await iranytuAllapot(szervezet.id);
    const verziok = await iranytuVerziok(szervezet.id);
    return Response.json({ allapot, verziok }, { headers: { "cache-control": "no-store" } });
  } catch (h) {
    console.error("Iránytű GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}

// PUT — a tervezet mentése (a szerkesztő is mentheti).
export async function PUT(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const { szervezet } = e;

    const be = await keres.json().catch(() => null);
    const eredmeny = await iranytuTervezetMent(szervezet.id, be);
    if (!eredmeny.ok) {
      if (eredmeny.hiba === "ERVENYTELEN_ADAT") {
        return Response.json({ hiba: "ERVENYTELEN_ADAT", mezok: eredmeny.mezok }, { status: 400, headers: { "cache-control": "no-store" } });
      }
      return hiba({ hiba: "BELSO_HIBA" }, 500);
    }
    return Response.json({ allapot: eredmeny.ertek }, { headers: { "cache-control": "no-store" } });
  } catch (h) {
    console.error("Iránytű PUT hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
