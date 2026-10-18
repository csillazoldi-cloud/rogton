import { z } from "zod";
import { kapu } from "../../_kapu";
import { szerepFordit } from "../../../../hozzaferes";
import { fajlTar } from "../../../../fajl/tar";
import { alapA, arculatMent, hasznaltLogokMost } from "../../../../arculat/ment";
import { betuValasztek, betukJovahagy, kulcsErvenyes } from "../../../../arculat/betuk";
import { regeneralCsendben } from "../../../../arculat/nevlogo";
import { belsoHiba, szakaszValasz } from "../_szakasz";

export const dynamic = "force-dynamic";
const FEJ = { "cache-control": "no-store" };

// R-16 K5 (TERV §2-K5, gepezet 7–8) — 12e „Betűk”.
// GET (tag) → 200 { beepitett: [{ kulcs, szo, nev }], sajat: [{ id, kulcs: "sajat:<id>", nev, hianyzo }], cim, szoveg, elonezet }
//   · 409 NINCS_PISZKOZAT (nincs még profil). A `hianyzo` a munkatér nyelveire szűrt hiányzó ékezetek (hu mindig, ro ha a munkatér nyelve).
export async function GET(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "tag");
    if (e instanceof Response) return e;
    const v = await betuValasztek(e.szervezet.id, szerepFordit(e.szerep));
    if (!v) return Response.json({ hiba: "NINCS_PISZKOZAT" }, { status: 409, headers: FEJ });
    return Response.json(v, { headers: FEJ });
  } catch (h) {
    return belsoHiba("betűk GET", h);
  }
}

/** Legalább az egyik; ismeretlen kulcs → 400 (a kliens nem küld teljes arculatot). */
const BetukKeres = z.object({ cim: z.string().max(80).optional(), szoveg: z.string().max(80).optional() }).strict()
  .refine((b) => b.cim !== undefined || b.szoveg !== undefined, { message: "ures" });

// POST (szerkeszto) { cim?, szoveg? } — beépített kulcs, vagy a munkatér egyik saját betűjének "sajat:<id>"-je — → mentés ÉS
// jóváhagyás egy lépésben (kerdesek 4) → 200 { arculat } · 400 ERVENYTELEN_ADAT · 403 NINCS_JOG (néző) · 409 NINCS_PISZKOZAT.
export async function POST(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const be = BetukKeres.safeParse(await keres.json().catch(() => null));
    if (!be.success) return Response.json({ hiba: "ERVENYTELEN_ADAT", mezok: Object.fromEntries(be.error.issues.map((i) => [i.path.join(".") || "torzs", i.code])) }, { status: 400, headers: FEJ });
    const sajatIdk = new Set((await fajlTar.lista(e.szervezet.id, "betu")).map((f) => f.id));
    const rossz = (["cim", "szoveg"] as const).filter((m) => be.data[m] !== undefined && !kulcsErvenyes(be.data[m]!, sajatIdk));
    if (rossz.length > 0) return Response.json({ hiba: "ERVENYTELEN_ADAT", mezok: Object.fromEntries(rossz.map((m) => [m, "ismeretlen_betu"])) }, { status: 400, headers: FEJ });
    const logok = await hasznaltLogokMost(e.szervezet.id);
    const m = await arculatMent(e.szervezet.id, (a, k) => betukJovahagy(a, be.data, alapA(k), k.most, logok));
    // R-16 K6 (TERV §2-K6, gepezet 13): új CÍM-betű → a gép-készítette névlogó újra készül (csak a gépi helyeken). A szöveg-betű a
    // névlogót nem érinti. A hibája a mentést nem rontja el.
    if (m.ok && !m.valtozatlan && be.data.cim !== undefined) await regeneralCsendben(e.szervezet.id, e.fiok.id, e.szervezet.nev);
    return szakaszValasz(m);
  } catch (h) {
    return belsoHiba("betűk POST", h);
  }
}
