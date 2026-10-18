import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@rogton/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../hitelesites";
import { oldalcim } from "../../nyelv/oldalcim";
import { felsoSav } from "../../kezdolap";
import { FelsoSav } from "../_kozos/FelsoSav";
import { gazdaNezet, honapVagyMost, sajatNezet } from "../../koltseg";
import { KoltsegGazda } from "./KoltsegGazda";
import { kreditOsszes } from "../../kredit";
import { KoltsegSajat } from "./KoltsegSajat";
import "../_kozos/fiok.css";
import "../_kozos/felsosav.css";
import "./koltseg-gazda.css";
import "./koltseg-sajat.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("koltseg.oldalcim");

export default async function KoltsegOldal() {
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes");
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) redirect("/szervezet/uj");
  const honap = honapVagyMost(null);
  const szerep = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep ?? "nezo";
  const sav = await felsoSav(fiok, szervezet, szerep);
  if (fiok.rendszergazda) {
    return (
      <>
        <FelsoSav adat={sav} aktiv="gephaz" />
        <KoltsegGazda kezdo={await gazdaNezet(honap)} honap={honap} kredit={(await kreditOsszes()).map((k) => ({ ...k, felhasznalt: k.felhasznalt / 1000 }))} />
      </>
    );
  }
  return (
    <>
      <FelsoSav adat={sav} aktiv="nincs" />
      <KoltsegSajat kezdo={await sajatNezet(szervezet.id, honap)} szervezetNev={szervezet.nev} />
    </>
  );
}
