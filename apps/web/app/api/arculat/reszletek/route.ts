import { z } from "zod";
import { kapu } from "../../_kapu";
import { alapA, arculatMent, hasznaltLogokMost } from "../../../../arculat/ment";
import { reszletekJovahagy, type Reszletek } from "../../../../arculat/lepes";
import { belsoHiba, szakaszValasz } from "../_szakasz";

export const dynamic = "force-dynamic";

/** Ugyanazok a korlátok, mint az ArculatTervezet mezőié (@km/contracts). Ismeretlen kulcs → 400 (a kliens nem küld teljes arculatot). */
const ReszletekKeres = z.object({
  kepvilag: z.string().trim().max(500).optional(),
  kovetendo: z.string().trim().max(300).optional(),
  kerulendo: z.string().trim().max(300).optional(),
  lekerekites: z.number().int().min(0).max(24).optional(),
}).strict();

// R-16 K3 (TERV §2-K3): PUT { kepvilag?, kovetendo?, kerulendo?, lekerekites? } — a Részletek mentése ÉS jóváhagyása egy lépésben
// (kerdesek 4). 200 { arculat } · 400 ERVENYTELEN_ADAT · 403 NINCS_JOG (néző) · 409 NINCS_PISZKOZAT (nincs még profil).
export async function PUT(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const be = ReszletekKeres.safeParse(await keres.json().catch(() => null));
    if (!be.success) return Response.json({ hiba: "ERVENYTELEN_ADAT", mezok: Object.fromEntries(be.error.issues.map((i) => [i.path.join(".") || "torzs", i.code])) }, { status: 400, headers: { "cache-control": "no-store" } });
    const resz = Object.fromEntries(Object.entries(be.data).filter(([, v]) => v !== undefined)) as Reszletek; // csak a küldött mezők
    const logok = await hasznaltLogokMost(e.szervezet.id);
    return szakaszValasz(await arculatMent(e.szervezet.id, (a, k) => reszletekJovahagy(a, resz, alapA(k), k.most, logok)));
  } catch (h) {
    return belsoHiba("részletek", h);
  }
}
