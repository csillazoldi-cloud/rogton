"use client";
// VZ-1 · V1 „Mit szeretnél közölni?” (design/VZ1-szerkeszto/rajz/VZ1-szerkeszto.dc.html, V1; gepezet 1). Három kártya a gép mintaképével
// (Forgalmi változás · Egy mondat · Számokban — a recept azonosítója marad), az első előre kijelölve, egy fő gomb: „Elkészítjük”.
// A mintakép készülése / hibája alatt a kártya helyén halvány váz, a kártya választható (mint a régi VZ-1a). A posztból nyitva
// (?poszt=) a poszt azonosítója megy tovább a szerkesztőbe (gepezet 2).
import { useEffect, useState } from "react";
import { useFeliratok } from "../../nyelv/kliens";
import { FoGomb, KerdesCim } from "../_kozos/R15";
import { SABLONOK, SABLON_NEV, type Sablon } from "../../vizual/kozlemeny-szabaly";
import "./kozlemeny.css";

type Minta = "keszul" | "kesz" | "hiba";

export function Kozlemenyek({ poszt }: { poszt: string | null }) {
  const { t } = useFeliratok();
  const [valasztott, setValasztott] = useState<Sablon>("zavar");
  const [minta, setMinta] = useState<Record<string, Minta>>({});

  useEffect(() => {
    for (const s of SABLONOK) {
      const kep = new Image();
      kep.onload = () => setMinta((m) => ({ ...m, [s]: "kesz" }));
      kep.onerror = () => setMinta((m) => ({ ...m, [s]: "hiba" }));
      kep.src = `/api/vizual/mintakep/${s}`;
    }
  }, []);

  const cel = `/kepek/${valasztott}${poszt ? `?poszt=${encodeURIComponent(poszt)}` : ""}`;
  const fo = <FoGomb href={cel}>{t("vz1r.elkeszitjuk")}</FoGomb>;

  return (
    <main className="km-lap-keret km-vz1r">
      <div className="km-vz1r-v1">
        <div className="km-vz1r-fej">
          <a href={poszt ? `/kepek?poszt=${encodeURIComponent(poszt)}` : "/kepek"} className="km-vz1r-vissza"><span aria-hidden="true">‹</span>{t("vz1r.vissza_kepek")}</a>
          <KerdesCim cim={t("vz1r.valaszto_cim")} alcim={t("vz1r.valaszto_alcim")} />
        </div>
        <div className="km-vz1r-kartyak" role="radiogroup" aria-label={t("vz1r.valaszto_cim")}>
          {SABLONOK.map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={valasztott === s}
              className={valasztott === s ? "km-vz1r-kartya km-vz1r-kartya-ki" : "km-vz1r-kartya"}
              onClick={() => setValasztott(s)}
            >
              {minta[s] === "kesz" ? (
                <img className="km-vz1r-minta" src={`/api/vizual/mintakep/${s}`} alt="" draggable={false} />
              ) : (
                <span className="km-vz1r-minta km-vz1r-minta-vaz" aria-hidden="true" />
              )}
              <span className="km-vz1r-kartya-szoveg">
                <span className="km-vz1r-kartya-nev">{t(SABLON_NEV[s].nev)}</span>
                <span className="km-vz1r-kartya-mi">{t(SABLON_NEV[s].mi)}</span>
              </span>
            </button>
          ))}
        </div>
        <span className="r15-csak-asztal">{fo}</span>
      </div>
      <div className="r15-also-sav">{fo}</div>
    </main>
  );
}
