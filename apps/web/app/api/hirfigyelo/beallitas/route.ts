import { aktivVerzio, beallitasMent, tervezetMent } from "@km/news-monitor-core";
import { belepettSzervezet, eredmenyValasz, hiba, kapu, valasz } from "../_kozos";
import { hostKontextus, kornyezet } from "../../../../hirfigyelo";

export const dynamic = "force-dynamic";

export async function GET(keres: Request): Promise<Response> {
  try {
    const eredmeny = await kapu(keres, "tag");
    if (eredmeny instanceof Response) return eredmeny;
    const ktx = hostKontextus(eredmeny.fiok, eredmeny.szervezet.id);
    if (!ktx) return hiba({ hiba: "NINCS_JOG" }, 403);
    const k = await kornyezet(eredmeny.szervezet.id);
    const verziok = await k.tar.verziok(eredmeny.szervezet.id);
    const tervezet = await k.tar.tervezet(eredmeny.szervezet.id, ktx.fiok_id);
    return valasz({ hirfigyelo: { verziok, aktiv: aktivVerzio(verziok), tervezet } });
  } catch (h) {
    console.error("Hirfigyelo beallitas GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}

export async function PUT(keres: Request): Promise<Response> {
  try {
    const eredmeny = await kapu(keres, "szerkeszto");
    if (eredmeny instanceof Response) return eredmeny;
    const ktx = hostKontextus(eredmeny.fiok, eredmeny.szervezet.id);
    if (!ktx) return hiba({ hiba: "NINCS_JOG" }, 403);
    const be = await keres.json().catch(() => null);
    const k = await kornyezet(eredmeny.szervezet.id);
    return eredmenyValasz(await beallitasMent(k, ktx, be, "kezi"));
  } catch (h) {
    console.error("Hirfigyelo beallitas PUT hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
