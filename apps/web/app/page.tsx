import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@rogton/contracts";
import { aktualisFiok } from "../hitelesites";

export const dynamic = "force-dynamic";

// G4 (Rögtön, 2026-10-18): nincs nyilvános nyitólap. A gyökér a belépésre visz; belépett fiókot a kezdőlapra (az intézi a
// szervezet / bemutatkozás hiányát is). A régi nyitólap (Nyitolap.tsx) kikerült — a márka nyilvános oldala a saját honlapja.
export default async function Gyoker() {
  const sutik = await cookies();
  let belepett = false;
  try {
    belepett = (await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value)) !== null;
  } catch {
    belepett = false;
  }
  redirect(belepett ? "/kezdolap" : "/belepes");
}
