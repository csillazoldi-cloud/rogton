import { z } from "zod";
import { kapu } from "../../_kapu";
import { hiba, valasz } from "../../tema/_kozos";
import { hozzaferesKornyezet, szerepFordit } from "../../../../hozzaferes";
import { nyilvanosCim } from "../../../../hitelesites/nyilvanos-cim";
import { meghiv, meghivoLista, Szerep } from "@km/hozzaferes-core";

export const dynamic = "force-dynamic";

const MeghivBe = z.object({
  szerep: Szerep,
  email: z.string().email().nullish(),
});

export async function GET(keres: Request): Promise<Response> {
  try {
    const ktx = await kapu(keres, "szerkeszto");
    if (ktx instanceof Response) return ktx;
    const k = hozzaferesKornyezet();
    const e = await meghivoLista(k, {
      fiok_id: ktx.fiok.id,
      szervezet_id: ktx.szervezet.id,
      szerep: szerepFordit(ktx.szerep),
    });
    if (!e.ok) return hiba({ hiba: e.hiba }, 403);
    return valasz({ hozzaferes: e.ertek });
  } catch (h) {
    console.error("Meghivo GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}

export async function POST(keres: Request): Promise<Response> {
  try {
    const ktx = await kapu(keres, "szerkeszto");
    if (ktx instanceof Response) return ktx;
    const nyers = await keres.json().catch(() => null);
    const p = MeghivBe.safeParse(nyers);
    if (!p.success) return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    const k = hozzaferesKornyezet();
    const e = await meghiv(k, {
      fiok_id: ktx.fiok.id,
      szervezet_id: ktx.szervezet.id,
      szerep: szerepFordit(ktx.szerep),
    }, { szerep: p.data.szerep, email: p.data.email ?? null });
    if (!e.ok) {
      switch (e.hiba) {
        case "NINCS_JOG":
        case "NAGYOBB_SZEREP":
          return hiba({ hiba: e.hiba }, 403);
        case "ERVENYTELEN_ADAT":
          return hiba({ hiba: e.hiba }, 400);
        default:
          return hiba({ hiba: e.hiba }, 500);
      }
    }
    // A jegy EGYSZER jön vissza; a link a később épülő lapra mutat.
    return valasz({
      hozzaferes: {
        meghivo: e.ertek.meghivo,
        jegy: e.ertek.jegy,
        // F9-L5: a teljes, nyilvános cím (a proxy fejléceiből), nem a belső út
        link: nyilvanosCim(keres, `/meghivo/${e.ertek.jegy}`).toString(),
      },
    }, 201); // létrehozás: 201
  } catch (h) {
    console.error("Meghivo POST hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
