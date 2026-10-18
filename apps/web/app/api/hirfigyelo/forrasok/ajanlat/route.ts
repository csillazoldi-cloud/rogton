import { forrasAjanlo } from "@rogton/news-monitor-core";
import { z } from "zod";
import { hiba, kapu, valasz } from "../../_kozos";

export const dynamic = "force-dynamic";

const ajanlatSchema = z.object({
  nyelvek: z.array(z.string().min(2).max(5)).max(10),
  szoveg: z.string().max(6000),
});

export async function POST(keres: Request): Promise<Response> {
  try {
    const eredmeny = await kapu(keres, "szerkeszto");
    if (eredmeny instanceof Response) return eredmeny;
    const be = await keres.json().catch(() => null);
    const ell = ajanlatSchema.safeParse(be);
    if (!ell.success) return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    const nyelv = (eredmeny.fiok.nyelv ?? "hu") as "hu" | "ro" | "en";
    const ajanlat = forrasAjanlo({
      nyelvek: ell.data.nyelvek,
      szoveg: ell.data.szoveg,
      nyelv,
    });
    return valasz({ hirfigyelo: { ajanlat } });
  } catch (h) {
    console.error("Hirfigyelo forrasok ajanlat POST hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
