import { kapu } from "../../_kapu";
import type { HibaValasz } from "@rogton/contracts";
import { iranytuJovahagy } from "../../../../iranytu";

export const dynamic = "force-dynamic";

function hiba(h: HibaValasz, status: number): Response {
  return Response.json(h, { status, headers: { "cache-control": "no-store" } });
}

// POST — a tervezet jóváhagyása (csak a tulajdonos). Új verziót hoz létre.
export async function POST(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "tulajdonos");
    if (e instanceof Response) return e;
    const { fiok, szervezet } = e;

    const be = await keres.json().catch(() => null);
    const eredmeny = await iranytuJovahagy(szervezet.id, be, fiok.id, fiok.nev);
    if (!eredmeny.ok) {
      if (eredmeny.hiba === "ERVENYTELEN_ADAT") {
        return Response.json({ hiba: "ERVENYTELEN_ADAT", mezok: eredmeny.mezok }, { status: 400, headers: { "cache-control": "no-store" } });
      }
      return hiba({ hiba: "BELSO_HIBA" }, 500);
    }
    return Response.json({ allapot: eredmeny.ertek }, { headers: { "cache-control": "no-store" } });
  } catch (h) {
    console.error("Iránytű jóváhagyás hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
