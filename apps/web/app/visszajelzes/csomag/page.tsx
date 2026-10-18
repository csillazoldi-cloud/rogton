import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@km/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../../hitelesites";
import { oldalcim } from "../../../nyelv/oldalcim";
import { felsoSav } from "../../../kezdolap";
import { FelsoSav } from "../../_kozos/FelsoSav";
import { Csomag } from "./Csomag";
import "../../_kozos/fiok.css";
import "../../_kozos/felsosav.css";
import "../visszajelzes.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("vj.csomag_cim");

// R-9 (9. lap): a Napi javítócsomag — csak rendszergazdának és tulajdonosnak. A csomagot a kliens tölti be
// (GET /api/visszajelzes/csomag); a készítés és a tétel-állapot csak rendszergazdának.
export default async function CsomagOldal() {
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes");
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) redirect("/szervezet/uj");
  const szerep = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep ?? "nezo";
  if (!fiok.rendszergazda && szerep !== "tulajdonos") redirect("/kezdolap");
  const sav = await felsoSav(fiok, szervezet, szerep);
  return (
    <>
      <FelsoSav adat={sav} aktiv="visszajelzes" />
      <main className="km-lap-keret km-vj-fo">
        <Csomag rendszergazda={fiok.rendszergazda} />
      </main>
    </>
  );
}
