"use client";
// R-9: a Visszajelzés modul befogadója — a vj.* feliratok és a POST /api/visszajelzes hívás.

import { VisszajelzesModul, type VisszajelzesAdat, type VisszajelzesFeliratok } from "@rogton/visszajelzes-react";
import "@rogton/visszajelzes-react/stilus.css";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useFeliratok } from "../../nyelv/kliens";

/** A Visszajelzés a felhasználó menüjének sorából is indul (R-12), ez az esemény indítja. A lebegő gomb MARAD:
 *  az R-12 rajz (A10) levette, de ezt Vilmos nem hagyta jóvá — visszatéve 2026-09-24, az ő kérésére. */
export const VISSZAJELZES_INDIT = "km-vj-indit";

export function Visszajelzes() {
  const { t, nyelv } = useFeliratok();
  // V5 (Csilla 14.): a modul a <body> végére kerül, nem a fejlécbe — a fejléc saját rétege (z-index 50)
  // a Hírek felugrója (55) ALÁ szorította a gombot, ezért a kattintás a felugró hátterét találta el és bezárta.
  const [kesz, setKesz] = useState(false);
  useEffect(() => setKesz(true), []);

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

  if (!kesz) return null;
  return createPortal(
    // R-18 8. kör: a .km-vj-hely a gomb alsó sávja ott, ahol nincs fejléc-gomb és telefonos gombsáv (r18.css §12); máshol display: contents
    <div className="km-vj-hely"><VisszajelzesModul kuldes={kuldes} feliratok={feliratok} nyelv={nyelv} inditoEsemeny={VISSZAJELZES_INDIT} /></div>,
    document.getElementById("km-lap-vege") ?? document.body, // a lap vége (layout.tsx), a tartalom után — kliensoldali lapváltás után is
  );
}
