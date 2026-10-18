import { cookies } from "next/headers";
import { MUNKAMENET_SUTI } from "@km/contracts";
import { aktualisFiok } from "../../../hitelesites";
import { oldalcim } from "../../../nyelv/oldalcim";
import { bevaltoNezet } from "../../../tagok";
import type { BevaltoNezet } from "../../../tagok/tipusok";
import { Bevalto } from "./Bevalto";
import { KozosTema } from "../../_kozos/KozosTema";
import "../../_kozos/fiok.css";
import "./bevalto.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("meghivo.oldalcim");

// F-3e (R-2 07): a meghivo bevalto lapja — nincs felso sav, a latogato meg nem tag.
export default async function MeghivoBevaltoOldal({ params }: { params: Promise<{ jegy: string }> }) {
  const { jegy } = await params;
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  const nezet: BevaltoNezet = await bevaltoNezet(jegy, fiok);
  return (
    <>
    <KozosTema />
    <div className="km-hatter">
      <div className="km-tartalom">
        <div className="km-kozep">
          <Bevalto nezet={nezet} jegy={jegy} />
        </div>
      </div>
    </div>
    </>
  );
}
