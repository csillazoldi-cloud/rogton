// R-13 (2026-09-22): a saját kreditem ebben a hónapban — minden tag a sajátját látja.
import { kapu } from "../../_kapu";
import { kreditAllapot, sajatBontas } from "../../../../kredit";
import { egyenleg, hiba, kr, valasz } from "../_kozos";

export const dynamic = "force-dynamic";

export async function GET(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "tag");
    if (e instanceof Response) return e;
    const a = await kreditAllapot(e.szervezet.id);
    const t = a.tagok.find((x) => x.fiok_id === e.fiok.id);
    const b = await sajatBontas(e.szervezet.id, e.fiok.id);
    return valasz({
      kredit: {
        honap: a.honap,
        ...egyenleg(t?.keret ?? 0, t?.felhasznalt ?? 0),
        kulon_megadott: t?.kulon !== null && t?.kulon !== undefined,
        munkater_elfogyott: a.munkater.felhasznalt >= a.munkater.keret,
        bontas: { hirek: kr(b.hirek), poszt: kr(b.poszt), iranytu: kr(b.iranytu), egyeb: kr(b.egyeb) },
      },
    });
  } catch (h) {
    console.error("Kredit sajat GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
