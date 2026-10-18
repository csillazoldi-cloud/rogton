import { z } from "zod";
import { kapu } from "../../_kapu";
import { hiba, valasz } from "../../tema/_kozos";
import { hozzaferesKornyezet, szerepFordit } from "../../../../hozzaferes";
import { aktualisSzervezetValaszt } from "../../../../hitelesites";
import { kilep } from "@km/hozzaferes-core";

export const dynamic = "force-dynamic";

const keresSema = z.object({ szervezet_id: z.uuid().optional() });

export async function POST(keres: Request): Promise<Response> {
  try {
    const ktx = await kapu(keres, "tag");
    if (ktx instanceof Response) return ktx;

    let nyers: unknown = {};
    try {
      nyers = await keres.json();
    } catch {
      nyers = {};
    }
    const p = keresSema.safeParse(nyers ?? {});
    if (!p.success) return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    const celId = p.data.szervezet_id;

    let celSzervezetId = ktx.szervezet.id;
    let celSzerep = szerepFordit(ktx.szerep);

    if (celId !== undefined && celId !== ktx.szervezet.id) {
      const tagsag = ktx.fiok.szervezetek.find((sz) => sz.id === celId);
      if (!tagsag) return hiba({ hiba: "NINCS_JOG" }, 403);
      celSzervezetId = tagsag.id;
      celSzerep = szerepFordit(tagsag.szerep);
    }

    const k = hozzaferesKornyezet();
    const e = await kilep(k, {
      fiok_id: ktx.fiok.id,
      szervezet_id: celSzervezetId,
      szerep: celSzerep,
    });
    if (!e.ok) {
      switch (e.hiba) {
        case "NINCS_JOG":
          return hiba({ hiba: e.hiba }, 403);
        case "UTOLSO_TULAJDONOS":
          return hiba({ hiba: e.hiba }, 409);
        default:
          return hiba({ hiba: e.hiba }, 500);
      }
    }

    let kovetkezo_szervezet_id: string | null = ktx.szervezet.id;
    if (celSzervezetId === ktx.szervezet.id) {
      const maradek = ktx.fiok.szervezetek.filter((sz) => sz.id !== celSzervezetId);
      const kovetkezo = maradek[0];
      if (kovetkezo) {
        await aktualisSzervezetValaszt(ktx.fiok.id, kovetkezo.id);
        kovetkezo_szervezet_id = kovetkezo.id;
      } else {
        kovetkezo_szervezet_id = null;
      }
    }

    return valasz({ hozzaferes: e.ertek, kovetkezo_szervezet_id });
  } catch (h) {
    console.error("Kilep hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
