import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@rogton/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../../hitelesites";
import { profilBetolt } from "../../../profil";
import { oldalcim } from "../../../nyelv/oldalcim";
import { felsoSav } from "../../../kezdolap";
import { Finomhangolas } from "./Finomhangolas";
import "../../_kozos/fiok.css";
import "../../_kozos/felsosav.css";
import "../finomhangolas.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("hf.oldalcim");

// A Hírfigyelő „Finomhangolás" lapja (E-26) a v7 prototípus HF-III szakasza szerint. A modul a közös profilra épül: profil nélkül az onboarding jön.
export default async function FinomhangolasOldal() {
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes");
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) redirect("/szervezet/uj");
  const profil = await profilBetolt(szervezet.id);
  if (!profil) redirect("/onboarding/1");
  const szerep = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep ?? "nezo";
  const sav = await felsoSav(fiok, szervezet, szerep);
  return <Finomhangolas profilNev={profil.nev} szerep={szerep} sav={sav} />;
}
