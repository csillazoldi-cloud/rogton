import { kapu } from "../../_kapu";
import { hiba, valasz } from "../../tema/_kozos";
import { jelszotValt } from "../../../../hitelesites/sajat";
import { munkamenetTokenKeresbol } from "../../../../hitelesites/suti";

export const dynamic = "force-dynamic";

export async function PUT(keres: Request): Promise<Response> {
  const belepo = await kapu(keres, "belepett");
  if (belepo instanceof Response) return belepo;

  const token = munkamenetTokenKeresbol(keres);
  if (!token) return hiba({ hiba: "NINCS_BELEPVE" }, 401);

  let torzs: unknown;
  try {
    torzs = await keres.json();
  } catch {
    return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
  }

  const eredmeny = await jelszotValt(belepo.fiok.id, torzs, token);
  if (!eredmeny.ok) {
    switch (eredmeny.hiba) {
      case "GYENGE_JELSZO":
        return hiba({ hiba: eredmeny.hiba }, 400);
      case "ERVENYTELEN_ADAT":
        return hiba({ hiba: eredmeny.hiba }, 400);
      case "ROSSZ_JELENLEGI_JELSZO":
        // 400, nem 403: a 403 a rendszerben a „kevés a szerep" jele (a jogosultsági mátrix is annak méri) — itt a bemenet rossz
        return hiba({ hiba: eredmeny.hiba }, 400);
      default:
        return hiba({ hiba: "BELSO_HIBA" }, 500);
    }
  }
  return valasz({ fiok: { masEszkozokKileptetve: eredmeny.ertek.masEszkozokKileptetve } }, 200);
}
