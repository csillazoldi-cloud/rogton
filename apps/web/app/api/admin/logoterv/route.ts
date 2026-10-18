import "server-only";
import { kapu } from "../../_kapu";
import { hiba, valasz } from "../../hirfigyelo/_kozos";
import { beallitas, beallitasMent, lista } from "../../../../logoterv";
import { smtpBeallitas } from "../../../../logoterv/smtp";

export const dynamic = "force-dynamic";

// R-17 B4 (a Beállítások „Rendszer” csoportja, rendszergazda): a logótervezés ára és a kérések címzettje, és a kérések listája.
// GET: { beallitas: { ar, cimzett }, levelezes: bool (be van-e állítva az SMTP a környezetben — a titok soha nem megy ki), keresek: […] }
// PUT: { ar?: szám | "" | null, cimzett?: string } → 400 { hiba, mezok: { mezo } } hibás értéknél.
export async function GET(keres: Request): Promise<Response> {
  try {
    const k = await kapu(keres, "rendszergazda");
    if (k instanceof Response) return k;
    return valasz({ beallitas: await beallitas(), levelezes: smtpBeallitas() !== null, keresek: await lista() });
  } catch (h) {
    console.error("[logoterv] admin GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}

export async function PUT(keres: Request): Promise<Response> {
  try {
    const k = await kapu(keres, "rendszergazda");
    if (k instanceof Response) return k;
    const torzs = (await keres.json().catch(() => null)) as Record<string, unknown> | null;
    if (!torzs || typeof torzs !== "object") return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    const e = await beallitasMent(torzs);
    if (!e.ok) return hiba({ hiba: "ERVENYTELEN_ADAT", mezok: { mezo: e.mezo } }, 400);
    return valasz({ beallitas: e.beallitas });
  } catch (h) {
    console.error("[logoterv] admin PUT hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
