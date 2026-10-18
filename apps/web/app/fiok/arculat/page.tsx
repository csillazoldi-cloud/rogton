import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@km/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../../hitelesites";
import { arculatAllapot } from "../../../arculat/allapot";
import { oldalcim } from "../../../nyelv/oldalcim";
import { felsoSav } from "../../../kezdolap";
import { FelsoSav } from "../../_kozos/FelsoSav";
import { ArculatSzakasz } from "./ArculatSzakasz";
import "../../_kozos/felsosav.css";
import "../../_kozos/arculat-anyagok.css";
import "./arculat.css";
import "./kepbetuk.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("r16.arculat.szakasz");

// R-16 K3 · a „Logó, színek, betűk” szakasz: 12a (üres) · 12b (a gép talált valamit) · 12c (jóváhagyva)
// (design/R16-arculat/R16-arculat.dc.html; TERV §2-K3). SÖTÉT lap: nincs rá link a fiókoldalon és a menüben, csak a címmel érhető el
// (TERV §4 2.), amíg a K7 át nem kapcsolja a 12. lapot. A profilt a `profil/tar`-ból olvassuk, NEM a `profil` bejáratából (TERV §3).
export default async function ArculatOldal() {
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes");
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) redirect("/szervezet/uj");
  const szerep = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep ?? "nezo";
  const [adat, sav] = await Promise.all([arculatAllapot(szervezet.id, szerep), felsoSav(fiok, szervezet, szerep)]);
  // Jóváhagyott profil nélkül nincs mit mutatni — ugyanaz, mint a /fiok-on: a néző ott magyarázatot kap, a többiek az onboardingot.
  if (!adat) redirect(szerep === "nezo" ? "/fiok" : "/onboarding/1");
  return (
    <>
      <FelsoSav adat={sav} aktiv="ugyfelprofil" />
      <ArculatSzakasz adat={adat} />
    </>
  );
}
