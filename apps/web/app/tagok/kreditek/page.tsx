import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@km/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../../hitelesites";
import { oldalcim } from "../../../nyelv/oldalcim";
import { felsoSav } from "../../../kezdolap";
import { kreditekNezet } from "../../../kredit";
import { FelsoSav } from "../../_kozos/FelsoSav";
import { Kreditek } from "./Kreditek";
import "../../_kozos/fiok.css";
import "../../_kozos/felsosav.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("tagok.oldalcim");

// R-13 · 13b1–13b3 a Kreditek nézet (design/R13/rajz/R13-lapok.dc.html; gepezet.md 13b; Csilla 10-03: saját nézet a Tagok „Kreditek ›” sora mögött).
// Csak a tulajdonos látja (a GET /api/kredit/tagok is tulajdonosi): a szerkesztő a Tagok lapra, a néző a Kezdőlapra kerül.
export default async function KreditekOldal() {
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes?vissza=/tagok/kreditek");
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) redirect("/szervezet/uj");
  const szerep = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep ?? "nezo";
  if (szerep === "nezo") redirect("/kezdolap");
  if (szerep !== "tulajdonos") redirect("/tagok");
  const [nezet, sav] = await Promise.all([kreditekNezet(szervezet.id, fiok.id), felsoSav(fiok, szervezet, szerep)]);
  return (
    <>
      <FelsoSav adat={sav} aktiv="nincs" />
      <Kreditek nezet={nezet} />
    </>
  );
}
