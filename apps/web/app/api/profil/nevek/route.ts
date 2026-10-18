import { kapu } from "../../_kapu";
import { hivatalosNevekMent, profilBetolt } from "../../../../profil";

export const dynamic = "force-dynamic";

const valasz = (adat: unknown, status = 200) => Response.json(adat, { status, headers: { "cache-control": "no-store" } });

// R-18 6. kör (Kati D) · „Hivatalos nevek”: GET — a lista (a tag is látja); PUT {nevek: [{hu, ro, en}]} — a teljes lista mentése.
// Szerkesztő menthet (a posztíró ugyanaz, aki a neveket ismeri); a szervezet a munkamenetből jön, a sor a saját szervezet szabályán át íródik.
export async function GET(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "tag");
    if (e instanceof Response) return e;
    const p = await profilBetolt(e.szervezet.id);
    return valasz({ nevek: p?.hivatalos_nevek ?? [], van_profil: !!p });
  } catch (h) {
    console.error("Hivatalos nevek GET hiba:", h);
    return valasz({ hiba: "BELSO_HIBA" }, 500);
  }
}

export async function PUT(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const eredmeny = await hivatalosNevekMent(e.szervezet.id, await keres.json().catch(() => null));
    if (!eredmeny.ok) {
      if (eredmeny.hiba === "NINCS_JOG") return valasz({ hiba: "NINCS_JOG" }, 409);
      return valasz({ hiba: "ERVENYTELEN_ADAT", mezok: eredmeny.mezok ?? {} }, 400);
    }
    return valasz({ nevek: eredmeny.ertek.hivatalos_nevek ?? [] });
  } catch (h) {
    console.error("Hivatalos nevek PUT hiba:", h);
    return valasz({ hiba: "BELSO_HIBA" }, 500);
  }
}
