import { z } from "zod";
import { HexSzin } from "@km/contracts";
import { SZETT_IDK } from "@km/arculat-core";
import { kapu } from "../../_kapu";
import { alapA, arculatMent, hasznaltLogokMost } from "../../../../arculat/ment";
import { szinekJovahagy } from "../../../../arculat/lepes";
import { regeneralCsendben } from "../../../../arculat/nevlogo";
import { belsoHiba, szakaszValasz } from "../_szakasz";

export const dynamic = "force-dynamic";

/** A 12d kártyája (logo · honlap · szett, a mostani saját is) vagy a 12d2 egyenkénti választása (sajat). A `szett` csak szett-forrással. */
const SzinekKeres = z.object({
  fo: HexSzin,
  masodik: HexSzin,
  hatter: HexSzin,
  forras: z.enum(["logo", "honlap", "szett", "sajat"]),
  szett: z.enum(SZETT_IDK).optional(),
}).strict().refine((k) => (k.forras === "szett") === (k.szett !== undefined), { path: ["szett"], message: "a szett csak szett-forrással, és ott kötelező" });

// R-16 K4 (TERV §2-K4, gepezet 6 · 6b, kerdesek 4): POST { fo, masodik, hatter, forras, szett? } — „Ez legyen” a 12d-n és a 12d2-n:
// a három szín mentése ÉS jóváhagyása egy tranzakcióban (`arculatMent`). Az olvasható betűszín a kép dolga (K2 `olvashato`) — nem tároljuk.
// 200 { arculat } · 400 ERVENYTELEN_ADAT · 403 NINCS_JOG (néző) · 409 NINCS_PISZKOZAT (nincs még profil).
export async function POST(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const be = SzinekKeres.safeParse(await keres.json().catch(() => null));
    if (!be.success) return Response.json({ hiba: "ERVENYTELEN_ADAT", mezok: Object.fromEntries(be.error.issues.map((i) => [i.path.join(".") || "torzs", i.code])) }, { status: 400, headers: { "cache-control": "no-store" } });
    const logok = await hasznaltLogokMost(e.szervezet.id);
    const m = await arculatMent(e.szervezet.id, (a, k) => szinekJovahagy(a, be.data, alapA(k), k.most, logok));
    // R-16 K6 (TERV 1.6, gepezet 13): új színek → a gép-készítette névlogó újra készül (csak ahol a hely legfrissebb fájlja a gépé;
    // a feltöltött logóhoz nem nyúl). A hibája a mentést nem rontja el.
    if (m.ok && !m.valtozatlan) await regeneralCsendben(e.szervezet.id, e.fiok.id, e.szervezet.nev);
    return szakaszValasz(m);
  } catch (h) {
    return belsoHiba("színek", h);
  }
}
