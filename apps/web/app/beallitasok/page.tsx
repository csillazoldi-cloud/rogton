import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@rogton/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../hitelesites";
import { oldalcim } from "../../nyelv/oldalcim";
import { beallitasokNezet } from "../../ertesites";
import { felsoSav } from "../../kezdolap";
import { profilBetolt } from "../../profil";
import { nyelvMod } from "@rogton/profile-core";
import { FelsoSav } from "../_kozos/FelsoSav";
import { Beallitasok } from "./Beallitasok";
import "../_kozos/felsosav.css";
import "../_kozos/kapcsolo.css";
import "./beallitasok.css";

// F-5b (R-4): Beállítások — Értesítések · Adatpolitika. Mindenkié (néző is): a saját értesítéseit állítja, az adatpolitikát olvassa.
// A bejárat: a harang a felső sávban (és az R-3 oldalsávjának sora, ha megjön). A fül a `?ful=` címből.
export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("beallitasok.oldalcim");

export default async function BeallitasokOldal({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes?vissza=/beallitasok");
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) redirect("/szervezet/uj");
  const szerep = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep ?? "nezo";
  const sp = await searchParams;
  // R-18 8. kör: ?ful= nélkül telefonon a Beállítások listája, asztalon az Értesítések (Round 8 rajz)
  const [nezet, sav, profil] = await Promise.all([beallitasokNezet(fiok, szerep, szervezet.id), felsoSav(fiok, szervezet, szerep), profilBetolt(szervezet.id).catch(() => null)]);
  // c30 F3 (rajz D9b): „Posztok nyelve” — csak 2+ nyelvű szervezetnél, és annak, aki posztol (szerkesztő, tulajdonos); a néző nem állítja
  const nyelvAdat = profil && profil.nyelvek.length >= 2 && szerep !== "nezo" ? { nyelvek: profil.nyelvek, mod: nyelvMod(profil) } : null;
  const ful = sp["ful"] === "adatpolitika" ? "adatpolitika" : sp["ful"] === "ertesitesek" ? "ertesitesek" : sp["ful"] === "nyelv" && nyelvAdat ? "nyelv" : null;
  return (
    <>
      <FelsoSav adat={sav} aktiv="beallitasok" />
      <Beallitasok nezet={nezet} ful={ful} sav={sav} szervezetNev={szervezet.nev} nyelvAdat={nyelvAdat} />
    </>
  );
}
