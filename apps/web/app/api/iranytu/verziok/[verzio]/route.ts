import { kapu } from "../../../_kapu";
import type { HibaValasz } from "@rogton/contracts";
import { iranytuVisszaallit } from "../../../../../iranytu";

export const dynamic = "force-dynamic";

function hiba(h: HibaValasz, status: number): Response {
  return Response.json(h, { status, headers: { "cache-control": "no-store" } });
}

// POST — egy korábbi verzió visszaállítása TERVEZETKÉNT (csak a tulajdonos).
export async function POST(keres: Request, kontextus: { params: Promise<{ verzio: string }> }): Promise<Response> {
  try {
    const e = await kapu(keres, "tulajdonos");
    if (e instanceof Response) return e;
    const { szervezet } = e;

    const { verzio } = await kontextus.params;
    const szam = Number(verzio);
    if (!Number.isInteger(szam) || szam < 1) return hiba({ hiba: "NINCS_ILYEN_VERZIO" }, 404);

    const eredmeny = await iranytuVisszaallit(szervezet.id, szam);
    if (!eredmeny.ok) {
      if (eredmeny.hiba === "NINCS_ILYEN_VERZIO") return hiba({ hiba: "NINCS_ILYEN_VERZIO" }, 404);
      return hiba({ hiba: "BELSO_HIBA" }, 500);
    }
    return Response.json({ allapot: eredmeny.ertek }, { headers: { "cache-control": "no-store" } });
  } catch (h) {
    console.error("Iránytű visszaállítás hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
