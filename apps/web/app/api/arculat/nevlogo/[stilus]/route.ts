import { kapu } from "../../../_kapu";
import { profilTar } from "../../../../../profil/tar";
import { NevlogoHiba, kepgyarNevlogo, nevlogoBemenet, nevlogoStilusE } from "../../../../../arculat/nevlogo";
import { belsoHiba } from "../../_szakasz";

export const dynamic = "force-dynamic";
const FEJ = { "cache-control": "no-store" };

// R-16 K6 (TERV §2-K6): GET (tag) — a jelölt névlogó VILÁGOS változata a munkatér mostani színeivel és cím-betűjével, PNG-ként (a 12g
// sávjai: asztalon a kép fölött, telefonon a három egymás alatt). Nem tárol semmit (a képgyártó a kérés ujjlenyomatával megjegyzi).
// 200 image/png · 404 NINCS_ILYEN (ismeretlen stílus) · 409 NINCS_PISZKOZAT · 503 KEPGYAR_NEM_VALASZOL.
export async function GET(keres: Request, { params }: { params: Promise<{ stilus: string }> }): Promise<Response> {
  try {
    const e = await kapu(keres, "tag");
    if (e instanceof Response) return e;
    const { stilus } = await params;
    if (!nevlogoStilusE(stilus)) return Response.json({ hiba: "NINCS_ILYEN" }, { status: 404, headers: FEJ });
    const profil = await profilTar.betolt(e.szervezet.id);
    if (!profil) return Response.json({ hiba: "NINCS_PISZKOZAT" }, { status: 409, headers: FEJ });
    const v = await kepgyarNevlogo(await nevlogoBemenet(e.szervezet.id, e.szervezet.nev, stilus, profil));
    return new Response(Buffer.from(v.vilagos.png), { headers: { "content-type": "image/png", ...FEJ } });
  } catch (h) {
    if (h instanceof NevlogoHiba) return Response.json({ hiba: "KEPGYAR_NEM_VALASZOL" }, { status: 503, headers: FEJ });
    return belsoHiba("névlogó GET", h);
  }
}
