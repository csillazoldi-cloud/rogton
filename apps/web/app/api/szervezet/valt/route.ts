import { z } from "zod";
import { kapu } from "../../_kapu";
import { hiba, valasz } from "../../tema/_kozos";
import { aktualisSzervezetValaszt } from "../../../../hitelesites";
import { hatasosNyelv, nyelvSutiFejlec } from "../../../../nyelv/munkater";

export const dynamic = "force-dynamic";

const ValtBe = z.object({ szervezet_id: z.uuid() });

/** F-2 (R-1 v3): a fiók aktuális munkaterének váltása (belépett; csak a saját munkaterei közt). */
export async function POST(keres: Request): Promise<Response> {
  try {
    const ktx = await kapu(keres, "belepett");
    if (ktx instanceof Response) return ktx;
    const p = ValtBe.safeParse(await keres.json().catch(() => null));
    if (!p.success) return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    const ok = await aktualisSzervezetValaszt(ktx.fiok.id, p.data.szervezet_id);
    if (!ok) return hiba({ hiba: "NINCS_JOG" }, 403);
    const sz = ktx.fiok.szervezetek.find((s) => s.id === p.data.szervezet_id);
    const valaszObj = valasz({ szervezet: { id: p.data.szervezet_id, nev: sz?.nev ?? "" } });
    // V1: ha a fiók még nem választott nyelvet, a süti az ÚJ munkatér első tartalomnyelvére áll.
    if (ktx.fiok.nyelv === null) {
      const nyelv = await hatasosNyelv(ktx.fiok, p.data.szervezet_id);
      if (nyelv) valaszObj.headers.append("set-cookie", nyelvSutiFejlec(nyelv));
    }
    return valaszObj;
  } catch (h) {
    console.error("Szervezet valt POST hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
