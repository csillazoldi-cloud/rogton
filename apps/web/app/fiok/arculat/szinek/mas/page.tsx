import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { HexSzin, MUNKAMENET_SUTI } from "@km/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../../../../hitelesites";
import { szinAdat } from "../../../../../arculat/szinek";
import { oldalcim } from "../../../../../nyelv/oldalcim";
import { felsoSav } from "../../../../../kezdolap";
import { FelsoSav } from "../../../../_kozos/FelsoSav";
import { MasSzin, type Ful } from "./MasSzin";
import "../../../../_kozos/felsosav.css";
import "../../arculat.css";
import "../szinek.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("r16.arculat.szettek.mas");

type Keres = { ful?: string | string[]; fo?: string | string[]; masodik?: string | string[]; hatter?: string | string[] };
const egy = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const hex = (v: string | string[] | undefined) => { const s = egy(v); return s && HexSzin.safeParse(s).success ? s.toLowerCase() : null; };

// R-16 K4 · 12d2 „Más színt” (design/R16-arculat/R16-arculat.dc.html 12d2; TERV §2-K4, gepezet 6b) — a kivétel: egy szín egyenként,
// a logó színeiből vagy a rögzített 12 színű gyűrűből. `?ful=fo|masodik|hatter` a fül; `?fo=&masodik=&hatter=` a 12d-n kijelölt
// összeállítás (hiányában / hibásan a munkatér mostani színei). SÖTÉT lap a K7-ig. A néző a szakaszt látja.
export default async function MasSzinOldal({ searchParams }: { searchParams: Promise<Keres> }) {
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes");
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) redirect("/szervezet/uj");
  const szerep = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep ?? "nezo";
  if (szerep === "nezo") redirect("/fiok/arculat");
  const [adat, sav, k] = await Promise.all([szinAdat(szervezet.id, szerep), felsoSav(fiok, szervezet, szerep), searchParams]);
  if (!adat) redirect("/onboarding/1");
  const fulKert = egy(k.ful);
  const ful: Ful = fulKert === "masodik" || fulKert === "hatter" ? fulKert : "fo";
  const fo = hex(k.fo), masodik = hex(k.masodik), hatter = hex(k.hatter);
  const kezdo = fo && masodik && hatter ? { fo, masodik, hatter } : adat.jelenlegi;
  return (
    <>
      <FelsoSav adat={sav} aktiv="ugyfelprofil" />
      <MasSzin adat={adat} kezdo={kezdo} ful={ful} />
    </>
  );
}
