import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@km/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../../hitelesites";
import { oldalcim } from "../../../nyelv/oldalcim";
import { felsoSav } from "../../../kezdolap";
import { FelsoSav } from "../../_kozos/FelsoSav";
import { Kozlemenyek } from "../Kozlemenyek";
import "../../_kozos/felsosav.css";
import "../../_kozos/r15-lapok.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("vz1r.kozlemenyek");

// VZ-1 · V1 „Mit szeretnél közölni?” (design/VZ1-szerkeszto, gepezet 1). A Képek lap „Szöveges képek” sorából (kerdesek 1: a csomag-kapcsoló
// marad; a sor és a lap neve Csilla 2026-10-06 18:15 óta „Szöveges képek” — a /kepek/kozlemenyek és a /kepek/kozlekedes ide visz). A néző nem készít képet → vissza a Képekhez (mint a régi VZ-1a/1b).
export default async function SzovegesKepekOldal({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes");
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) redirect("/szervezet/uj");
  const szerep = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep ?? "nezo";
  if (szerep === "nezo") redirect("/kepek");
  const p = (await searchParams)["poszt"];
  const sav = await felsoSav(fiok, szervezet, szerep);
  return (
    <>
      <FelsoSav adat={sav} aktiv="kepek" />
      <Kozlemenyek poszt={typeof p === "string" && /^[0-9a-f-]{36}$/i.test(p) ? p : null} />
    </>
  );
}
