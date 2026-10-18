import { KEP_MAX_MERET_BAJT, feltolt } from "@rogton/fajl-core";
import { kapu } from "../../../_kapu";
import { eldob, korlatosBeolvas } from "../../../../../fajl/beolvas";
import { fajlKornyezet } from "../../../../../fajl";
import { szerepFordit } from "../../../../../hozzaferes";

export const dynamic = "force-dynamic";

// R-18 7. kör · 2. és 4. lépés: az étlap / árlista (PDF, fotó) és a képernyőképek feltöltése a meglévő fájltárba („dokumentum” cél —
// a fájlok a Szervezet adatai fájljai között is látszanak). A törzs maga a fájl; fejléc: x-fajl-nev. Ki: {fajl: {id, nev, tipus}}.
export async function POST(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const cl = keres.headers.get("content-length");
    if (cl && Number(cl) > KEP_MAX_MERET_BAJT) {
      await eldob(keres);
      return Response.json({ hiba: "TUL_NAGY" }, { status: 413 });
    }
    const bajtok = await korlatosBeolvas(keres, KEP_MAX_MERET_BAJT);
    if (!bajtok) return Response.json({ hiba: "TUL_NAGY" }, { status: 413 });
    const nev = decodeURIComponent(keres.headers.get("x-fajl-nev") ?? "lista").slice(0, 120);
    const ktx = { fiok_id: e.fiok.id, szervezet_id: e.szervezet.id, szerep: szerepFordit(e.szerep) };
    const f = await feltolt(fajlKornyezet(), ktx, { nev, cel: "dokumentum", bajtok });
    if (!f.ok) {
      const http = f.hiba === "NINCS_JOG" ? 403 : f.hiba === "TUL_NAGY" ? 413 : f.hiba === "TIPUS_NEM_ENGEDETT" || f.hiba === "SVG_NEM_ENGEDETT" ? 415 : 400;
      return Response.json({ hiba: f.hiba }, { status: http });
    }
    return Response.json({ fajl: { id: f.ertek.id, nev: f.ertek.nev, tipus: f.ertek.tipus } }, { status: 201, headers: { "cache-control": "no-store" } });
  } catch (h) {
    console.error("Beállítás fájl hiba:", h);
    return Response.json({ hiba: "BELSO_HIBA" }, { status: 500 });
  }
}
