import { forrasHozzaad } from "@rogton/news-monitor-core";
import { z } from "zod";
import { belepettSzervezet, eredmenyValasz, hiba, kapu, valasz } from "../_kozos";
import { hostKontextus, kornyezet } from "../../../../hirfigyelo";
import { szervezetCsomag } from "../../../../csomag";

export const dynamic = "force-dynamic";

const forrasHozzaadSchema = z.object({
  cim: z.string().min(1),
});

export async function GET(keres: Request): Promise<Response> {
  try {
    const eredmeny = await kapu(keres, "tag");
    if (eredmeny instanceof Response) return eredmeny;
    const ktx = hostKontextus(eredmeny.fiok, eredmeny.szervezet.id);
    if (!ktx) return hiba({ hiba: "NINCS_JOG" }, 403);
    const k = await kornyezet(eredmeny.szervezet.id);
    const forrasok = await k.tar.forrasok(eredmeny.szervezet.id);
    const forras_max = await szervezetCsomag(eredmeny.szervezet.id)
      .then((cs) => cs.forras_max)
      .catch(() => null);
    return valasz({ hirfigyelo: { forrasok, forras_max } });
  } catch (h) {
    console.error("Hirfigyelo forrasok GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}

export async function POST(keres: Request): Promise<Response> {
  try {
    const eredmeny = await kapu(keres, "szerkeszto");
    if (eredmeny instanceof Response) return eredmeny;
    const ktx = hostKontextus(eredmeny.fiok, eredmeny.szervezet.id);
    if (!ktx) return hiba({ hiba: "NINCS_JOG" }, 403);
    const be = await keres.json().catch(() => null);
    const ell = forrasHozzaadSchema.safeParse(be);
    if (!ell.success) return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    const k = await kornyezet(eredmeny.szervezet.id);
    // F9-A8: a csomag forrás-korlátja — a próbaidőszakban 5
    const cs = await szervezetCsomag(eredmeny.szervezet.id).catch(() => null);
    if (typeof cs?.forras_max === "number") {
      const meglevo = await k.tar.forrasok(eredmeny.szervezet.id);
      if (meglevo.length >= cs.forras_max) return hiba({ hiba: "FORRAS_KORLAT" }, 403);
    }
    return eredmenyValasz(await forrasHozzaad(k, ktx, ell.data.cim, "kezi"));
  } catch (h) {
    console.error("Hirfigyelo forrasok POST hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
