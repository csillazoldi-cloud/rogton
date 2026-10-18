import { kapu } from "../_kapu";
import { hiba, valasz } from "../tema/_kozos";
import { kezdolapNezet } from "../../../kezdolap";

export const dynamic = "force-dynamic";

/** F-2 (R-1 v3): a kezdőképernyő EGY lekérdezése. Minden tag hívhatja. */
export async function GET(keres: Request): Promise<Response> {
  try {
    const ktx = await kapu(keres, "tag");
    if (ktx instanceof Response) return ktx;
    const kezdolap = await kezdolapNezet(ktx.fiok, ktx.szervezet, ktx.szerep);
    return valasz({ kezdolap });
  } catch (h) {
    console.error("Kezdolap GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
