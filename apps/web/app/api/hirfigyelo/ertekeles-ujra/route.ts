import { belepettSzervezet, hiba, kapu, valasz } from "../_kozos";
import { hostKontextus } from "../../../../hirfigyelo";
import { jogosult } from "@km/news-monitor-core";
import { sorbaTesz } from "../../../../hirfigyelo/sor";
import { keresNyelve } from "../../../../nyelv/keresbol";

export const dynamic = "force-dynamic";

export async function POST(keres: Request): Promise<Response> {
  try {
    const eredmeny = await kapu(keres, "szerkeszto");
    if (eredmeny instanceof Response) return eredmeny;
    const ktx = hostKontextus(eredmeny.fiok, eredmeny.szervezet.id);
    if (!ktx) return hiba({ hiba: "NINCS_JOG" }, 403);
    if (!jogosult(ktx.szerep, "futtat")) return hiba({ hiba: "NINCS_JOG" }, 403);
    const e = await sorbaTesz(eredmeny.szervezet.id, "ertekeles_ujra", { nyelv: eredmeny.fiok.nyelv ?? keresNyelve(keres) });
    if (!e.ok) return hiba({ hiba: "FUT_MAR" }, 409);
    return valasz({ hirfigyelo: { sor: e.sor } }, 202);
  } catch (h) {
    console.error("Hirfigyelo ertekeles-ujra POST hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
