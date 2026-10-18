import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@rogton/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../../hitelesites";
import { profilBetolt } from "../../../profil";
import { olvasasAllapot, programLista } from "../../../program";
import { oldalcim } from "../../../nyelv/oldalcim";
import { felsoSav } from "../../../kezdolap";
import { FelsoSav } from "../../_kozos/FelsoSav";
import { Programod } from "./Programod";
import "../../_kozos/felsosav.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("c30.prog.oldal_cim");

// c30 F6 (rajz D9a „Szervezet adatai → Programod”): a fesztivál programja napokra bontva, „Újraolvasom” · „Másik fájl”, „+ Új program”.
// Beállítás-jellegű lap: fő gomb nélkül (Csilla 10-17, q30c). A néző látja, de nem szerkeszti.
export default async function ProgramOldal() {
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes");
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) redirect("/szervezet/uj");
  const szerep = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep ?? "nezo";
  const [sav, p, tetelek] = await Promise.all([felsoSav(fiok, szervezet, szerep), profilBetolt(szervezet.id), programLista(szervezet.id).catch(() => [])]);
  return (
    <>
      <FelsoSav adat={sav} aktiv="ugyfelprofil" />
      <Programod kezdo={tetelek} nyelvek={p?.nyelvek ?? ["hu"]} forras={p?.program_forras ? { fajta: p.program_forras.fajta, ...(p.program_forras.link ? { link: p.program_forras.link } : {}) } : null} szerkesztheti={szerep !== "nezo"} fut={olvasasAllapot(p?.program_olvasas)?.allapot === "fut" ? p?.program_olvasas?.fajta ?? "word" : null} />
    </>
  );
}
