import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MUNKAMENET_SUTI } from "@rogton/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../hitelesites";
import { oldalcim } from "../../nyelv/oldalcim";
import { tagokNezet } from "../../tagok";
import { felsoSav } from "../../kezdolap";
import { FelsoSav } from "../_kozos/FelsoSav";
import { Tagok } from "./Tagok";
import { kreditekNezet } from "../../kredit";
import "../_kozos/fiok.css";
import "../_kozos/felsosav.css";
import "./tagok.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("tagok.oldalcim");

export default async function TagokOldal({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sutik = await cookies();
  const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
  if (!fiok) redirect("/belepes");
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) redirect("/szervezet/uj");
  const szerep = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep ?? "nezo";
  if (szerep === "nezo") redirect("/kezdolap");
  const nezet = await tagokNezet(fiok, szervezet, szerep);
  const sav = await felsoSav(fiok, szervezet, szerep);
  // R-13 13b0: a „Kreditek ›” sor csak a tulajdonosnak; a kis szöveg („mindenki egyenlő részt kap”) csak ha senkinek nincs külön összege
  const kredit = szerep === "tulajdonos" ? { egyenlo: (await kreditekNezet(szervezet.id, fiok.id)).tagok.every((x) => x.kulon === null) } : null;
  return (
    <>
      <FelsoSav adat={sav} aktiv="nincs" />
      <main className="km-lap-keret km-tg-fo">
        {/* R-15 c5 2. kör (13a, gepezet-5 4): a Beállítások „Meghívok valakit” gombja ?meghivo=1-gyel érkezik — a meglévő meghívó-ablak nyitva indul
            (csak ha a látogatónak van meghívó-joga; a jogot a Tagok dönti el, mint eddig, a kiszolgáló pedig a meghíváskor) */}
        <Tagok nezet={nezet} kredit={kredit} meghivoNyitva={(await searchParams)["meghivo"] === "1"} />
      </main>
    </>
  );
}
