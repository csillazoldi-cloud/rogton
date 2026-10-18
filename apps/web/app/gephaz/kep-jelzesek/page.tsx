import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@km/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../../hitelesites";
import { felsoSav } from "../../../kezdolap";
import { kepJelzesLista } from "../../../vizual/kozlemeny";
import { oldalcim } from "../../../nyelv/oldalcim";
import { FelsoSav } from "../../_kozos/FelsoSav";
import { KepJelzesek } from "./KepJelzesek";
import "../../_kozos/fiok.css";
import "../../_kozos/felsosav.css";
import "../gephaz.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("vz1r.admin_lista_cim");

// VZ-1 kerdesek 4 (Csilla 2026-10-06: „a márka-szabályok sértése a rendszergazdához megy, nem Tiborhoz”): a letöltött közlemény-képek
// szabály-jelzései MINDEN munkatérből (a SECURITY DEFINER függvényen át, 0152), legújabb elöl. Csak rendszergazdának (admin nézet, mint a
// Logókérések); mindenki más a Beállításokra kerül.
export default async function KepJelzesekOldal() {
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes");
  if (!fiok.rendszergazda) redirect("/gephaz");
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) redirect("/szervezet/uj");
  const szerep = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep ?? "nezo";
  const [sav, sorok] = await Promise.all([felsoSav(fiok, szervezet, szerep), kepJelzesLista()]);
  return (
    <>
      <FelsoSav adat={sav} aktiv="gephaz" />
      <main className="km-lap-keret km-gh-fo">
        <KepJelzesek sorok={sorok} />
      </main>
    </>
  );
}
