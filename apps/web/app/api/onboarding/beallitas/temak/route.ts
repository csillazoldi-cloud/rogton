import { kapu } from "../../../_kapu";
import { temakatJavasol } from "../../../../../onboarding/kinalat";

export const dynamic = "force-dynamic";

// R-18 7. kör · 5. lépés: „Ezekről érdemes posztolnod” — a gép 4–8 témája, mindegyik egy javasolt poszttípussal (nem ment; a „Rendben” ment).
export async function POST(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const temak = await temakatJavasol({ szervezetId: e.szervezet.id, fiokId: e.fiok.id });
    if (!temak) return Response.json({ hiba: "NINCS_PROFIL" }, { status: 409 });
    return Response.json({ temak }, { headers: { "cache-control": "no-store" } });
  } catch (h) {
    console.error("Témák hiba:", h);
    return Response.json({ hiba: "BELSO_HIBA" }, { status: 500 });
  }
}
