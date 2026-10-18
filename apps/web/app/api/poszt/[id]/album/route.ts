import { kapu } from "../../../_kapu";
import { AlbumHiba, albumAllapot, albumKivesz, albumSorrend, albumValogatasIndit } from "../../../../../album/poszt";
import { cellaCim, hiba, posztHibaValasz, torzset, valasz } from "../../_kozos";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// c30 F10 (terv §6; rajz D8a–c): a poszt fotóalbuma.
//   GET  → { album, fotok, munka } — a feltöltött fotók és a válogatás állapota (a lap 2 mp-enként kérdez, amíg „fut”)
//   POST { felulet, nyelv } → 202 { album } — a válogatás (gép vagy tartalék) és a felirat a háttérben
//   PUT  { muvelet: "sorrend", fotok: [id…] } | { muvelet: "kivesz", fajl_id } → { munka } — Előrébb / Hátrébb · Kiveszem (D8c)
function albumHibaValasz(h: unknown): Response {
  if (h instanceof AlbumHiba) return hiba({ hiba: h.kod }, h.kod === "NINCS_ILYEN_FAJL" ? 404 : 400);
  return posztHibaValasz(h, "album");
}

export async function GET(keres: Request, kontextus: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const e = await kapu(keres, "tag");
    if (e instanceof Response) return e;
    const { id } = await kontextus.params;
    if (!UUID.test(id)) return hiba({ hiba: "NINCS_ILYEN_TALALAT" }, 404);
    return valasz(await albumAllapot(e.szervezet.id, id));
  } catch (h) {
    return albumHibaValasz(h);
  }
}

export async function POST(keres: Request, kontextus: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const { id } = await kontextus.params;
    if (!UUID.test(id)) return hiba({ hiba: "NINCS_ILYEN_TALALAT" }, 404);
    const cim = cellaCim(keres, e.szervezet.id, id, await torzset(keres), e.fiok.id);
    if (cim instanceof Response) return cim;
    return Response.json({ album: await albumValogatasIndit(cim) }, { status: 202, headers: { "cache-control": "no-store" } });
  } catch (h) {
    return albumHibaValasz(h);
  }
}

export async function PUT(keres: Request, kontextus: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const { id } = await kontextus.params;
    if (!UUID.test(id)) return hiba({ hiba: "NINCS_ILYEN_TALALAT" }, 404);
    const t = await torzset(keres);
    if (t["muvelet"] === "sorrend" && Array.isArray(t["fotok"]) && t["fotok"].every((x) => typeof x === "string" && UUID.test(x))) {
      return valasz({ munka: await albumSorrend(e.szervezet.id, id, t["fotok"] as string[]) });
    }
    if (t["muvelet"] === "kivesz" && typeof t["fajl_id"] === "string" && UUID.test(t["fajl_id"])) {
      return valasz({ munka: await albumKivesz(e.szervezet.id, id, t["fajl_id"]) });
    }
    return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
  } catch (h) {
    return albumHibaValasz(h);
  }
}
