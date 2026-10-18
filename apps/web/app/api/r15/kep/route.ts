import { PosztForras } from "@rogton/contracts";
import { KEP_MAX_MERET_BAJT } from "@rogton/fajl-core";
import { eldob, korlatosBeolvas } from "../../../../fajl/beolvas";
import { kapu } from "../../_kapu";
import { szerepFordit } from "../../../../hozzaferes";
import { kepFeltolt, keszKepeim } from "../../../../r15/kep";
import { kepHibaValasz } from "./_hiba";

export const dynamic = "force-dynamic";

// R-15 · 08c — POST: kép feltöltése (a törzs maga a kép; fejlécek: x-fajl-nev, és ha rögtön egy poszthoz megy: x-poszt).
// GET: a „Kész képeim” lista (gepezet 18).
export async function POST(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const cl = keres.headers.get("content-length");
    // a posztkép korlátja 10 MB marad (Csilla 2026-10-10: csak az arculati fájlok kapnak 100 MB-ot)
    if (cl && Number(cl) > KEP_MAX_MERET_BAJT) {
      await eldob(keres); // a válasz így biztosan megérkezik (különben a kliens kapcsolat-bontást lát)
      return Response.json({ hiba: "TUL_NAGY" }, { status: 413 });
    }
    const nev = decodeURIComponent(keres.headers.get("x-fajl-nev") ?? "kep");
    const poszt = keres.headers.get("x-poszt") ?? "";
    const bajtok = await korlatosBeolvas(keres, KEP_MAX_MERET_BAJT);
    if (!bajtok) return Response.json({ hiba: "TUL_NAGY" }, { status: 413 });
    const ktx = { fiok_id: e.fiok.id, szervezet_id: e.szervezet.id, szerep: szerepFordit(e.szerep) };
    // R-18 8. kör: a szerkesztő beállításai (x-kep-beallitas, URI-kódolt JSON) — ebből nyílik újra a „Kép szerkesztése”
    let beallitas: PosztForras["kep_beallitas"];
    try {
      const b = keres.headers.get("x-kep-beallitas");
      const e2 = b ? PosztForras.shape.kep_beallitas.safeParse(JSON.parse(decodeURIComponent(b))) : null;
      if (e2?.success) beallitas = e2.data;
    } catch { /* hibás fejléc: beállítás nélkül */ }
    const kep = await kepFeltolt(ktx, { nev, bajtok, ...(poszt ? { posztId: poszt } : {}), ...(beallitas ? { beallitas } : {}) });
    return Response.json({ kep }, { status: 201, headers: { "cache-control": "no-store" } });
  } catch (h) {
    return kepHibaValasz(h, "feltöltés");
  }
}

export async function GET(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "tag");
    if (e instanceof Response) return e;
    const ktx = { fiok_id: e.fiok.id, szervezet_id: e.szervezet.id, szerep: szerepFordit(e.szerep) };
    return Response.json({ kepek: await keszKepeim(ktx) }, { headers: { "cache-control": "no-store" } });
  } catch (h) {
    return kepHibaValasz(h, "lista");
  }
}
