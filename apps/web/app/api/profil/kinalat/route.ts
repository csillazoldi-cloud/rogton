import { kapu } from "../../_kapu";
import { kinalatMent, profilBetolt } from "../../../../profil";

export const dynamic = "force-dynamic";

const valasz = (adat: unknown, status = 200) => Response.json(adat, { status, headers: { "cache-control": "no-store" } });

// R-18 7. kör (IRANYOK-round7.md): „Kínálat és árak” + tématerv. GET — a tag is látja; PUT — egy vagy több rész (kinalat, arak_posztban,
// kozossegi_oldal, tema_terv, kepernyokepek, kesz). Szerkesztő menthet (mint a Hivatalos neveket: aki posztol, az ismeri a kínálatot);
// a profil többi része marad a tulajdonosé. A szervezet a munkamenetből jön, a sor a saját szervezet szabályán át íródik.
export async function GET(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "tag");
    if (e instanceof Response) return e;
    const p = await profilBetolt(e.szervezet.id);
    return valasz({
      van_profil: !!p,
      kinalat: p?.kinalat ?? [],
      arak_posztban: p?.arak_posztban ?? null,
      kozossegi_oldal: p?.kozossegi_oldal ?? "",
      tema_terv: p?.tema_terv ?? [],
    });
  } catch (h) {
    console.error("Kínálat GET hiba:", h);
    return valasz({ hiba: "BELSO_HIBA" }, 500);
  }
}

export async function PUT(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const eredmeny = await kinalatMent(e.szervezet.id, await keres.json().catch(() => null));
    if (!eredmeny.ok) {
      if (eredmeny.hiba === "NINCS_JOG") return valasz({ hiba: "NINCS_PROFIL" }, 409);
      return valasz({ hiba: "ERVENYTELEN_ADAT", mezok: eredmeny.mezok ?? {} }, 400);
    }
    const p = eredmeny.ertek;
    return valasz({ kinalat: p.kinalat ?? [], arak_posztban: p.arak_posztban ?? null, kozossegi_oldal: p.kozossegi_oldal ?? "", tema_terv: p.tema_terv ?? [] });
  } catch (h) {
    console.error("Kínálat PUT hiba:", h);
    return valasz({ hiba: "BELSO_HIBA" }, 500);
  }
}
