import { kapu } from "../../_kapu";
import { rendezvenyMent } from "../../../../profil";
import { kepFordit } from "../../../../vizual/melle";

export const dynamic = "force-dynamic";

const valasz = (adat: unknown, status = 200) => Response.json(adat, { status, headers: { "cache-control": "no-store" } });

// c30 F6 (rajz D2 „Mikor és hol lesz?”): PUT {mettol, meddig, hely: {hu, ro, …}, belepo} — a szerkesztő menti (aki a programot is
// kezeli). A szervezet a munkamenetből jön; csak a profil `rendezveny` mezője íródik (mezoMent, a saját szervezet szabályán át).
export async function PUT(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    // a második nyelvű helyszínt a gép csak akkor fordítja újra, ha még a gépé (profil/tipus-szabaly.ts helyTerv)
    const r = await rendezvenyMent(e.szervezet.id, await keres.json().catch(() => null), (szoveg, cel) => kepFordit(e.szervezet.id, e.fiok.id, { szoveg, cel }));
    if (!r.ok) {
      if (r.hiba === "NINCS_JOG") return valasz({ hiba: "NINCS_PROFIL" }, 409);
      return valasz({ hiba: "ERVENYTELEN_ADAT", mezok: r.mezok ?? {} }, 400);
    }
    return valasz({ rendezveny: r.ertek });
  } catch (h) {
    console.error("Rendezvény PUT hiba:", h);
    return valasz({ hiba: "BELSO_HIBA" }, 500);
  }
}
