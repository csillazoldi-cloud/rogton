import { kapu } from "../../_kapu";
import { belepettSzervezet, hiba, valasz } from "../../hirfigyelo/_kozos";
import { gazdaNezet, honapVagyMost } from "../../../../koltseg";

export const dynamic = "force-dynamic";

/** MINDEN szervezet AI-használata (E-39) — csak rendszergazdának. */
export async function GET(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "rendszergazda");
    if (e instanceof Response) return e;
    if (!e.fiok.rendszergazda) return hiba({ hiba: "NINCS_JOG" }, 403);
    const honap = honapVagyMost(new URL(keres.url).searchParams.get("honap"));
    return valasz({ koltseg: await gazdaNezet(honap) });
  } catch (h) {
    console.error("Koltseg osszes GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
