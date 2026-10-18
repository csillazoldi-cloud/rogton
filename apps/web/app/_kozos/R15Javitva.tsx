"use client";
// c7 a Kezdőlapon (R-15 c5 2. kör, design/R15/rajz/R15-lapok-5.dc.html 03j · 03j2; gepezet-5 6; kerdesek-5 16–17, Csilla 10-10 18:08):
// EGY halk elem a felső sávban, az „Értesítések” előtt: zöld ✓ és a szám — csak annak, akinek a jelzéséből tegnap óta lett „kész”.
// Nem jelvény, nem gomb-külsejű; a teljes mondat a súgója / akadálymentes neve és a lenyíló fejléce. Kattintásra halk lista:
// a saját szavai idézőjelben, a lap címe (ha van), „Megnézem” → a lap, ahol jelezte (csak belső útvonal — a kiszolgáló szűri).
// Miért a sávban: a jóváhagyott 03b 58/60 (asztal) és 39/40 (telefon) szónál jár — a lapra írt sor a T5-öt törné; a sáv keret.
import { useEffect, useRef, useState } from "react";
import { useFeliratok } from "../../nyelv/kliens";
import "./r15-javitva.css";

export type JavitottTetel = { szoveg: string; lap: string | null; lap_cim: string };

export function R15Javitva({ tetelek, osztaly }: { tetelek: JavitottTetel[]; osztaly?: string }) {
  const { t } = useFeliratok();
  const [nyitva, setNyitva] = useState(false);
  const hely = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!nyitva) return;
    const kattint = (e: MouseEvent) => { if (hely.current && !hely.current.contains(e.target as Node)) setNyitva(false); };
    const bill = (e: KeyboardEvent) => { if (e.key === "Escape") setNyitva(false); };
    document.addEventListener("mousedown", kattint);
    document.addEventListener("keydown", bill);
    return () => { document.removeEventListener("mousedown", kattint); document.removeEventListener("keydown", bill); };
  }, [nyitva]);
  if (tetelek.length === 0) return null;
  const mondat = t("r15.kezdolap.javitva_sor", { n: tetelek.length });
  return (
    <div className={osztaly ? `r15jv ${osztaly}` : "r15jv"} ref={hely}>
      <button type="button" className="r15jv-gomb" aria-expanded={nyitva} aria-label={mondat} title={mondat} onClick={() => setNyitva((x) => !x)}>
        <span className="r15jv-pipa" aria-hidden="true">✓</span>
        <span aria-hidden="true">{tetelek.length}</span>
      </button>
      {nyitva ? (
        <div className="r15jv-lista" data-r15="reszletek">
          <p className="r15jv-cim">{mondat}</p>
          {tetelek.map((x, i) => (
            <div key={i} className="r15jv-tetel">
              <span className="r15jv-szoveg">
                <span>„{x.szoveg}”</span>
                {x.lap_cim ? <span className="r15jv-lap">{x.lap_cim}</span> : null}
              </span>
              {x.lap ? <a className="r15-halk-link" href={x.lap}>{t("r15.kezdolap.atnezem")}</a> : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
