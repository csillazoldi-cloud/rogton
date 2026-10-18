import { oldalcim } from "../../nyelv/oldalcim";
import { FiokOldal } from "../_kozos/Keretek";
import { KozosTema } from "../_kozos/KozosTema";
import { FejlecLink } from "../_kozos/FejlecLink";
import { VisszaallitasUrlap } from "./VisszaallitasUrlap";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("visszaallitas.oldalcim");

export default async function VisszaallitasOldal({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parameterek = await searchParams;
  const nyers = parameterek["jegy"];
  const jegy = typeof nyers === "string" ? nyers : "";

  return (
    <>
    <KozosTema />
    <FiokOldal fejlecJobb={<FejlecLink href="/belepes" szovegKulcs="visszaallitas.vissza" linkKulcs="visszaallitas.vissza_link" />}>
      <VisszaallitasUrlap jegy={jegy} />
    </FiokOldal>
    </>
  );
}
