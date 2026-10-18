import { kapu } from "../../_kapu";
import { NextResponse } from "next/server";
import { aktualisFiok, aktualisSzervezet } from "../../../../hitelesites";
import { munkamenetTokenKeresbol } from "../../../../hitelesites/suti";
import { piszkozatBetolt, piszkozatMent } from "../../../../onboarding/piszkozat";

export const dynamic = "force-dynamic";

function hibavalasz(hiba: string, status: number, mezok?: Record<string, string>): NextResponse {
  return NextResponse.json({ hiba, ...(mezok ? { mezok } : {}) }, { status, headers: { "cache-control": "no-store" } });
}

export async function GET(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "tag");
    if (e instanceof Response) return e;
    const { fiok, szervezet } = e;
    const valasz = await piszkozatBetolt(szervezet.id);
    return NextResponse.json(valasz, { headers: { "cache-control": "no-store" } });
  } catch (hiba) {
    console.error("Piszkozat GET hiba:", hiba);
    return hibavalasz("BELSO_HIBA", 500);
  }
}

export async function PUT(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const { fiok, szervezet } = e;
    const torzs = await keres.json().catch(() => null);
    if (torzs === null) return hibavalasz("ERVENYTELEN_ADAT", 400);
    const eredmeny = await piszkozatMent(szervezet.id, torzs);
    if (!eredmeny.ok) return hibavalasz("ERVENYTELEN_ADAT", 400, eredmeny.mezok);
    return NextResponse.json(eredmeny.ertek, { headers: { "cache-control": "no-store" } });
  } catch (hiba) {
    console.error("Piszkozat PUT hiba:", hiba);
    return hibavalasz("BELSO_HIBA", 500);
  }
}
