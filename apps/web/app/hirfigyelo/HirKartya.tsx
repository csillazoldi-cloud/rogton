"use client";
// R-9: a Hírek lap kártyája — két hasábos lista egy eleme; a leghangsúlyosabb sor a `miert` (mit tud kezdeni a hírrel).

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Kartya } from "@rogton/news-monitor-core";
import { idoRovid, forrasNev } from "./_kozos/kliens";

/** Az első mondat a `.`-ig (a régiből átemelve). */
export function elsoMondat(szoveg: string): string {
  const i = szoveg.indexOf(".");
  return i === -1 ? szoveg : szoveg.slice(0, i + 1);
}

/** R-11/A: a hírből poszt lesz. A-8: ugyanabból a hírből ugyanaz a munka nyílik meg, nem új. */
export function TartalomgyarGomb({
  t,
  kartya,
  szerep,
}: {
  t: (kulcs: string, p?: Record<string, string | number>) => string;
  kartya: Kartya;
  szerep?: string;
}) {
  const utvonalak = useRouter();
  const [fut, setFut] = useState(false);
  const [hiba, setHiba] = useState("");

  if (szerep === "nezo") return null;

  async function posztotKeszit(): Promise<void> {
    setFut(true);
    setHiba("");
    const elso = kartya.forrasok[0];
    const valasz = await fetch("/api/poszt", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        forras: {
          tipus: "hir",
          azonosito: kartya.esemeny_id,
          cim: kartya.cim_forditott || kartya.cim,
          url: elso?.url ?? "",
          szoveg: [kartya.osszefoglalo, kartya.cegednek].filter(Boolean).join("\n\n").slice(0, 4000),
        },
        cim: kartya.cim_forditott || kartya.cim,
        felulet: "fb",
        nyelv: "hu",
      }),
    }).catch(() => null);
    const torzs = valasz ? ((await valasz.json().catch(() => ({}))) as { munka?: { id: string } }) : {};
    setFut(false);
    if (!valasz || valasz.status !== 200 || !torzs.munka) {
      setHiba(t("hf.poszt_hiba"));
      return;
    }
    utvonalak.push(`/poszt?munka=${torzs.munka.id}`);
  }

  return (
    <span className="km-hf-gyar">
      <button type="button" className="km-hf-gyar-gomb" onClick={() => void posztotKeszit()} disabled={fut}>
        {fut ? t("hf.poszt_keszul") : t("hf.poszt_keszits") + " →"}
      </button>
      {hiba ? <span className="km-hf-gyar-kesobb">{hiba}</span> : null}
    </span>
  );
}

export function HirKartya({
  kartya,
  nyelv,
  t,
  szerep,
  megtekintettHelyileg,
  onJelol,
  onNyit,
  onUjraertekel,
  ujraFut,
}: {
  kartya: Kartya;
  nyelv: string;
  t: (kulcs: string, p?: Record<string, string | number>) => string;
  szerep: string;
  megtekintettHelyileg: boolean;
  onJelol: (jeloles: "nincs" | "mentett" | "elrejtett") => void;
  onNyit: () => void;
  onUjraertekel?: () => void;
  ujraFut?: boolean;
}) {
  const elsoForras = kartya.forrasok[0] ?? null;
  const kiado = elsoForras ? forrasNev(elsoForras.forras_cim) : "";
  const ido = elsoForras ? idoRovid(elsoForras.megjelenes, nyelv) : "";

  const fuggoben = kartya.ertekeles_allapot === "fuggoben";
  const ertekelesKesz = kartya.ertekeles_allapot === "kesz";
  const uj = kartya.megtekintes === "uj" && !megtekintettHelyileg && kartya.jeloles !== "elrejtett";

  const katCimke =
    kartya.fontossag === "fontos"
      ? t("hf.kat_fontos")
      : kartya.fontossag === "erdekes"
        ? t("hf.kat_erdekes")
        : kartya.fontossag === "hatter"
          ? t("hf.kat_hatter")
          : null;

  return (
    <article className="km-hf-k" data-uj={uj} data-fontossag={kartya.fontossag ?? "nincs"} data-fuggo={fuggoben}>
      <div className="km-hf-k-fej">
        {katCimke ? (
          <span className="km-hf-at-kartya-kat" data-kat={kartya.fontossag}>
            {katCimke}
          </span>
        ) : fuggoben ? (
          <span className="km-hf-at-kartya-kat" data-kat="fuggo">
            {t("hf.kat_keszul")}
          </span>
        ) : null}
        <span className="km-hf-k-meta">
          {kiado}
          {ido ? " · " + ido : ""}
        </span>
      </div>

      {ertekelesKesz && kartya.miert ? <div className="km-hf-k-otlet">{elsoMondat(kartya.miert)}</div> : null}

      <div className="km-hf-k-cimek">
        <div className="km-hf-k-cim">{kartya.cim_forditott || kartya.cim}</div>
        {kartya.cim_forditott && kartya.cim_forditott !== kartya.cim ? (
          <div className="km-hf-k-eredeti">
            {t("hf.eredeti_elott")} {kartya.cim}
          </div>
        ) : null}
      </div>

      {fuggoben ? (
        <div className="km-hf-k-keszul">
          <span className="km-hf-at-porgo" aria-hidden="true" />
          {t("hf.kartya_nincs_osszefoglalo")}
        </div>
      ) : null}

      <div className="km-hf-k-gombok">
        {fuggoben ? (
          <>
            {szerep !== "nezo" && onUjraertekel ? (
              <button className="km-hf-at-gomb-mentes" onClick={onUjraertekel} disabled={ujraFut}>
                {ujraFut ? t("hf.osszefoglalo_ujra_fut") : t("hf.osszefoglalo_ujra")}
              </button>
            ) : null}
            {elsoForras ? (
              <a href={elsoForras.url} target="_blank" rel="noopener noreferrer" className="km-hf-at-gomb-ghost">
                {t("hf.eredeti_cikk")} ↗
              </a>
            ) : null}
          </>
        ) : (
          <>
            <button className="km-hf-k-gomb-fo" onClick={onNyit}>
              {t("hf.gomb_reszletek")}
            </button>
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
            <TartalomgyarGomb t={t} kartya={kartya} szerep={szerep} />
          </>
        )}
      </div>
    </article>
  );
}
