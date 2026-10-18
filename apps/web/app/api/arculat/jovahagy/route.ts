import { kapu } from "../../_kapu";
import { alapA, arculatMent, hasznaltLogokMost } from "../../../../arculat/ment";
import { jovahagyTenyleges } from "../../../../arculat/lepes";
import { belsoHiba, szakaszValasz } from "../_szakasz";

export const dynamic = "force-dynamic";

// R-16 K3 (TERV §2-K3, kerdesek 4): POST {} — a tényleges tervezet jóváhagyása („Így jó, logó nélkül” a 12a-n, „Igen, ez mi
// vagyunk” a 12b-n). Tervezet nélkül az alapszettből (amit a 12a mutatott). A pillanatkép a most használt logókat rögzíti.
// 200 { arculat: ArculatLepes } · 403 NINCS_JOG (néző) · 409 NINCS_PISZKOZAT (nincs még profil).
export async function POST(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const logok = await hasznaltLogokMost(e.szervezet.id);
    return szakaszValasz(await arculatMent(e.szervezet.id, (a, k) => jovahagyTenyleges(a, alapA(k), k.most, logok)));
  } catch (h) {
    return belsoHiba("jóváhagyás", h);
  }
}
