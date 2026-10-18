import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@rogton/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../hitelesites";
import { profilBetolt } from "../../profil";
import { szervezetReszletek } from "../../szervezet/reszletek";
import { oldalcim } from "../../nyelv/oldalcim";
import { felsoSav } from "../../kezdolap";
import { Fiok } from "./Fiok";
import { NincsProfil } from "./NincsProfil";
import "../_kozos/fiok.css";
import "../_kozos/felsosav.css";
import "../_kozos/kockak.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("fiok.oldalcim");

// A központi fiókoldal (E-10): a jóváhagyott profil szerkesztése (R-05). Jóváhagyott profil nélkül az onboarding jön.
export default async function FiokOldal() {
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes");
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) redirect("/szervezet/uj");
  const [profil, reszletek] = await Promise.all([profilBetolt(szervezet.id), szervezetReszletek(szervezet.id)]);
  const szerep = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep ?? "nezo";
  const sav = await felsoSav(fiok, szervezet, szerep);
  // B-01: jóváhagyott profil nélkül az onboarding jön — DE nézőt oda nem küldünk, mert onnan
  // visszairányítanánk ide, és a kettő között pattogna a lap. Ő magyarázatot kap, nem hurkot.
  if (!profil || !reszletek) {
    if (szerep === "nezo") return <NincsProfil szervezetNev={szervezet.nev} />;
    redirect("/onboarding/1");
  }
  // B-01: a szervezet profilját CSAK a tulajdonos írhatja (a kiszolgáló is ezt mondja).
  // A lapot mindenki látja — a szerkesztő gombok viszont csak annak jelennek meg, akinek van joga:
  // gomb, ami mögött nincs gépezet, nem maradhat a képernyőn.
  const szerkesztheto = szerep === "tulajdonos";
  // R-16 K7: a jóváhagyó neve az arculat-dobozé volt — a doboz beolvadt a /fiok/arculat-ba (ott a 12c „Részletek” mondja, K3)
  return <Fiok kezdoProfil={profil} szervezet={reszletek} fiokId={fiok.id} fiokNev={fiok.nev} fiokEmail={fiok.email} szerkesztheto={szerkesztheto} sav={sav} />;
}
