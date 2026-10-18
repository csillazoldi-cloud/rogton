import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MUNKAMENET_SUTI, type PosztMunka } from "@km/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../hitelesites";
import { oldalcim } from "../../nyelv/oldalcim";
import { felsoSav } from "../../kezdolap";
import { r15PosztLista } from "../../r15";
import { sajatKredit } from "../../kredit";
import { posztTar } from "../../poszt/tar";
import { cegAdat, kepAdat, keszKepeim } from "../../r15/kep";
import { forrasNev } from "../../r15/szamol";
import { profilTar } from "../../profil/tar";
import { szerepFordit } from "../../hozzaferes";
import { FelsoSav } from "../_kozos/FelsoSav";
import { R15Poszt } from "./R15Poszt";
import { javasoltTipus } from "../../poszt/tipus";
import { nyelvMod } from "@km/profile-core";
import "../_kozos/felsosav.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("poszt.cim");

// R-15 · 08 Posztszöveg („Kész a posztom?”) — design/R15/rajz/R15-lapok-1.dc.html. ?munka=<id> nyitja a posztot.
export default async function PosztOldal({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes");
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) redirect("/szervezet/uj");
  const szerep = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep ?? "nezo";
  const munkaId = (await searchParams)["munka"];
  // R-13 13d4: a saját kredit (hibánál nincs elfogyott állapot)
  const [adat, sav, kredit] = await Promise.all([r15PosztLista(szervezet.id), felsoSav(fiok, szervezet, szerep), sajatKredit(szervezet.id, fiok.id).catch(() => null)]);
  let munka: PosztMunka | null = null;
  if (typeof munkaId === "string" && munkaId) munka = await posztTar.betolt(szervezet.id, munkaId).catch(() => null);
  // 08b/08c: a cég az előnézetben, a poszt képe és a Kész képeim
  const ktx = { fiok_id: fiok.id, szervezet_id: szervezet.id, szerep: szerepFordit(szerep) };
  const [cegAlap, kep, kepek, profil] = await Promise.all([cegAdat(ktx, szervezet.nev), kepAdat(ktx, munka?.forras.kep_fajl_id ?? ""), keszKepeim(ktx), profilTar.betolt(szervezet.id).catch(() => null)]);
  // R-17 C2: a honlap-cikk előnézetének sávja a cég honlapjával (az arculat „Honnan?” címe, ha a gép olvasta) — különben a cég neve
  const forrasCim = profil?.arculat?.tervezet?.forras_cim ?? "";
  const honlap = forrasCim ? forrasNev(/^https?:\/\//i.test(forrasCim) ? forrasCim : `https://${forrasCim}`) : "";
  const ceg = honlap ? { ...cegAlap, honlap } : cegAlap;
  return (
    <>
      <FelsoSav adat={sav} aktiv="poszt" />
      <R15Poszt key={munka?.id ?? "ures"} lista={adat.lista} munka={munka} nyelv={adat.nyelv} iranytuVan={adat.iranytuVan} halad={adat.halad} ceg={ceg} kep={kep} kepek={kepek} kredit={kredit} tulajdonos={szerep === "tulajdonos"}
        nevekSzama={profil?.hivatalos_nevek?.length ?? 0} ctaHonlap={honlap} profilNyelvek={profil?.nyelvek ?? []} nyelvModja={nyelvMod(profil)}
        javasolt={munka ? munka.forras.tipus_javasolt ?? javasoltTipus(`${munka.forras.rovid_cim || munka.cim} ${munka.forras.rovid_nev}`, profil?.tema_terv) : null} />
    </>
  );
}
