import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@km/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../hitelesites";
import { oldalcim } from "../../nyelv/oldalcim";
import { felsoSav } from "../../kezdolap";
import { naptarBetolt } from "../../poszt";
import { fesztivalOtletek } from "../../program/otletek";
import { szellemSorok } from "../../program/horgony";
import { kepAdat } from "../../r15/kep";
import { szerepFordit } from "../../hozzaferes";
import { FelsoSav } from "../_kozos/FelsoSav";
import { Naptar } from "./Naptar";
import "../_kozos/felsosav.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("r15.nav.naptar");

// R-18 3. kör · Naptár (Claude Design „Naptár …” A/B; IRANYOK.md Round 5). Ezen és a jövő héten, ?korabbi=N → N korábbi hét is fölötte.
export default async function NaptarOldal({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes");
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) redirect("/szervezet/uj");
  const szerep = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep ?? "nezo";
  const k = Number((await searchParams)["korabbi"]);
  const korabbi = Number.isInteger(k) && k > 0 ? Math.min(k, 26) : 0;
  const [sav, adat, fo] = await Promise.all([felsoSav(fiok, szervezet, szerep), naptarBetolt(szervezet.id), fesztivalOtletek(szervezet.id).catch(() => null)]);
  // c30 F8 (rajz D7b): a fesztivál horgonyzott ötletei szellem-sorként a napjukon (ma-tól) — semmi nem íródik, amíg nem koppint a „Megírjuk”-ra
  const szellemek = fo ? szellemSorok(fo.lista, adat.ma, fo.letezo).map((o) => ({ ...o, ma: o.nap === adat.ma, nyelv: fo.nyelv })) : [];
  // a sor bélyegképe: a poszt képe (ha van) — ugyanaz a kép-adat, mint a Posztszöveg lapon
  const ktx = { fiok_id: fiok.id, szervezet_id: szervezet.id, szerep: szerepFordit(szerep) };
  const posztok = await Promise.all(
    adat.posztok.map(async ({ kep_fajl_id, ...p }) => ({ ...p, kep_url: kep_fajl_id ? ((await kepAdat(ktx, kep_fajl_id).catch(() => null))?.url ?? null) : null })),
  );
  return (
    <>
      <FelsoSav adat={sav} aktiv="naptar" />
      <Naptar ma={adat.ma} posztok={posztok} korabbi={korabbi} szerkesztheti={szerep !== "nezo"} {...(szellemek.length ? { szellemek } : {})} />
    </>
  );
}
