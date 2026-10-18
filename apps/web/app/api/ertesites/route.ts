import { kapu } from "../_kapu";
import { hiba, valasz } from "../tema/_kozos";
import { esemenyKornyezet, ertesitesLekerdez, ertesitesSzervezetiMent } from "../../../esemeny";

export const dynamic = "force-dynamic";

/** F-5: az értesítés két szintje — GET bármely tagnak (közös, szervezeti, hatásos), PUT a tulajdonosnak (a szervezeti felülírás). */
export async function GET(keres: Request): Promise<Response> {
  try {
    const ktx = await kapu(keres, "tag");
    if (ktx instanceof Response) return ktx;
    const k = await esemenyKornyezet();
    const e = await ertesitesLekerdez(k, { fiok_id: ktx.fiok.id, szervezet_id: ktx.szervezet.id, szerep: ktx.szerep });
    if (!e.ok) return hiba({ hiba: e.hiba === "NINCS_JOG" ? "NINCS_JOG" : "ERVENYTELEN_ADAT" }, e.hiba === "NINCS_JOG" ? 403 : 400);
    // R-5: a kimenő csatorna be van-e kötve — csak igen/nem, a cím titok (a NAS .env-je), a felületen soha
    return valasz({ beallitas: e.ertek, bekotve: Boolean(process.env["ERTESITES_WEBHOOK_URL"]) });
  } catch (h) {
    console.error("Ertesites GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}

export async function PUT(keres: Request): Promise<Response> {
  try {
    const ktx = await kapu(keres, "tulajdonos");
    if (ktx instanceof Response) return ktx;
    const torzs = await keres.json().catch(() => null);
    const k = await esemenyKornyezet();
    const e = await ertesitesSzervezetiMent(k, { fiok_id: ktx.fiok.id, szervezet_id: ktx.szervezet.id, szerep: ktx.szerep }, torzs);
    if (!e.ok) return hiba({ hiba: e.hiba === "NINCS_JOG" ? "NINCS_JOG" : "ERVENYTELEN_ADAT" }, e.hiba === "NINCS_JOG" ? 403 : 400);
    return valasz({ beallitas: e.ertek });
  } catch (h) {
    console.error("Ertesites PUT hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
