import { EsemenyFajta } from "@km/esemeny-core";
import { kapu } from "../_kapu";
import { hiba, valasz } from "../tema/_kozos";
import { esemenyKornyezet, naplo } from "../../../esemeny";

export const dynamic = "force-dynamic";

/** F-5: a munkatér eseménynaplója — bármely tag olvashatja. `?fajta=` és `?limit=` szűrő. */
export async function GET(keres: Request): Promise<Response> {
  try {
    const ktx = await kapu(keres, "tag");
    if (ktx instanceof Response) return ktx;
    const url = new URL(keres.url);
    const nyersFajta = url.searchParams.get("fajta");
    const fajtaE = nyersFajta === null ? null : EsemenyFajta.safeParse(nyersFajta);
    if (fajtaE && !fajtaE.success) return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    const nyersLimit = url.searchParams.get("limit");
    const limit = nyersLimit === null ? undefined : Number(nyersLimit);
    if (limit !== undefined && (!Number.isInteger(limit) || limit < 1 || limit > 500)) return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    const k = await esemenyKornyezet();
    // a kapu szerepe és a modul szerepe ugyanazok a szavak — ez a befogadó fordítása
    const e = await naplo(k, { fiok_id: ktx.fiok.id, szervezet_id: ktx.szervezet.id, szerep: ktx.szerep }, { ...(fajtaE ? { fajta: fajtaE.data } : {}), ...(limit !== undefined ? { limit } : {}) });
    if (!e.ok) return hiba({ hiba: e.hiba === "NINCS_JOG" ? "NINCS_JOG" : "ERVENYTELEN_ADAT" }, e.hiba === "NINCS_JOG" ? 403 : 400);
    return valasz({ esemeny: e.ertek });
  } catch (h) {
    console.error("Esemenyek GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
