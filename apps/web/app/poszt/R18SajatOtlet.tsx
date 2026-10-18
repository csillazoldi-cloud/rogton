"use client";
// R-18 3. kör · „Saját ötlet” (Csilla 10-11; Claude Design „Saját ötlet · üres / kitöltve / írjuk”, A sötét + B világos; IRANYOK Round 5).
// A „Saját ötletből” ezt nyitja: EGY mező („Miről szóljon a poszt?”) és egy fő gomb („Megírjuk”). Asztalon a Posztszöveg közepén, a lap
// tetején álló panel; telefonon alsó lap fátyollal. Üresen is elküldhető (mint eddig: akkor a gép választ témát).
// A rajz „Fotók hozzá” sora NINCS megépítve: a gépnek nincs útja fotóból posztot írni (képet nem lát), és egy poszthoz egy kép tartozik —
// félig működő vezérlő nem kerül a képernyőre (EGYUTTMUKODES 4). Lásd docs/decisions/2026-10-11-r18-kor3-naptar-sajat-otlet.md.
import { useEffect, useRef } from "react";
import { useFeliratok } from "../../nyelv/kliens";
import { DolgozoGomb, FoGomb, HalkLink, Info, KerdesCim } from "../_kozos/R15";
import "./r18-sajat.css";

/** A beírható ötlet felső határa (a forrás szövege és címe ebből lesz). */
export const SAJAT_OTLET_MAX = 600;

type Kozos = { ertek: string; setErtek: (s: string) => void; onKuld: () => void; onZar: () => void; fut: boolean; hiba?: string };

function Mezo({ ertek, setErtek, onKuld, fut, fokusz }: Pick<Kozos, "ertek" | "setErtek" | "onKuld" | "fut"> & { fokusz: boolean }) {
  const { t } = useFeliratok();
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (fokusz) ref.current?.focus(); }, [fokusz]);
  return (
    <textarea
      ref={ref}
      className="r18s-mezo"
      rows={3}
      maxLength={SAJAT_OTLET_MAX}
      value={ertek}
      disabled={fut}
      aria-label={t("r18.sajat.mezo_cimke")}
      placeholder={t("r18.sajat.pelda")}
      onChange={(e) => setErtek(e.target.value)}
      onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onKuld(); } }}
    />
  );
}

/** Asztal: a panel a Posztszöveg közepének tetején (a rajz „Saját ötlet · asztali”). */
export function SajatOtletPanel({ ertek, setErtek, onKuld, onZar, fut, hiba }: Kozos) {
  const { t } = useFeliratok();
  const asztal = typeof window !== "undefined" && window.matchMedia("(min-width: 641px)").matches;
  return (
    <div className="r18s-panel r15-csak-asztal">
      <KerdesCim cim={t("r18.sajat.kerdes")} alcim={t("r18.sajat.alcim")} />
      <section className="r15-teendo r18s-doboz" data-r15="teendo">
        <Mezo ertek={ertek} setErtek={setErtek} onKuld={onKuld} fut={fut} fokusz={asztal} />
        <Info>{t("r18.sajat.ures_info")}</Info>
        {hiba ? <Info>{hiba}</Info> : null}
        <div className="r18s-gombsor">
          {fut ? <DolgozoGomb>{t("r15.poszt.irjuk")}</DolgozoGomb> : <FoGomb onClick={onKuld}>{t("r18.sajat.megirjuk")}</FoGomb>}
          <HalkLink onClick={onZar} disabled={fut}>{t("kozos.megse")}</HalkLink>
        </div>
      </section>
    </div>
  );
}

/** Telefon: alsó lap fátyollal (a rajz „Saját ötlet · telefon (alsó lap)”). Esc és a fátyol is zárja. */
export function SajatOtletLap({ ertek, setErtek, onKuld, onZar, fut, hiba }: Kozos) {
  const { t } = useFeliratok();
  const telefon = typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches;
  useEffect(() => {
    const bill = (e: KeyboardEvent) => { if (e.key === "Escape" && !fut) onZar(); };
    document.addEventListener("keydown", bill);
    return () => document.removeEventListener("keydown", bill);
  }, [onZar, fut]);
  return (
    <div className="r15-csak-tel">
      <div className="r18s-fatyol" aria-hidden="true" onClick={() => { if (!fut) onZar(); }} />
      <div className="r18s-lap" role="dialog" aria-modal="true" aria-label={t("r18.sajat.kerdes")}>
        <div className="r18s-fogo" aria-hidden="true" />
        <div className="r18s-lap-fej">
          <h2 className="r18s-lap-cim">{t("r18.sajat.kerdes")}</h2>
          <button type="button" className="r18s-bezar" aria-label={t("r18.naptar.bezaras")} onClick={onZar} disabled={fut}>✕</button>
        </div>
        <Mezo ertek={ertek} setErtek={setErtek} onKuld={onKuld} fut={fut} fokusz={telefon} />
        <Info>{t("r18.sajat.ures_info")}</Info>
        {hiba ? <Info>{hiba}</Info> : null}
        {fut ? <DolgozoGomb osztaly="r18s-teljes">{t("r15.poszt.irjuk")}</DolgozoGomb> : <FoGomb osztaly="r18s-teljes" onClick={onKuld}>{t("r18.sajat.megirjuk")}</FoGomb>}
      </div>
    </div>
  );
}
