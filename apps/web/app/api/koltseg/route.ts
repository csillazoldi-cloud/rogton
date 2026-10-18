import { kapu } from "../_kapu";
import { belepettSzervezet, hiba, valasz } from "../hirfigyelo/_kozos";
import { honapVagyMost, sajatNezet } from "../../../koltseg";

export const dynamic = "force-dynamic";

/** A szervezet SAJÁT AI-használata (E-39). Minden belépett tag látja a saját szervezetéét. */
export async function GET(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "tag");
    if (e instanceof Response) return e;
    const honap = honapVagyMost(new URL(keres.url).searchParams.get("honap"));
    return valasz({ koltseg: await sajatNezet(e.szervezet.id, honap) });
  } catch (h) {
    console.error("Koltseg GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
