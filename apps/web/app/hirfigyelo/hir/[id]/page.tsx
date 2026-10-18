import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@km/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../../../hitelesites";
import { profilBetolt } from "../../../../profil";
import { oldalcim } from "../../../../nyelv/oldalcim";
import { felsoSav } from "../../../../kezdolap";
import { r15Hir } from "../../../../r15";
import { sajatKredit } from "../../../../kredit";
import { FelsoSav } from "../../../_kozos/FelsoSav";
import { R15Hir } from "./R15Hir";
import "../../../_kozos/fiok.css";
import "../../../_kozos/felsosav.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("hf.oldalcim");

// R-15 · 05 Hír részletei (design/R15/rajz/R15-lapok-4.dc.html 05 · 05w; gepezet-4 · 3; kerdesek-4 · 5 — Csilla 10-10: saját lap).
// A régi felugró (/hirfigyelo/osszes?talalat=…) változatlanul él; ez a lap a R-15 Hírek kártyáiról nyílik.
// Jogosultság: belépett tag (mint a 04-en); a néző (nezo) olvashat, posztot nem kérhet. Bérlő: r15Hir csak a szervezet saját adatát látja.
export default async function HirReszletOldal({ params }: { params: Promise<{ id: string }> }) {
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes");
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) redirect("/szervezet/uj");
  const profil = await profilBetolt(szervezet.id);
  if (!profil) redirect("/onboarding/1");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const szerep = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep ?? "nezo";
  const [reszlet, sav, kredit] = await Promise.all([r15Hir(szervezet.id, fiok.id, id), felsoSav(fiok, szervezet, szerep), sajatKredit(szervezet.id, fiok.id).catch(() => null)]);
  if (!reszlet) notFound();
  return (
    <>
      <FelsoSav adat={sav} aktiv="hirek" />
      <R15Hir reszlet={reszlet} szerep={szerep} elfogyottKezdo={kredit?.elfogyott === true} tulajdonos={szerep === "tulajdonos"} />
    </>
  );
}
