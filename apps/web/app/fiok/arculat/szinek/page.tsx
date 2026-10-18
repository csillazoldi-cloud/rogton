import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@km/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../../../hitelesites";
import { szinAdat } from "../../../../arculat/szinek";
import { oldalcim } from "../../../../nyelv/oldalcim";
import { felsoSav } from "../../../../kezdolap";
import { FelsoSav } from "../../../_kozos/FelsoSav";
import { Szinek } from "./Szinek";
import "../../../_kozos/felsosav.css";
import "../arculat.css";
import "./szinek.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("r16.arculat.szettek.kerdes");

// R-16 K4 · 12d „Színek — javaslatok” (design/R16-arculat/R16-arculat.dc.html 12d; TERV §2-K4, gepezet 6). A 12a–12c „Csere” gombja
// hozza ide. SÖTÉT lap a K7-ig (csak a címmel érhető el, TERV §4 2.). A néző nem választ színt: ő a szakaszt látja (a POST 403 neki).
// A profilt a `profil/tar`-ból olvassuk (az `arculat/szinek` át), NEM a `profil` bejáratából (TERV §3).
export default async function SzinekOldal() {
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes");
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) redirect("/szervezet/uj");
  const szerep = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep ?? "nezo";
  if (szerep === "nezo") redirect("/fiok/arculat");
  const [adat, sav] = await Promise.all([szinAdat(szervezet.id, szerep), felsoSav(fiok, szervezet, szerep)]);
  if (!adat) redirect("/onboarding/1"); // jóváhagyott profil nélkül nincs mit színezni (mint a /fiok/arculat-on)
  return (
    <>
      <FelsoSav adat={sav} aktiv="ugyfelprofil" />
      <Szinek adat={adat} />
    </>
  );
}
