import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@rogton/contracts";
import { aktualisFiok } from "../../../hitelesites";
import { oldalcim } from "../../../nyelv/oldalcim";
import { FiokOldal } from "../../_kozos/Keretek";
import { KilepesGomb } from "./KilepesGomb";
import { SzervezetUrlap } from "./SzervezetUrlap";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("szervezet.oldalcim");

export default async function UjSzervezetOldal() {
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes");
  if (fiok.szervezetek.length > 0) redirect("/onboarding/1"); // van már szervezete: az onboarding jön
  return (
    <FiokOldal
      fejlecJobb={
        <>
          <div className="km-fejlec-nev">{fiok.nev}</div>
          <KilepesGomb />
        </>
      }
    >
      <SzervezetUrlap />
    </FiokOldal>
  );
}
