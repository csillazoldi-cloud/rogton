import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@km/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../../../hitelesites";
import { arculatAllapot } from "../../../../arculat/allapot";
import { oldalcim } from "../../../../nyelv/oldalcim";
import { felsoSav } from "../../../../kezdolap";
import { FelsoSav } from "../../../_kozos/FelsoSav";
import { Nevlogo } from "./Nevlogo";
import { beallitas } from "../../../../logoterv";
import "../../../_kozos/felsosav.css";
import "../arculat.css";
import "./nevlogo.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("r16.arculat.nevlogo.kerdes");

// R-16 K6 · 12g „Készítsünk egyet?” (design/R16-arculat/R16-arculat.dc.html 12g; TERV §2-K6; gepezet 13). A 12a Logó sorának és a 12f-nek
// „Nincs logóm” linkje hozza ide. SÖTÉT lap a K7-ig (csak a címmel érhető el, TERV §4 2.). A névlogó elkészítése szerkesztői művelet (a POST
// kapuja „szerkeszto”) — a néző a szakaszt látja. A profilt a `profil/tar`-ból olvassuk (az `arculat/allapot` át), NEM a `profil` bejáratából (TERV §3).
export default async function NevlogoOldal() {
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes");
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) redirect("/szervezet/uj");
  const szerep = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep ?? "nezo";
  if (szerep === "nezo") redirect("/fiok/arculat");
  const [adat, sav, lt] = await Promise.all([arculatAllapot(szervezet.id, szerep), felsoSav(fiok, szervezet, szerep), beallitas().catch(() => ({ ar: null }))]);
  if (!adat) redirect("/onboarding/1"); // jóváhagyott profil nélkül nincs miből logót készíteni (mint a /fiok/arculat-on)
  const kep = adat.lepes.allapot === "jovahagyott" && adat.lepes.jovahagyott_verzio ? adat.lepes.verziok[String(adat.lepes.jovahagyott_verzio)] : adat.lepes.tervezet;
  return (
    <>
      <FelsoSav adat={sav} aktiv="ugyfelprofil" />
      <Nevlogo adat={{ hatter: adat.szinek.hatter, elonezet: adat.elonezet, stilus: kep?.nevlogo_stilus ?? null, logotervAr: lt.ar }} />
    </>
  );
}
