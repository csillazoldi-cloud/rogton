import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { MUNKAMENET_SUTI } from "@rogton/contracts";
import { aktualisFiok, aktualisSzervezetValaszt } from "../../../../hitelesites";
import { esemenyMunkatere, olvasottJelol } from "../../../../ertesites";
import { CEL_UT, FAJTA_CEL } from "../../../../ertesites/tipusok";
import { nyilvanosCim } from "../../../../hitelesites/nyilvanos-cim";

export const dynamic = "force-dynamic";

/** F-5b (R-4), F-8.1 a: a cél a NYILVÁNOS címre épül (a proxy fejléceiből), nem a doboz belső címére (T-30).
 * Egy értesítés megnyitása — olvasottnak jelöl, átvált arra a munkatérre, ahol történt, és a sor céljára visz (találatok · források · költség · futás · Fiókok). */
export async function GET(_keres: Request, ktx: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await ktx.params;
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) return NextResponse.redirect(nyilvanosCim(_keres, "/belepes?vissza=/beallitasok"));
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.redirect(nyilvanosCim(_keres, "/beallitasok"));
  try {
    const hely = await esemenyMunkatere(fiok, id);
    if (!hely) return NextResponse.redirect(nyilvanosCim(_keres, "/beallitasok"));
    await olvasottJelol(fiok.id, id);
    if (hely.szervezet_id) await aktualisSzervezetValaszt(fiok.id, hely.szervezet_id);
    return NextResponse.redirect(nyilvanosCim(_keres, CEL_UT[FAJTA_CEL[hely.fajta]]));
  } catch (h) {
    console.error("Ertesites nyit hiba:", h);
    return NextResponse.redirect(nyilvanosCim(_keres, "/beallitasok"));
  }
}
