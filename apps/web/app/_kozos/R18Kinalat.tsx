"use client";
import { useEffect, useRef, useState } from "react";
import type { KinalatSor, PosztTipus, TemaTerv } from "@km/contracts";
import { useFeliratok } from "../../nyelv/kliens";

// R-18 7. kör (rajz: „Beállítás · Ezt kínáljátok?”, „Ezekről érdemes posztolnod”, „Szervezet adatai · Kínálat és árak”): a pipás
// kínálat-lista és a tématerv sorai — ugyanaz az első beállításban és a Szervezet adatainál. Koppintás a szövegre = helyben szerkesztés
// (Enter / kilépés ment), koppintás a négyzetre = pipa ki/be. A témák fajta-chipje egy kis listát nyit az öt fajtával.

export const TIPUSOK: PosztTipus[] = ["album", "picmess", "video", "szavazas", "kartya"];

function Pipa() {
  return <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
}

/** Helyben szerkeszthető szöveg: gombként látszik, koppintásra mező lesz (az új, üres sor rögtön mezőként nyílik). */
function SzerkSzoveg({ ertek, valt, cimke, nyitva: kezdo = false, children }: { ertek: string; valt: (s: string) => void; cimke: string; nyitva?: boolean; children?: React.ReactNode }) {
  const [nyitva, setNyitva] = useState(kezdo);
  const [most, setMost] = useState(ertek);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (nyitva) ref.current?.focus(); }, [nyitva]);
  const kesz = () => { setNyitva(false); if (most.trim() !== ertek) valt(most.trim()); };
  if (nyitva) {
    return <input ref={ref} className="r18p-input r18k7-mezo" value={most} aria-label={cimke} maxLength={160} onChange={(e) => setMost(e.target.value)} onBlur={kesz} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); kesz(); } if (e.key === "Escape") { setMost(ertek); setNyitva(false); } }} />;
  }
  return <button type="button" className="r18k7-szoveg" onClick={() => { setMost(ertek); setNyitva(true); }}>{ertek}{children}</button>;
}

/** A pipás lista. `arral`: soronként egy ár-mező is (Szervezet adatai). */
export function KinalatLista({ sorok, valt, arral = false, ujNyitva = -1 }: { sorok: KinalatSor[]; valt: (s: KinalatSor[]) => void; arral?: boolean; ujNyitva?: number }) {
  const { t } = useFeliratok();
  const modosit = (i: number, resz: Partial<KinalatSor>) => valt(sorok.map((s, j) => (j === i ? { ...s, ...resz } : s)));
  return (
    <div className="r18k7-lista" role="group" aria-label={t("onb.kinalat_cim")}>
      {sorok.map((s, i) => (
        <div key={i} className="r18k7-sor">
          <button type="button" className="r18k7-pipa" role="checkbox" aria-checked={s.aktiv} aria-label={s.nev || t("onb.sor_mezo")} onClick={() => modosit(i, { aktiv: !s.aktiv })}>{s.aktiv ? <Pipa /> : null}</button>
          <span className="r18k7-sor-szoveg">
            <SzerkSzoveg ertek={s.nev} cimke={t("onb.sor_mezo")} nyitva={i === ujNyitva && !s.nev} valt={(nev) => (nev ? modosit(i, { nev }) : valt(sorok.filter((_, j) => j !== i)))}>
              {!arral && (s.reszlet || s.ar) ? <small>{[s.reszlet, s.ar].filter(Boolean).join(" · ")}</small> : null}
            </SzerkSzoveg>
          </span>
          {arral ? <input className="r18p-input r18k7-ar" value={s.ar} placeholder={t("szerv.ar_mezo")} maxLength={60} aria-label={`${t("szerv.ar_mezo")}: ${s.nev}`} onChange={(e) => modosit(i, { ar: e.target.value })} /> : null}
        </div>
      ))}
    </div>
  );
}

/** A fajta-chip a kis listával (a téma sorában). */
function TipusValaszto({ tipus, valt }: { tipus: PosztTipus; valt: (t: PosztTipus) => void }) {
  const { t } = useFeliratok();
  const [nyitva, setNyitva] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!nyitva) return;
    const kattint = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setNyitva(false); };
    const bill = (e: KeyboardEvent) => { if (e.key === "Escape") setNyitva(false); };
    document.addEventListener("mousedown", kattint);
    document.addEventListener("keydown", bill);
    return () => { document.removeEventListener("mousedown", kattint); document.removeEventListener("keydown", bill); };
  }, [nyitva]);
  return (
    <div className="r18k7-tipus-hely" ref={ref}>
      <button type="button" className="r18k7-chip" aria-haspopup="listbox" aria-expanded={nyitva} aria-label={`${t("tipus.cim")} ${t(`tipus.${tipus}`)}`} onClick={() => setNyitva((n) => !n)}>{t(`tipus.${tipus}`)} ▾</button>
      {nyitva ? (
        <div className="r18k7-tipus-lista" role="listbox" aria-label={t("tipus.cim")}>
          {TIPUSOK.map((x) => (
            <button key={x} type="button" role="option" aria-selected={x === tipus} className="r18k7-tipus-sor" onClick={() => { valt(x); setNyitva(false); }}>{t(`tipus.${x}`)}</button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** A tématerv sorai: szöveg (koppintás = szerkesztés) · fajta-chip · ✕. */
export function TemaLista({ temak, valt, ujNyitva = -1 }: { temak: TemaTerv[]; valt: (t: TemaTerv[]) => void; ujNyitva?: number }) {
  const { t } = useFeliratok();
  const modosit = (i: number, resz: Partial<TemaTerv>) => valt(temak.map((x, j) => (j === i ? { ...x, ...resz } : x)));
  return (
    <div className="r18k7-lista">
      {temak.map((x, i) => (
        <div key={i} className="r18k7-tema">
          <span className="r18k7-tema-nev"><SzerkSzoveg ertek={x.tema} cimke={t("onb.tema_mezo")} nyitva={i === ujNyitva && !x.tema} valt={(tema) => (tema ? modosit(i, { tema }) : valt(temak.filter((_, j) => j !== i)))} /></span>
          <TipusValaszto tipus={x.tipus} valt={(tipus) => modosit(i, { tipus })} />
          <button type="button" className="r18k7-torol" aria-label={t("onb.tema_torles")} onClick={() => valt(temak.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
    </div>
  );
}
