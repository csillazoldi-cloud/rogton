import { kapu } from "../../_kapu";
import { hiba, valasz } from "../../tema/_kozos";
import { nevetModosit } from "../../../../hitelesites/sajat";

export const dynamic = "force-dynamic";

export async function PUT(keres: Request): Promise<Response> {
  const belepo = await kapu(keres, "belepett");
  if (belepo instanceof Response) return belepo;

  let torzs: unknown;
  try {
    torzs = await keres.json();
  } catch {
    return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
  }

  const eredmeny = await nevetModosit(belepo.fiok.id, torzs);
  if (!eredmeny.ok) {
    switch (eredmeny.hiba) {
      case "ERVENYTELEN_ADAT":
        return hiba({ hiba: eredmeny.hiba }, 400);
      default:
        return hiba({ hiba: "BELSO_HIBA" }, 500);
    }
  }
  return valasz({ fiok: { nev: eredmeny.ertek.nev } }, 200);
}
