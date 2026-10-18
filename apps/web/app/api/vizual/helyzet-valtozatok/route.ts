import { kapu } from "../../_kapu";
import { helyzetValtozatok, kepArculat } from "../../../../vizual/helyzet";
import { hibaValasz } from "../_kozos";

export const dynamic = "force-dynamic";

// POST {helyzet, meret, tartalom} — VZ-3: a megmaradó színváltozatok kis mintaképe a munkatárs szövegével.
export async function POST(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const torzs = ((await keres.json().catch(() => null)) ?? {}) as Record<string, unknown>;
    const { arculat, nyelv: alapNyelv } = await kepArculat(e.szervezet.id, e.szervezet.nev);
    // Kati 10-11: a „Román változat” a kép NYELVÉT is váltja (a kis feliratok: KÉSZ MUNKA → LUCRARE GATA) — csak hu/ro/en kérhető
    const nyelv = typeof torzs["nyelv"] === "string" && ["hu", "ro", "en"].includes(torzs["nyelv"]) ? torzs["nyelv"] : alapNyelv;
    return Response.json(await helyzetValtozatok(torzs["helyzet"], torzs["meret"], torzs["tartalom"], arculat, nyelv), { headers: { "cache-control": "no-store" } });
  } catch (h) {
    return hibaValasz(h, "helyzet-valtozatok");
  }
}
