"use client";
// R-9: a hír részletei FELUGRÓ ablakban (nem oldalsó panel) — két hasáb: balra a hír, jobbra „Mit adhat ez neked".

import { useEffect } from "react";
import type { Kartya } from "@km/news-monitor-core";
import { idoRovid, nyelvNev, forrasNev } from "./_kozos/kliens";
import { TartalomgyarGomb, elsoMondat } from "./HirKartya";

export function HirFelugro({
  kartya,
  nyelv,
  t,
  szerep,
  otletFut,
  otletHiba,
  onBezar,
  onOtlet,
  onJelol,
}: {
  kartya: Kartya;
  nyelv: string;
  t: (kulcs: string, p?: Record<string, string | number>) => string;
  szerep: string;
  otletFut: boolean;
  otletHiba: string | null;
  onBezar: () => void;
  onOtlet: () => void;
  onJelol: (jeloles: "nincs" | "mentett" | "elrejtett") => void;
}) {
  // R-9: a felugró nyitásakor a lap ne görögjön.
  useEffect(() => {
    const regi = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = regi;
    };
  }, []);

  const elsoForras = kartya.forrasok[0] ?? null;
  const kiado = elsoForras ? forrasNev(elsoForras.forras_cim) : "";
  const ido = elsoForras ? idoRovid(elsoForras.megjelenes, nyelv) : "";

  const fuggoben = kartya.ertekeles_allapot === "fuggoben";
  const keretKimerult = kartya.ertekeles_allapot === "keret_kimerult";
  const ertekelesKesz = kartya.ertekeles_allapot === "kesz";
  const hatter = kartya.fontossag === "hatter";

  const katCimke =
    kartya.fontossag === "fontos"
      ? t("hf.kat_fontos")
      : kartya.fontossag === "erdekes"
        ? t("hf.kat_erdekes")
        : kartya.fontossag === "hatter"
          ? t("hf.kat_hatter")
          : null;

  const forditasJelzes =
    kartya.cim_forditott && kartya.cim_forditott !== kartya.cim && elsoForras?.nyelv
      ? " · " + t("hf.forditva_nyelvbol", { nyelv: nyelvNev(elsoForras.nyelv, nyelv) })
      : "";

  const osszefoglaloSzoveg = fuggoben
    ? t("hf.kartya_nincs_osszefoglalo")
    : keretKimerult
      ? t("hf.keret_kimerult")
      : kartya.osszefoglalo;

  const otlet = kartya.tartalomotlet;

  // R-9: jelölő módban a felugró NEM záródik be kattintásra (a Visszajelzés modul jelölése közben).
  function hatterKattint() {
    if (document.body.dataset.vjJelol === "1") return;
    onBezar();
  }

  return (
    <div className="km-hf-fu-hatter" onClick={hatterKattint}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("hf.detTitle")}
        className="km-hf-fu"
        data-screen-label="HF-Felugró"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="km-hf-fu-fej">
          {katCimke ? (
            <span className="km-hf-at-kartya-kat" data-kat={kartya.fontossag}>
              {katCimke}
            </span>
          ) : fuggoben ? (
            <span className="km-hf-at-kartya-kat" data-kat="fuggo">
              {t("hf.kat_keszul")}
            </span>
          ) : null}
          <span className="km-hf-fu-meta">
            {kiado}
            {ido ? " · " + ido : ""}
            {forditasJelzes}
          </span>
          <button className="km-hf-at-gomb-ghost" onClick={onBezar}>
            ✕ {t("kozos.bezaras")}
          </button>
        </div>

        <div className="km-hf-fu-torzs">
          {/* BAL: a hír */}
          <div className="km-hf-fu-bal">
            <h2 className="km-hf-fu-cim">{kartya.cim_forditott || kartya.cim}</h2>
            {kartya.cim_forditott && kartya.cim_forditott !== kartya.cim ? (
              <div className="km-hf-k-eredeti">
                {t("hf.eredeti_elott")} {kartya.cim}
              </div>
            ) : null}
            <p className="km-hf-fu-osszefoglalo">{osszefoglaloSzoveg}</p>

            <div className="km-hf-fu-gombok">
              <button
                className="km-hf-at-gomb-mentes"
                data-mentve={kartya.jeloles === "mentett" ? "true" : "false"}
                onClick={() => onJelol(kartya.jeloles === "mentett" ? "nincs" : "mentett")}
              >
                {kartya.jeloles === "mentett" ? "✓ " + t("hf.saved") : t("hf.gomb_elmentem")}
              </button>
              {kartya.jeloles !== "elrejtett" ? (
                <button className="km-hf-at-gomb-ghost" onClick={() => onJelol("elrejtett")}>
                  {t("hf.gomb_nem_erdekel")}
                </button>
              ) : (
                <button className="km-hf-at-gomb-ghost" onClick={() => onJelol("nincs")}>
                  {t("hf.restore")}
                </button>
              )}
              {elsoForras ? (
                <a href={elsoForras.url} target="_blank" rel="noopener noreferrer" className="km-hf-at-gomb-ghost">
                  {t("hf.eredeti_cikk")} ↗
                </a>
              ) : null}
            </div>

            <details className="km-hf-fu-miert">
              <summary>{t("hf.fu_miert_kaptad")}</summary>
              {ertekelesKesz ? <p>{kartya.indoklas || kartya.miert}</p> : null}
              {kartya.csonkolt_alapjan ? <p>{t("hf.csonkolt")}</p> : null}
              {kartya.forrasok.length > 0 ? (
                <div className="km-hf-at-panel-forrasok">
                  {kartya.forrasok.map((f) => (
                    <div key={f.talalat_id} className="km-hf-at-panel-forras">
                      <span className="km-hf-at-panel-forras-nev">{forrasNev(f.forras_cim)}</span>
                      <span className="km-hf-at-panel-forras-meta">
                        {idoRovid(f.megjelenes, nyelv)}
                        {f.nyelv ? " · " + t("hf.forras_nyelve", { nyelv: nyelvNev(f.nyelv, nyelv) }) : ""}
                      </span>
                      <a href={f.url} target="_blank" rel="noopener noreferrer" className="km-hf-at-panel-forras-link">
                        {t("hf.gomb_eredeti_cikk")}
                      </a>
                    </div>
                  ))}
                </div>
              ) : null}
              {kartya.szabaly_verzio ? <p>{t("hf.verMadeWith", { v: kartya.szabaly_verzio })}</p> : null}
            </details>
          </div>

          {/* JOBB: Mit adhat ez neked */}
          <div className="km-hf-fu-jobb">
            <div className="km-hf-fu-jobb-cim">
              <span className="km-hf-fu-orb" aria-hidden="true" />
              {t("hf.fu_mit_adhat")}
            </div>

            {hatter ? (
              <div className="km-hf-fu-doboz">
                <p>{kartya.miert}</p>
                {kartya.indoklas ? <p className="km-hf-at-panel-indoklas">{elsoMondat(kartya.indoklas)}</p> : null}
              </div>
            ) : ertekelesKesz ? (
              <>
                <div className="km-hf-fu-doboz">
                  <div className="km-hf-fu-doboz-cim">{t("hf.fu_cegednek")}</div>
                  <p>{kartya.cegednek || kartya.miert}</p>
                </div>
                {kartya.vevoidnek ? (
                  <div className="km-hf-fu-doboz">
                    <div className="km-hf-fu-doboz-cim">{t("hf.fu_vevoidnek")}</div>
                    <p>{kartya.vevoidnek}</p>
                  </div>
                ) : null}
                <div className="km-hf-fu-doboz km-hf-fu-doboz-tartalom">
                  <div className="km-hf-fu-doboz-cim">
                    {t("hf.fu_egy_tartalom")} <span className="km-hf-at-osszkep-jelveny">{t("hf.ovSummaryBadge")}</span>
                  </div>
                  {otlet ? (
                    <>
                      <p>{otlet.szoveg}</p>
                      <TartalomgyarGomb t={t} kartya={kartya} szerep={szerep} />
                    </>
                  ) : szerep !== "nezo" && (kartya.fontossag === "fontos" || kartya.fontossag === "erdekes") ? (
                    <>
                      <button className="km-hf-at-panel-otlet-gomb" onClick={onOtlet} disabled={otletFut}>
                        {otletFut ? t("hf.detIdeaWorking") : "✦ " + t("hf.detIdeaBtn")}
                      </button>
                      {otletHiba ? <div className="km-hf-at-panel-otlet-hiba">{otletHiba}</div> : null}
                    </>
                  ) : szerep === "nezo" ? (
                    <p>{t("hf.fu_otlet_nezo")}</p>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="km-hf-fu-doboz">
                <p>{keretKimerult ? t("hf.keret_kimerult") : t("hf.stAiPend")}</p>
              </div>
            )}

            {otlet ? <div className="km-hf-fu-lab">{t("hf.otlet_figyelmeztetes")}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
