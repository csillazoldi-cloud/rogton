import { kapu } from "../../_kapu";
import { ctaBeleir, munkatBetolt, szovegetMent } from "../../../../poszt";
import { cellaCim, posztHibaValasz, torzset, valasz } from "../_kozos";

export const dynamic = "force-dynamic";

// GET — egy munka teljes tartalma (minden cella: felület × nyelv).
export async function GET(keres: Request, kontextus: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const e = await kapu(keres, "tag");
    if (e instanceof Response) return e;
    const { id } = await kontextus.params;
    return valasz({ munka: await munkatBetolt(e.szervezet.id, id) });
  } catch (h) {
    return posztHibaValasz(h, "betoltes");
  }
}

// PUT — a kézzel írt szöveg mentése egy cellába. Ez a „Piszkozat mentve" mögötti hívás.
export async function PUT(keres: Request, kontextus: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const { id } = await kontextus.params;
    const torzs = await torzset(keres);
    const cim = cellaCim(keres, e.szervezet.id, id, torzs, e.fiok.id);
    if (cim instanceof Response) return cim;
    const szoveg = typeof torzs["szoveg"] === "string" ? torzs["szoveg"] : "";
    // R-18 6. kör (Kati C) → 8. kör: {cta} → „Beleírom”: a szándék a munkán marad, a gép a poszt hangján írja meg a zárást (átírás-kredit)
    if (typeof torzs["cta"] === "string") return valasz({ munka: await ctaBeleir(cim, szoveg, torzs["cta"]) });
    // R-17 C2: a blog felületen a cikk címe is jöhet (a cella `cim` mezője); máshol nem kerül a cellába
    const cikkCim = typeof torzs["cim"] === "string" ? torzs["cim"] : undefined;
    return valasz({ munka: await szovegetMent(cim.szervezetId, cim.id, cim.felulet, cim.nyelv, szoveg, cikkCim) });
  } catch (h) {
    return posztHibaValasz(h, "mentes");
  }
}
