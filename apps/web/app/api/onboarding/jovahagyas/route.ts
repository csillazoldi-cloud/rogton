import { kapu } from "../../_kapu";
import type { HibaValasz } from "@rogton/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../../../hitelesites";
import { munkamenetTokenKeresbol } from "../../../../hitelesites/suti";
import { profiltJovahagy } from "../../../../onboarding/jovahagyas";

export const dynamic = "force-dynamic";

function hiba(h: HibaValasz, status: number): Response {
  return Response.json(h, { status, headers: { "cache-control": "no-store" } });
}

// POST — a piszkozat jóváhagyása: átkerül a szervezet_profilba, a piszkozat törlődik (R-06).
export async function POST(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "tulajdonos");
    if (e instanceof Response) return e;
    const { fiok, szervezet } = e;
    const eredmeny = await profiltJovahagy(szervezet.id, fiok.id);
    if (!eredmeny.ok) {
      const status = eredmeny.hiba === "NINCS_PISZKOZAT" ? 409 : 400;
      return hiba(eredmeny.mezok ? { hiba: eredmeny.hiba, mezok: eredmeny.mezok } : { hiba: eredmeny.hiba }, status);
    }
    return Response.json({ profil: eredmeny.ertek }, { headers: { "cache-control": "no-store" } });
  } catch (h) {
    console.error("Jóváhagyás POST hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
