import { kapu } from "../../_kapu";
import { cookies, headers } from "next/headers";
import type { HibaValasz } from "@rogton/contracts";
import { NYELV_SUTI } from "@rogton/design-system";
import { aktualisFiok, aktualisSzervezet } from "../../../../hitelesites";
import { munkamenetTokenKeresbol } from "../../../../hitelesites/suti";
import { piszkozatBetolt } from "../../../../onboarding/piszkozat";
import { JavaslatHiba } from "../../../../onboarding/javaslatok";
import { arculatotJavasol } from "../../../../onboarding/arculat";
import { nyelvKeresbol } from "../../../../nyelv";

export const dynamic = "force-dynamic";

function hiba(h: HibaValasz, status: number): Response {
  return Response.json(h, { status, headers: { "cache-control": "no-store" } });
}
function hibaValasz(h: JavaslatHiba): Response {
  const status = h.kod === "ERVENYTELEN_ADAT" ? 400 : h.kod === "AI_KERET_KIMERULT" ? 429 : h.kod === "AI_KIKAPCSOLVA" ? 409 : 503;
  return hiba(h.mezok ? { hiba: h.kod, mezok: h.mezok } : { hiba: h.kod }, status);
}

// POST — arculati tervezet javaslata az 1. lépés forrásaiból (v6 seedStep2 → brand draft). Javaslat, nem jogosultság.
export async function POST(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const { fiok, szervezet } = e;
    const { piszkozat } = await piszkozatBetolt(szervezet.id);
    const [sutik, fejlecek] = await Promise.all([cookies(), headers()]);
    const felulet = nyelvKeresbol(sutik.get(NYELV_SUTI)?.value, fejlecek.get("accept-language"));
    const valasz = await arculatotJavasol(szervezet.id, piszkozat, felulet, fiok.id);
    return Response.json(valasz, { headers: { "cache-control": "no-store" } });
  } catch (h) {
    if (h instanceof JavaslatHiba) return hibaValasz(h);
    console.error("Arculat POST hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
