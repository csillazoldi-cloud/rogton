import { NextResponse } from "next/server";
import { kapu } from "../../_kapu";
import { HibaValasz } from "@rogton/contracts";
import { aktualisFiok, aktualisSzervezet, belep } from "../../../../hitelesites";
import { hatasosNyelv, nyelvSutiFejlec } from "../../../../nyelv/munkater";
import { munkamenetSutiBeallit } from "../../../../hitelesites/suti";
import { keresCime, kiserletNaplo, korlatEllenoriz } from "../../../../hitelesites/korlat";
import { esemenyKornyezet, feljegyezHatterben } from "../../../../esemeny";

export const dynamic = "force-dynamic";

/** A törzsből kiolvasott e-mail — csak a számlálóhoz. Hibás törzsnél null (akkor csak a cím szerint számolunk). */
function emailBol(test: unknown): string | null {
  const ertek = (test as { email?: unknown } | null)?.email;
  return typeof ertek === "string" && ertek.trim() !== "" ? ertek.trim().toLowerCase() : null;
}

export async function POST(keres: Request): Promise<Response> {
  // B-01: a szint KIMONDVA — ez a végpont szándékosan belépés nélkül is hívható.
  // A kapu itt nem tilt, csak kimondja a döntést; a jogosultsági mátrix ezt ellenőrzi.
  await kapu(keres, "nyilvanos");
  const cim = keresCime(keres.headers);

  let test;
  try {
    test = await keres.json();
  } catch {
    // A hibás törzs is kísérlet: különben a korlát megkerülhető lenne szemetet küldve.
    await kiserletNaplo("belepes", null, cim, false);
    const valasz = NextResponse.json<HibaValasz>({ hiba: "ERVENYTELEN_ADAT" }, { status: 400 });
    valasz.headers.set("cache-control", "no-store");
    return valasz;
  }

  const email = emailBol(test);

  // A korlátot a jelszó-ellenőrzés ELŐTT nézzük: a lassú argon2 el se induljon.
  const allas = await korlatEllenoriz("belepes", email, cim);
  if (!allas.szabad) {
    // F-5b (D-F33): a rendszergazda értesül — csak az ok (fiók vagy cím) és a szünet; e-mail és cím NEM kerül a naplóba
    await feljegyezHatterben(await esemenyKornyezet(), { szervezet_id: null, fajta: "belepesi_kiserletek", fiok_id: null, adat: { ok: allas.ok, ujra_perc: allas.ujraPerc } });
    const valasz = NextResponse.json<HibaValasz>(
      { hiba: "TUL_SOK_KISERLET", mezok: { ujra_perc: String(allas.ujraPerc) } },
      { status: 429 },
    );
    valasz.headers.set("cache-control", "no-store");
    valasz.headers.set("retry-after", String(allas.ujraPerc * 60));
    return valasz;
  }

  const eredmeny = await belep(test);
  if (!eredmeny.ok) {
    await kiserletNaplo("belepes", email, cim, false);
    const status = eredmeny.hiba === "ROSSZ_BELEPES" ? 401 : 400;
    const valasz = NextResponse.json<HibaValasz>(
      { hiba: eredmeny.hiba, mezok: eredmeny.mezok },
      { status },
    );
    valasz.headers.set("cache-control", "no-store");
    return valasz;
  }

  // A sikeres belépés naplózása egyben NULLÁZZA a fiók számlálóját: a korlát csak az utolsó
  // siker ÓTA nézi a sikertelen próbákat. Naplósort NEM törlünk (a napló hozzáférésnapló is).
  await kiserletNaplo("belepes", email, cim, true);

  const valasz = NextResponse.json({ id: eredmeny.ertek.fiokId }, { status: 200 });
  munkamenetSutiBeallit(valasz, eredmeny.ertek.token, eredmeny.ertek.lejar);
  // V1: a nyelv-süti a HATÁSOS nyelvre áll — a fiók választása, különben a munkatér első tartalomnyelve.
  const fiok = await aktualisFiok(eredmeny.ertek.token).catch(() => null);
  if (fiok) {
    const nyelv = await hatasosNyelv(fiok, aktualisSzervezet(fiok)?.id ?? null);
    if (nyelv) valasz.headers.append("set-cookie", nyelvSutiFejlec(nyelv));
  }
  valasz.headers.set("cache-control", "no-store");
  return valasz;
}
