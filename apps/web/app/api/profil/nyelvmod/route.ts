import { kapu } from "../../_kapu";
import { nyelvModMent, profilBetolt } from "../../../../profil";
import { nyelvMod } from "@rogton/profile-core";

export const dynamic = "force-dynamic";

const valasz = (adat: unknown, status = 200) => Response.json(adat, { status, headers: { "cache-control": "no-store" } });

// c30 F3 (rajz D5 + D9b): a posztok nyelvi módja. GET — a tag is látja; PUT {mod: "egy" | "egyben" | "kulon"} — szerkesztő menthet (aki
// posztol, az dönt a poszt nyelvéről, mint a kínálatnál). A szervezet a munkamenetből jön; a profil sora a saját szervezet szabályán át íródik.
export async function GET(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "tag");
    if (e instanceof Response) return e;
    const p = await profilBetolt(e.szervezet.id);
    return valasz({ van_profil: !!p, nyelvek: p?.nyelvek ?? [], mod: nyelvMod(p) });
  } catch (h) {
    console.error("Nyelvi mód GET hiba:", h);
    return valasz({ hiba: "BELSO_HIBA" }, 500);
  }
}

export async function PUT(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const r = await nyelvModMent(e.szervezet.id, await keres.json().catch(() => null));
    if (!r.ok) {
      if (r.hiba === "NINCS_JOG") return valasz({ hiba: "NINCS_PROFIL" }, 409);
      return valasz({ hiba: "ERVENYTELEN_ADAT", mezok: r.mezok ?? {} }, 400);
    }
    return valasz({ mod: r.ertek });
  } catch (h) {
    console.error("Nyelvi mód PUT hiba:", h);
    return valasz({ hiba: "BELSO_HIBA" }, 500);
  }
}
