import { kapu } from "../../../../_kapu";
import { hirbolPoszt } from "../../../../../../r15";

export const dynamic = "force-dynamic";

// R-15 · 04 Hírek „Átnézem a posztot” — a hírhez tartozó poszt munkája; ha még nincs, most jön létre (gepezet 1).
// A szöveget a 08 lap íratja meg („Írjuk a posztot…”), így ez a hívás azonnal válaszol.
export async function POST(keres: Request, kontextus: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const { id } = await kontextus.params;
    const munka = await hirbolPoszt(e.szervezet.id, e.fiok.id, id);
    if (!munka) return Response.json({ hiba: "NINCS_ILYEN_TALALAT" }, { status: 404 });
    return Response.json({ munka_id: munka.id }, { headers: { "cache-control": "no-store" } });
  } catch (h) {
    console.error("R15 hirbol poszt hiba:", h);
    return Response.json({ hiba: "BELSO_HIBA" }, { status: 500 });
  }
}
