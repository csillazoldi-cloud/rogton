import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@km/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../../hitelesites";
import { profilBetolt } from "../../../profil";
import { oldalcim } from "../../../nyelv/oldalcim";
import { felsoSav } from "../../../kezdolap";
import { FelsoSav } from "../../_kozos/FelsoSav";
import { Kinalat } from "./Kinalat";
import "../../_kozos/felsosav.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("szerv.kinalat");

// R-18 7. kör (rajz: „Szervezet adatai · Kínálat és árak · asztali”; Csilla 10-12: a tématerv is itt szerkeszthető): a cég kínálata
// árral, az „Árak a posztokban” kapcsoló és a tématerv. Elérés: Profil → Szervezet adatai → „Kínálat és árak”.
export default async function KinalatOldal() {
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes");
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) redirect("/szervezet/uj");
  const szerep = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep ?? "nezo";
  const [sav, p] = await Promise.all([felsoSav(fiok, szervezet, szerep), profilBetolt(szervezet.id)]);
  return (
    <>
      <FelsoSav adat={sav} aktiv="ugyfelprofil" />
      <Kinalat
        cegNev={p?.nev ?? szervezet.nev}
        kezdo={{ kinalat: p?.kinalat ?? [], arak: p?.arak_posztban === true, temak: p?.tema_terv ?? [] }}
        nevekSzama={p?.hivatalos_nevek?.length ?? 0}
        vanProfil={!!p}
        szerkesztheti={szerep !== "nezo"}
      />
    </>
  );
}
