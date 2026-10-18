import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@rogton/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../../../hitelesites";
import { arculatAllapot } from "../../../../arculat/allapot";
import { profilTar } from "../../../../profil/tar";
import { beallitas, rovidMondat, szinNevKulcsok } from "../../../../logoterv";
import { oldalcim } from "../../../../nyelv/oldalcim";
import { felsoSav } from "../../../../kezdolap";
import { FelsoSav } from "../../../_kozos/FelsoSav";
import { Logoterv } from "./Logoterv";
import "../../../_kozos/felsosav.css";
import "../arculat.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("r17.logoterv.kerdes");

// R-17 B2/B3 · 12h „Mesélj a logódról” és 12h2 „Megkaptuk, köszönjük!” (design/R17-visszajelzes/rajz/R17-lapok.dc.html; gepezet B).
// A Névlogó lap halk „Tervezzünk neked logót — {ár}” gombja hozza ide. Csak szerkesztőnek (a néző a szakaszt látja), és csak, ha van ár
// (különben nincs ajánlat — vissza a névlogóhoz). Előtöltés (T4): a név a profilból, a „Mivel foglalkoztok?” az összefoglaló első
// mondatából, a hangulat a két betű hangulat-szavából, a színek a munkatér három színének nevéből; „Hol”: Facebook, Honlap, Autó, ruha.
export default async function LogotervOldal() {
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes");
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) redirect("/szervezet/uj");
  const szerep = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep ?? "nezo";
  if (szerep === "nezo") redirect("/fiok/arculat");
  const [b, adat, profil, sav] = await Promise.all([
    beallitas(), arculatAllapot(szervezet.id, szerep).catch(() => null), profilTar.betolt(szervezet.id).catch(() => null), felsoSav(fiok, szervezet, szerep),
  ]);
  if (b.ar === null) redirect("/fiok/arculat/nevlogo");
  return (
    <>
      <FelsoSav adat={sav} aktiv="ugyfelprofil" />
      <Logoterv
        ar={b.ar}
        elotoltes={{
          nev: profil?.nev ?? szervezet.nev,
          mivel: rovidMondat(profil?.osszefoglalo ?? ""),
          hangulatKulcsok: adat ? [adat.betuk.cimSzo, adat.betuk.szovegSzo] : [],
          szinKulcsok: adat ? szinNevKulcsok([adat.szinek.fo, adat.szinek.masodik, adat.szinek.hatter]) : [],
        }}
      />
    </>
  );
}
