import { kapu } from "../_kapu";
import type { HibaValasz } from "@rogton/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../../hitelesites";
import { munkamenetTokenKeresbol } from "../../../hitelesites/suti";
import { profilBetolt, profilModosit } from "../../../profil";

export const dynamic = "force-dynamic";

function hiba(h: HibaValasz, status: number): Response {
  return Response.json(h, { status, headers: { "cache-control": "no-store" } });
}

// GET — a szervezet jóváhagyott profilja (R-06). Lehet null, ha még nincs jóváhagyva.
export async function GET(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "tag");
    if (e instanceof Response) return e;
    const { fiok, szervezet } = e;
    const profil = await profilBetolt(szervezet.id);
    return Response.json({ profil }, { headers: { "cache-control": "no-store" } });
  } catch (h) {
    console.error("Profil GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}

// PUT — a szervezet jóváhagyott profiljának módosítása a fiókoldalon (E-10).
export async function PUT(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "tulajdonos");
    if (e instanceof Response) return e;
    const { fiok, szervezet } = e;

    const be = await keres.json().catch(() => null);
    const eredmeny = await profilModosit(szervezet.id, be);
    if (!eredmeny.ok) {
      if (eredmeny.hiba === "NINCS_JOG") return hiba({ hiba: "NINCS_JOG" }, 409);
      // R-16 K1 (TERV 1.7 R2): a beküldött arculat régebbi a tároltnál — a régi doboz a nem-200-at hibaállapotba teszi (újratöltés)
      if (eredmeny.hiba === "ELAVULT_ADAT") return hiba({ hiba: "ELAVULT_ADAT" }, 409);
      if (eredmeny.hiba === "ERVENYTELEN_ADAT") {
        return Response.json({ hiba: "ERVENYTELEN_ADAT", mezok: eredmeny.mezok }, { status: 400, headers: { "cache-control": "no-store" } });
      }
      return hiba({ hiba: "BELSO_HIBA" }, 500);
    }
    return Response.json({ profil: eredmeny.ertek }, { headers: { "cache-control": "no-store" } });
  } catch (h) {
    console.error("Profil PUT hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
