import { z } from "zod";
import { kapu } from "../../_kapu";
import { NEVLOGO_STILUSOK, NevlogoHiba, nevlogoMent } from "../../../../arculat/nevlogo";
import { belsoHiba } from "../_szakasz";

export const dynamic = "force-dynamic";
const FEJ = { "cache-control": "no-store" };

const NevlogoKeres = z.object({ stilus: z.enum(NEVLOGO_STILUSOK) }).strict();

// R-16 K6 (TERV §2-K6, 1.6; gepezet 13; kerdesek 4) — 12g „Ez legyen”: POST (szerkeszto) { stilus: "nev" | "kor" | "negyzet" } →
// a gép a munkatér nevéből, mostani színeiből és cím-betűjéből elkészíti a négy változatot (PNG + SVG = 8 új `arculat_fajl` sor,
// `eredet='gep'`), és a stílust ELMENTI ÉS JÓVÁHAGYJA egy lépésben.
// 200 { logok: { vilagos, sotet, egyszinu, negyzetes } (a PNG-k azonosítója) } · 400 ERVENYTELEN_ADAT · 403 NINCS_JOG (néző)
// · 409 NINCS_PISZKOZAT (nincs még profil) · 503 KEPGYAR_NEM_VALASZOL (ilyenkor semmi nem íródik).
export async function POST(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const be = NevlogoKeres.safeParse(await keres.json().catch(() => null));
    if (!be.success) return Response.json({ hiba: "ERVENYTELEN_ADAT", mezok: Object.fromEntries(be.error.issues.map((i) => [i.path.join(".") || "torzs", i.code])) }, { status: 400, headers: FEJ });
    const m = await nevlogoMent(e.szervezet.id, e.fiok.id, e.szervezet.nev, be.data.stilus);
    if (m.ok) return Response.json({ logok: m.logok }, { headers: FEJ });
    if (m.hiba === "NINCS_PROFIL") return Response.json({ hiba: "NINCS_PISZKOZAT" }, { status: 409, headers: FEJ });
    return Response.json({ hiba: "ERVENYTELEN_ADAT" }, { status: 400, headers: FEJ });
  } catch (h) {
    if (h instanceof NevlogoHiba) return Response.json({ hiba: h.kod === "ERVENYTELEN_ADAT" ? "ERVENYTELEN_ADAT" : "KEPGYAR_NEM_VALASZOL" }, { status: h.kod === "ERVENYTELEN_ADAT" ? 400 : 503, headers: FEJ });
    return belsoHiba("névlogó POST", h);
  }
}
