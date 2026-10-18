import { kapu } from "../../_kapu";
import { szinAdat } from "../../../../arculat/szinek";
import { belsoHiba } from "../_szakasz";

export const dynamic = "force-dynamic";

const FEJ = { "cache-control": "no-store" };

// R-16 K4 (TERV §2-K4, gepezet 6): GET — a 12d négy színösszeállítása. Minden tag olvashatja (a néző is: ő csak nem választhat).
// 200 { szettek: [{ kulcs, nev /* feliratkulcs */, fo, masodik, hatter, forras: "logo"|"honlap"|"szett"|"sajat", szett?, jelenlegi }],
//       logo_szinek: Hex[] (≤ 5), gyuru: Hex[12], elemzes_nelkul: uuid[] (a K1 előtti logók — a böngésző elemzi) }
// Az első elem mindig a mostani (jelenlegi: true, ✓). 409 NINCS_PISZKOZAT: még nincs profil (az onboarding van hátra).
export async function GET(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "tag");
    if (e instanceof Response) return e;
    const adat = await szinAdat(e.szervezet.id, e.szerep);
    if (!adat) return Response.json({ hiba: "NINCS_PISZKOZAT" }, { status: 409, headers: FEJ });
    return Response.json({ szettek: adat.javaslatok, logo_szinek: adat.logoSzinek, gyuru: adat.gyuru, elemzes_nelkul: adat.elemzesNelkul }, { headers: FEJ });
  } catch (h) {
    return belsoHiba("színjavaslatok", h);
  }
}
