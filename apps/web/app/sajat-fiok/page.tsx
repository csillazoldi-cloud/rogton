import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@km/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../hitelesites";
import { oldalcim } from "../../nyelv/oldalcim";
import { sajatFiokNezet } from "../../sajatfiok";
import { felsoSav } from "../../kezdolap";
import { FelsoSav } from "../_kozos/FelsoSav";
import { SajatFiok } from "./SajatFiok";
import { R13SajatFiok } from "./R13SajatFiok";
import { sajatKredit } from "../../kredit";
import { sajatSzuresNezet } from "../../hirfigyelo/sajat-szures-nezet";
import "../_kozos/felsosav.css";
import "./sajat-fiok.css";

// F-4b (R-3 v2): Saját fiók — adataim, jelszó, belépések, a felület nyelve, munkatereim, a rendszergazdai blokk. Mindenkié.
// A bejárat: a sáv fiók-neve és telefonon a menü legalsó sora (D-F34).
export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("sajat.oldalcim");

export default async function SajatFiokOldal() {
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes?vissza=/sajat-fiok");
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) redirect("/szervezet/uj");
  const szerep = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep ?? "nezo";
  // R-13 13a (design/R13/rajz/R13-lapok.dc.html): a hírek és a kreditek szakasza a lap tetején, az R-3 v2 blokkok alatta változatlanul
  const [nezet, sav, szures, kredit] = await Promise.all([
    sajatFiokNezet(fiok, szervezet.id), felsoSav(fiok, szervezet, szerep), sajatSzuresNezet(szervezet.id, fiok.id), sajatKredit(szervezet.id, fiok.id),
  ]);
  return (
    <>
      <FelsoSav adat={sav} aktiv="sajat" />
      {/* EGY keret a két részre (R-13 13a fent, R-3 v2 alatta): így a telefonos közös keret (r15-lapok.css) erre a lapra is érvényes —
          a tartalom a Visszajelzés sávja fölött véget ér (T10, 10-06). Korábban két külön keret volt, a közös szabály kihagyta. */}
      <main className="km-lap-keret km-sf-keret">
        <R13SajatFiok szures={szures} kredit={kredit} tulajdonos={szerep === "tulajdonos"} />
        <SajatFiok nezet={nezet} />
      </main>
    </>
  );
}
