import { NextResponse } from "next/server";
import { kapu } from "../../_kapu";
import { kilep } from "../../../../hitelesites";
import { munkamenetSutiTorol, munkamenetTokenKeresbol } from "../../../../hitelesites/suti";

export const dynamic = "force-dynamic";

export async function POST(keres: Request): Promise<Response> {
  // B-01: a szint KIMONDVA — ez a végpont szándékosan belépés nélkül is hívható.
  // A kapu itt nem tilt, csak kimondja a döntést; a jogosultsági mátrix ezt ellenőrzi.
  await kapu(keres, "nyilvanos");
  const token = munkamenetTokenKeresbol(keres);
  if (token) {
    await kilep(token);
  }
  const valasz = new NextResponse(null, { status: 204 });
  munkamenetSutiTorol(valasz);
  valasz.headers.set("cache-control", "no-store");
  return valasz;
}
