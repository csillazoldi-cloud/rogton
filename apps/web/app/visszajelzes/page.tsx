import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@km/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../hitelesites";
import { oldalcim } from "../../nyelv/oldalcim";
import { felsoSav } from "../../kezdolap";
import { FelsoSav } from "../_kozos/FelsoSav";
import { Lista } from "./Lista";
import "../_kozos/fiok.css";
import "../_kozos/felsosav.css";
import "./visszajelzes.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("vj.lista_cim");

// R-9 (8. lap): a Visszajelzések listája — csak rendszergazdának és tulajdonosnak. Kiszolgálói lap: a jog itt dől el,
// a lista a kliensen tölti be az adatot (GET /api/visszajelzes).
export default async function VisszajelzesOldal() {
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
        <Lista rendszergazda={fiok.rendszergazda} />
      </main>
    </>
  );
}
