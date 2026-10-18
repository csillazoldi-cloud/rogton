import { belepettSzervezet, hiba, kapu, valasz } from "../../_kozos";
import { hostKontextus, kornyezet } from "../../../../../hirfigyelo";

export const dynamic = "force-dynamic";

/** Egy futás részlete: a futás + a hozzá tartozó találatok (a szervezet saját futása, különben 404). */
export async function GET(keres: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const { id } = await params;
    const eredmeny = await kapu(keres, "tag");
    if (eredmeny instanceof Response) return eredmeny;
    const ktx = hostKontextus(eredmeny.fiok, eredmeny.szervezet.id);
    if (!ktx) return hiba({ hiba: "NINCS_JOG" }, 403);
    const k = await kornyezet(eredmeny.szervezet.id);
    const futas = (await k.tar.futasok(eredmeny.szervezet.id)).find((f) => f.id === id);
    if (!futas) return hiba({ hiba: "NINCS_ILYEN_FUTAS" }, 404);
    const talalatok = (await k.tar.talalatok(eredmeny.szervezet.id)).filter((t) => t.futas_id === id);
    return valasz({ hirfigyelo: { futas: { ...futas, talalatok } } });
  } catch (h) {
    console.error("Hirfigyelo futas reszlet GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
