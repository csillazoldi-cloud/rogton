import "server-only";
import { kapu } from "../../_kapu";
import { hiba, valasz } from "../../hirfigyelo/_kozos";
import { csomagok, napiCsomagKeszit } from "../../../../visszajelzes";

export const dynamic = "force-dynamic";

/** A mai nap kulcsa Europe/Budapest szerint (YYYY-MM-DD). */
function maiNapBudapest(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Budapest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}

export async function GET(keres: Request): Promise<Response> {
  try {
    const kapuValasz = await kapu(keres, "belepett");
    if (kapuValasz instanceof Response) return kapuValasz;
    const { fiok, szerep } = kapuValasz;

    if (!fiok.rendszergazda && szerep !== "tulajdonos") return hiba({ hiba: "NINCS_JOG" }, 403);

    const lista = await csomagok();
    return valasz({ visszajelzes: { csomagok: lista } });
  } catch (h) {
    console.error("[visszajelzes/csomag] GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}

export async function POST(keres: Request): Promise<Response> {
  try {
    const kapuValasz = await kapu(keres, "rendszergazda");
    if (kapuValasz instanceof Response) return kapuValasz;

    let nap = maiNapBudapest();
    try {
      const torzs = (await keres.json()) as { nap?: unknown } | null;
      if (torzs && typeof torzs.nap === "string" && /^\d{4}-\d{2}-\d{2}$/.test(torzs.nap)) nap = torzs.nap;
    } catch {
      // üres törzs: a mai nap
    }

    const eredmeny = await napiCsomagKeszit(nap, "hu");
    if (!eredmeny.ok) {
      const status = eredmeny.hiba === "AI_KERET_KIMERULT" ? 503 : 503;
      return hiba({ hiba: eredmeny.hiba }, status);
    }
    return valasz({ visszajelzes: { csomag: eredmeny.csomag } });
  } catch (h) {
    console.error("[visszajelzes/csomag] POST hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
