import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@km/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../../hitelesites";
import { profilBetolt } from "../../../profil";
import { oldalcim } from "../../../nyelv/oldalcim";
import { felsoSav } from "../../../kezdolap";
import { FelsoSav } from "../../_kozos/FelsoSav";
import { Nevek } from "./Nevek";
import "../../_kozos/felsosav.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("nevek.cim");

// R-18 6. kör (Kati D; Claude Design „Hivatalos nevek · Szervezet adatai” asztali + telefon): a cég hivatalos nevei három nyelven.
// Elérés: Profil → Szervezet adatai → „Hivatalos nevek”, és a Posztszöveg „Hivatalos nevek · N” linkje. ?vissza=poszt → vissza a poszthoz.
export default async function NevekOldal({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes");
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) redirect("/szervezet/uj");
  const szerep = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep ?? "nezo";
  const [sav, profil] = await Promise.all([felsoSav(fiok, szervezet, szerep), profilBetolt(szervezet.id)]);
  const v = (await searchParams)["vissza"];
  const vissza = typeof v === "string" && /^\/poszt\?munka=[0-9a-f-]{36}$/i.test(v) ? v : null;
  return (
    <>
      <FelsoSav adat={sav} aktiv="ugyfelprofil" />
      <Nevek kezdo={profil?.hivatalos_nevek ?? []} vanProfil={!!profil} szerkesztheti={szerep !== "nezo"} vissza={vissza} />
    </>
  );
}
