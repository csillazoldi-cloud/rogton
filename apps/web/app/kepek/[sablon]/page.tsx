import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@km/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../../hitelesites";
import { oldalcim } from "../../../nyelv/oldalcim";
import { felirat, feliratok } from "../../../nyelv";
import { felsoSav } from "../../../kezdolap";
import { iparagiCsomagok } from "../../../vizual/helyzet";
import { ALLAPOTOK, ALLAPOT_FELIRAT, holFajta, maIso, posztNeve, sablonE, sorszamJavaslat, type Allapot } from "../../../vizual/kozlemeny";
import { FelsoSav } from "../../_kozos/FelsoSav";
import { KozlemenySzerkeszto } from "../KozlemenySzerkeszto";
import "../../_kozos/felsosav.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("vz1r.kozlemenyek");

// VZ-1 · V2–V6 a közlemény szerkesztője (design/VZ1-szerkeszto, gepezet 2–9) — a régi VZ-1b (09-23) helyén, ugyanazon a címen
// (/kepek/zavar · /kepek/allitas · /kepek/adatsavok). A néző nem készít képet → vissza a Képekhez. A szám javaslata (az utolsó letöltött + 1),
// a „Hol?” / „Melyik járat?” (a munkatér csomagja) és a kép második nyelvének szavai a kiszolgálóról jönnek; posztból nyitva (?poszt=)
// a poszt rövid neve is (a kitöltést a lap kéri, egy AI-hívással).
export default async function KozlemenySzerkesztoOldal({ params, searchParams }: { params: Promise<{ sablon: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes");
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) redirect("/szervezet/uj");
  const szerep = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep ?? "nezo";
  if (szerep === "nezo") redirect("/kepek");
  const { sablon } = await params;
  if (!sablonE(sablon)) redirect("/kepek/szoveges-kepek");
  const p = (await searchParams)["poszt"];
  const [sav, sorszam, csomagok, ro, poszt] = await Promise.all([
    felsoSav(fiok, szervezet, szerep),
    sorszamJavaslat(szervezet.id, sablon),
    iparagiCsomagok(szervezet.id),
    feliratok("ro", szervezet.id),
    typeof p === "string" && /^[0-9a-f-]{36}$/i.test(p) ? posztNeve(szervezet.id, p) : Promise.resolve(null),
  ]);
  const roSzavak = {
    allapot: Object.fromEntries(ALLAPOTOK.map((a) => [a, felirat(ro, ALLAPOT_FELIRAT[a])])) as Record<Allapot, string>,
    rovat: felirat(ro, "vz1r.szamok_nev"),
    jaratFocim: felirat(ro, "vz1r.jarat_focim"),
  };
  return (
    <>
      <FelsoSav adat={sav} aktiv="kepek" />
      <KozlemenySzerkeszto sablon={sablon} ma={maIso()} sorszam={sorszam} holFajta={holFajta(csomagok)} ro={roSzavak} poszt={poszt} />
    </>
  );
}
