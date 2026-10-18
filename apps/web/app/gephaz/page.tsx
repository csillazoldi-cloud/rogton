import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@rogton/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../hitelesites";
import { felsoSav, gephazNezet } from "../../kezdolap";
import { oldalcim } from "../../nyelv/oldalcim";
import { FelsoSav } from "../_kozos/FelsoSav";
import { Gephaz } from "./Gephaz";
import { beallitas } from "../../logoterv";
import { sajatKredit } from "../../kredit";
import "../_kozos/fiok.css";
import "../_kozos/felsosav.css";
import "./gephaz.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("gephaz.oldalcim");

// F-2 (R-1 v3): a Gépház — a rendszergazdának a közös alap négy ajtaja (4. artboard), a tulajdonosnak a munkatér két felülírása (8. artboard).
// A szerkesztő és a néző a kezdőlapra kerül (D-F23). A csempék adata a kezdolap modul gephazNezet()-éből.
export default async function GephazOldal() {
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes");
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) redirect("/szervezet/uj");
  const szerep = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep ?? "nezo";
  const nezet = await gephazNezet(fiok, szervezet, szerep);
  if (nezet === null) redirect("/kezdolap");
  const sav = await felsoSav(fiok, szervezet, szerep);
  // R-17 B4: a rendszergazda a logótervezés árát és címzettjét is itt állítja
  const logoterv = nezet.nezet === "rendszergazda" ? await beallitas().catch(() => null) : null;
  // R-15 c5 2. kör (13a): a tulajdonos nézetén az R-13 kredit-sor — a meglévő, szervezet- és tagszintű olvasás (a hibája nem dönti el a lapot)
  const kredit = nezet.nezet === "rendszergazda" ? null : await sajatKredit(szervezet.id, fiok.id).catch(() => null);
  return (
    <>
      <FelsoSav adat={sav} aktiv="gephaz" />
      <main className="km-lap-keret km-gh-fo">
        <Gephaz nezet={nezet} logoterv={logoterv} kredit={kredit} />
      </main>
    </>
  );
}
