import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@km/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../../../hitelesites";
import { betuValasztek } from "../../../../arculat/betuk";
import { oldalcim } from "../../../../nyelv/oldalcim";
import { felsoSav } from "../../../../kezdolap";
import { FelsoSav } from "../../../_kozos/FelsoSav";
import { Betuk } from "./Betuk";
import "../../../_kozos/felsosav.css";
import "../arculat.css";
import "../kepbetuk.css";
import "./betuk.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("r16.arculat.betu.kerdes");

// R-16 K5 · 12e „Melyik betű illik hozzátok?” (design/R16-arculat/R16-arculat.dc.html 12e; TERV §2-K5; gepezet 7–8).
// SÖTÉT lap: csak a 12c „Betűk” sorának Csere gombja visz ide (maga a 12c is csak címmel érhető el), amíg a K7 át nem kapcsolja a 12. lapot
// (TERV §4 2.). A választás szerkesztői művelet (a POST kapuja „szerkeszto”) — a néző a szakaszt látja (12c), nem egy gomb nélküli lapot.
// `?ful=szoveg`: a Szöveg fül nyílik (alap: Cím).
export default async function ArculatBetukOldal({ searchParams }: { searchParams: Promise<{ ful?: string }> }) {
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes");
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) redirect("/szervezet/uj");
  const szerep = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep ?? "nezo";
  if (szerep === "nezo") redirect("/fiok/arculat");
  const [adat, sav, { ful }] = await Promise.all([betuValasztek(szervezet.id, szerep), felsoSav(fiok, szervezet, szerep), searchParams]);
  if (!adat) redirect("/onboarding/1");
  return (
    <>
      <FelsoSav adat={sav} aktiv="ugyfelprofil" />
      <Betuk adat={adat} ful={ful === "szoveg" ? "szoveg" : "cim"} />
    </>
  );
}
