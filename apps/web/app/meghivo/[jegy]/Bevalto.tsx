"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { BevaltoNezet } from "../../../tagok/tipusok";
import { useFeliratok } from "../../../nyelv/kliens";
import { Marka } from "../../_kozos/Marka";
import { apiHivas, hibaKod, hibaSzoveg } from "../../_kozos/hibaszoveg";

export function Bevalto({ nezet, jegy }: { nezet: BevaltoNezet; jegy: string }) {
  const router = useRouter();
  const { t, nyelv } = useFeliratok();
  const [hiba, setHiba] = useState<string | null>(null);
  const [fut, setFut] = useState(false);

  const cim = nezet.meghivo_nev && nezet.szervezet_nev
    ? t("meghivo.bevalt_cim").replace("{meghivo}", nezet.meghivo_nev).replace("{munkater}", nezet.szervezet_nev)
    : "";

  const szerepLeirasKulcs = nezet.szerep ? `meghivo.${nezet.szerep}_mit` : null;
  const szerepLeiras = szerepLeirasKulcs ? t(szerepLeirasKulcs) : "";

  const szerepJelvenyKulcs = nezet.szerep ? `nav.szerep_${nezet.szerep}` : null;
  const szerepJelveny = szerepJelvenyKulcs ? t(szerepJelvenyKulcs) : "";

  const datumFormaz = (iso: string | null) => {
    if (!iso) return "";
    return new Intl.DateTimeFormat(nyelv, { dateStyle: "medium", timeZone: "Europe/Budapest" }).format(new Date(iso));
  };

  async function elfogad() {
    setFut(true);
    setHiba(null);
    const r = await apiHivas("/api/meghivo/elfogad", { jegy });
    if (r.statusz === 200) {
      router.push("/kezdolap");
      return;
    }
    const kod = hibaKod(r.torzs);
    setHiba(hibaSzoveg(t, kod));
    setFut(false);
  }

  // A: belepve, meghivo elo, nem tag
  const allapotA = nezet.allapot === "kiadott" && nezet.belepve && !nezet.mar_tag;

  // B: belepes nelkul
  const allapotB = !nezet.belepve;

  // C: hibautak
  const allapotC = !allapotA && !allapotB;

  return (
    <div className="km-bv-kartya">
      {/* Termekjel + nev — minden allapotban */}
      <div className="km-bv-fej">
        {/* R-18 2. kör: a/t jel + termék neve (mint a belépett lapok sávjában) */}
        <Marka nev={t("fejlec.termeknev")} />
      </div>

      {allapotA && (
        <>
          <h1 className="km-bv-cim">{cim}</h1>
          {nezet.szerep && (
            <div className="km-bv-szerep-sor">
              <span className="km-bv-szerep-cimke">{t("meghivo.bevalt_szerep_cimke")}</span>
              <span className="km-bv-jelveny">{szerepJelveny}</span>
              <span className="km-bv-szerep-leiras">{szerepLeiras}</span>
            </div>
          )}
          {nezet.fiok_email && (
            <p className="km-bv-fiok">
              {t("meghivo.bevalt_ki_vagy").replace("{email}", nezet.fiok_email)}
            </p>
          )}
          {hiba ? <div className="km-bv-hiba">{hiba}</div> : null}
          <button
            className="km-gomb"
            type="button"
            onClick={elfogad}
            disabled={fut}
          >
            {t("meghivo.elfogad_gomb")}
          </button>
          <p className="km-bv-megj">{t("meghivo.elfogad_utan")}</p>
        </>
      )}

      {allapotB && (
        <>
          <h1 className="km-bv-cim">{cim}</h1>
          <p className="km-bv-szoveg">{t("meghivo.belepes_kell")}</p>
          <div className="km-bv-gombok">
            <Link
              className="km-gomb"
              href={`/belepes?vissza=/meghivo/${encodeURIComponent(jegy)}`}
            >
              {t("meghivo.belepes_gomb")}
            </Link>
            <Link
              className="km-gomb-szellem"
              href={`/regisztracio?vissza=/meghivo/${encodeURIComponent(jegy)}`}
            >
              {t("meghivo.regisztracio_gomb")}
            </Link>
          </div>
          <p className="km-bv-megj">{t("meghivo.belepes_megj")}</p>
        </>
      )}

      {allapotC && (
        <div className="km-bv-hiba-kartya">
          {nezet.allapot === "lejart" && (
            <>
              <h2 className="km-bv-hiba-cim">{t("hozzaferes.hiba_meghivo_lejart")}</h2>
              <p className="km-bv-hiba-szoveg">{t("meghivo.hiba_lejart_mit")}</p>
            </>
          )}
          {nezet.allapot === "elfogadott" && (
            <>
              <h2 className="km-bv-hiba-cim">{t("hozzaferes.hiba_meghivo_felhasznalva")}</h2>
              <p className="km-bv-hiba-szoveg">{t("meghivo.hiba_felhasznalva_mit")}</p>
            </>
          )}
          {(nezet.allapot === "visszavont" || nezet.allapot === "nincs") && (
            <>
              <h2 className="km-bv-hiba-cim">{t("hozzaferes.hiba_meghivo_visszavonva")}</h2>
              <p className="km-bv-hiba-szoveg">{t("meghivo.hiba_visszavonva_mit")}</p>
            </>
          )}
          {nezet.mar_tag && (
            <>
              <h2 className="km-bv-info-cim">{t("hozzaferes.hiba_mar_tag")}</h2>
              <p className="km-bv-info-szoveg">{t("meghivo.hiba_mar_tag_mit")}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
