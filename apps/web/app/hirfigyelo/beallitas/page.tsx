import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@km/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../../hitelesites";
import { profilBetolt } from "../../../profil";
import { oldalcim } from "../../../nyelv/oldalcim";
import { felsoSav } from "../../../kezdolap";
import { Beallitas } from "./Beallitas";
import "../../_kozos/fiok.css";
import "../../_kozos/felsosav.css";
import "../beallitas.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("hf.oldalcim");

// A Hírfigyelő „Figyelés beállítása" lapja (E-25) a v7 prototípus HF-II szakasza szerint. A modul a közös profilra épül: profil nélkül az onboarding jön.
export default async function BeallitasOldal() {
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes");
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) redirect("/szervezet/uj");
  const profil = await profilBetolt(szervezet.id);
  if (!profil) redirect("/onboarding/1");
  const szerep = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep ?? "nezo";
  const sav = await felsoSav(fiok, szervezet, szerep);
  return <Beallitas profilNev={profil.nev} szerep={szerep} sav={sav} />;
}
