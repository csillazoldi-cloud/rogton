import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@rogton/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../../hitelesites";
import { felsoSav } from "../../../kezdolap";
import { lista } from "../../../logoterv";
import { oldalcim } from "../../../nyelv/oldalcim";
import { FelsoSav } from "../../_kozos/FelsoSav";
import { Logokeresek } from "./Logokeresek";
import "../../_kozos/fiok.css";
import "../../_kozos/felsosav.css";
import "../gephaz.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("r17.logokeres.cim");

// R-17 B (Csilla 10-06: „a kérés mindig tárolva van, és a rendszergazda listájában megjelenik”): a Logókérések lista — MINDEN munkatér
// kérései (a SECURITY DEFINER függvényen át, 0150), legújabb elöl, állapottal (új · folyamatban · kész) és az e-mail sorsával.
// Csak rendszergazdának (Tibor-zár alól kivett admin nézet, mint a /visszajelzes); mindenki más a Beállításokra kerül.
export default async function LogokeresekOldal() {
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes");
  if (!fiok.rendszergazda) redirect("/gephaz");
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) redirect("/szervezet/uj");
  const szerep = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep ?? "nezo";
  const [sav, keresek] = await Promise.all([felsoSav(fiok, szervezet, szerep), lista()]);
  return (
    <>
      <FelsoSav adat={sav} aktiv="gephaz" />
      <main className="km-lap-keret km-gh-fo">
        <Logokeresek kezdo={keresek} />
      </main>
    </>
  );
}
