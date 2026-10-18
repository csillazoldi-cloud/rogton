import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@km/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../hitelesites";
import { oldalcim } from "../../nyelv/oldalcim";
import { felsoSav } from "../../kezdolap";
import { elsoNyelv } from "../../r15";
import { peldakFrissen } from "../../vizual/peldak";
import { iranytuPeldaKulcsok } from "../../iranytu/pelda";
import { iranytuAllapot, iranytuVerziok } from "../../iranytu";
import { R15Iranytu } from "./R15Iranytu";
import "../_kozos/felsosav.css";
import "./iranytu.css";
import "./blokkvalaszto.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("iranytu.cim");

// R-11/B3: A cég iránytűje — a lap. Minden tag látja; szerkeszteni a nézőn kívül bárki,
// jóváhagyni csak a tulajdonos tud (a kiszolgáló is ezt kényszeríti).
// c5 · R-15 11 (design/R15/rajz/R15-lapok-4.dc.html 11a · 11a2 · 11b · 11c · 11c2; gepezet-4 · 4): a R-15 nézet; a mai szerkesztő
// változatlanul a mögött. A 11a példája a szakma szerint (c15 kategória, a szervezet saját tárolt példáiból — új AI-hívás nincs).
export default async function IranytuOldal() {
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes");
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) redirect("/szervezet/uj");
  const szerep = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep ?? "nezo";
  // az állapot a kiszolgálón (ugyanaz, mint a GET /api/iranytu — szervezetre szűrt tár, A-11): a lap nem villan üresen
  const [sav, nyelv, peldak, allapot, verziok] = await Promise.all([
    felsoSav(fiok, szervezet, szerep),
    elsoNyelv(szervezet.id).catch(() => "hu" as const),
    peldakFrissen(szervezet.id).catch(() => null),
    iranytuAllapot(szervezet.id),
    iranytuVerziok(szervezet.id),
  ]);
  const szerkesztheto = szerep !== "nezo";
  const jovahagyhat = szerep === "tulajdonos";
  return (
    <R15Iranytu szerkesztheto={szerkesztheto} jovahagyhat={jovahagyhat} sav={sav} tartalomNyelv={nyelv} kezdoAllapot={allapot} kezdoVerziok={verziok}
      peldaKulcsok={iranytuPeldaKulcsok(peldak?.fotoKategoria === "rendezveny" ? "semleges" : peldak?.kategoria).kulcsok} /* c30 F12: a fesztivál a semleges példák fesztivál-változatát kapja (0180) */ />
  );
}
