import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@km/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../hitelesites";
import { oldalcim } from "../../nyelv/oldalcim";
import { felsoSav } from "../../kezdolap";
import { FelsoSav } from "../_kozos/FelsoSav";
import { honapVagyMost, nezet } from "../../fiokok";
import { Fiokok } from "./Fiokok";
import "../_kozos/fiok.css";
import "../_kozos/felsosav.css";
import "./fiokok.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("fiokok.oldalcim");

export default async function FiokokOldal() {
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes");
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) redirect("/szervezet/uj");
  if (!fiok.rendszergazda) redirect("/kezdolap");
  const honap = honapVagyMost(null);
  const szerep = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep ?? "nezo";
  const sav = await felsoSav(fiok, szervezet, szerep);
  return (
    <>
      <FelsoSav adat={sav} aktiv="gephaz" />
      <Fiokok kezdo={await nezet(fiok.id, honap)} />
    </>
  );
}
