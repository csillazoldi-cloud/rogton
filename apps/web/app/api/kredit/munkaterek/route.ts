// R-13 (2026-09-22): a rendszergazda: minden munkatér havi kreditje és felhasználása ebben a hónapban.
import { kapu } from "../../_kapu";
import { kreditOsszes } from "../../../../kredit";
import { hiba, kr, valasz } from "../_kozos";

export const dynamic = "force-dynamic";

export async function GET(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "rendszergazda");
    if (e instanceof Response) return e;
    if (!e.fiok.rendszergazda) return hiba({ hiba: "NINCS_JOG" }, 403);
    const sorok = await kreditOsszes();
    return valasz({ kredit: { munkaterek: sorok.map((s) => ({ szervezet_id: s.szervezet_id, havi: s.havi, felhasznalt: kr(s.felhasznalt) })) } });
  } catch (h) {
    console.error("Kredit munkaterek GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
