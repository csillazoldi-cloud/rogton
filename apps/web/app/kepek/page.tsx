import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@km/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../hitelesites";
import { oldalcim } from "../../nyelv/oldalcim";
import { felsoSav } from "../../kezdolap";
import { iparagiCsomagok, kepArculat } from "../../vizual/helyzet";
import { peldakFrissen, peldakatFrissit } from "../../vizual/peldak";
import { Helyzetek } from "./Helyzetek";
import { posztTar } from "../../poszt/tar";
import { rovidNev } from "../../r15/szamol";
import "../_kozos/felsosav.css";
import "./kepek.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("vz.cim");

// VZ-2a — „Mit szeretnél ma megmutatni?” (design/vz2/rajz/VZ2a-helyzetek.dc.html).
export default async function KepekOldal({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes");
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) redirect("/szervezet/uj");
  const szerep = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep ?? "nezo";
  const [sav, a, p, csomagok] = await Promise.all([felsoSav(fiok, szervezet, szerep), kepArculat(szervezet.id, szervezet.nev), peldakFrissen(szervezet.id), iparagiCsomagok(szervezet.id)]);
  // ha a gép még nem írta meg (vagy a profil azóta változott), most elindul a háttérben; a kártyák addig az általános mintát mutatják
  if (p.elavult) peldakatFrissit(szervezet.id);
  // A közlekedési csomag sora csak ott, ahol be van kapcsolva (DESIGN-KERES-VZ2 3. pont — eldöntve).
  // VZ-1: posztból nyitva (?poszt=, R-15 08c) a Közlemények sor is viszi a poszt azonosítóját (a szerkesztő abból tölt ki)
  const posztId = (await searchParams)["poszt"];
  const id = typeof posztId === "string" && /^[0-9a-f-]{36}$/i.test(posztId) ? posztId : null;
  // R-18 6. kör (Kati F): posztból a lap az 1. lépés — a poszt rövid neve és a gép javaslata (hírből „Fontos hír”, különben „Kész munka”)
  const munka = id ? await posztTar.betolt(szervezet.id, id).catch(() => null) : null;
  // R-18 7. kör: a „Szöveges kártya” fajtából a szöveges minta („Tudtad?”) a javasolt; a „Picmess kép” a mai szabály szerint
  const tipus = (await searchParams)["tipus"];
  const javasolt = tipus === "kartya" ? "tudtad" : munka?.forras.tipus === "hir" ? "hir" : "kesz";
  return <Helyzetek sav={sav} nincsArculat={a.nincsArculat} csomag={csomagok.includes("kozlekedes") ? 3 : 0} poszt={munka ? munka.id : null} posztNev={munka ? rovidNev(munka) : ""} javasolt={javasolt} />;
}
