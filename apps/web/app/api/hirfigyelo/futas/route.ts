import { z } from "zod";
import { belepettSzervezet, hiba, kapu, valasz } from "../_kozos";
import { hostKontextus, kornyezet } from "../../../../hirfigyelo";
import { aktivVerzio, jogosult } from "@rogton/news-monitor-core";
import { sorbaTesz, szervezetSora } from "../../../../hirfigyelo/sor";
import { keresNyelve } from "../../../../nyelv/keresbol";

export const dynamic = "force-dynamic";

const futasSchema = z.object({
  proba: z.boolean().optional(),
});

export async function POST(keres: Request): Promise<Response> {
  try {
    const eredmeny = await kapu(keres, "szerkeszto");
    if (eredmeny instanceof Response) return eredmeny;
    const ktx = hostKontextus(eredmeny.fiok, eredmeny.szervezet.id);
    if (!ktx) return hiba({ hiba: "NINCS_JOG" }, 403);
    if (!jogosult(ktx.szerep, "futtat")) return hiba({ hiba: "NINCS_JOG" }, 403);
    const be = await keres.json().catch(() => null);
    const ell = futasSchema.safeParse(be);
    if (!ell.success) return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    const k = await kornyezet(eredmeny.szervezet.id);
    if (!aktivVerzio(await k.tar.verziok(eredmeny.szervezet.id))) return hiba({ hiba: "NINCS_BEALLITAS" }, 409);
    const e = await sorbaTesz(eredmeny.szervezet.id, "futas", { proba: !!ell.data.proba, nyelv: eredmeny.fiok.nyelv ?? keresNyelve(keres) });
    if (!e.ok) return hiba({ hiba: "FUT_MAR" }, 409);
    return valasz({ hirfigyelo: { sor: e.sor } }, 202);
  } catch (h) {
    console.error("Hirfigyelo futas POST hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}

export async function GET(keres: Request): Promise<Response> {
  try {
    const eredmeny = await kapu(keres, "tag");
    if (eredmeny instanceof Response) return eredmeny;
    const ktx = hostKontextus(eredmeny.fiok, eredmeny.szervezet.id);
    if (!ktx) return hiba({ hiba: "NINCS_JOG" }, 403);
    const k = await kornyezet(eredmeny.szervezet.id);
    const futasok = await k.tar.futasok(eredmeny.szervezet.id);
    const sor = await szervezetSora(eredmeny.szervezet.id);
    return valasz({ hirfigyelo: { futasok, sor } });
  } catch (h) {
    console.error("Hirfigyelo futas GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
