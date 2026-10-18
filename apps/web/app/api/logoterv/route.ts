import "server-only";
import { kapu } from "../_kapu";
import { hiba, valasz } from "../hirfigyelo/_kozos";
import { kuld } from "../../../logoterv";

export const dynamic = "force-dynamic";

// R-17 B2 (12h „Mesélj a logódról” → „Elküldöm”): a kérdőív beküldése. Szerkesztői művelet (a Logó, színek, betűk lapjai is azok);
// a néző nem kér fizetős szolgáltatást. Törzs: logoterv/szabaly.ts LogotervKuldes. 201 → a lap a köszönő állapotra vált (12h2).
// 409 NINCS_AJANLAT: a rendszergazda közben levette az árat (a gomb sem látszik már).
export async function POST(keres: Request): Promise<Response> {
  try {
    const k = await kapu(keres, "szerkeszto");
    if (k instanceof Response) return k;
    const torzs = await keres.json().catch(() => null);
    const e = await kuld({ szervezetId: k.szervezet.id, szervezetNev: k.szervezet.nev, fiokId: k.fiok.id, fiokNev: k.fiok.nev }, torzs);
    if (!e.ok) return hiba({ hiba: e.hiba }, e.hiba === "NINCS_AJANLAT" ? 409 : 400);
    return valasz({ logoterv: { id: e.id, ertesites: e.ertesites } }, 201);
  } catch (h) {
    console.error("[logoterv] POST hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
