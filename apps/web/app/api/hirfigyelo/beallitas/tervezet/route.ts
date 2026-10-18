import { Beallitas, tervezetMent } from "@km/news-monitor-core";
import { belepettSzervezet, eredmenyValasz, hiba, kapu, valasz } from "../../_kozos";
import { hostKontextus, kornyezet } from "../../../../../hirfigyelo";

export const dynamic = "force-dynamic";

export async function PUT(keres: Request): Promise<Response> {
  try {
    const eredmeny = await kapu(keres, "szerkeszto");
    if (eredmeny instanceof Response) return eredmeny;
    const ktx = hostKontextus(eredmeny.fiok, eredmeny.szervezet.id);
    if (!ktx) return hiba({ hiba: "NINCS_JOG" }, 403);
    const be = await keres.json().catch(() => null);
    const e = Beallitas.safeParse(be);
    if (!e.success) return valasz({ hiba: "ERVENYTELEN_ADAT", hibak: e.error.issues }, 400);
    const k = await kornyezet(eredmeny.szervezet.id);
    return eredmenyValasz(await tervezetMent(k, ktx, e.data));
  } catch (h) {
    console.error("Hirfigyelo tervezet PUT hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}

export async function DELETE(keres: Request): Promise<Response> {
  try {
    const eredmeny = await kapu(keres, "szerkeszto");
    if (eredmeny instanceof Response) return eredmeny;
    const ktx = hostKontextus(eredmeny.fiok, eredmeny.szervezet.id);
    if (!ktx) return hiba({ hiba: "NINCS_JOG" }, 403);
    const k = await kornyezet(eredmeny.szervezet.id);
    return eredmenyValasz(await tervezetMent(k, ktx, null));
  } catch (h) {
    console.error("Hirfigyelo tervezet DELETE hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
