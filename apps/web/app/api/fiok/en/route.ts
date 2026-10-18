import { NextResponse } from "next/server";
import { HibaValasz } from "@km/contracts";
import { aktualisFiok } from "../../../../hitelesites";
import { munkamenetTokenKeresbol } from "../../../../hitelesites/suti";

export const dynamic = "force-dynamic";

export async function GET(keres: Request): Promise<Response> {
  const token = munkamenetTokenKeresbol(keres);
  const fiok = await aktualisFiok(token);
  if (!fiok) {
    const valasz = NextResponse.json<HibaValasz>({ hiba: "NINCS_BELEPVE" }, { status: 401 });
    valasz.headers.set("cache-control", "no-store");
    return valasz;
  }

  const valasz = NextResponse.json(fiok, { status: 200 });
  valasz.headers.set("cache-control", "no-store");
  return valasz;
}
