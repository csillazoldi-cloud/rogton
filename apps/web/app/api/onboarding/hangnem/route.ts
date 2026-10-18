import { kapu } from "../../_kapu";
import { cookies, headers } from "next/headers";
import { HangnemFinomitasKeres, type HibaValasz } from "@km/contracts";
import { NYELV_SUTI } from "@km/design-system";
import { aktualisFiok, aktualisSzervezet } from "../../../../hitelesites";
import { munkamenetTokenKeresbol } from "../../../../hitelesites/suti";
import { JavaslatHiba, hangnemetFinomit } from "../../../../onboarding/javaslatok";
import { nyelvKeresbol } from "../../../../nyelv";

export const dynamic = "force-dynamic";

function hiba(h: HibaValasz, status: number): Response {
  return Response.json(h, { status, headers: { "cache-control": "no-store" } });
}

// POST — a hangnem finomítása (közvetlenebb / tárgyilagosabb / saját megjegyzés). Az eredmény függő javaslat a felületen.
export async function POST(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const { fiok, szervezet } = e;
    let torzs: unknown;
    try { torzs = await keres.json(); } catch { return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400); }
    const ertek = HangnemFinomitasKeres.safeParse(torzs);
    if (!ertek.success) {
      const mezok: Record<string, string> = {};
      for (const p of ertek.error.issues) { const ut = p.path.join("."); if (ut && !mezok[ut]) mezok[ut] = p.code; }
      return hiba({ hiba: "ERVENYTELEN_ADAT", mezok }, 400);
    }
    const [sutik, fejlecek] = await Promise.all([cookies(), headers()]);
    const felulet = nyelvKeresbol(sutik.get(NYELV_SUTI)?.value, fejlecek.get("accept-language"));
    const valasz = await hangnemetFinomit(szervezet.id, ertek.data, felulet, fiok.id);
    return Response.json(valasz, { headers: { "cache-control": "no-store" } });
  } catch (h) {
    if (h instanceof JavaslatHiba) {
      const status = h.kod === "ERVENYTELEN_ADAT" ? 400 : h.kod === "AI_KERET_KIMERULT" ? 429 : h.kod === "AI_KIKAPCSOLVA" ? 409 : 503;
      return hiba(h.mezok ? { hiba: h.kod, mezok: h.mezok } : { hiba: h.kod }, status);
    }
    console.error("Hangnem POST hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
