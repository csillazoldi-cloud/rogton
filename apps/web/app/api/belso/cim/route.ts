// E-34: MÉRŐ végpont a fordított proxyk számához.
//
// Miért kell: a sebességkorlát cím szerinti fele az `x-forwarded-for` fejlécből olvassa a kérő címét.
// Hogy hányadik elem a valódi cím, az attól függ, hány proxy van a rendszer előtt — ezt a kirakás után
// MÉRNI kell, nem feltételezni. Ez a végpont megmutatja, mit lát a kiszolgáló, és mire jutott belőle.
// Ha az `ahogy_latjuk` nem a te valódi címed, a `MEGBIZHATO_PROXY_DB` értékét kell igazítani.
//
// Nem ad ki semmit, amit a hívó ne tudna magáról; a saját címén kívül nincs benne adat.
import { keresCime, megbizhatoProxyDb } from "../../../../hitelesites/korlat";
import { aktualisFiok } from "../../../../hitelesites";
import { munkamenetTokenKeresbol } from "../../../../hitelesites/suti";

export const dynamic = "force-dynamic";

export async function GET(keres: Request): Promise<Response> {
  // Biztonsági felülvizsgálat 2026-09-10 (K-07): mérő végpont, de NEM nyilvános. Csak rendszergazda.
  const fiok = await aktualisFiok(munkamenetTokenKeresbol(keres));
  if (!fiok?.rendszergazda) {
    return Response.json({ hiba: "NINCS_JOG" }, { status: 403, headers: { "cache-control": "no-store" } });
  }
  const nyers = keres.headers.get("x-forwarded-for");
  return Response.json(
    {
      ellenorzes: "E-34 — a kérő címe a fordított proxyk mögött",
      x_forwarded_for: nyers,
      x_real_ip: keres.headers.get("x-real-ip"),
      elemek: nyers ? nyers.split(",").map((r) => r.trim()).filter((r) => r !== "") : [],
      megbizhato_proxy_db: megbizhatoProxyDb(),
      ahogy_latjuk: keresCime(keres.headers),
      megjegyzes:
        "Ha az 'ahogy_latjuk' NEM a te valódi címed, a MEGBIZHATO_PROXY_DB környezeti változót kell igazítani (docs/UZEMELTETES.md).",
    },
    { headers: { "cache-control": "no-store" } },
  );
}
