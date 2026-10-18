import { cookies, headers } from "next/headers";
import { NYELV_SUTI } from "@km/design-system";
import { feliratok, nyelvKeresbol } from "../../nyelv";
import { oldalcim } from "../../nyelv/oldalcim";
import { Adatkezeles } from "./Adatkezeles";
import { KozosTema } from "../_kozos/KozosTema";
import "../nyitolap.css";
import "./adatkezeles.css";

export const dynamic = "force-dynamic";
export const generateMetadata = () => oldalcim("nyitolap.adat_link");

// E-41: az adatkezelési tájékoztató nyilvános lapja. A nyitólap közös fejlécével és láblécével
// fogja körbe; a tartalom három kérdésben foglalja össze, amit a Beállítások → Adatkezelés fülén
// is látni. A teljes tájékoztató és a kapcsolattartó adata még nincs (DÖNTÉS 3.6) — addig a sor
// elmarad, nem helyőrző.
export default async function AdatkezelesOldal() {
  return (
    <>
      <KozosTema />
      <Adatkezeles />
    </>
  );
}
