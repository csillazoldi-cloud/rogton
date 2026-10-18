import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@rogton/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../hitelesites";
import { oldalcim } from "../../nyelv/oldalcim";
import { felsoSav } from "../../kezdolap";
import { r15Kezdolap } from "../../r15";
import { sajatKredit } from "../../kredit";
import { sajatJavitott } from "../../visszajelzes";
import { FelsoSav } from "../_kozos/FelsoSav";
import { R15Kezdolap } from "./R15Kezdolap";
import "../_kozos/fiok.css";
import "../_kozos/felsosav.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("kezdolap.oldalcim");

// R-15 · 03 Kezdőlap („Mi a dolgom ma?”) — design/R15/rajz/R15-lapok-1.dc.html. Belépés után ide érkezik az ember (D-F25).
// A régi csempék adata (AI-keret, próbaidőszak, forrás-állapot) a Beállítások · Csomag részbe kerül (kerdesek 3).
export default async function KezdolapOldal() {
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes");
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) redirect("/szervezet/uj");
  const szerep = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep ?? "nezo";
  // R-13 13d1/13d2: a saját kredit (a kredit-nyilvántartás hibája nem dönti el a lapot — akkor nincs kredit-sor)
  // c7 (R-15 c5 2. kör, 03j): a saját, az elmúlt 24 órában javított jelzések — a sávban egy halk ✓ + szám (hibánál: semmi)
  const [adat, sav, kredit, javitott] = await Promise.all([r15Kezdolap(szervezet.id, fiok.id, szerep), felsoSav(fiok, szervezet, szerep), sajatKredit(szervezet.id, fiok.id).catch(() => null), sajatJavitott(fiok.id, szervezet.id).catch(() => [])]);
  return (
    <>
      <FelsoSav adat={sav} aktiv="kezdolap" javitott={javitott} />
      <R15Kezdolap adat={adat} kredit={kredit} />
    </>
  );
}
