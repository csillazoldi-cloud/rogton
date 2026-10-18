import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@rogton/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../hitelesites";
import { profilBetolt } from "../../profil";
import { oldalcim } from "../../nyelv/oldalcim";
import { felsoSav } from "../../kezdolap";
import { r15Hirek } from "../../r15";
import { sajatKredit } from "../../kredit";
import { FelsoSav } from "../_kozos/FelsoSav";
import { R15Hirek } from "./R15Hirek";
import "../_kozos/fiok.css";
import "../_kozos/felsosav.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("hf.oldalcim");

// R-15 · 04 Hírek („Van valami, amiből posztot csinálhatok?”) — design/R15/rajz/R15-lapok-1.dc.html.
// A régi áttekintés a /hirfigyelo/osszes címen él tovább (a „Hírek beállításai” menüből).
export default async function HirfigyeloOldal({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes");
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) redirect("/szervezet/uj");
  const profil = await profilBetolt(szervezet.id);
  if (!profil) redirect("/onboarding/1");
  const szerep = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep ?? "nezo";
  // ?talalat=… (értesítésből, régi hivatkozásból) → a részletek a régi áttekintésben nyílnak
  const talalat = (await searchParams)["talalat"];
  if (typeof talalat === "string" && talalat) redirect(`/hirfigyelo/osszes?talalat=${encodeURIComponent(talalat)}`);
  // R-13 13d3: a saját kredit (hibánál nincs elfogyott állapot — a gép a keret-hibával úgyis megáll)
  const [adat, sav, kredit] = await Promise.all([r15Hirek(szervezet.id, fiok.id, szerep), felsoSav(fiok, szervezet, szerep), sajatKredit(szervezet.id, fiok.id).catch(() => null)]);
  return (
    <>
      <FelsoSav adat={sav} aktiv="hirek" />
      <R15Hirek adat={adat} kredit={kredit} tulajdonos={szerep === "tulajdonos"} />
    </>
  );
}
