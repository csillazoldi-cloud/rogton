import { kapu } from "../../../_kapu";
import { naptarMuvelet } from "../../../../../poszt";
import { posztHibaValasz, torzset, valasz } from "../../_kozos";

export const dynamic = "force-dynamic";

// R-18 3. kör · Naptár: POST {muvelet: "elfogad" | "nap" | "kitettem", nap?} — a poszt napjának elfogadása, másik nap, „Kitettem”.
// Ugyanaz a kapu, mint a poszt többi írásánál (szerkesztő); a szervezet a munkamenetből jön, a sor a saját szervezet szűrőjén át íródik.
export async function POST(keres: Request, kontextus: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const { id } = await kontextus.params;
    await naptarMuvelet(e.szervezet.id, id, await torzset(keres));
    return valasz({ ok: true });
  } catch (h) {
    return posztHibaValasz(h, "naptar");
  }
}
