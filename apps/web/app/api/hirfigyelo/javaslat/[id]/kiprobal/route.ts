import { jogosult } from "@km/news-monitor-core";
import { belepettSzervezet, hiba, kapu, valasz } from "../../../_kozos";
import { hostKontextus, kornyezet } from "../../../../../../hirfigyelo";
import { sorbaTesz } from "../../../../../../hirfigyelo/sor";
import { keresNyelve } from "../../../../../../nyelv/keresbol";

export const dynamic = "force-dynamic";

/**
 * A javaslat kipróbálása ugyanazon a mintán (E-26): cikkenként egy AI-hívás, valódi AI-val percekig tart → a háttérbe megy (E-22 sor),
 * a válasz 202 + a sor tétele; az eredmény (`osszehasonlitas`) a tétel `eredmeny`-ében (`GET futas/sor/{id}`). A javaslat léte és a minta
 * itt ellenőrzött, hogy a hiba azonnal látsszon (404 / 409 MINTA_LEJART), ne a háttérben.
 */
export async function POST(keres: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const { id } = await ctx.params;
    const eredmeny = await kapu(keres, "szerkeszto");
    if (eredmeny instanceof Response) return eredmeny;
    const ktx = hostKontextus(eredmeny.fiok, eredmeny.szervezet.id);
    if (!ktx) return hiba({ hiba: "NINCS_JOG" }, 403);
    if (!jogosult(ktx.szerep, "javaslat_dont")) return hiba({ hiba: "NINCS_JOG" }, 403);
    const k = await kornyezet(eredmeny.szervezet.id, undefined, eredmeny.fiok.id); // R-13: a néző szűrő-beállításával
    const javaslat = (await k.tar.javaslatok(eredmeny.szervezet.id)).find((j) => j.id === id);
    if (!javaslat) return hiba({ hiba: "NINCS_ILYEN_JAVASLAT" }, 404);
    const mintak = await k.tar.mintak(eredmeny.szervezet.id);
    const minta = [...mintak].sort((a, b) => new Date(b.letrehozva).getTime() - new Date(a.letrehozva).getTime())[0];
    if (!minta || new Date(minta.lejar) <= k.most()) return hiba({ hiba: "MINTA_LEJART" }, 409);
    const e = await sorbaTesz(eredmeny.szervezet.id, "kiprobal", { javaslat_id: id, nyelv: eredmeny.fiok.nyelv ?? keresNyelve(keres), fiok_id: eredmeny.fiok.id });
    if (!e.ok) return hiba({ hiba: "FUT_MAR" }, 409);
    return valasz({ hirfigyelo: { sor: e.sor } }, 202);
  } catch (h) {
    console.error("Hirfigyelo javaslat kiprobal POST hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
