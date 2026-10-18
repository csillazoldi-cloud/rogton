import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@rogton/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../hitelesites";
import { piszkozatBetolt } from "../../onboarding/piszkozat";
import { profilBetolt } from "../../profil";
import { oldalcim } from "../../nyelv/oldalcim";
import { ElsoBeallitas } from "./ElsoBeallitas";
import "../_kozos/fiok.css";
import "../_kozos/kockak.css";
import "./elso-beallitas.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("onboarding.oldalcim");

// R-8: az első beállítás EGY lapon (űrlap → dolgozik → átnézés). A piszkozat a SZERVEZETHEZ tartozik:
// belépés nélkül nincs, szervezet nélkül a szervezet létrehozására visz. Ha már van jóváhagyott profil,
// nincs itt mit tenni — a Kezdőlap fogadja.
export default async function ElsoBeallitasLap() {
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes");
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) redirect("/szervezet/uj");
  if (fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep === "nezo") redirect("/fiok");
  const { piszkozat, frissitve } = await piszkozatBetolt(szervezet.id);
  if (frissitve === null && (await profilBetolt(szervezet.id))) redirect("/kezdolap");
  return <ElsoBeallitas szervezetNev={szervezet.nev} kezdo={piszkozat} kezdoFrissitve={frissitve} fiokNev={fiok.nev} />;
}
