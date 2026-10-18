import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@km/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../hitelesites";
import { szervezetTemaAllapot } from "../../tema";
import { oldalcim } from "../../nyelv/oldalcim";
import { felsoSav } from "../../kezdolap";
import { FelsoSav } from "../_kozos/FelsoSav";
import { Tema } from "./Tema";
import { TemaEgyszeru } from "./TemaEgyszeru";
import "../_kozos/fiok.css";
import "../_kozos/felsosav.css";
import "./tema.css";
import "./tema-egyszeru.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("tema.oldalcim");

export default async function TemaOldal({
  searchParams,
}: {
  searchParams: Promise<{ halado?: string }>;
}) {
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes");
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) redirect("/szervezet/uj");
  const tulajdonos = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep === "tulajdonos";
  const kezdo = await szervezetTemaAllapot(szervezet.id);
  const szerep = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep ?? "nezo";
  // F9-L1: a Megjelenés a tulajdonosé (és a rendszergazdáé); szerkesztő és néző a kezdőlapra
  if (szerep !== "tulajdonos" && !fiok.rendszergazda) redirect("/kezdolap");
  const sav = await felsoSav(fiok, szervezet, szerep);
  const params = await searchParams;
  const halado = params.halado === "1";
  const mutatHaladot = fiok.rendszergazda || halado;
  return (
    <>
      <FelsoSav adat={sav} aktiv="gephaz" />
      {mutatHaladot ? (
        <Tema kezdo={kezdo} szervezetNev={szervezet.nev} tulajdonos={tulajdonos} rendszergazda={fiok.rendszergazda} />
      ) : (
        <TemaEgyszeru kezdo={kezdo} szervezetNev={szervezet.nev} tulajdonos={tulajdonos} />
      )}
    </>
  );
}
