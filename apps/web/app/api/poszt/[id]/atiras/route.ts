import { kapu } from "../../../_kapu";
import { szovegetAtir } from "../../../../../poszt";
import { cellaCim, hiba, posztHibaValasz, torzset, valasz } from "../../_kozos";

export const dynamic = "force-dynamic";

const MUVELETEK = ["rovidebb", "hosszabb", "kozvetlenebb", "targyilagosabb", "hashtag", "sajat"] as const;

// POST — a szöveg (vagy a kijelölt rész) átírása a kért művelettel.
export async function POST(keres: Request, kontextus: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const { id } = await kontextus.params;
    const torzs = await torzset(keres);
    const cim = cellaCim(keres, e.szervezet.id, id, torzs, e.fiok.id);
    if (cim instanceof Response) return cim;

    const muvelet = typeof torzs["muvelet"] === "string" ? torzs["muvelet"].trim() : "";
    if (!(MUVELETEK as readonly string[]).includes(muvelet)) {
      return hiba({ hiba: "ERVENYTELEN_ADAT", mezok: { muvelet: "ervenytelen" } }, 400);
    }
    const sajat = typeof torzs["sajat"] === "string" ? torzs["sajat"].trim().slice(0, 300) : "";
    if (muvelet === "sajat" && !sajat) {
      return hiba({ hiba: "ERVENYTELEN_ADAT", mezok: { sajat: "hianyzo" } }, 400);
    }
    const kijeloles = typeof torzs["kijeloles"] === "string" ? torzs["kijeloles"] : undefined;

    return valasz({ munka: await szovegetAtir(cim, muvelet === "sajat" ? sajat : muvelet, kijeloles) });
  } catch (h) {
    return posztHibaValasz(h, "atiras");
  }
}
