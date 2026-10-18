import { kapu } from "../../_kapu";
import { MelleHiba, kepFordit, kepForditMezok } from "../../../../vizual/melle";

export const dynamic = "force-dynamic";

// POST {szoveg, cel} — VZ-2b „Román változat is”: a kép szövege a második nyelven, gépi fordítás javaslatként. A néző nem kér.
// POST {mezok: {cim, sor, …}, cel} → {mezok} — Kati 10-11: a kép MINDEN szövegmezője (teljes román kép), egy hívásban.
export async function POST(keres: Request): Promise<Response> {
  const e = await kapu(keres, "szerkeszto");
  if (e instanceof Response) return e;
  try {
    const torzs = ((await keres.json().catch(() => null)) ?? {}) as Record<string, unknown>;
    if (torzs["mezok"] && typeof torzs["mezok"] === "object") return Response.json({ mezok: await kepForditMezok(e.szervezet.id, e.fiok.id, torzs) }, { headers: { "cache-control": "no-store" } });
    return Response.json({ szoveg: await kepFordit(e.szervezet.id, e.fiok.id, torzs) }, { headers: { "cache-control": "no-store" } });
  } catch (h) {
    const kod = h instanceof MelleHiba ? h.kod : "AI_NEM_ELERHETO";
    return Response.json({ hiba: kod }, { status: kod === "ERVENYTELEN_ADAT" ? 400 : kod === "AI_KERET_KIMERULT" ? 402 : 502, headers: { "cache-control": "no-store" } });
  }
}
