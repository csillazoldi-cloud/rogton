import "server-only";
import { kapu } from "../../../_kapu";
import { hiba, valasz } from "../../../hirfigyelo/_kozos";
import { allapotValt } from "../../../../../logoterv";

export const dynamic = "force-dynamic";

// R-17 B (Logókérések lista, rendszergazda): egy kérés állapota — új · folyamatban · kész. 404, ha nincs ilyen kérés.
export async function PUT(keres: Request, kontextus: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const k = await kapu(keres, "rendszergazda");
    if (k instanceof Response) return k;
    const { id } = await kontextus.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    const torzs = (await keres.json().catch(() => null)) as { allapot?: unknown } | null;
    const allapot = typeof torzs?.allapot === "string" ? torzs.allapot : "";
    if (!["uj", "folyamatban", "kesz"].includes(allapot)) return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    const ok = await allapotValt(id, allapot);
    if (!ok) return hiba({ hiba: "NINCS_ILYEN_TALALAT" }, 404);
    return valasz({ ok: true });
  } catch (h) {
    console.error("[logoterv] admin allapot hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
