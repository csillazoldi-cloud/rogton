import { NextResponse } from "next/server";
import { kapu } from "../../_kapu";
import { HibaValasz } from "@km/contracts";
import { regisztral } from "../../../../hitelesites";
import { keresCime, kiserletNaplo, korlatEllenoriz } from "../../../../hitelesites/korlat";

export const dynamic = "force-dynamic";

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
    await kiserletNaplo("regisztracio", null, cim, false);
    const valasz = NextResponse.json<HibaValasz>({ hiba: "ERVENYTELEN_ADAT" }, { status: 400 });
    valasz.headers.set("cache-control", "no-store");
    return valasz;
  }

  // D-17: a regisztráció nyitva marad, ezért CÍM szerint korlátozzuk — óránként néhány új fiók.
  const allas = await korlatEllenoriz("regisztracio", emailBol(test), cim);
  if (!allas.szabad) {
    const valasz = NextResponse.json<HibaValasz>(
      { hiba: "TUL_SOK_KISERLET", mezok: { ujra_perc: String(allas.ujraPerc) } },
      { status: 429 },
    );
    valasz.headers.set("cache-control", "no-store");
    valasz.headers.set("retry-after", String(allas.ujraPerc * 60));
    return valasz;
  }

  const eredmeny = await regisztral(test);
  if (!eredmeny.ok) {
    await kiserletNaplo("regisztracio", emailBol(test), cim, false);
    const status = eredmeny.hiba === "EMAIL_FOGLALT" ? 409 : 400;
    const valasz = NextResponse.json<HibaValasz>(
      { hiba: eredmeny.hiba, mezok: eredmeny.mezok },
      { status },
    );
    valasz.headers.set("cache-control", "no-store");
    return valasz;
  }

  // A naplóban a valóság áll (sikeres = igaz). A regisztrációnál a korlát MINDEN kísérletet
  // számol, nem csak a sikerteleneket — így ez a sor is beleszámít, hazugság nélkül.
  await kiserletNaplo("regisztracio", emailBol(test), cim, true);

  const valasz = NextResponse.json({ id: eredmeny.ertek.fiokId }, { status: 201 });
  valasz.headers.set("cache-control", "no-store");
  return valasz;
}
