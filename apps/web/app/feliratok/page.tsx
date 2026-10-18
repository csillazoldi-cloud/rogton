import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@km/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../hitelesites";
import { szervezetAllapot } from "../../szovegek";
import { oldalcim } from "../../nyelv/oldalcim";
import { felsoSav } from "../../kezdolap";
import { FelsoSav } from "../_kozos/FelsoSav";
import { Feliratok } from "./Feliratok";
import "../_kozos/fiok.css";
import "../_kozos/felsosav.css";
import "../tema/tema.css";
import "./feliratok.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("feliratok.oldalcim");

export default async function FeliratokOldal() {
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes");
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) redirect("/szervezet/uj");
  const tulajdonos = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep === "tulajdonos";
  const kezdo = await szervezetAllapot(szervezet.id);
  const szerep = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep ?? "nezo";
  // F9-L1: a Felület szövegei a tulajdonosé (és a rendszergazdáé); szerkesztő és néző a kezdőlapra
  if (!tulajdonos && !fiok.rendszergazda) redirect("/kezdolap");
  const sav = await felsoSav(fiok, szervezet, szerep);
  return (
    <>
      <FelsoSav adat={sav} aktiv="gephaz" />
      <Feliratok kezdo={kezdo} szervezetNev={szervezet.nev} tulajdonos={tulajdonos} rendszergazda={fiok.rendszergazda} />
    </>
  );
}
