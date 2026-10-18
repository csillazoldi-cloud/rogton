"use client";
import { useFeliratok } from "../../nyelv/kliens";
import { Nyelvvalaszto } from "../_kozos/Nyelvvalaszto";

/**
 * B-01: amit a NÉZŐ lát, ha a munkatér még nincs beállítva.
 * Nem hiba és nem hurok: a beállítás a tulajdonos dolga, ezt mondjuk ki egy mondatban.
 */
export function NincsProfil({ szervezetNev }: { szervezetNev: string }) {
  const { t } = useFeliratok();
  return (
    <div className="km-kozep">
      <div className="km-kartya">
        <h1 className="km-h1">{szervezetNev}</h1>
        <p className="km-alcim">{t("fiok.nincs_profil_nezo")}</p>
        <Nyelvvalaszto />
      </div>
    </div>
  );
}
