"use client";
// R-9: a Visszajelzés modul befogadója — a vj.* feliratok és a POST /api/visszajelzes hívás.
// G8: ezt a fájlt a Visszajelzes.tsx CSAK bekapcsolt gombnál tölti be (next/dynamic) — így a modul és a képernyőkép-készítője
// (html-to-image) kikapcsolt gombnál le sem töltődik a böngészőbe.

import { VisszajelzesModul, type VisszajelzesAdat, type VisszajelzesFeliratok } from "@rogton/visszajelzes-react";
import "@rogton/visszajelzes-react/stilus.css";
import { createPortal } from "react-dom";
import { useFeliratok } from "../../nyelv/kliens";
import { VISSZAJELZES_INDIT } from "./visszajelzes-esemeny";

export default function VisszajelzesModulHely() {
  const { t, nyelv } = useFeliratok();

  const feliratok: VisszajelzesFeliratok = {
    gomb: t("vj.gomb"),
    jelolo_mod: t("vj.jelolo_mod"),
    jelolo_szoveg: t("vj.jelolo_szoveg"),
    kilepes: t("vj.kilepes"),
    ehhez: t("vj.ehhez"),
    szovegresz: t("vj.szovegresz"),
    egesz_lap: t("vj.egesz_lap"),
    mezo_sugo: t("vj.mezo_sugo"),
    jegyzet: t("vj.jegyzet"),
    kuldes: t("vj.kuldes"),
    megse: t("vj.megse"),
    feljegyeztuk: t("vj.feljegyeztuk"),
    koszonjuk: t("vj.koszonjuk"),
    hiba: t("vj.hiba"),
  };

  async function kuldes(adat: VisszajelzesAdat): Promise<boolean> {
    const v = await fetch("/api/visszajelzes", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(adat),
    });
    return v.status === 201;
  }

  return createPortal(
    // R-18 8. kör: a .km-vj-hely a gomb alsó sávja ott, ahol nincs fejléc-gomb és telefonos gombsáv (r18.css §12); máshol display: contents
    <div className="km-vj-hely"><VisszajelzesModul kuldes={kuldes} feliratok={feliratok} nyelv={nyelv} inditoEsemeny={VISSZAJELZES_INDIT} /></div>,
    document.getElementById("km-lap-vege") ?? document.body, // a lap vége (layout.tsx), a tartalom után — kliensoldali lapváltás után is
  );
}
