"use client";
import { useRouter } from "next/navigation";
import type { SzervezetProfil } from "@km/contracts";
import { useFeliratok } from "../../../nyelv/kliens";
import { FiokOldal } from "../../_kozos/Keretek";
import { KilepesGomb } from "../../szervezet/uj/KilepesGomb";

// A jóváhagyás utáni képernyő (R-7a 07): pipa, „Kész — a szervezet adatai mentve.”, fő gomb a hírforrásokra,
// másodlagos hivatkozás a fiókba; az arculatról egy halk mondat.
export function Kesz({ profil, fiokNev }: { profil: SzervezetProfil; fiokNev: string }) {
  const { t } = useFeliratok();
  const router = useRouter();
  const hianyzok = profil.kesobbre.filter((m) => String(m) !== "arculat").map((m) => t(`mezo.${m}`)); // F9-Sz1/b: az Arculat jelvény elmarad
  return (
    <FiokOldal fejlecJobb={<><div className="km-fejlec-nev">{fiokNev}</div><KilepesGomb /></>}>
      <div className="km-kesz">
        <div className="km-kesz-pipa-keret" aria-hidden="true">
          <div className="km-kesz-gyuru" />
          <div className="km-kesz-pipa">✓</div>
        </div>
        <h1 className="km-kesz-cim">{t("onboarding.kesz_cim")}</h1>
        <p className="km-alcim">{t("onboarding.kesz_szoveg")}</p>
        <div className="km-kesz-halk">{t("onboarding.kesz_arculat")}</div>
        {hianyzok.length > 0 ? (
          <div className="km-kesz-cimkek">{hianyzok.map((h) => <span key={h} className="km-kesz-cimke">{h}</span>)}</div>
        ) : null}
        <div className="km-kesz-gombok">
          <button type="button" className="km-gomb" onClick={() => router.push("/hirfigyelo/beallitas")}>{t("onboarding.kesz_gomb_forrasok")}</button>
          <button type="button" className="km-kesz-masodlagos" onClick={() => router.push("/fiok")}>{t("onboarding.kesz_gomb_profil")}</button>
        </div>
      </div>
    </FiokOldal>
  );
}
