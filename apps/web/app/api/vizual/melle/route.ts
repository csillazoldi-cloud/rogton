import { kapu } from "../../_kapu";
import { MelleHiba, melleIr } from "../../../../vizual/melle";

export const dynamic = "force-dynamic";

// POST {meret, szoveg} — VZ-2c „Mit írj mellé?”: javasolt posztszöveg a kép mellé (a Posztszöveg gépezete). A néző nem kér.
export async function POST(keres: Request): Promise<Response> {
  const e = await kapu(keres, "szerkeszto");
  if (e instanceof Response) return e;
  try {
    const torzs = ((await keres.json().catch(() => null)) ?? {}) as Record<string, unknown>;
    return Response.json({ szoveg: await melleIr(e.szervezet.id, e.fiok.id, torzs) }, { headers: { "cache-control": "no-store" } });
  } catch (h) {
    const kod = h instanceof MelleHiba ? h.kod : "AI_NEM_ELERHETO";
    return Response.json({ hiba: kod }, { status: kod === "ERVENYTELEN_ADAT" ? 400 : kod === "AI_KERET_KIMERULT" ? 402 : 502, headers: { "cache-control": "no-store" } });
  }
}
