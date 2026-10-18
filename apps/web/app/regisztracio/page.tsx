import { oldalcim } from "../../nyelv/oldalcim";
import { FiokOldal } from "../_kozos/Keretek";
import { KozosTema } from "../_kozos/KozosTema";
import { FejlecLink } from "../_kozos/FejlecLink";
import { RegisztracioUrlap } from "./RegisztracioUrlap";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("regisztracio.oldalcim");

export default function RegisztracioOldal() {
  return (
    <>
    <KozosTema />
    <FiokOldal fejlecJobb={<FejlecLink href="/belepes" szovegKulcs="regisztracio.van_fiok" linkKulcs="regisztracio.van_fiok_link" />}>
      <RegisztracioUrlap />
    </FiokOldal>
    </>
  );
}
