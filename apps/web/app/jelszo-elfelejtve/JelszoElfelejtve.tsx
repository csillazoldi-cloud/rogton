"use client";
import { KartyaFej } from "../_kozos/Keretek";
import { useFeliratok } from "../../nyelv/kliens";

export function JelszoElfelejtve() {
  const { t } = useFeliratok();
  const kapcsolat = t("kozos.kapcsolat");
  const vanKapcsolat = kapcsolat !== "kozos.kapcsolat";

  return (
    <>
      <KartyaFej cim={t("fiok.visszaallitas_cim")} kiemelt="" alcim={t("fiok.visszaallitas_szoveg")} />
      {vanKapcsolat ? (
        <p className="km-alcim">
          <a href={`mailto:${kapcsolat}`}>{kapcsolat}</a>
        </p>
      ) : null}
      <div className="km-lab">
        <a href="/belepes">{t("fiok.vissza_belepesre")}</a>
      </div>
    </>
  );
}
