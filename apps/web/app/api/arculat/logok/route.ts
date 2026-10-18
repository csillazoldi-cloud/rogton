import { kapu } from "../../_kapu";
import { hiba, valasz } from "../../tema/_kozos";
import { fajlKornyezet } from "../../../../fajl";
import { szerepFordit } from "../../../../hozzaferes";
import { fajlLista, hasznaltLogok, LOGO_VALTOZATOK, type FajlMeta, type LogoValtozat } from "@rogton/fajl-core";

export const dynamic = "force-dynamic";

// R-16 K1 (TERV 2-K1, gepezet 2): GET — a négy logóhely, ahogy a képek használják: helyenként a legfrissebb, képre alkalmas
// fájl (`hasznaltLogok`, A5 szabály). `200 { logok: { vilagos: FajlMeta | null, sotet, egyszinu, negyzetes } }`. Bármely tag olvashatja.
export async function GET(keres: Request): Promise<Response> {
  try {
    const ktx = await kapu(keres, "tag");
    if (ktx instanceof Response) return ktx;
    const e = await fajlLista(fajlKornyezet(), {
      fiok_id: ktx.fiok.id,
      szervezet_id: ktx.szervezet.id,
      szerep: szerepFordit(ktx.szerep),
    }, "logo");
    if (!e.ok) return hiba({ hiba: e.hiba }, 403);
    const idk = hasznaltLogok(e.ertek, null);
    const logok = {} as Record<LogoValtozat, FajlMeta | null>;
    for (const h of LOGO_VALTOZATOK) logok[h] = e.ertek.find((f) => f.id === idk[h]) ?? null;
    return valasz({ logok });
  } catch (h) {
    console.error("Arculat logok GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
