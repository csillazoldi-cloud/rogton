import { NextResponse } from "next/server";
import { HibaValasz } from "@km/contracts";
import { szervezetLetrehoz } from "../../../hitelesites";
import { kapu } from "../_kapu";

export const dynamic = "force-dynamic";

export async function POST(keres: Request): Promise<Response> {
  const e = await kapu(keres, "belepett");
  if (e instanceof Response) return e;
  const { fiok } = e;

  let test;
  try {
    test = await keres.json();
  } catch {
    const valasz = NextResponse.json<HibaValasz>({ hiba: "ERVENYTELEN_ADAT" }, { status: 400 });
    valasz.headers.set("cache-control", "no-store");
    return valasz;
  }

  const eredmeny = await szervezetLetrehoz(fiok.id, test);
  if (!eredmeny.ok) {
    const valasz = NextResponse.json<HibaValasz>(
      { hiba: eredmeny.hiba, mezok: eredmeny.mezok },
      { status: 400 },
    );
    valasz.headers.set("cache-control", "no-store");
    return valasz;
  }

  const valasz = NextResponse.json({ id: eredmeny.ertek.szervezetId }, { status: 201 });
  valasz.headers.set("cache-control", "no-store");
  return valasz;
}
