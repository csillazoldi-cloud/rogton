"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useFeliratok } from "../../nyelv/kliens";
import { FelsoSav } from "../_kozos/FelsoSav";
import type { FelsoSavAdat } from "../../kezdolap/tipusok";
import { FoGomb, KerdesCim } from "../_kozos/R15";
import { KESZ_MUNKA_CIM } from "../_kozos/R15MunkaMinta";
import "../_kozos/r15-lapok.css";

// VZ-2a — „Mit szeretnél ma megmutatni?” (design/vz2/rajz/VZ2a-helyzetek.dc.html). Hét kártya, mindegyiken a gép
// mintaképe a munkatér arculatával. Telefonon 2 oszlop, asztalon 4. Az egész kártya kattintható → kitöltő.
// R-15 c5 2. kör (design/R15/rajz/R15-lapok-5.dc.html 09; kerdesek-5 1–2, Csilla 10-10 18:08): a lap EGYETLEN fő gombja
// „Képet készítek a munkámról” a kiemelt „Kész munka” kártyán (asztal) / az alsó sávban (telefon) — ugyanaz a cél, mint a kártyáé;
// egy mondat a cím alatt; telefonon a kártyák leírása nem látszik (a mintakép mutatja). A minták valódi szakma-fotóval (c14/c15).

export const HELYZETEK = ["kesz", "akcio", "uj", "hir", "tudtad", "esemeny", "szam"] as const;
type Minta = "keszul" | "kesz" | "hiba";

export function Helyzetek({ sav, nincsArculat, csomag, poszt = null, posztNev = "", javasolt = "kesz" }: {
  sav: FelsoSavAdat; nincsArculat: boolean; csomag: number;
  /** VZ-1: posztból nyitva a Közlemények is ehhez a poszthoz készül */ poszt?: string | null;
  /** R-18 6. kör (Kati F): posztból nyitva a lap az 1. lépés („Milyen kép legyen ehhez a poszthoz?”) — a poszt rövid neve és a gép javaslata */
  posztNev?: string; javasolt?: string;
}) {
  const { t } = useFeliratok();
  const [minta, setMinta] = useState<Record<string, Minta>>({});
  // R-18 6. kör: posztból a mintaképek a poszt szövegével (?poszt=), és egy kártya ki van választva (a javasolt) — a fő gomb azon áll
  const posztbol = !!poszt;
  const [valasztott, setValasztott] = useState<string>(javasolt);
  const mintaCim = (h: string) => `/api/vizual/helyzet-minta/${h}${poszt ? `?poszt=${encodeURIComponent(poszt)}` : ""}`;
  useEffect(() => {
    for (const h of HELYZETEK) {
      const kep = new Image();
      kep.onload = () => setMinta((m) => ({ ...m, [h]: "kesz" }));
      kep.onerror = () => setMinta((m) => ({ ...m, [h]: "hiba" }));
      kep.src = mintaCim(h);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const folytatCim = (h: string) => `/kepek/uj/${h}?poszt=${encodeURIComponent(poszt ?? "")}`;

  return (
    <>
      <FelsoSav adat={sav} aktiv="kepek" />
      <main className="km-lap-keret km-vz km-vz2">
        {posztbol ? (
          <>
            <span className="r15-csak-asztal"><KerdesCim cim={t("kep.minta_cim")} alcim={t("kep.minta_alcim")} /></span>
            <span className="r15-csak-tel"><KerdesCim cim={t("kep.minta_cim")} alcim={t("kep.minta_alcim_rovid")} /></span>
            <p className="r18k-lepes"><b>{t("kep.lepes1")}</b><span aria-hidden="true">→</span><span>{t("kep.lepes2")}</span>{posztNev ? <span className="r18k-lepes-poszt r15-csak-asztal">{t("kep.a_posztbol", { nev: posztNev })}</span> : null}</p>
          </>
        ) : <KerdesCim cim={t("vz2.helyzet_cim")} alcim={t("r15.kep.helyzet_alcim")} />}
        {nincsArculat && !posztbol && (
          <p className="km-vz2-arculat-sor">
            <span>{t("vz2.arculat_nelkul")}</span> <Link href="/fiok">{t("nav.ugyfelprofil")}</Link>
          </p>
        )}
        <div className="km-vz2-helyzetek">
          {HELYZETEK.map((h) => {
            const belso = (
              <>
                {minta[h] === "kesz" ? (
                  <img className="km-vz2-minta" src={mintaCim(h)} alt="" />
                ) : (
                  <span className="km-vz2-minta km-vz2-minta-vaz" aria-hidden="true" />
                )}
                <span className="km-vz2-helyzet-szoveg">
                  <span className="km-vz2-helyzet-nev">{t(`vz2.h_${h}`)}{posztbol && h === javasolt ? ` · ${t("kep.javasolt")}` : ""}</span>
                  <span className="km-vz2-helyzet-leiras">{t(`vz2.h_${h}_leiras`)}</span>
                </span>
              </>
            );
            // R-18 6. kör (Kati F): posztból az 1. lépés — a kártya kiválaszt (nem visz tovább); a kiválasztotton „Ezzel folytatom” → a szerkesztő
            if (posztbol) {
              const ki = h === valasztott;
              return (
                <div key={h} className={ki ? "km-vz2-helyzet km-vz2-helyzet-kiemelt" : "km-vz2-helyzet"} {...(ki ? { "data-r15": "teendo", "aria-current": "true" } : {})}>
                  <button type="button" className="km-vz2-helyzet-link r18k-valaszt" aria-pressed={ki} onClick={() => setValasztott(h)}>{belso}</button>
                  {ki ? <FoGomb href={folytatCim(h)} osztaly="r15-csak-asztal">{t("kep.tovabb")}</FoGomb> : null}
                </div>
              );
            }
            // Kati 10-11: posztból jövet a sablon is ehhez a poszthoz nyílik (eddig a ?poszt= itt elveszett)
            const posztra = poszt ? `?poszt=${encodeURIComponent(poszt)}` : "";
            if (h !== "kesz") return <Link key={h} href={`/kepek/uj/${h}${posztra}`} className="km-vz2-helyzet">{belso}</Link>;
            return (
              <div key={h} className="km-vz2-helyzet km-vz2-helyzet-kiemelt" data-r15="teendo">
                <Link href={`${KESZ_MUNKA_CIM}${posztra}`} className="km-vz2-helyzet-link">{belso}</Link>
                <FoGomb href={`${KESZ_MUNKA_CIM}${posztra}`} osztaly="r15-csak-asztal">{t("r15.kozos.kepet_keszitek_munka")}</FoGomb>
              </div>
            );
          })}
        </div>
        {csomag > 0 && (
          <Link href={poszt ? `/kepek/szoveges-kepek?poszt=${encodeURIComponent(poszt)}` : "/kepek/szoveges-kepek"} className="km-vz2-csomag">
            {/* VZ-1 kerdesek 1 (Csilla 2026-10-06): a sor neve „Szöveges képek” (Csilla 18:15; a régi „Közlekedési közlemények (3)” helyett) */}
            {t("vz1r.kozlemenyek")}
          </Link>
        )}
        <div className="r15-also-sav">{posztbol ? <FoGomb href={folytatCim(valasztott)}>{t("kep.tovabb")}</FoGomb> : <FoGomb href={KESZ_MUNKA_CIM}>{t("r15.kozos.kepet_keszitek_munka")}</FoGomb>}</div>
      </main>
    </>
  );
}
