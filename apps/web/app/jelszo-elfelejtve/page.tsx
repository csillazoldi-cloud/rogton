import { oldalcim } from "../../nyelv/oldalcim";
import { FiokOldal } from "../_kozos/Keretek";
import { KozosTema } from "../_kozos/KozosTema";
import { FejlecLink } from "../_kozos/FejlecLink";
import { JelszoElfelejtve } from "./JelszoElfelejtve";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("fiok.visszaallitas_cim");

export default function JelszoElfelejtveOldal() {
  return (
    <>
    <KozosTema />
    <FiokOldal fejlecJobb={<FejlecLink href="/belepes" szovegKulcs="fiok.vissza_belepesre" linkKulcs="fiok.vissza_belepesre" />}>
      <JelszoElfelejtve />
    </FiokOldal>
    </>
  );
}
