import "server-only";
import { kapu } from "../_kapu";
import { hiba, valasz } from "../hirfigyelo/_kozos";
import { bekuld, lista, NEVTELEN_HATAR } from "../../../visszajelzes";
import { aktualisSzervezet } from "../../../hitelesites";
import { keresCime, kiserletNaplo, korlatEllenoriz } from "../../../hitelesites/korlat";
import { VisszajelzesAllapot } from "@km/visszajelzes-core";

export const dynamic = "force-dynamic";

/** A kérés törzse szövegként, legfeljebb `hatar` bájtig; ha több jönne, `null` (és nem olvas tovább). */
async function korlatosanOlvas(keres: Request, hatar: number): Promise<string | null> {
  if (!keres.body) return "";
  const olvaso = keres.body.getReader();
  const darabok: Uint8Array[] = [];
  let osszes = 0;
  for (;;) {
    const { done, value } = await olvaso.read();
    if (done) break;
    osszes += value.byteLength;
    if (osszes > hatar) {
      await olvaso.cancel().catch(() => undefined);
      return null;
    }
    darabok.push(value);
  }
  return Buffer.concat(darabok).toString("utf8");
}

export async function POST(keres: Request): Promise<Response> {
  try {
    // 0148 (Kati 10-02, Csilla 10-06): a lebegő gomb a belépés ELŐTTI lapokon is ott van (fiók létrehozása, belépés, első beállítás).
    // Ezért a szint NYILVÁNOS — de két úton:
    //   - belépett fiók, munkatérrel: mint eddig (ugyanaz, amit a „tag” szint adott — a szervezet a fiók saját tagságából jön);
    //   - munkamenet nélkül (NÉVTELEN), vagy belépve, de még munkatér nélkül: a belépési védelem mintájára SZŰK út — cím szerinti
    //     sebességkorlát (hitelesites/korlat.ts „visszajelzes”: 10 / óra, minden kísérlet számít), törzsméret-határ a beolvasás ELŐTT,
    //     rövidebb szöveg, és kép csak a modul saját PNG-képernyőképe lehet (visszajelzes/index.ts NEVTELEN_HATAR).
    const { fiok } = await kapu(keres, "nyilvanos");
    const szervezet = fiok ? aktualisSzervezet(fiok) : null;
    if (fiok && szervezet) {
      let torzs: unknown;
      try {
        torzs = await keres.json();
      } catch {
        return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
      }
      const eredmeny = await bekuld({ nevtelen: false, fiok: { id: fiok.id, nev: fiok.nev }, szervezet }, torzs);
      if (!eredmeny.ok) return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
      return valasz({ visszajelzes: { id: eredmeny.id } }, 201);
    }

    // --- a szűk út (nincs munkatér) ---
    const cim = keresCime(keres.headers);
    const allas = await korlatEllenoriz("visszajelzes", null, cim);
    if (!allas.szabad) {
      const v = hiba({ hiba: "TUL_SOK_KISERLET", mezok: { ujra_perc: String(allas.ujraPerc) } }, 429);
      v.headers.set("retry-after", String(allas.ujraPerc * 60));
      return v;
    }
    // MINDEN kísérlet bekerül a naplóba (a sikeres is — a korlát mindet számolja), a valós kimenetellel
    const valaszNaplozva = async (v: Response, sikeres: boolean): Promise<Response> => {
      await kiserletNaplo("visszajelzes", null, cim, sikeres);
      return v;
    };
    const hossz = Number(keres.headers.get("content-length") ?? "0");
    if (!Number.isFinite(hossz) || hossz > NEVTELEN_HATAR.torzsBajt) return valaszNaplozva(hiba({ hiba: "TUL_NAGY" }, 413), false);
    const nyers = await korlatosanOlvas(keres, NEVTELEN_HATAR.torzsBajt); // fejléc nélküli (darabolt) törzsnél is megáll a határon
    if (nyers === null) return valaszNaplozva(hiba({ hiba: "TUL_NAGY" }, 413), false);
    let torzs: unknown;
    try {
      torzs = JSON.parse(nyers);
    } catch {
      return valaszNaplozva(hiba({ hiba: "ERVENYTELEN_ADAT" }, 400), false);
    }
    const bekuldo = fiok ? { nevtelen: false as const, fiok: { id: fiok.id, nev: fiok.nev }, szervezet: null } : { nevtelen: true as const };
    const eredmeny = await bekuld(bekuldo, torzs);
    if (!eredmeny.ok) return valaszNaplozva(hiba({ hiba: "ERVENYTELEN_ADAT" }, 400), false);
    return valaszNaplozva(valasz({ visszajelzes: { id: eredmeny.id } }, 201), true);
  } catch (h) {
    console.error("[visszajelzes] POST hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}

export async function GET(keres: Request): Promise<Response> {
  try {
    const kapuValasz = await kapu(keres, "belepett");
    if (kapuValasz instanceof Response) return kapuValasz;
    const { fiok, szervezet, szerep } = kapuValasz;

    const url = new URL(keres.url);
    const allapotNyers = url.searchParams.get("allapot");
    let allapot: ReturnType<typeof VisszajelzesAllapot.parse> | undefined;
    if (allapotNyers) {
      const p = VisszajelzesAllapot.safeParse(allapotNyers);
      if (!p.success) return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
      allapot = p.data;
    }

    if (fiok.rendszergazda) {
      const tetelek = await lista({ szervezetId: null, allapot });
      return valasz({ visszajelzes: { tetelek } });
    }
    if (szerep === "tulajdonos" && szervezet) {
      const tetelek = await lista({ szervezetId: szervezet.id, allapot });
      return valasz({ visszajelzes: { tetelek } });
    }
    return hiba({ hiba: "NINCS_JOG" }, 403);
  } catch (h) {
    console.error("[visszajelzes] GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
