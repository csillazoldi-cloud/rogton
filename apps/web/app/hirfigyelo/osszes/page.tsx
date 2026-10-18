import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@km/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../../hitelesites";
import { profilBetolt } from "../../../profil";
import { oldalcim } from "../../../nyelv/oldalcim";
import { felsoSav } from "../../../kezdolap";
import { Attekintes } from "../Attekintes";
import "../../_kozos/fiok.css";
import "../../_kozos/felsosav.css";
import "../attekintes.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("hf.oldalcim");

// R-15: a régi Hírek-áttekintés (összkép, szűrők, minden hír, részletek) — a „Hírek beállításai” menüből érhető el.
// Semmi nem került le, csak hátrébb (design/R15 04, „HÁTRÉBB KERÜLT”).
export default async function HirekOsszesOldal() {
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes");
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) redirect("/szervezet/uj");
  const profil = await profilBetolt(szervezet.id);
  if (!profil) redirect("/onboarding/1");
  const szerep = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep ?? "nezo";
  const sav = await felsoSav(fiok, szervezet, szerep);
  return <Attekintes profilNev={profil.nev} szerep={szerep} sav={sav} />;
}
