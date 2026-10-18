import { kapu } from "../../_kapu";
import { hiba, valasz } from "../../tema/_kozos";
import { masEszkozoketKileptet } from "../../../../hitelesites/sajat";
import { munkamenetTokenKeresbol } from "../../../../hitelesites/suti";

export const dynamic = "force-dynamic";

export async function POST(keres: Request): Promise<Response> {
  const belepo = await kapu(keres, "belepett");
  if (belepo instanceof Response) return belepo;

  const token = munkamenetTokenKeresbol(keres);
  if (!token) return hiba({ hiba: "NINCS_BELEPVE" }, 401);

  const { torolt } = await masEszkozoketKileptet(belepo.fiok.id, token);
  return valasz({ fiok: { torolt } }, 200);
}
