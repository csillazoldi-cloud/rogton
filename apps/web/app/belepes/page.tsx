import { oldalcim } from "../../nyelv/oldalcim";
import { FiokOldal } from "../_kozos/Keretek";
import { KozosTema } from "../_kozos/KozosTema";
import { FejlecLink } from "../_kozos/FejlecLink";
import { BelepesUrlap } from "./BelepesUrlap";
import "../_kozos/r15-lapok.css";
import "./belepes.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("belepes.oldalcim");

// R-15 · 01 Belépés (design/R15/rajz/R15-lapok-4.dc.html, c5 1. kör, Csilla 10-10). Ugyanaz az űrlap és logika, R-15 alapelemekből.
export default function BelepesOldal() {
  return (
    <>
    <KozosTema />
    <FiokOldal r15 fejlecJobb={<FejlecLink href="/regisztracio" szovegKulcs="belepes.nincs_fiok" linkKulcs="belepes.nincs_fiok_link" />}>
      <BelepesUrlap />
    </FiokOldal>
    </>
  );
}
