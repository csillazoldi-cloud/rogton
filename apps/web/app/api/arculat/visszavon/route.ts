import { kapu } from "../../_kapu";
import { arculatMent } from "../../../../arculat/ment";
import { visszavon } from "../../../../arculat/lepes";
import { belsoHiba, szakaszValasz } from "../_szakasz";

export const dynamic = "force-dynamic";

// R-16 K3 (TERV §2-K3): POST — a 12c Részletek „jóváhagyás visszavonása” (profile-core `arculatVisszavon`): az arculat tervezet
// állapotba kerül, a pillanatképek megmaradnak. 200 { arculat } · 403 NINCS_JOG (néző) · 409 NINCS_PISZKOZAT (nincs még profil).
export async function POST(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    return szakaszValasz(await arculatMent(e.szervezet.id, (a) => visszavon(a)));
  } catch (h) {
    return belsoHiba("visszavonás", h);
  }
}
