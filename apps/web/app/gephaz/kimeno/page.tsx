import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@rogton/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../../hitelesites";
import { oldalcim } from "../../../nyelv/oldalcim";
import { kimenoNezet } from "../../../kimeno";
import { felsoSav } from "../../../kezdolap";
import { FelsoSav } from "../../_kozos/FelsoSav";
import { Kimeno } from "./Kimeno";
import "../../_kozos/felsosav.css";
import "../../_kozos/kapcsolo.css";
import "./kimeno.css";

// F-7b (R-5, 03–04. artboard): Kimenő értesítések — a munkatér külső csatornája (webes horog). Tulajdonos: a munkatér felülírása; rendszergazda: a közös alap.
// Szerkesztő és néző: a lap nem jár → a Gépház sem → a kezdőlapra.
export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("kimeno.oldalcim");

export default async function KimenoOldal() {
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes?vissza=/gephaz/kimeno");
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) redirect("/szervezet/uj");
  const szerep = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep ?? "nezo";
  const [nezet, sav] = await Promise.all([kimenoNezet(fiok, szervezet.id, szerep), felsoSav(fiok, szervezet, szerep)]);
  if (!nezet) redirect("/kezdolap");
  return (
    <>
      <FelsoSav adat={sav} aktiv="gephaz" />
      <Kimeno nezet={nezet} />
    </>
  );
}
