import { cookies, headers } from "next/headers";
import { RENDSZER_VERZIO } from "@km/contracts";
import { NYELV_SUTI } from "@km/design-system";
import { felirat, feliratok, nyelvDontes } from "../nyelv";
import { oldalcim } from "../nyelv/oldalcim";
import { Nyelvvalaszto } from "./_kozos/Nyelvvalaszto";
import Nyitolap from "./Nyitolap";
import { KozosTema } from "./_kozos/KozosTema";
import { NyelvValasztoSav } from "./_kozos/NyelvValasztoSav";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("nyitolap.oldalcim");

// E-41: a nyilvános nyitólap (belépés előtt), a design/nyitolap/Nyitolap.dc.html rajz szerint.
// Statikus, ügyféladatot nem tölt, és NEM az ügyfél arculatát használja — a közös alaptémát.
// Ez váltja fel az E-1 egysoros üres kezdőképernyőjét.
export default async function Kezdolap() {
  const [sutik, fejlecek] = await Promise.all([cookies(), headers()]);
  const { nyelv, eldontve } = nyelvDontes(sutik.get(NYELV_SUTI)?.value, fejlecek.get("accept-language"));
  const f = await feliratok(nyelv);
  // R-17 D1: ha a nyelv nem dönthető el, a háromnyelvű választó — a cím és a gombok mindhárom nyelv SAJÁT feliratából
  let nyelvSav = null;
  if (!eldontve) {
    const [hu, ro, en] = await Promise.all((["hu", "ro", "en"] as const).map((n) => feliratok(n)));
    nyelvSav = (
      <NyelvValasztoSav
        cimek={[felirat(hu!, "r17.nyelv.valaszto_cim"), felirat(ro!, "r17.nyelv.valaszto_cim"), felirat(en!, "r17.nyelv.valaszto_cim")]}
        gombok={[{ nyelv: "hu", nev: felirat(hu!, "nyelv.hu") }, { nyelv: "ro", nev: felirat(ro!, "nyelv.ro") }, { nyelv: "en", nev: felirat(en!, "nyelv.en") }]}
      />
    );
  }
  return (
    <>
    <KozosTema />
    <Nyitolap
      t={(kulcs: string) => felirat(f, kulcs)}
      verzio={RENDSZER_VERZIO}
      nyelvSav={nyelvSav}
      nyelvvalaszto={
        <>
          <Nyelvvalaszto className="km-ny-nyelv km-ny-csak-asztali" />
          <Nyelvvalaszto className="km-ny-nyelv km-ny-csak-telefon" rovid />
        </>
      }
    />
    </>
  );
}
